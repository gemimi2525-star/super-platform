#!/bin/bash
set -e

echo "🔍 Checking for legacy imports in V2 zone..."
echo ""

# Paths to check (V2 zone)
V2_ZONE="app/[locale]/(platform-v2)"

# Patterns that indicate legacy imports
# Looking for imports from:
# - (platform) route group (legacy)
# - root /components (legacy)
# - Any path that's not design-system or standard lib/
LEGACY_PATTERNS=(
  "from ['\"]@/app/\[locale\]/\(platform\)"
  "from ['\"]@/components/"
  "from ['\"]\.\./\.\./\.\./\(platform\)"
  "from ['\"]\.\./\.\./\.\./components"
)

VIOLATIONS_FOUND=0
VIOLATION_FILES=""

# Check each pattern
for pattern in "${LEGACY_PATTERNS[@]}"; do
  RESULT=$(grep -rn -E "$pattern" "$V2_ZONE" 2>/dev/null || true)
  
  if [ -n "$RESULT" ]; then
    VIOLATIONS_FOUND=1
    echo "❌ VIOLATION: Legacy imports found:"
    echo "$RESULT"
    echo ""
    VIOLATION_FILES="$VIOLATION_FILES
$RESULT"
  fi
done

# Additional check: imports from (auth) if it's considered legacy
AUTH_RESULT=$(grep -rn "from ['\"]@/app/\[locale\]/\(auth\)" "$V2_ZONE" 2>/dev/null || true)
if [ -n "$AUTH_RESULT" ]; then
  echo "⚠️  WARNING: Auth imports found (review if legacy):"
  echo "$AUTH_RESULT"
  echo ""
fi

if [ $VIOLATIONS_FOUND -eq 0 ]; then
  echo "✅ No legacy imports found in V2 zone"
  echo ""
  echo "Checked zone: $V2_ZONE"
  echo "Status: COMPLIANT ✅"
  exit 0
else
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "❌ LEGACY IMPORT VIOLATIONS DETECTED"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "V2 zone MUST NOT import from legacy code."
  echo ""
  echo "See: docs/LEGACY_FREEZE.md"
  echo ""
  echo "To fix:"
  echo "  1. Use design-system components instead"
  echo "  2. Extract pure logic to lib/"
  echo "  3. Rebuild component in V2 zone"
  echo ""
  exit 1
fi
