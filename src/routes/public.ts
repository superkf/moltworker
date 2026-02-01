import { Hono } from 'hono';
import type { AppEnv } from '../types';
import { MOLTBOT_PORT, TELEGRAM_WEBHOOK_PORT, TELEGRAM_WEBHOOK_PATH } from '../config';
import { findExistingMoltbotProcess, ensureMoltbotGateway } from '../gateway';

/**
 * Public routes - NO Cloudflare Access authentication required
 * 
 * These routes are mounted BEFORE the auth middleware is applied.
 * Includes: health checks, static assets, and public API endpoints.
 */
const publicRoutes = new Hono<AppEnv>();

// GET /sandbox-health - Health check endpoint
publicRoutes.get('/sandbox-health', (c) => {
  return c.json({
    status: 'ok',
    service: 'moltbot-sandbox',
    gateway_port: MOLTBOT_PORT,
  });
});

// GET /logo.png - Serve logo from ASSETS binding
publicRoutes.get('/logo.png', (c) => {
  return c.env.ASSETS.fetch(c.req.raw);
});

// GET /logo-small.png - Serve small logo from ASSETS binding
publicRoutes.get('/logo-small.png', (c) => {
  return c.env.ASSETS.fetch(c.req.raw);
});

// GET /api/status - Public health check for gateway status (no auth required)
publicRoutes.get('/api/status', async (c) => {
  const sandbox = c.get('sandbox');
  
  try {
    const process = await findExistingMoltbotProcess(sandbox);
    if (!process) {
      return c.json({ ok: false, status: 'not_running' });
    }
    
    // Process exists, check if it's actually responding
    // Try to reach the gateway with a short timeout
    try {
      await process.waitForPort(18789, { mode: 'tcp', timeout: 5000 });
      return c.json({ ok: true, status: 'running', processId: process.id });
    } catch {
      return c.json({ ok: false, status: 'not_responding', processId: process.id });
    }
  } catch (err) {
    return c.json({ ok: false, status: 'error', error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// GET /_admin/assets/* - Admin UI static assets (CSS, JS need to load for login redirect)
// Assets are built to dist/client with base "/_admin/"
publicRoutes.get('/_admin/assets/*', async (c) => {
  const url = new URL(c.req.url);
  // Rewrite /_admin/assets/* to /assets/* for the ASSETS binding
  const assetPath = url.pathname.replace('/_admin/assets/', '/assets/');
  const assetUrl = new URL(assetPath, url.origin);
  return c.env.ASSETS.fetch(new Request(assetUrl.toString(), c.req.raw));
});

// POST /telegram-webhook - Telegram webhook endpoint (public, no auth required)
// Telegram servers send updates here, which we proxy to the container's webhook server
publicRoutes.post(TELEGRAM_WEBHOOK_PATH, async (c) => {
  const sandbox = c.get('sandbox');
  console.log('[TELEGRAM] Received webhook request');

  // Ensure moltbot gateway is running (webhook server starts with it)
  try {
    await ensureMoltbotGateway(sandbox, c.env);
  } catch (error) {
    console.error('[TELEGRAM] Failed to start gateway:', error);
    return c.json({ ok: false, error: 'Gateway not available' }, 503);
  }

  // Proxy the request to the container's webhook server
  try {
    const response = await sandbox.containerFetch(c.req.raw, TELEGRAM_WEBHOOK_PORT);
    console.log('[TELEGRAM] Webhook response status:', response.status);
    return response;
  } catch (error) {
    console.error('[TELEGRAM] Webhook proxy failed:', error);
    return c.json({ ok: false, error: 'Webhook proxy failed' }, 502);
  }
});

// Also handle /healthz for the webhook server (used by Telegram to verify webhook)
publicRoutes.get('/healthz', async (c) => {
  return c.text('ok', 200);
});

export { publicRoutes };
