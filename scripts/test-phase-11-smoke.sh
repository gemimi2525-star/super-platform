#!/usr/bin/env bash
# =============================================================================
# Phase 11: Smoke Tests
# 
# Tests for Production Hardening features.
# Runs deterministic tests to verify:
# - API returns 401 JSON with correct schema
# - /os redirect behavior
# - Error codes and retryable flags
# =============================================================================

set -e

echo "╔════════════════════════════════════════════════════════════════════════╗"
echo "║         Phase 11: Production Hardening Smoke Tests                     ║"
echo "╚════════════════════════════════════════════════════════════════════════╝"
echo ""

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3000}"
PASSED=0
FAILED=0

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test helper function
test_case() {
    local name="$1"
    local expected="$2"
    local actual="$3"
    
    if [ "$expected" = "$actual" ]; then
        echo -e "${GREEN}✅ PASS:${NC} $name"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL:${NC} $name"
        echo "   Expected: $expected"
        echo "   Actual:   $actual"
        ((FAILED++))
    fi
}

# =============================================================================
# Test 1: API 401 Response Schema (No Cookie)
# =============================================================================
echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo "Test 1: API 401 Response Schema (No Cookie)"
echo "═══════════════════════════════════════════════════════════════════════"

# Get response and status
RESPONSE=$(curl -s "$BASE_URL/api/platform/me")
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/platform/me")

# With bypass enabled, we get 200, so check for that case
if [ "$STATUS" = "200" ]; then
    echo -e "${YELLOW}⚠️  DEV_BYPASS enabled - checking bypass response schema${NC}"
    
    # Check authMode is present
    AUTH_MODE=$(echo "$RESPONSE" | grep -o '"authMode"' || echo "missing")
    test_case "Response has authMode field" "\"authMode\"" "$AUTH_MODE"
    
    # Check success is present
    SUCCESS=$(echo "$RESPONSE" | grep -o '"success":true' || echo "missing")
    test_case "Response has success:true" "\"success\":true" "$SUCCESS"
    
elif [ "$STATUS" = "401" ]; then
    echo "Testing 401 response schema..."
    
    # Check for required fields
    HAS_SUCCESS=$(echo "$RESPONSE" | grep -o '"success":false' || echo "missing")
    test_case "Has success:false" "\"success\":false" "$HAS_SUCCESS"
    
    HAS_CODE=$(echo "$RESPONSE" | grep -o '"code"' || echo "missing")
    test_case "Has error code" "\"code\"" "$HAS_CODE"
    
    HAS_ERROR_ID=$(echo "$RESPONSE" | grep -o '"errorId"' || echo "missing")
    test_case "Has errorId" "\"errorId\"" "$HAS_ERROR_ID"
    
    HAS_TIMESTAMP=$(echo "$RESPONSE" | grep -o '"timestamp"' || echo "missing")
    test_case "Has timestamp" "\"timestamp\"" "$HAS_TIMESTAMP"
else
    echo -e "${RED}Unexpected status: $STATUS${NC}"
    ((FAILED++))
fi

# =============================================================================
# Test 2: /os Redirect Behavior
# =============================================================================
echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo "Test 2: /os Redirect Behavior"
echo "═══════════════════════════════════════════════════════════════════════"

OS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-redirs 0 "$BASE_URL/os" 2>/dev/null || echo "307")

if [ "$OS_STATUS" = "200" ]; then
    echo -e "${YELLOW}⚠️  DEV_BYPASS enabled - /os returns 200${NC}"
    test_case "/os accessible with bypass" "200" "$OS_STATUS"
elif [ "$OS_STATUS" = "307" ]; then
    test_case "/os redirects without session" "307" "$OS_STATUS"
    
    # Check redirect location
    LOCATION=$(curl -sI "$BASE_URL/os" 2>/dev/null | grep -i "^location:" | head -1 || echo "")
    HAS_CALLBACK=$(echo "$LOCATION" | grep -o "login" || echo "missing")
    test_case "Redirects to /login" "login" "$HAS_CALLBACK"
else
    test_case "/os returns expected status" "200 or 307" "$OS_STATUS"
fi

# =============================================================================
# Test 3: Multiple API Endpoints
# =============================================================================
echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo "Test 3: Multiple API Endpoints"
echo "═══════════════════════════════════════════════════════════════════════"

ENDPOINTS=("/api/platform/users" "/api/platform/orgs" "/api/platform/session-debug")

for endpoint in "${ENDPOINTS[@]}"; do
    RESP=$(curl -s "$BASE_URL$endpoint")
    STAT=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint")
    
    if [ "$STAT" = "200" ] || [ "$STAT" = "401" ]; then
        # Check for success field
        HAS_SUCCESS=$(echo "$RESP" | grep -o '"success"' || echo "missing")
        test_case "$endpoint has success field" "\"success\"" "$HAS_SUCCESS"
    else
        echo -e "${RED}❌ $endpoint returned unexpected status: $STAT${NC}"
        ((FAILED++))
    fi
done

# =============================================================================
# Test 4: Content-Type Headers
# =============================================================================
echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo "Test 4: API Content-Type (JSON Only)"
echo "═══════════════════════════════════════════════════════════════════════"

CONTENT_TYPE=$(curl -sI "$BASE_URL/api/platform/me" | grep -i "content-type" | head -1)
HAS_JSON=$(echo "$CONTENT_TYPE" | grep -o "application/json" || echo "missing")
test_case "API returns application/json" "application/json" "$HAS_JSON"

# =============================================================================
# Summary
# =============================================================================
echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo "SUMMARY"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed.${NC}"
    exit 1
fi
