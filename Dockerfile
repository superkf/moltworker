FROM docker.io/cloudflare/sandbox:0.7.0

# Install Node.js 22 (required by openclaw) and rsync (for R2 backup sync)
# The base image has Node 20, we need to replace it with Node 22
# Using direct binary download for reliability
ENV NODE_VERSION=22.13.1
RUN apt-get update && apt-get install -y xz-utils ca-certificates rsync python3 python3-pip git \
    && curl -fsSLk https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.xz -o /tmp/node.tar.xz \
    && tar -xJf /tmp/node.tar.xz -C /usr/local --strip-components=1 \
    && rm /tmp/node.tar.xz \
    && node --version \
    && npm --version

# Install pnpm globally
RUN npm install -g pnpm

# Install moltbot (CLI is still named openclaw until upstream renames)
# Pin to specific version for reproducible builds
RUN git clone https://github.com/roerohan/openclaw.git /tmp/openclaw \
    && cd /tmp/openclaw \
    && pnpm install \
    && pnpm build \
    && npm link \
    && openclaw --version

# Create moltbot directories (paths still use openclaw until upstream renames)
# Templates are stored in /root/.openclaw-templates for initialization
RUN mkdir -p /root/.openclaw \
    && mkdir -p /root/.openclaw-templates \
    && mkdir -p /root/clawd \
    && mkdir -p /root/clawd/skills

# Copy startup script
# Build cache bust: 2026-02-05-v30-auto-webhook
COPY start-moltbot.sh /usr/local/bin/start-moltbot.sh
RUN chmod +x /usr/local/bin/start-moltbot.sh

# Copy default configuration template
COPY moltbot.json.template /root/.openclaw-templates/moltbot.json.template

# Copy custom skills
COPY skills/ /root/clawd/skills/

# Copy workspace files (Big Fork config, scripts, memory)
COPY workspace/ /root/clawd/

# Install email dependencies for clinic-email.mjs
RUN cd /root/clawd && npm init -y && npm install nodemailer imap mailparser dotenv

# Install Python dependencies for auto_buy_monitor.py
RUN pip3 install requests python-dotenv && ln -sf /usr/bin/python3 /usr/bin/python

# Set working directory
WORKDIR /root/clawd

# Expose the gateway port
EXPOSE 18789
