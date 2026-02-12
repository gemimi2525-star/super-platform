#!/bin/bash
# ============================================================
# Phase 20 CI Guardrail: Block test/debug routes in production
# ============================================================
# This script prevents accidental deployment of temporary test
# or debug API routes to production. Run in CI before merge.
#
# Exit code 0 = PASS (no forbidden routes found)
# Exit code 1 = FAIL (forbidden routes detected)
# ============================================================

set -euo pipefail

SEARCH_DIR="${1:-.}"
FAIL=0

echo "🔍 Checking for forbidden test/debug routes..."
echo ""

# List of forbidden patterns (file paths and code references)
PATTERNS=(
  "verify-ui"
  "test-deep-verify"
  "/api/brain/test"
  "/api/brain/debug"
)

for pattern in "${PATTERNS[@]}"; do
  # Search in app/api directory for route files containing the pattern
  MATCHES=$(grep -rl "$pattern" "$SEARCH_DIR/app/api/" 2>/dev/null || true)
  
  if [ -n "$MATCHES" ]; then
    echo "❌ FORBIDDEN PATTERN: \"$pattern\""
    echo "   Found in:"
    echo "$MATCHES" | sed 's/^/     /'
    echo ""
    FAIL=1
  fi
done

# Also check for directories that shouldn't exist
FORBIDDEN_DIRS=(
  "$SEARCH_DIR/app/api/brain/verify-ui"
  "$SEARCH_DIR/app/api/brain/test-deep-verify"
)

for dir in "${FORBIDDEN_DIRS[@]}"; do
  if [ -d "$dir" ]; then
    echo "❌ FORBIDDEN DIRECTORY: $dir"
    FAIL=1
  fi
done

echo ""
if [ $FAIL -eq 1 ]; then
  echo "🚫 FAILED: Test/debug routes detected. Remove before merging to main."
  exit 1
else
  echo "✅ PASSED: No forbidden test/debug routes found."
  exit 0
fi
