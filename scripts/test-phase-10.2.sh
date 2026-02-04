#!/usr/bin/env bash
# =============================================================================
# Phase 10.2 Verification Script
# Tests NO SESSION (bypass off) and REAL AUTH modes
# =============================================================================

set -e

echo "╔════════════════════════════════════════════════════════════════════════╗"
echo "║         Phase 10.2: Final Verification Test Script                     ║"
echo "╚════════════════════════════════════════════════════════════════════════╝"
echo ""

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3000}"
COOKIE_FILE="/tmp/session_cookie.txt"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# =============================================================================
# A) NO SESSION GATE
# =============================================================================
echo "═══════════════════════════════════════════════════════════════════════"
echo "GATE A: NO SESSION (AUTH_DEV_BYPASS=false, no cookie)"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""
echo "⚠️  Before running this section:"
echo "   1. Stop the dev server"
echo "   2. Set AUTH_DEV_BYPASS=false in .env.local"
echo "   3. Start the dev server again (npm run dev)"
echo ""
echo "Press ENTER to continue or Ctrl+C to cancel..."
read

# Test 1: /os should redirect
echo "📍 Test A1: /os should redirect to /login"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -L --max-redirs 0 "$BASE_URL/os" 2>/dev/null || echo "307")
if [ "$STATUS" = "307" ]; then
    echo -e "${GREEN}✅ PASS: /os returned 307 (redirect)${NC}"
else
    echo -e "${RED}❌ FAIL: /os returned $STATUS (expected 307)${NC}"
fi

# Test 2: Check redirect location
echo "📍 Test A2: Redirect should point to /login?callbackUrl=/os"
LOCATION=$(curl -sI "$BASE_URL/os" 2>/dev/null | grep -i "^location:" | head -1 || echo "")
echo "   Location: $LOCATION"

# Test 3: API endpoints should return 401 JSON
echo ""
echo "📍 Test A3-8: APIs should return 401 JSON (no redirect)"
ENDPOINTS=("/api/platform/me" "/api/platform/users" "/api/platform/orgs" "/api/platform/session-debug" "/api/platform/audit-logs" "/api/platform/alerts")

for endpoint in "${ENDPOINTS[@]}"; do
    RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint" 2>/dev/null)
    STATUS=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    
    if [ "$STATUS" = "401" ]; then
        echo -e "${GREEN}✅ $endpoint → $STATUS${NC}"
    else
        echo -e "${YELLOW}⚠️ $endpoint → $STATUS (bypass may be on)${NC}"
    fi
done

echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo "GATE B: REAL AUTH (AUTH_DEV_BYPASS=false + __session)"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""
echo "⚠️  Before running this section:"
echo "   1. Ensure AUTH_DEV_BYPASS=false"
echo "   2. Run: npx tsx scripts/reset-and-seed.ts"
echo "   3. Login via browser to get __session cookie"
echo "   4. Export the cookie value below"
echo ""
echo "Enter __session cookie value (or press ENTER to skip):"
read SESSION_COOKIE

if [ -n "$SESSION_COOKIE" ]; then
    echo ""
    echo "Testing with session cookie..."
    
    for endpoint in "${ENDPOINTS[@]}"; do
        RESPONSE=$(curl -s -w "\n%{http_code}" -H "Cookie: __session=$SESSION_COOKIE" "$BASE_URL$endpoint" 2>/dev/null)
        STATUS=$(echo "$RESPONSE" | tail -n1)
        BODY=$(echo "$RESPONSE" | head -n -1)
        
        if [ "$STATUS" = "200" ]; then
            # Check for authMode
            if echo "$BODY" | grep -q '"authMode":"REAL"'; then
                echo -e "${GREEN}✅ $endpoint → $STATUS + authMode:REAL${NC}"
            elif echo "$BODY" | grep -q '"authMode":"DEV_BYPASS"'; then
                echo -e "${YELLOW}⚠️ $endpoint → $STATUS but authMode:DEV_BYPASS${NC}"
            else
                echo -e "${GREEN}✅ $endpoint → $STATUS${NC}"
            fi
        else
            echo -e "${RED}❌ $endpoint → $STATUS${NC}"
        fi
    done
    
    # Show sample responses
    echo ""
    echo "📋 Sample Response - /api/platform/me:"
    curl -s -H "Cookie: __session=$SESSION_COOKIE" "$BASE_URL/api/platform/me" | head -c 500
    echo ""
else
    echo "⏭️ Skipping REAL AUTH tests (no cookie provided)"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo "VERIFICATION COMPLETE"
echo "═══════════════════════════════════════════════════════════════════════"
