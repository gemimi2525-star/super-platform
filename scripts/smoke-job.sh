#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# CORE OS — Smoke Test: Enqueue + Poll until COMPLETED (Phase 21C)
# ═══════════════════════════════════════════════════════════════════
# Usage: ./scripts/smoke-job.sh [jobType] [reason]
#   e.g. ./scripts/smoke-job.sh scheduler.tick local-e2e
set -euo pipefail

BASE_URL="${COREOS_API_URL:-http://127.0.0.1:3001}"
JOB_TYPE="${1:-scheduler.tick}"
REASON="${2:-smoke}"
PD_ID="pd-smoke-$(date +%s)"

echo "[smoke] enqueue: $JOB_TYPE reason=$REASON"
RESP="$(curl -s -X POST "$BASE_URL/api/jobs/enqueue" \
  -H "content-type: application/json" \
  -d "{\"jobType\":\"$JOB_TYPE\",\"payload\":{\"reason\":\"$REASON\"},\"policyDecisionId\":\"$PD_ID\"}")"

echo "$RESP"
JOB_ID="$(echo "$RESP" | python3 -c 'import sys, json; print(json.loads(sys.stdin.read())["jobId"])')"

echo "[smoke] jobId=$JOB_ID — waiting for COMPLETED..."
for i in $(seq 1 30); do
  S="$(curl -s "$BASE_URL/api/jobs/$JOB_ID")"
  STATUS="$(echo "$S" | python3 -c 'import sys, json; print(json.loads(sys.stdin.read())["status"])')"
  echo "[smoke] try=$i status=$STATUS"
  if [ "$STATUS" = "COMPLETED" ]; then
    echo "[smoke] ✅ PASS"
    exit 0
  fi
  sleep 1
done

echo "[smoke] ❌ FAIL — timeout after 30s"
exit 1
