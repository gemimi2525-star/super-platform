#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# prod-down.sh — Stop CORE OS containers (Phase 22C)
# ═══════════════════════════════════════════════════════════════════════════
set -euo pipefail
cd "$(dirname "$0")/.."

echo "═══════════════════════════════════════"
echo "  CORE OS — Docker Production Stop"
echo "═══════════════════════════════════════"

docker compose down

echo ""
echo "✅ All containers stopped"
