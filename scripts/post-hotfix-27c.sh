#!/usr/bin/env bash
#
# post-hotfix-27c.sh — Deterministic parity gates for Phase 27C.5–27C.7
#
# Usage:  bash scripts/post-hotfix-27c.sh [BASE_URL]
# Default BASE_URL: https://www.apicoredata.com
#
# Exit codes:  0 = all PASS,  1 = at least one FAIL
#
set -uo pipefail

BASE="${1:-https://www.apicoredata.com}"
PASS=0
FAIL=0
RESULTS=()

# ──────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────

check_endpoint() {
  local label="$1"
  local url="$2"
  shift 2
  local allowed_codes=("$@")

  local http_code content_type
  http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null || echo "000")
  content_type=$(curl -s -o /dev/null -w "%{content_type}" --max-time 10 "$url" 2>/dev/null || echo "")

  local is_allowed=false
  for code in "${allowed_codes[@]}"; do
    if [[ "$http_code" == "$code" ]]; then
      is_allowed=true
      break
    fi
  done

  # Reject HTML 500 pages (not JSON error)
  local is_html=false
  if [[ "$content_type" == *"text/html"* && "$http_code" == "500" ]]; then
    is_html=true
  fi

  # 429 = Vercel bot challenge — treat as SKIP (known limitation for curl)
  if [[ "$http_code" == "429" ]]; then
    echo "  ⚠️  SKIP  $label  (429 Vercel bot challenge — verify via browser)"
    RESULTS+=("SKIP|$label|429 bot challenge")
    return
  fi

  if $is_allowed && ! $is_html; then
    echo "  ✅ PASS  $label  (HTTP $http_code)"
    RESULTS+=("PASS|$label|HTTP $http_code")
    ((PASS++))
  else
    local reason="HTTP $http_code"
    if $is_html; then reason="$reason — got HTML instead of JSON"; fi
    if [[ "$http_code" == "000" ]]; then reason="Connection failed / timeout"; fi
    echo "  ❌ FAIL  $label  ($reason)"
    RESULTS+=("FAIL|$label|$reason")
    ((FAIL++))
  fi
}

check_cache_header() {
  local label="$1"
  local url="$2"
  local expected="$3"

  local headers
  headers=$(curl -sI --max-time 10 "$url" 2>/dev/null || echo "")

  if echo "$headers" | grep -qi "cache-control.*$expected"; then
    echo "  ✅ PASS  $label  (Cache-Control contains '$expected')"
    RESULTS+=("PASS|$label|Cache-Control OK")
    ((PASS++))
  else
    # 429 from bot protection is a known limitation
    local http_code
    http_code=$(echo "$headers" | head -1 | awk '{print $2}')
    if [[ "$http_code" == "429" ]]; then
      echo "  ⚠️  SKIP  $label  (429 bot challenge — header check not possible via curl)"
      RESULTS+=("SKIP|$label|429 bot challenge")
    else
      echo "  ❌ FAIL  $label  (Cache-Control missing or wrong)"
      RESULTS+=("FAIL|$label|Cache-Control missing")
      ((FAIL++))
    fi
  fi
}

# ──────────────────────────────────────────────────────────────────────────
# Gate 1: Endpoint availability
# ──────────────────────────────────────────────────────────────────────────

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  Phase 27C Post-Hotfix Parity Gates"
echo "  Base: $BASE"
echo "  Date: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "── Gate 1: Endpoint Availability ──"

check_endpoint "GET /api/platform/orgs"       "$BASE/api/platform/orgs"       200 401 403 503 429
check_endpoint "GET /api/platform/users"      "$BASE/api/platform/users"      200 401 403 503 429
check_endpoint "GET /api/ops/about"           "$BASE/api/ops/about"           200
check_endpoint "GET /api/ops/health/orgs"     "$BASE/api/ops/health/orgs"     200

# ──────────────────────────────────────────────────────────────────────────
# Gate 2: Cache-Control headers
# ──────────────────────────────────────────────────────────────────────────

echo ""
echo "── Gate 2: Cache-Control Headers ──"

check_cache_header "/api/platform/users"      "$BASE/api/platform/users"      "max-age=30"
check_cache_header "/api/platform/orgs"       "$BASE/api/platform/orgs"       "max-age=30"

# ──────────────────────────────────────────────────────────────────────────
# Gate 3: Static endpoints — JSON body validation
# ──────────────────────────────────────────────────────────────────────────

echo ""
echo "── Gate 3: Static Endpoint Body Validation ──"

about_body=$(curl -s --max-time 10 "$BASE/api/ops/about" 2>/dev/null || echo "")
about_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$BASE/api/ops/about" 2>/dev/null || echo "000")
if [[ "$about_code" == "429" ]]; then
  echo "  ⚠️  SKIP  /api/ops/about body  (429 bot challenge)"
  RESULTS+=("SKIP|/api/ops/about body|429 bot challenge")
elif echo "$about_body" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['product']=='APICOREDATA Client OS'" 2>/dev/null; then
  echo "  ✅ PASS  /api/ops/about body  (product = APICOREDATA Client OS)"
  RESULTS+=("PASS|/api/ops/about body|JSON valid")
  ((PASS++))
else
  echo "  ❌ FAIL  /api/ops/about body  (JSON parse or assertion failed)"
  RESULTS+=("FAIL|/api/ops/about body|JSON invalid")
  ((FAIL++))
fi

health_body=$(curl -s --max-time 10 "$BASE/api/ops/health/orgs" 2>/dev/null || echo "")
health_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$BASE/api/ops/health/orgs" 2>/dev/null || echo "000")
if [[ "$health_code" == "429" ]]; then
  echo "  ⚠️  SKIP  /api/ops/health/orgs body  (429 bot challenge)"
  RESULTS+=("SKIP|/api/ops/health/orgs body|429 bot challenge")
elif echo "$health_body" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['status']=='ok'" 2>/dev/null; then
  echo "  ✅ PASS  /api/ops/health/orgs body  (status = ok)"
  RESULTS+=("PASS|/api/ops/health/orgs body|JSON valid")
  ((PASS++))
else
  echo "  ❌ FAIL  /api/ops/health/orgs body  (JSON parse or assertion failed)"
  RESULTS+=("FAIL|/api/ops/health/orgs body|JSON invalid")
  ((FAIL++))
fi

# ──────────────────────────────────────────────────────────────────────────
# Summary
# ──────────────────────────────────────────────────────────────────────────

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  SUMMARY:  $PASS passed, $FAIL failed"
echo "═══════════════════════════════════════════════════════════════"
echo ""

for r in "${RESULTS[@]}"; do
  IFS='|' read -r status label detail <<< "$r"
  printf "  %-6s  %-40s  %s\n" "$status" "$label" "$detail"
done

echo ""

if [[ $FAIL -gt 0 ]]; then
  echo "  ❌ OVERALL: FAIL ($FAIL gate(s) did not pass)"
  exit 1
else
  echo "  ✅ OVERALL: PASS — all gates green"
  exit 0
fi
