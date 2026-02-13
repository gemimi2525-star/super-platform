#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# prod-up.sh — Build & Start CORE OS containers (Phase 22C)
# ═══════════════════════════════════════════════════════════════════════════
set -euo pipefail
cd "$(dirname "$0")/.."

echo "═══════════════════════════════════════"
echo "  CORE OS — Docker Production Start"
echo "═══════════════════════════════════════"

# Build and start
docker compose up -d --build

echo ""
echo "Waiting for services to be healthy..."
sleep 5

# Check health
TS_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' coreos-ts 2>/dev/null || echo "unknown")
WORKER_STATUS=$(docker inspect --format='{{.State.Status}}' coreos-worker 2>/dev/null || echo "unknown")

echo ""
echo "  coreos-ts:     $TS_HEALTH"
echo "  coreos-worker: $WORKER_STATUS"
echo ""

if [ "$TS_HEALTH" = "healthy" ]; then
  echo "✅ CORE OS is running at http://localhost:3001"
else
  echo "⏳ TS container still starting (health: $TS_HEALTH)"
  echo "   Run 'docker compose logs -f' to check"
fi
