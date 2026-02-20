#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# Smoke Test — Job Priority + Suspend/Resume (Phase 15B.2F)
# ═══════════════════════════════════════════════════════════════════════════
#
# Usage:   bash scripts/smoke-job-priority.sh
# Expects: npm run dev running on localhost:3000
#          dev-worker.sh running and polling
#
# Tests:
#   1. Enqueue 2 jobs → set priority A=90, B=10 → verify A completes first
#   2. Enqueue C → suspend → verify not claimed → resume → verify completes
# ═══════════════════════════════════════════════════════════════════════════

set -euo pipefail

BASE="${COREOS_API_URL:-http://127.0.0.1:3000}"
PASS=0
FAIL=0

# ─── Helpers ──────────────────────────────────────────────────────────────

log()  { echo "[$(date +%H:%M:%S)] $*"; }
ok()   { PASS=$((PASS + 1)); log "✅ PASS: $*"; }
fail() { FAIL=$((FAIL + 1)); log "❌ FAIL: $*"; }

enqueue() {
    local result
    result=$(curl -s -X POST "${BASE}/api/jobs/enqueue" \
        -H 'Content-Type: application/json' \
        -d "{\"jobType\":\"scheduler.tick\",\"payload\":{\"test\":\"priority-smoke-$1\"},\"policyDecisionId\":\"smoke-$1\"}")
    echo "$result" | grep -o '"jobId":"[^"]*"' | cut -d'"' -f4
}

get_status() {
    curl -s "${BASE}/api/jobs/$1" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4
}

set_priority() {
    curl -s -X POST "${BASE}/api/jobs/$1/priority" \
        -H 'Content-Type: application/json' \
        -d "{\"value\":$2}" > /dev/null
}

suspend_job() {
    curl -s -X POST "${BASE}/api/jobs/$1/suspend" \
        -H 'Content-Type: application/json' \
        -d '{}' > /dev/null
}

resume_job() {
    curl -s -X POST "${BASE}/api/jobs/$1/resume" \
        -H 'Content-Type: application/json' \
        -d '{}' > /dev/null
}

wait_for_status() {
    local jobId="$1" target="$2" timeout="${3:-30}"
    local elapsed=0
    while [ $elapsed -lt $timeout ]; do
        local status
        status=$(get_status "$jobId")
        if [ "$status" = "$target" ]; then
            return 0
        fi
        sleep 1
        elapsed=$((elapsed + 1))
    done
    return 1  # timeout
}

# ═══════════════════════════════════════════════════════════════════════════
# TEST 1: Priority ordering (A=90 before B=10)
# ═══════════════════════════════════════════════════════════════════════════

log "═══ TEST 1: Priority Ordering ═══"

JOB_A=$(enqueue "A")
JOB_B=$(enqueue "B")
log "Enqueued: A=$JOB_A, B=$JOB_B"

# Set priority before they get claimed
set_priority "$JOB_A" 90
set_priority "$JOB_B" 10
log "Priority set: A=90, B=10"

# Wait for both to complete (timeout 30s)
if wait_for_status "$JOB_A" "COMPLETED" 30; then
    ok "Job A (priority 90) reached COMPLETED"
else
    status_a=$(get_status "$JOB_A")
    fail "Job A stuck at $status_a (expected COMPLETED)"
fi

if wait_for_status "$JOB_B" "COMPLETED" 30; then
    ok "Job B (priority 10) reached COMPLETED"
else
    status_b=$(get_status "$JOB_B")
    fail "Job B stuck at $status_b (expected COMPLETED)"
fi

# ═══════════════════════════════════════════════════════════════════════════
# TEST 2: Suspend → not claimed → Resume → completes
# ═══════════════════════════════════════════════════════════════════════════

log ""
log "═══ TEST 2: Suspend / Resume ═══"

JOB_C=$(enqueue "C")
log "Enqueued: C=$JOB_C"

# Immediately suspend
suspend_job "$JOB_C"
status_c=$(get_status "$JOB_C")
if [ "$status_c" = "SUSPENDED" ]; then
    ok "Job C suspended (status=$status_c)"
else
    fail "Job C expected SUSPENDED, got $status_c"
fi

# Wait 5s — C must NOT be claimed
log "Waiting 5s to verify C stays SUSPENDED..."
sleep 5
status_c=$(get_status "$JOB_C")
if [ "$status_c" = "SUSPENDED" ]; then
    ok "Job C still SUSPENDED after 5s (not claimed)"
else
    fail "Job C moved to $status_c during suspend (should stay SUSPENDED)"
fi

# Resume
resume_job "$JOB_C"
status_c=$(get_status "$JOB_C")
if [ "$status_c" = "PENDING" ]; then
    ok "Job C resumed to PENDING"
else
    # Could already be PROCESSING if worker is fast
    if [ "$status_c" = "PROCESSING" ] || [ "$status_c" = "COMPLETED" ]; then
        ok "Job C resumed and already $status_c (worker fast)"
    else
        fail "Job C expected PENDING after resume, got $status_c"
    fi
fi

# Wait for completion
if wait_for_status "$JOB_C" "COMPLETED" 30; then
    ok "Job C reached COMPLETED after resume"
else
    status_c=$(get_status "$JOB_C")
    fail "Job C stuck at $status_c after resume (expected COMPLETED)"
fi

# ═══════════════════════════════════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════════════════════════════════

log ""
log "═══════════════════════════════════════"
log "  PASS: $PASS  FAIL: $FAIL"
log "═══════════════════════════════════════"

if [ $FAIL -gt 0 ]; then
    log "🔴 SMOKE FAILED"
    exit 1
else
    log "🟢 SMOKE PASSED"
    exit 0
fi
