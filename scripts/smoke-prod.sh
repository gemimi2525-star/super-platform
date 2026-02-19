#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# smoke-prod.sh — Production Container Smoke Test (Phase 22C)
# ═══════════════════════════════════════════════════════════════════════════
# Assumes containers are running via docker compose.
# Tests: health → enqueue → COMPLETED → metrics counter → stuck endpoint
set -euo pipefail

BASE="${COREOS_API_URL:-http://127.0.0.1:3000}"

echo "═══════════════════════════════════════"
echo "  CORE OS — Production Smoke Test"
echo "═══════════════════════════════════════"

PASS=0
FAIL=0

# ── 1. Health Check ──
echo ""
echo "[1/5] Health Check..."
HEALTH=$(curl -sf "$BASE/api/worker/health" 2>/dev/null || echo '{"error":"unreachable"}')
HEALTH_STATUS=$(echo "$HEALTH" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status','FAIL'))" 2>/dev/null || echo "FAIL")

if [ "$HEALTH_STATUS" = "ok" ]; then
  echo "  ✅ /api/worker/health → ok"
  PASS=$((PASS+1))
else
  echo "  ❌ /api/worker/health → $HEALTH_STATUS"
  echo "     Response: $HEALTH"
  FAIL=$((FAIL+1))
fi

# ── 2. Enqueue Job ──
echo ""
echo "[2/5] Enqueue scheduler.tick..."
PD_ID="pd-prod-smoke-$(date +%s)"
ENQUEUE=$(curl -sf -X POST "$BASE/api/jobs/enqueue" \
  -H "Content-Type: application/json" \
  -d "{\"jobType\":\"scheduler.tick\",\"payload\":{\"reason\":\"prod-smoke\"},\"policyDecisionId\":\"$PD_ID\"}" 2>/dev/null || echo '{"error":"failed"}')

JOB_ID=$(echo "$ENQUEUE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('jobId','FAIL'))" 2>/dev/null || echo "FAIL")

if [ "$JOB_ID" != "FAIL" ]; then
  echo "  ✅ Enqueued: $JOB_ID"
  PASS=$((PASS+1))
else
  echo "  ❌ Enqueue failed: $ENQUEUE"
  FAIL=$((FAIL+1))
fi

# ── 3. Wait for COMPLETED ──
echo ""
echo "[3/5] Waiting for COMPLETED..."
JOB_DONE=false
for i in $(seq 1 30); do
  sleep 2
  STATUS=$(curl -sf "$BASE/api/jobs/$JOB_ID" 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin).get('status','UNKNOWN'))" 2>/dev/null || echo "UNKNOWN")
  echo "  try=$i status=$STATUS"
  if [ "$STATUS" = "COMPLETED" ]; then
    JOB_DONE=true
    break
  fi
done

if [ "$JOB_DONE" = "true" ]; then
  echo "  ✅ Job COMPLETED"
  PASS=$((PASS+1))
else
  echo "  ❌ Job did not complete (last status: $STATUS)"
  FAIL=$((FAIL+1))
fi

# ── 4. Metrics Summary ──
echo ""
echo "[4/5] Metrics Summary..."
sleep 2
SUMMARY=$(curl -sf "$BASE/api/ops/metrics/summary" 2>/dev/null || echo '{"error":"failed"}')
TOTAL=$(echo "$SUMMARY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('aggregated',{}).get('total',0))" 2>/dev/null || echo "0")

if [ "$TOTAL" -gt 0 ]; then
  COMPLETED=$(echo "$SUMMARY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('aggregated',{}).get('completed',0))")
  RATE=$(echo "$SUMMARY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('rates',{}).get('successRate',0))")
  echo "  ✅ Metrics: total=$TOTAL completed=$COMPLETED successRate=$RATE%"
  PASS=$((PASS+1))
else
  echo "  ❌ Metrics total=0"
  FAIL=$((FAIL+1))
fi

# ── 5. Stuck Endpoint ──
echo ""
echo "[5/5] Stuck Jobs Endpoint..."
STUCK=$(curl -sf "$BASE/api/ops/jobs/stuck" 2>/dev/null || echo '{"error":"failed"}')
HAS_COUNT=$(echo "$STUCK" | python3 -c "import sys,json; d=json.load(sys.stdin); print('count' in d and 'jobs' in d)" 2>/dev/null || echo "False")

if [ "$HAS_COUNT" = "True" ]; then
  STUCK_COUNT=$(echo "$STUCK" | python3 -c "import sys,json; print(json.load(sys.stdin)['count'])")
  echo "  ✅ Stuck endpoint: count=$STUCK_COUNT"
  PASS=$((PASS+1))
else
  echo "  ❌ Stuck endpoint invalid"
  FAIL=$((FAIL+1))
fi

# ── Summary ──
echo ""
echo "═══════════════════════════════════════"
echo "  Results: $PASS passed, $FAIL failed"
echo "═══════════════════════════════════════"

if [ "$FAIL" -eq 0 ]; then
  echo "  ✅ ALL PRODUCTION SMOKE TESTS PASSED"
  exit 0
else
  echo "  ❌ $FAIL TEST(S) FAILED"
  exit 1
fi
