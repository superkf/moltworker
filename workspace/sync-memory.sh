#!/bin/bash
# Memory sync script for cloud clawdbot
# Called by cron job to sync memory with GitHub

SYNC_DIR="/root/clawd/sync"
WORKSPACE_DIR="/root/clawd"
LAST_ACTIVE_FILE="$SYNC_DIR/memory/.last-active"
OFFLINE_THRESHOLD=1800  # 30 minutes in seconds

cd "$SYNC_DIR" || exit 1

# Pull latest from remote
echo "Pulling latest from GitHub..."
git pull origin main

# Copy updated files to workspace
cp -r memory "$WORKSPACE_DIR/"
cp -f MEMORY.md "$WORKSPACE_DIR/" 2>/dev/null || true
cp -f HEARTBEAT.md "$WORKSPACE_DIR/" 2>/dev/null || true

# Check if local is offline (last-active > 30 min ago)
if [ -f "$LAST_ACTIVE_FILE" ]; then
    LAST_ACTIVE=$(cat "$LAST_ACTIVE_FILE")
    LAST_ACTIVE_EPOCH=$(date -d "$LAST_ACTIVE" +%s 2>/dev/null || echo "0")
    NOW_EPOCH=$(date +%s)
    DIFF=$((NOW_EPOCH - LAST_ACTIVE_EPOCH))

    echo "Local last active: $LAST_ACTIVE ($DIFF seconds ago)"

    if [ "$DIFF" -lt "$OFFLINE_THRESHOLD" ]; then
        echo "Local is online (< 30 min), skipping push"
        exit 0
    fi

    echo "Local is offline (> 30 min), cloud can push"
fi

# Copy workspace changes back to sync dir
cp -r "$WORKSPACE_DIR/memory" "$SYNC_DIR/"
cp -f "$WORKSPACE_DIR/MEMORY.md" "$SYNC_DIR/" 2>/dev/null || true
cp -f "$WORKSPACE_DIR/HEARTBEAT.md" "$SYNC_DIR/" 2>/dev/null || true

# Update cloud's last-active
date -Iseconds > "$SYNC_DIR/memory/.last-active-cloud"

# Commit and push if there are changes
if git diff --quiet && git diff --staged --quiet; then
    echo "No changes to push"
else
    echo "Pushing changes to GitHub..."
    git add -A
    git commit -m "Cloud sync: $(date -Iseconds)"
    git push origin main
fi
