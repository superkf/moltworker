/**
 * Configuration constants for Moltbot Sandbox
 */

/** Port that the Moltbot gateway listens on inside the container */
export const MOLTBOT_PORT = 18789;

/** Port that the Telegram webhook server listens on inside the container */
export const TELEGRAM_WEBHOOK_PORT = 8787;

/** Path for Telegram webhook endpoint */
export const TELEGRAM_WEBHOOK_PATH = '/telegram-webhook';

/** Maximum time to wait for Moltbot to start (3 minutes) */
export const STARTUP_TIMEOUT_MS = 180_000;

/** Mount path for R2 persistent storage inside the container */
export const R2_MOUNT_PATH = '/data/moltbot';

/** R2 bucket name for persistent storage */
export const R2_BUCKET_NAME = 'moltbot-data';
