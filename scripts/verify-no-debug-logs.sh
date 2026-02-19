#!/bin/bash
#
# Phase 39D: Debug-Log Gate
# Ensures no debug/diagnostic log strings have leaked into the codebase.
#
# Usage:
#   bash scripts/verify-no-debug-logs.sh
#
# Exit 0 = PASS (no forbidden strings found)
# Exit 1 = FAIL (forbidden strings found)
#

set -e

SEARCH_DIRS="components/ coreos/ governance/"
EXTENSIONS="--include=*.ts --include=*.tsx --include=*.js --include=*.jsx"

# Forbidden keywords that indicate debug/diagnostic logs
FORBIDDEN_PATTERNS=(
    "MANIFEST_DEBUG"
    "CapGraph"
    "getDockApps DEBUG"
    "DockBar DIAG"
    "UNIQUE_OS_RENDER_MARKER"
    "__DOCKBAR_STATE"
    "DOCK_DEBUG"
    "console.log.*\[DOCK"
)

echo ""
echo "🔍 Phase 39D: Debug-Log Gate"
echo "   Scanning: ${SEARCH_DIRS}"
echo ""

FOUND=0

for pattern in "${FORBIDDEN_PATTERNS[@]}"; do
    MATCHES=$(grep -rn $EXTENSIONS "$pattern" $SEARCH_DIRS 2>/dev/null || true)
    if [ -n "$MATCHES" ]; then
        echo "❌ Found forbidden pattern: '$pattern'"
        echo "$MATCHES" | head -5
        echo ""
        FOUND=1
    fi
done

if [ $FOUND -eq 0 ]; then
    echo "✅ PASS: No forbidden debug strings found"
    exit 0
else
    echo ""
    echo "❌ FAIL: Forbidden debug strings detected"
    exit 1
fi
