#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# Smoke: Metrics Counters (Phase 22B)
# ═══════════════════════════════════════════════════════════════════════════
set -euo pipefail
BASE="${COREOS_API_URL:-http://127.0.0.1:3000}"

echo "═══════════════════════════════════════"
echo "  Smoke: Metrics Counters (Phase 22B)"
echo "═══════════════════════════════════════"

# ─── 1. Baseline ───
echo "[smoke-metrics] Fetching baseline counters..."
BEFORE=$(curl -sf "$BASE/api/ops/metrics/summary")
BEFORE_TOTAL=$(echo "$BEFORE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('aggregated',{}).get('total',0))" 2>/dev/null || echo "0")
echo "[smoke-metrics] Baseline jobs_total=$BEFORE_TOTAL"

# ─── 2. Enqueue + wait for completion ───
PD_ID="pd-smoke-metrics-$(date +%s)"
echo "[smoke-metrics] Enqueuing scheduler.tick..."
ENQUEUE=$(curl -sf -X POST "$BASE/api/jobs/enqueue" \
  -H "Content-Type: application/json" \
  -d "{\"jobType\":\"scheduler.tick\",\"payload\":{\"reason\":\"smoke-metrics\"},\"policyDecisionId\":\"$PD_ID\"}")

JOB_ID=$(echo "$ENQUEUE" | python3 -c "import sys,json; print(json.load(sys.stdin)['jobId'])")
echo "[smoke-metrics] jobId=$JOB_ID"

for i in $(seq 1 20); do
  sleep 3
  STATUS=$(curl -sf "$BASE/api/jobs/$JOB_ID" | python3 -c "import sys,json; print(json.load(sys.stdin)['status'])")
  echo "[smoke-metrics] try=$i status=$STATUS"
  if [ "$STATUS" = "COMPLETED" ]; then break; fi
  if [ "$i" -eq 20 ]; then echo "[smoke-metrics] ❌ FAIL — job did not complete"; exit 1; fi
done

# ─── 3. Assert counters incremented ───
sleep 2
AFTER=$(curl -sf "$BASE/api/ops/metrics/summary")
AFTER_TOTAL=$(echo "$AFTER" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('aggregated',{}).get('total',0))")
AFTER_COMPLETED=$(echo "$AFTER" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('aggregated',{}).get('completed',0))")
AFTER_SUCCESS=$(echo "$AFTER" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('rates',{}).get('successRate',0))")

echo "[smoke-metrics] After: total=$AFTER_TOTAL completed=$AFTER_COMPLETED successRate=$AFTER_SUCCESS%"

if [ "$AFTER_TOTAL" -gt "$BEFORE_TOTAL" ]; then
  echo "[smoke-metrics] ✅ jobs_total incremented ($BEFORE_TOTAL → $AFTER_TOTAL)"
else
  echo "[smoke-metrics] ❌ FAIL — jobs_total did not increment"; exit 1
fi

if [ "$AFTER_COMPLETED" -gt 0 ]; then
  echo "[smoke-metrics] ✅ jobs_completed > 0 ($AFTER_COMPLETED)"
else
  echo "[smoke-metrics] ❌ FAIL — jobs_completed is 0"; exit 1
fi

echo ""
echo "[smoke-metrics] ✅ PASS — metrics counters verified"
