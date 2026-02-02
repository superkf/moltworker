# PRD: Local-Cloud Bidirectional Memory Sync

## Introduction

实现本地与云端 bigfork-memory 的双向同步机制。当前系统只有云端单向保护（云端检查本地是否活跃后才 push），缺少本地启动时拉取和退出时推送的逻辑。本 PRD 补全这个双向同步，确保本地和云端切换时数据一致。

## Goals

- 本地启动时自动从 GitHub 拉取最新 memory 数据
- 本地退出时自动将 memory 变更推送到 GitHub
- 复用现有 .last-active 机制实现双向冲突预防
- 同步失败时静默处理，不阻止 bot 运行

## User Stories

### US-001: Clone bigfork-memory on first local run
**Description:** As a user, I want the local startup script to automatically clone bigfork-memory if it doesn't exist, so I don't need to manually set it up.

**Acceptance Criteria:**
- [ ] Check if `workspace/sync/.git` exists
- [ ] If not, `git clone https://github.com/superkf/bigfork-memory.git workspace/sync`
- [ ] Clone failure logs warning but does not block startup
- [ ] Typecheck/lint passes (shellcheck for bash)

### US-002: Pull latest memory on local startup
**Description:** As a user, I want the latest cloud memory data pulled when I start locally, so I continue where cloud left off.

**Acceptance Criteria:**
- [ ] Run `git pull origin main` in `workspace/sync/`
- [ ] Copy `sync/memory/*` to `workspace/memory/`
- [ ] Copy `sync/MEMORY.md` and `sync/HEARTBEAT.md` to `workspace/`
- [ ] Pull failure logs warning but does not block startup

### US-003: Check cloud last-active before local push
**Description:** As a user, I want the local script to check if cloud was recently active before pushing, to avoid overwriting cloud changes.

**Acceptance Criteria:**
- [ ] Read `.last-active-cloud` timestamp from sync directory
- [ ] If cloud was active within 30 minutes, skip push and log warning
- [ ] If cloud inactive or file missing, proceed with push

### US-004: Update local last-active timestamp
**Description:** As a developer, I need local to update .last-active so cloud knows not to overwrite local data.

**Acceptance Criteria:**
- [ ] On local startup, write current ISO timestamp to `workspace/memory/.last-active`
- [ ] This file gets synced to GitHub, cloud reads it before pushing

### US-005: Push memory changes on local exit
**Description:** As a user, I want my local memory changes pushed to GitHub when I stop the bot, so cloud can pick up where I left off.

**Acceptance Criteria:**
- [ ] Copy `workspace/memory/*` to `sync/memory/`
- [ ] Copy `workspace/MEMORY.md` and `workspace/HEARTBEAT.md` to `sync/`
- [ ] Run `git add -A && git commit && git push` in sync directory
- [ ] Push failure logs warning but does not block exit
- [ ] No commit if no changes detected

### US-006: Create start-local.sh script
**Description:** As a user, I want a single script to start the local bot with proper sync, mirroring how start-moltbot.sh works for cloud.

**Acceptance Criteria:**
- [ ] Script located at `workspace/start-local.sh`
- [ ] Implements US-001, US-002, US-004 before starting gateway
- [ ] Traps EXIT signal to run US-003, US-005 on shutdown
- [ ] Starts `openclaw gateway` with appropriate local flags

## Functional Requirements

- FR-1: Create `workspace/start-local.sh` as the local entry point
- FR-2: Clone bigfork-memory to `workspace/sync/` if not present
- FR-3: Pull latest from GitHub before copying to workspace
- FR-4: Copy memory files from sync to workspace on startup
- FR-5: Update `.last-active` with current timestamp on startup
- FR-6: Trap EXIT/SIGTERM to trigger shutdown sync
- FR-7: Check `.last-active-cloud` before pushing (30 min threshold)
- FR-8: Copy memory files from workspace to sync on shutdown
- FR-9: Commit and push changes to GitHub on shutdown
- FR-10: All sync failures are logged but non-blocking

## Non-Goals

- No real-time sync during runtime (only startup/shutdown)
- No automatic conflict resolution (last-active wins)
- No sync of script files (*.mjs, *.py) - those are code, not memory
- No GUI or notification system
- No Windows-specific implementation (bash script only, use Git Bash)

## Technical Considerations

- Reuse logic patterns from existing `start-moltbot.sh` and `sync-memory.sh`
- Git operations require `superkf/bigfork-memory` repo access (already configured)
- Local paths: `workspace/sync/` (git repo), `workspace/memory/` (runtime)
- Cloud paths: `/root/clawd/sync/` (git repo), `/root/clawd/memory/` (runtime)
- OFFLINE_THRESHOLD = 1800 seconds (30 minutes) - same as cloud

## Success Metrics

- Local startup pulls latest data from GitHub within 5 seconds
- Switching from cloud to local preserves all memory data
- Switching from local to cloud preserves all memory data
- No data loss when following the "only one active at a time" rule

## Open Questions

- None - design is straightforward extension of existing cloud logic
