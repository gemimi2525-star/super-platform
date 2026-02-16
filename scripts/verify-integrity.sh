#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# verify-integrity.sh — Phase 30
# ═══════════════════════════════════════════════════════════════════════════
#
# Fetches the integrity endpoint and verifies the HMAC SHA-256 signature.
#
# Usage:
#   INTEGRITY_HMAC_SECRET=<secret> ./scripts/verify-integrity.sh [url]
#
# Default URL: https://www.apicoredata.com/api/platform/integrity
# Requires: curl, jq, openssl
# ═══════════════════════════════════════════════════════════════════════════

set -euo pipefail

URL="${1:-https://www.apicoredata.com/api/platform/integrity}"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "  ${GREEN}✓ $1${NC}"; }
fail() { echo -e "  ${RED}✗ $1${NC}"; FAILURES=$((FAILURES + 1)); }
warn() { echo -e "  ${YELLOW}⚠ $1${NC}"; }

FAILURES=0

echo "═══════════════════════════════════════════════════════════"
echo " Phase 30 — Integrity Signature Verification"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Endpoint: $URL"
echo ""

# ── Fetch ─────────────────────────────────────────────────────
echo "▸ Fetching integrity response..."
RESPONSE=$(curl -s "$URL")
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$URL")

if [ "$HTTP_CODE" != "200" ]; then
    fail "HTTP status: $HTTP_CODE (expected 200)"
    exit 1
fi
pass "HTTP 200"

# ── Extract signature ─────────────────────────────────────────
SIGNATURE=$(echo "$RESPONSE" | jq -r '.signature // empty')
if [ -z "$SIGNATURE" ]; then
    fail "No signature field in response"
    exit 1
fi
pass "signature field present: ${SIGNATURE:0:16}..."

if [ "$SIGNATURE" = "unsigned" ]; then
    warn "Response is UNSIGNED (INTEGRITY_HMAC_SECRET not configured)"
    echo ""
    echo "Signature verification skipped (unsigned mode)."
    echo "Set INTEGRITY_HMAC_SECRET env var on Vercel to enable signing."
    exit 0
fi

# ── Verify HMAC ───────────────────────────────────────────────
if [ -z "${INTEGRITY_HMAC_SECRET:-}" ]; then
    fail "INTEGRITY_HMAC_SECRET not set — cannot verify"
    echo ""
    echo "Usage: INTEGRITY_HMAC_SECRET=<secret> $0 [url]"
    exit 1
fi

# Remove signature field and produce canonical JSON (sorted keys)
PAYLOAD=$(echo "$RESPONSE" | jq -cS 'del(.signature)')
COMPUTED=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$INTEGRITY_HMAC_SECRET" -hex 2>/dev/null | awk '{print $NF}')

echo ""
echo "▸ Verifying HMAC SHA-256..."
echo "  Payload (canonical): ${PAYLOAD:0:80}..."
echo "  Expected:  $SIGNATURE"
echo "  Computed:  $COMPUTED"

if [ "$COMPUTED" = "$SIGNATURE" ]; then
    pass "SIGNATURE VALID ✓"
else
    fail "SIGNATURE MISMATCH ✗"
fi

# ── Tamper test ───────────────────────────────────────────────
echo ""
echo "▸ Tamper detection test..."
TAMPERED=$(echo "$RESPONSE" | jq -cS 'del(.signature) | .status = "HACKED"')
TAMPERED_SIG=$(echo -n "$TAMPERED" | openssl dgst -sha256 -hmac "$INTEGRITY_HMAC_SECRET" -hex 2>/dev/null | awk '{print $NF}')

if [ "$TAMPERED_SIG" != "$SIGNATURE" ]; then
    pass "Tampered payload produces different signature"
else
    fail "Tampered payload produced same signature (!)"
fi

# ── Summary ───────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════"
if [ "$FAILURES" -eq 0 ]; then
    echo -e "  ${GREEN}ALL CHECKS PASSED${NC}"
else
    echo -e "  ${RED}$FAILURES CHECK(S) FAILED${NC}"
fi
echo "═══════════════════════════════════════════════════════════"
exit "$FAILURES"
