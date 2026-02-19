#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# CORE OS — Smoke Test: Dead Letter (Phase 22A)
# ═══════════════════════════════════════════════════════════════════════════
# Enqueues a __test.fail_n_times job that always fails.
# maxAttempts=2 → 2 failures → DEAD.
# Verifies: status=DEAD, attempts=maxAttempts, lastError present.
set -euo pipefail

BASE_URL="${COREOS_API_URL:-http://127.0.0.1:3000}"

echo "═══════════════════════════════════════"
echo "  Smoke: Dead Letter (Phase 22A)"
echo "═══════════════════════════════════════"

# Enqueue with maxAttempts=2 (fast dead-letter)
echo "[smoke-deadletter] enqueue __test.fail_n_times (maxAttempts=2, failCount=99)"
RESP=$(curl -s -X POST "$BASE_URL/api/jobs/enqueue" \
  -H "content-type: application/json" \
  -d "{\"jobType\":\"__test.fail_n_times\",\"payload\":{\"reason\":\"smoke-deadletter\",\"failCount\":99},\"policyDecisionId\":\"pd-dead-$(date +%s)\",\"maxAttempts\":2}")

echo "$RESP"
JOB_ID=$(echo "$RESP" | python3 -c 'import sys,json; print(json.load(sys.stdin)["jobId"])')
echo "[smoke-deadletter] jobId=$JOB_ID"

echo "[smoke-deadletter] Polling..."
for i in $(seq 1 60); do
  S=$(curl -s "$BASE_URL/api/jobs/$JOB_ID")
  STATUS=$(echo "$S" | python3 -c 'import sys,json; print(json.load(sys.stdin)["status"])')
  ATTEMPTS=$(echo "$S" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("attempts",0))')

  echo "[smoke-deadletter] try=$i status=$STATUS attempts=$ATTEMPTS"

  if [ "$STATUS" = "DEAD" ]; then
    break
  fi

  sleep 2
done

if [ "$STATUS" != "DEAD" ]; then
  echo "[smoke-deadletter] ❌ FAIL — expected DEAD, got $STATUS"
  exit 1
fi

echo ""
# Verify attempts
echo "[smoke-deadletter] ✅ status=DEAD"

if [ "$ATTEMPTS" -ge 2 ]; then
  echo "[smoke-deadletter] ✅ attempts=$ATTEMPTS (>= maxAttempts=2)"
else
  echo "[smoke-deadletter] ❌ FAIL — attempts=$ATTEMPTS, expected >= 2"
  exit 1
fi

# Verify lastError
LAST_ERROR=$(echo "$S" | python3 -c 'import sys,json; e=json.load(sys.stdin).get("lastError",{}); print(e.get("code","missing"))')
LAST_MSG=$(echo "$S" | python3 -c 'import sys,json; e=json.load(sys.stdin).get("lastError",{}); print(e.get("message","missing")[:60])')

if [ "$LAST_ERROR" != "missing" ]; then
  echo "[smoke-deadletter] ✅ lastError.code=$LAST_ERROR"
  echo "[smoke-deadletter]    lastError.message=$LAST_MSG"
else
  echo "[smoke-deadletter] ❌ FAIL — lastError not present"
  exit 1
fi

echo ""
echo "[smoke-deadletter] ✅ PASS — dead letter verified"
