#!/bin/bash
# Visibility Scope - Runtime Verification Script
# 
# PURPOSE: Test all visibility scope guards with real API calls
# AUTH: Uses cookie-based session (__session cookie from Firebase)
# 
# USAGE:
#   1. Update OWNER_UID, ADMIN_UID, TEST_USER_UID
#   2. Update login credentials
#   3. Run: bash test-visibility-scope.sh
#
# REQUIREMENTS:
#   - Dev server running on http://localhost:3000
#   - curl installed
#   - jq installed (for JSON parsing)

set -e  # Exit on error

# =============================================================================
# CONFIGURATION
# =============================================================================

BASE_URL="http://localhost:3000"
COOKIE_JAR="/tmp/visibility-test-cookies.txt"

# TODO: Update these UIDs from your Firebase database
OWNER_UID="o8peRpxaqrNtyz7NYocN4cujvhR2"  # Replace with actual owner UID
ADMIN_UID="REPLACE_WITH_ADMIN_UID"        # Replace with actual admin UID
TEST_USER_UID="REPLACE_WITH_USER_UID"     # Replace with actual user UID for testing

# TODO: Update these credentials
OWNER_EMAIL="test1@superplatform.local"
OWNER_PASSWORD="password123"

ADMIN_EMAIL="admin@superplatform.local"
ADMIN_PASSWORD="admin123"

VIEWER_EMAIL="viewer@superplatform.local"
VIEWER_PASSWORD="viewer123"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results
PASSED=0
FAILED=0

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_test() {
    echo ""
    echo -e "${YELLOW}TEST: $1${NC}"
}

print_pass() {
    echo -e "${GREEN}✓ PASS${NC}: $1"
    ((PASSED++))
}

print_fail() {
    echo -e "${RED}✗ FAIL${NC}: $1"
    ((FAILED++))
}

print_info() {
    echo -e "${BLUE}INFO${NC}: $1"
}

# Login function using cookie jar
login() {
    local email=$1
    local password=$2
    local role=$3
    
    print_info "Logging in as $role ($email)..."
    
    # Clear existing cookies
    rm -f "$COOKIE_JAR"
    
    # Login via browser flow (Next.js app with Firebase)
    # Note: This assumes you have a login API endpoint
    # Adjust the endpoint based on your actual auth implementation
    
    # For Firebase, we might need to use the browser to get the session cookie
    # This is a placeholder - adjust based on your actual auth flow
    
    echo "⚠️  MANUAL STEP REQUIRED:"
    echo "1. Open browser to $BASE_URL/auth/login"
    echo "2. Login with: $email / $password"
    echo "3. Export cookies manually or use browser extension"
    echo ""
    echo "OR use this curl command to get session (if API supports it):"
    echo "curl -c '$COOKIE_JAR' -X POST '$BASE_URL/api/auth/session' -H 'Content-Type: application/json' -d '{\"email\":\"$email\",\"password\":\"$password\"}'"
    echo ""
    read -p "Press ENTER when logged in and cookie saved to $COOKIE_JAR..."
}

# Make API call with cookies
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    local description=$5
    
    print_test "$description"
    print_info "Request: $method $endpoint"
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" -X "$method" "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" -X "$method" "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    # Extract status code (last line)
    status=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    print_info "Expected: $expected_status"
    print_info "Actual:   $status"
    
    if [ "$status" = "$expected_status" ]; then
        print_pass "$description"
        if command -v jq &> /dev/null && [ ! -z "$body" ]; then
            echo "$body" | jq '.' 2>/dev/null || echo "$body"
        else
            echo "$body"
        fi
    else
        print_fail "$description (Expected $expected_status, got $status)"
        echo "Response body:"
        if command -v jq &> /dev/null && [ ! -z "$body" ]; then
            echo "$body" | jq '.' 2>/dev/null || echo "$body"
        else
            echo "$body"
        fi
    fi
    
    echo ""
}

# =============================================================================
# TEST SUITE 1: OWNER ROLE
# =============================================================================

test_owner_role() {
    print_header "TEST SUITE 1: OWNER ROLE"
    
    login "$OWNER_EMAIL" "$OWNER_PASSWORD" "owner"
    
    # Test 1.1: GET list (should see ALL users including owners)
    api_call "GET" "/api/platform/users" "" "200" \
        "Owner GET list - Should see ALL users (including other owners)"
    
    # Test 1.2: GET owner detail (should succeed)
    api_call "GET" "/api/platform/users/$OWNER_UID" "" "200" \
        "Owner GET owner detail - Should return 200 OK"
    
    # Test 1.3: PATCH owner (should succeed)
    api_call "PATCH" "/api/platform/users/$OWNER_UID" \
        '{"displayName":"Owner Updated Name"}' "200" \
        "Owner PATCH owner - Should return 200 OK"
    
    # Test 1.4: DELETE self (should fail - self-delete protection)
    api_call "DELETE" "/api/platform/users/$OWNER_UID" "" "403" \
        "Owner DELETE self - Should return 403 (cannot delete yourself)"
    
    # Test 1.5: PATCH promote user to owner (should succeed - owner can do this)
    if [ "$TEST_USER_UID" != "REPLACE_WITH_USER_UID" ]; then
        api_call "PATCH" "/api/platform/users/$TEST_USER_UID" \
            '{"role":"owner"}' "200" \
            "Owner promote user to owner - Should return 200 OK"
        
        # Revert back
        api_call "PATCH" "/api/platform/users/$TEST_USER_UID" \
            '{"role":"user"}' "200" \
            "Owner demote user back - Should return 200 OK"
    fi
}

# =============================================================================
# TEST SUITE 2: ADMIN ROLE
# =============================================================================

test_admin_role() {
    print_header "TEST SUITE 2: ADMIN ROLE"
    
    login "$ADMIN_EMAIL" "$ADMIN_PASSWORD" "admin"
    
    # Test 2.1: GET list (should NOT see owner users)
    print_test "Admin GET list - Should NOT see owner users"
    response=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" "$BASE_URL/api/platform/users")
    status=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$status" = "200" ]; then
        # Check if owner users are in the list
        if echo "$body" | grep -q "\"role\":\"owner\""; then
            print_fail "Admin can see owner users (should be filtered out)"
            echo "$body" | jq '.'
        else
            print_pass "Admin GET list - Owner users filtered out"
            echo "$body" | jq '.'
        fi
    else
        print_fail "Admin GET list failed with status $status"
        echo "$body"
    fi
    echo ""
    
    # Test 2.2: GET owner detail (should return 404 - stealth mode)
    api_call "GET" "/api/platform/users/$OWNER_UID" "" "404" \
        "Admin GET owner detail - Should return 404 Not Found (stealth)"
    
    # Test 2.3: PATCH owner (should return 403)
    api_call "PATCH" "/api/platform/users/$OWNER_UID" \
        '{"displayName":"Hacked Owner"}' "403" \
        "Admin PATCH owner - Should return 403 Forbidden"
    
    # Test 2.4: DELETE owner (should return 403)
    api_call "DELETE" "/api/platform/users/$OWNER_UID" "" "403" \
        "Admin DELETE owner - Should return 403 Forbidden"
    
    # Test 2.5: PATCH promote user to owner (should return 403)
    if [ "$TEST_USER_UID" != "REPLACE_WITH_USER_UID" ]; then
        api_call "PATCH" "/api/platform/users/$TEST_USER_UID" \
            '{"role":"owner"}' "403" \
            "Admin promote user to owner - Should return 403 Forbidden"
    fi
    
    # Test 2.6: PATCH another admin (should succeed - same level allowed for some operations)
    if [ "$ADMIN_UID" != "REPLACE_WITH_ADMIN_UID" ] && [ "$ADMIN_UID" != "$OWNER_UID" ]; then
        api_call "GET" "/api/platform/users/$ADMIN_UID" "" "200" \
            "Admin GET another admin - Should return 200 OK"
    fi
}

# =============================================================================
# TEST SUITE 3: VIEWER ROLE (Optional)
# =============================================================================

test_viewer_role() {
    print_header "TEST SUITE 3: VIEWER ROLE (Permission Layer)"
    
    login "$VIEWER_EMAIL" "$VIEWER_PASSWORD" "viewer"
    
    # Test 3.1: GET list (should fail at permission check - 403)
    api_call "GET" "/api/platform/users" "" "403" \
        "Viewer GET list - Should return 403 (no permission)"
    
    # Test 3.2: GET owner detail (should fail at permission check - 403)
    api_call "GET" "/api/platform/users/$OWNER_UID" "" "403" \
        "Viewer GET owner detail - Should return 403 (no permission)"
    
    # Test 3.3: PATCH (should fail at permission check - 403)
    api_call "PATCH" "/api/platform/users/$OWNER_UID" \
        '{"displayName":"Test"}' "403" \
        "Viewer PATCH owner - Should return 403 (no permission)"
    
    # Test 3.4: DELETE (should fail at permission check - 403)
    api_call "DELETE" "/api/platform/users/$OWNER_UID" "" "403" \
        "Viewer DELETE owner - Should return 403 (no permission)"
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================

main() {
    print_header "VISIBILITY SCOPE - RUNTIME VERIFICATION"
    
    echo "Base URL: $BASE_URL"
    echo "Cookie Jar: $COOKIE_JAR"
    echo ""
    echo "IMPORTANT: Make sure dev server is running!"
    echo ""
    
    # Check if jq is installed
    if ! command -v jq &> /dev/null; then
        echo "⚠️  WARNING: jq is not installed. Install it for better JSON output."
        echo "   Mac: brew install jq"
        echo "   Linux: sudo apt-get install jq"
        echo ""
    fi
    
    # Run test suites
    test_owner_role
    test_admin_role
    
    # Optional: Test viewer if credentials are configured
    if [ "$VIEWER_EMAIL" != "viewer@superplatform.local" ] || [ -f "$COOKIE_JAR" ]; then
        test_viewer_role
    fi
    
    # Print summary
    print_header "TEST SUMMARY"
    echo ""
    echo -e "${GREEN}PASSED: $PASSED${NC}"
    echo -e "${RED}FAILED: $FAILED${NC}"
    echo ""
    
    if [ $FAILED -eq 0 ]; then
        echo -e "${GREEN}✓ ALL TESTS PASSED!${NC}"
        exit 0
    else
        echo -e "${RED}✗ SOME TESTS FAILED${NC}"
        exit 1
    fi
}

# =============================================================================
# ALTERNATIVE: Manual Testing Steps
# =============================================================================

print_manual_steps() {
    cat << 'EOF'

# =============================================================================
# MANUAL TESTING ALTERNATIVE
# =============================================================================

If the script doesn't work with your auth setup, use these manual steps:

## 1. Get Session Cookie

### Browser Method:
1. Login to http://localhost:3000/auth/login
2. Open DevTools > Application > Cookies
3. Copy __session cookie value
4. Save to file:
   echo "__session=YOUR_COOKIE_VALUE" > cookies.txt

## 2. Test as Owner

# GET list (should see all users)
curl -b cookies.txt http://localhost:3000/api/platform/users | jq '.'

# GET owner detail (should return 200)
curl -b cookies.txt http://localhost:3000/api/platform/users/OWNER_UID | jq '.'

# PATCH owner (should return 200)
curl -b cookies.txt -X PATCH http://localhost:3000/api/platform/users/OWNER_UID \
  -H "Content-Type: application/json" \
  -d '{"displayName":"Updated"}' | jq '.'

## 3. Test as Admin

# Login as admin and get new cookie, then:

# GET list (should NOT see owners)
curl -b cookies.txt http://localhost:3000/api/platform/users | jq '. | .data.users[] | select(.role=="owner")'
# Should return nothing

# GET owner detail (should return 404)
curl -i -b cookies.txt http://localhost:3000/api/platform/users/OWNER_UID

# PATCH owner (should return 403)
curl -i -b cookies.txt -X PATCH http://localhost:3000/api/platform/users/OWNER_UID \
  -H "Content-Type: application/json" \
  -d '{"displayName":"Hacked"}'

# DELETE owner (should return 403)
curl -i -b cookies.txt -X DELETE http://localhost:3000/api/platform/users/OWNER_UID

# Promote to owner (should return 403)
curl -i -b cookies.txt -X PATCH http://localhost:3000/api/platform/users/USER_UID \
  -H "Content-Type: application/json" \
  -d '{"role":"owner"}'

EOF
}

# If script is called with --manual flag, show manual steps instead
if [ "$1" = "--manual" ]; then
    print_manual_steps
    exit 0
fi

# Run main test suite
main
