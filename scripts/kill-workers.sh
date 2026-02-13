#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# CORE OS — Kill Stale Go Workers (Phase 21C)
# ═══════════════════════════════════════════════════════════════════
# Finds and kills any Go worker processes left over from previous
# `go run .` sessions. Run this BEFORE starting a new worker.
set -euo pipefail

echo "🔍 Searching for stale Go worker processes..."
ps aux | grep 'go-build.*worker' | grep -v grep || true

PIDS=$(ps aux | grep 'go-build.*worker' | grep -v grep | awk '{print $2}' || true)
if [ -n "${PIDS:-}" ]; then
  echo "⚠️  Killing worker PIDs: $PIDS"
  kill -9 $PIDS || true
  echo "✅ Killed."
else
  echo "✅ No stale Go worker processes found."
fi
