#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# verify-parity.sh — Phase 32.5 Regression Gate
# ═══════════════════════════════════════════════════════════════════════════
#
# Calls production endpoints and asserts Phase 32.5 baseline invariants:
#   1. build-info.shaResolved = true
#   2. integrity.status = "OK"
#   3. integrity.errorCodes = []
#   4. integrity.checks.governance.ok = true
#   5. build-info.commit (short) = integrity.build.sha
#
# Usage:
#   ./scripts/verify-parity.sh [production|staging|local]
#
# Requires: curl, jq
# ═══════════════════════════════════════════════════════════════════════════

set -euo pipefail

# ── Configuration ─────────────────────────────────────────────
ENV="${1:-production}"
CB="$(date +%s)"

case "$ENV" in
    production)
        BASE="https://www.apicoredata.com"
        ;;
    staging)
        BASE="${STAGING_URL:-https://staging.apicoredata.com}"
        ;;
    local)
        BASE="http://localhost:3000"
        ;;
    *)
        echo "Usage: $0 [production|staging|local]"
        exit 1
        ;;
esac

BUILD_INFO_URL="${BASE}/api/build-info?cb=${CB}"
INTEGRITY_URL="${BASE}/api/platform/integrity?cb=${CB}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

pass() { echo -e "  ${GREEN}✓${NC} $1"; }
fail() { echo -e "  ${RED}✗${NC} $1"; FAILURES=$((FAILURES + 1)); }
info() { echo -e "  ${YELLOW}▸${NC} $1"; }

FAILURES=0

echo ""
echo -e "${BOLD}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD} Phase 32.5 — Parity Verification Gate${NC}"
echo -e "${BOLD}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "  Environment: $ENV"
echo "  Cache-bust:  $CB"
echo ""

# ── 1. Fetch build-info ───────────────────────────────────────
echo -e "${BOLD}▸ Fetching /api/build-info${NC}"
BI_RESPONSE=$(curl -sf "$BUILD_INFO_URL" 2>/dev/null) || {
    fail "Cannot reach $BUILD_INFO_URL"
    echo ""
    echo "RESULT: FAIL ($FAILURES failures)"
    exit 1
}
echo "$BI_RESPONSE" | jq . 2>/dev/null || echo "$BI_RESPONSE"
echo ""

BI_SHA_RESOLVED=$(echo "$BI_RESPONSE" | jq -r '.shaResolved // "null"')
BI_COMMIT=$(echo "$BI_RESPONSE" | jq -r '.commit // "null"')
BI_VERSION=$(echo "$BI_RESPONSE" | jq -r '.version // "null"')

if [ "$BI_SHA_RESOLVED" = "true" ]; then
    pass "build-info.shaResolved = true"
else
    fail "build-info.shaResolved = $BI_SHA_RESOLVED (expected true)"
fi

# ── 2. Fetch integrity ───────────────────────────────────────
echo ""
echo -e "${BOLD}▸ Fetching /api/platform/integrity${NC}"
INT_RESPONSE=$(curl -sf "$INTEGRITY_URL" 2>/dev/null) || {
    fail "Cannot reach $INTEGRITY_URL"
    echo ""
    echo "RESULT: FAIL ($FAILURES failures)"
    exit 1
}
echo "$INT_RESPONSE" | jq . 2>/dev/null || echo "$INT_RESPONSE"
echo ""

INT_STATUS=$(echo "$INT_RESPONSE" | jq -r '.status // "null"')
INT_ERROR_COUNT=$(echo "$INT_RESPONSE" | jq '.errorCodes | length')
INT_GOV_OK=$(echo "$INT_RESPONSE" | jq -r '.checks.governance.ok // "null"')
INT_GOV_FROZEN=$(echo "$INT_RESPONSE" | jq -r '.checks.governance.kernelFrozen // "null"')
INT_GOV_HASH=$(echo "$INT_RESPONSE" | jq -r '.checks.governance.hashValid // "null"')
INT_BUILD_SHA=$(echo "$INT_RESPONSE" | jq -r '.checks.build.sha // "null"')
INT_VERSION=$(echo "$INT_RESPONSE" | jq -r '.version // "null"')
INT_PHASE=$(echo "$INT_RESPONSE" | jq -r '.phase // "null"')

# ── 3. Assert invariants ──────────────────────────────────────
echo -e "${BOLD}▸ Asserting baseline invariants${NC}"

if [ "$INT_STATUS" = "OK" ]; then
    pass "integrity.status = OK"
else
    fail "integrity.status = $INT_STATUS (expected OK)"
fi

if [ "$INT_ERROR_COUNT" = "0" ]; then
    pass "integrity.errorCodes = [] (empty)"
else
    fail "integrity.errorCodes has $INT_ERROR_COUNT entries (expected 0)"
    info "errorCodes: $(echo "$INT_RESPONSE" | jq -c '.errorCodes')"
fi

if [ "$INT_GOV_OK" = "true" ]; then
    pass "governance.ok = true"
else
    fail "governance.ok = $INT_GOV_OK (expected true)"
fi

if [ "$INT_GOV_FROZEN" = "true" ]; then
    pass "governance.kernelFrozen = true"
else
    fail "governance.kernelFrozen = $INT_GOV_FROZEN (expected true)"
fi

if [ "$INT_GOV_HASH" = "true" ]; then
    pass "governance.hashValid = true"
else
    fail "governance.hashValid = $INT_GOV_HASH (expected true)"
fi

# ── 4. Cross-check parity ────────────────────────────────────
echo ""
echo -e "${BOLD}▸ Cross-checking parity${NC}"

# Short SHA comparison: build-info has full SHA, integrity has short
BI_SHORT="${BI_COMMIT:0:7}"
if [ "$BI_SHORT" = "$INT_BUILD_SHA" ]; then
    pass "build-info.commit[:7] ($BI_SHORT) = integrity.build.sha ($INT_BUILD_SHA)"
else
    fail "SHA mismatch: build-info=$BI_SHORT, integrity=$INT_BUILD_SHA"
fi

# ── 5. Summary ────────────────────────────────────────────────
echo ""
echo -e "${BOLD}═══════════════════════════════════════════════════════════${NC}"
echo -e "  Commit:    ${BOLD}${BI_COMMIT:0:7}${NC}"
echo -e "  Version:   ${BOLD}${BI_VERSION}${NC} / ${INT_VERSION}"
echo -e "  Phase:     ${BOLD}${INT_PHASE}${NC}"
echo -e "  Status:    ${BOLD}${INT_STATUS}${NC}"
echo ""
if [ "$FAILURES" -eq 0 ]; then
    echo -e "  ${GREEN}${BOLD}ALL CHECKS PASSED — PARITY OK${NC}"
else
    echo -e "  ${RED}${BOLD}$FAILURES CHECK(S) FAILED — PARITY BROKEN${NC}"
fi
echo -e "${BOLD}═══════════════════════════════════════════════════════════${NC}"
echo ""

exit "$FAILURES"
