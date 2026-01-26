#!/bin/bash
# V2 Zone Inline Style Checker
# Scans v2 zone and design-system for inline styles

set -e

echo "🔍 Checking for inline styles in v2 zone..."
echo ""

# Check for inline styles
RESULT=$(grep -rn "style={" app/\[locale\]/\(platform-v2\) modules/design-system 2>/dev/null || true)

if [ -n "$RESULT" ]; then
    echo "❌ ERROR: Inline styles found in v2 zone:"
    echo ""
    echo "$RESULT"
    echo ""
    echo "Total violations: $(echo "$RESULT" | wc -l | tr -d ' ')"
    exit 1
else
    echo "✅ No inline styles found"
    exit 0
fi
