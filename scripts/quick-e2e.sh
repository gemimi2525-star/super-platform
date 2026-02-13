#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# CORE OS — Quick E2E Guide (Phase 21C)
# ═══════════════════════════════════════════════════════════════════
# Prints the 3-terminal workflow for running a complete local E2E.
set -euo pipefail

cat <<'EOF'
═══════════════════════════════════════════════════════════
  CORE OS — Local E2E Quickstart (Phase 21C)
═══════════════════════════════════════════════════════════

  Terminal A — TS Dev Server:
    ./scripts/dev-ts.sh

  Terminal B — Go Worker:
    ./scripts/kill-workers.sh && ./scripts/dev-worker.sh

  Terminal C — Smoke Test:
    ./scripts/smoke-job.sh scheduler.tick quick-e2e

═══════════════════════════════════════════════════════════
EOF
