#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# Smoke: Timeseries Telemetry (Phase 22B)
# ═══════════════════════════════════════════════════════════════════════════
set -euo pipefail
BASE="${COREOS_API_URL:-http://127.0.0.1:3001}"

echo "═══════════════════════════════════════"
echo "  Smoke: Timeseries Telemetry (Phase 22B)"
echo "═══════════════════════════════════════"

# ─── 1. Enqueue and wait for completion ───
PD_ID="pd-smoke-telemetry-$(date +%s)"
echo "[smoke-telemetry] Enqueuing scheduler.tick..."
ENQUEUE=$(curl -sf -X POST "$BASE/api/jobs/enqueue" \
  -H "Content-Type: application/json" \
  -d "{\"jobType\":\"scheduler.tick\",\"payload\":{\"reason\":\"smoke-telemetry\"},\"policyDecisionId\":\"$PD_ID\"}")

JOB_ID=$(echo "$ENQUEUE" | python3 -c "import sys,json; print(json.load(sys.stdin)['jobId'])")
echo "[smoke-telemetry] jobId=$JOB_ID"

for i in $(seq 1 20); do
  sleep 3
  STATUS=$(curl -sf "$BASE/api/jobs/$JOB_ID" | python3 -c "import sys,json; print(json.load(sys.stdin)['status'])")
  echo "[smoke-telemetry] try=$i status=$STATUS"
  if [ "$STATUS" = "COMPLETED" ]; then break; fi
  if [ "$i" -eq 20 ]; then echo "[smoke-telemetry] ❌ FAIL — job did not complete"; exit 1; fi
done

sleep 2

# ─── 2. Query timeseries endpoint ───
echo "[smoke-telemetry] Querying timeseries (metric=job_latency, window=60m)..."
TS_RESP=$(curl -sf "$BASE/api/ops/metrics/timeseries?metric=job_latency&window=60m")
TOTAL_ENTRIES=$(echo "$TS_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('totalEntries',0))")
BUCKET_COUNT=$(echo "$TS_RESP" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('buckets',[])))")

echo "[smoke-telemetry] totalEntries=$TOTAL_ENTRIES buckets=$BUCKET_COUNT"

if [ "$TOTAL_ENTRIES" -gt 0 ]; then
  echo "[smoke-telemetry] ✅ Timeseries has $TOTAL_ENTRIES entries"
else
  echo "[smoke-telemetry] ❌ FAIL — no timeseries entries"; exit 1
fi

if [ "$BUCKET_COUNT" -gt 0 ]; then
  echo "[smoke-telemetry] ✅ $BUCKET_COUNT bucket(s) returned"
  echo "$TS_RESP" | python3 -c "import sys,json; b=json.load(sys.stdin)['buckets'][0]; print(f'  bucket={b[\"bucket\"]} count={b[\"count\"]} avg={b[\"avg\"]}ms')"
else
  echo "[smoke-telemetry] ❌ FAIL — no buckets"; exit 1
fi

echo ""
echo "[smoke-telemetry] ✅ PASS — timeseries telemetry verified"
