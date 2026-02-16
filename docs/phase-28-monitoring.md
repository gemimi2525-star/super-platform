# Phase 28 — Monitoring Runbook

> One-page operational guide for Super Platform monitoring.
> Generated: 2026-02-16 • Phase 28A

---

## Threshold Recommendations

| Metric | Endpoint | Threshold | Severity | Action |
|--------|----------|-----------|----------|--------|
| `systemStatus` | `/api/ops/health/summary` | `!= HEALTHY` for > 3 min | 🔴 Critical | Investigate violations |
| Dead Rate | `/api/ops/metrics/summary` | > 10% | 🔴 Critical | Pause jobs, check logs |
| Retry Rate | `/api/ops/metrics/summary` | > 20% | 🟡 Warning | Monitor trend, check Firestore |
| Worker Heartbeat | `/api/ops/health/summary` | `activeWorkerCount = 0` | 🔴 Critical | Manual tick + check CRON |
| Platform Users | `/api/platform/users` | 5xx > 2 min | 🟡 Warning | Check cache layer |
| Firestore Diag | `/api/ops/diag/firestore` | `ok: false` | 🔴 Critical | Check quota/permissions |

---

## 3-Endpoint Quick Check

Run these 3 checks to assess system health in under 30 seconds:

### 1. Public Health Summary (no auth required)

```bash
curl -s https://YOUR_DOMAIN/api/ops/health/summary | jq .
```

Expected response:
```json
{
  "ok": true,
  "systemStatus": "HEALTHY",
  "violationsCount": 0,
  "lastHeartbeatAt": "2026-02-16T04:03:27.959Z",
  "activeWorkerCount": 1,
  "buildSha": "76f5e3c",
  "phase": "28A"
}
```

**If `ok: false`** → proceed to checks 2 and 3.

### 2. Platform Users Endpoint

```bash
curl -s -o /dev/null -w "%{http_code}" https://YOUR_DOMAIN/api/platform/users
```

Expected: `200`. If `5xx` → check Firestore quota or cache invalidation.

### 3. Worker Heartbeat Tick

```bash
curl -s -H "Authorization: Bearer $CRON_SECRET" \
  https://YOUR_DOMAIN/api/worker/tick | jq .
```

Expected: `{ "ok": true }`. If `401` → CRON_SECRET mismatch.

---

## CRON_SECRET Verification

### Check if set in Vercel

1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Confirm `CRON_SECRET` exists for **Production** environment
3. Value should be a 64-character hex string

### Verify cron guard works

```bash
# Should return 401
curl -s -o /dev/null -w "%{http_code}" https://YOUR_DOMAIN/api/worker/tick
# → 401

# Should return 200
curl -s -H "Authorization: Bearer YOUR_SECRET" \
  https://YOUR_DOMAIN/api/worker/tick | jq .ok
# → true
```

### Rotate CRON_SECRET

```bash
# Generate new secret
openssl rand -hex 32

# Update in Vercel Dashboard → Environment Variables → CRON_SECRET
# Redeploy from latest commit
```

---

## Incident Response Flow

```
1. Alert: systemStatus != HEALTHY
   │
   ├─ Check /api/ops/health/summary
   │   └─ violationsCount > 0 → identify violation types
   │
   ├─ WORKER_HEARTBEAT_LOST
   │   ├─ Try: curl /api/worker/tick (with Bearer)
   │   ├─ Check: Vercel cron job logs
   │   └─ Check: CRON_SECRET env var
   │
   ├─ WORKER_DEAD_RATE_HIGH
   │   ├─ Check: /api/ops/metrics/summary → deadRate
   │   ├─ Review: Vercel function logs
   │   └─ Consider: pause job submission
   │
   └─ WORKER_RETRY_SPIKE
       ├─ Check: /api/ops/metrics/summary → retryRate
       ├─ Look for: Firestore quota errors
       └─ Monitor: retry trend over 10 min
```

---

## Ops Center Incident Card

When the system is degraded, the Ops Center (Monitor Hub → System Status tab) will display an **Incident Card** with:

- **What happened** — auto-generated cause from violation type
- **Next actions** — checklist from this runbook
- **Correlation ID** — unique ID for tracking
- **Copy Report** — copies full incident JSON to clipboard

Use the copied JSON when escalating issues or creating incident tickets.
