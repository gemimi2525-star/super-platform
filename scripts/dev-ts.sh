#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# CORE OS — Start TS Dev Server (Phase 21C)
# ═══════════════════════════════════════════════════════════════════
# Starts Next.js dev server on port 3001.
# Kills any existing process on port 3001 first.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Kill anything on port 3001
echo "🔍 Checking port 3001..."
EXISTING=$(lsof -tiTCP:3001 -sTCP:LISTEN 2>/dev/null || true)
if [ -n "${EXISTING:-}" ]; then
  echo "⚠️  Killing existing process on port 3001 (PID: $EXISTING)"
  kill -9 $EXISTING 2>/dev/null || true
  sleep 1
fi

# Clean Next.js lock
rm -f "$PROJECT_ROOT/.next/dev/lock"

echo "🚀 Starting Next.js dev server on port 3001..."
cd "$PROJECT_ROOT"
PORT=3001 exec npm run dev
