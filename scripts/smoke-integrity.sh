#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# Smoke Test — /api/platform/integrity (Phase 29)
# ═══════════════════════════════════════════════════════════════════════════
#
# Usage:
#   BASE_URL=https://www.apicoredata.com ./scripts/smoke-integrity.sh
#   ./scripts/smoke-integrity.sh  # defaults to production
#
# Requires: curl, jq

set -euo pipefail

BASE_URL="${BASE_URL:-https://www.apicoredata.com}"
ENDPOINT="${BASE_URL}/api/platform/integrity"

echo "═══════════════════════════════════════════════════════════════"
echo "  Phase 29 — Integrity Smoke Test"
echo "  Target: ${ENDPOINT}"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Fetch the endpoint
HTTP_CODE=$(curl -s -o /tmp/integrity.json -w "%{http_code}" "${ENDPOINT}")

echo "HTTP Status: ${HTTP_CODE}"

if [ "${HTTP_CODE}" != "200" ]; then
    echo "❌ FAIL: Expected 200, got ${HTTP_CODE}"
    cat /tmp/integrity.json 2>/dev/null || true
    exit 1
fi

echo "✅ HTTP 200 OK"
echo ""

# Parse JSON
echo "─── Response ───"
jq '.' /tmp/integrity.json
echo ""

# Validate required keys
echo "─── Schema Validation ───"
ERRORS=0

for KEY in status checks ts phase version errorCodes; do
    if ! jq -e ".${KEY}" /tmp/integrity.json >/dev/null 2>&1; then
        echo "❌ Missing key: ${KEY}"
        ERRORS=$((ERRORS + 1))
    else
        echo "✅ ${KEY} present"
    fi
done

# Validate nested checks
for CHECK in firebase auth governance build; do
    if ! jq -e ".checks.${CHECK}" /tmp/integrity.json >/dev/null 2>&1; then
        echo "❌ Missing check: checks.${CHECK}"
        ERRORS=$((ERRORS + 1))
    else
        echo "✅ checks.${CHECK} present"
    fi
done

# Validate firebase has latencyMs
if ! jq -e ".checks.firebase.latencyMs" /tmp/integrity.json >/dev/null 2>&1; then
    echo "❌ Missing: checks.firebase.latencyMs"
    ERRORS=$((ERRORS + 1))
else
    LATENCY=$(jq '.checks.firebase.latencyMs' /tmp/integrity.json)
    echo "✅ checks.firebase.latencyMs = ${LATENCY}ms"
fi

# Optional strict checks
PHASE=$(jq -r '.phase' /tmp/integrity.json)
VERSION=$(jq -r '.version' /tmp/integrity.json)
STATUS=$(jq -r '.status' /tmp/integrity.json)

echo ""
echo "─── Values ───"
echo "  status:  ${STATUS}"
echo "  phase:   ${PHASE}"
echo "  version: ${VERSION}"

if [ "${PHASE}" != "29" ]; then
    echo "⚠️  Warning: phase is '${PHASE}', expected '29'"
fi
if [ "${VERSION}" != "v0.29" ]; then
    echo "⚠️  Warning: version is '${VERSION}', expected 'v0.29'"
fi

echo ""
if [ "${ERRORS}" -gt 0 ]; then
    echo "❌ FAIL: ${ERRORS} schema error(s)"
    exit 1
else
    echo "✅ ALL CHECKS PASSED"
    exit 0
fi
