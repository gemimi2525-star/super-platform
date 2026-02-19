#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# CORE OS — Smoke Test: Health Endpoint (Phase 22A)
# ═══════════════════════════════════════════════════════════════════════════
set -euo pipefail

BASE_URL="${COREOS_API_URL:-http://127.0.0.1:3000}"

echo "[smoke-health] GET $BASE_URL/api/worker/health"
RESP=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/worker/health")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -1)

echo "[smoke-health] HTTP $HTTP_CODE"
echo "[smoke-health] Body: $BODY"

if [ "$HTTP_CODE" != "200" ]; then
  echo "[smoke-health] ❌ FAIL — expected 200, got $HTTP_CODE"
  exit 1
fi

# Check required fields
for FIELD in status env commitSha timeISO; do
  if ! echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); assert '$FIELD' in d, 'missing $FIELD'" 2>/dev/null; then
    echo "[smoke-health] ❌ FAIL — missing field: $FIELD"
    exit 1
  fi
done

STATUS=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['status'])")
if [ "$STATUS" != "ok" ]; then
  echo "[smoke-health] ❌ FAIL — status='$STATUS', expected 'ok'"
  exit 1
fi

echo "[smoke-health] ✅ PASS"
