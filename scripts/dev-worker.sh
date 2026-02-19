#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# CORE OS — Start Go Worker for Dev (Phase 21C)
# ═══════════════════════════════════════════════════════════════════
# Prerequisites:
#   1. TS dev server must be running on port 3000
#   2. Run `scripts/kill-workers.sh` first to clear stale processes
#   3. Env vars can be sourced from .env.local or set manually
set -euo pipefail

export PATH="/usr/local/go/bin:$PATH"
export COREOS_API_URL="${COREOS_API_URL:-http://127.0.0.1:3000}"
export WORKER_ID="${WORKER_ID:-worker-dev-1}"

# Load from .env.local if vars are missing
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

if [ -z "${JOB_WORKER_HMAC_SECRET:-}" ] || [ -z "${JOB_TICKET_PUBLIC_KEY:-}" ]; then
  if [ -f "$PROJECT_ROOT/.env.local" ]; then
    echo "📂 Loading secrets from .env.local..."
    export JOB_WORKER_HMAC_SECRET=$(grep '^JOB_WORKER_HMAC_SECRET=' "$PROJECT_ROOT/.env.local" | cut -d'=' -f2-)
    export JOB_TICKET_PUBLIC_KEY=$(grep '^JOB_TICKET_PUBLIC_KEY=' "$PROJECT_ROOT/.env.local" | head -1 | cut -d'=' -f2-)
  fi
fi

if [ -z "${JOB_WORKER_HMAC_SECRET:-}" ]; then
  echo "❌ [FATAL] JOB_WORKER_HMAC_SECRET is missing."
  echo "   Set it in .env.local or export it before running."
  exit 1
fi
if [ -z "${JOB_TICKET_PUBLIC_KEY:-}" ]; then
  echo "❌ [FATAL] JOB_TICKET_PUBLIC_KEY is missing."
  echo "   Set it in .env.local or export it before running."
  exit 1
fi

echo "═══════════════════════════════════════"
echo "  Go Worker Dev Environment"
echo "═══════════════════════════════════════"
echo "  API URL:   $COREOS_API_URL"
echo "  Worker ID: $WORKER_ID"
echo "  HMAC:      ${JOB_WORKER_HMAC_SECRET:0:8}..."
echo "  PubKey:    ${JOB_TICKET_PUBLIC_KEY:0:12}..."
echo "═══════════════════════════════════════"

cd "$PROJECT_ROOT/worker"
exec go run .
