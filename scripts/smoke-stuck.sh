#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# Smoke: Stuck Job Detection (Phase 22B)
# ═══════════════════════════════════════════════════════════════════════════
set -euo pipefail
BASE="${COREOS_API_URL:-http://127.0.0.1:3001}"

echo "═══════════════════════════════════════"
echo "  Smoke: Stuck Job Detection (Phase 22B)"
echo "═══════════════════════════════════════"

# ─── 1. Enqueue __test.hang ───
PD_ID="pd-smoke-stuck-$(date +%s)"
echo "[smoke-stuck] Enqueuing __test.hang (hangSec=300)..."
ENQUEUE=$(curl -sf -X POST "$BASE/api/jobs/enqueue" \
  -H "Content-Type: application/json" \
  -d "{\"jobType\":\"__test.hang\",\"payload\":{\"hangSec\":300},\"policyDecisionId\":\"$PD_ID\"}")

JOB_ID=$(echo "$ENQUEUE" | python3 -c "import sys,json; print(json.load(sys.stdin)['jobId'])")
echo "[smoke-stuck] jobId=$JOB_ID"

# ─── 2. Wait for PROCESSING ───
echo "[smoke-stuck] Waiting for PROCESSING..."
for i in $(seq 1 15); do
  sleep 3
  STATUS=$(curl -sf "$BASE/api/jobs/$JOB_ID" | python3 -c "import sys,json; print(json.load(sys.stdin)['status'])")
  echo "[smoke-stuck] try=$i status=$STATUS"
  if [ "$STATUS" = "PROCESSING" ]; then
    echo "[smoke-stuck] ✅ Job is PROCESSING"
    break
  fi
  if [ "$i" -eq 15 ]; then echo "[smoke-stuck] ❌ FAIL — job never reached PROCESSING"; exit 1; fi
done

# ─── 3. Verify stuck endpoint responds ───
echo "[smoke-stuck] Checking /api/ops/jobs/stuck..."
STUCK_RESP=$(curl -sf "$BASE/api/ops/jobs/stuck")
HAS_JOBS=$(echo "$STUCK_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print('jobs' in d and 'count' in d)")
STUCK_COUNT=$(echo "$STUCK_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('count',0))")

echo "[smoke-stuck] Response: count=$STUCK_COUNT"

if [ "$HAS_JOBS" = "True" ]; then
  echo "[smoke-stuck] ✅ /api/ops/jobs/stuck responds with valid structure"
else
  echo "[smoke-stuck] ❌ FAIL — invalid response"; exit 1
fi

# Verify our job is still PROCESSING
JOB_STATUS=$(curl -sf "$BASE/api/jobs/$JOB_ID" | python3 -c "import sys,json; print(json.load(sys.stdin)['status'])")
if [ "$JOB_STATUS" = "PROCESSING" ]; then
  echo "[smoke-stuck] ✅ Job is still PROCESSING (hanging as expected)"
fi

echo ""
echo "[smoke-stuck] ✅ PASS — stuck endpoint verified"
echo "[smoke-stuck] Note: hanging job $JOB_ID will remain PROCESSING"
