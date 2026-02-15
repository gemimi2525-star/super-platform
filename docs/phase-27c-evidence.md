# Phase 27C — Production Evidence Pack

> **Production SHA:** `f5dc967`  
> **Timestamp:** 2026-02-15T23:30:00+07:00  
> **Verified by:** Automated 9-Gate + Manual

---

## Post-Deploy Verification — 6 Gate Results

| # | Gate | Endpoint | Result | Key Value |
|---|------|----------|--------|-----------|
| 1 | Health/Users | `GET /api/ops/health/users` | ✅ 200 | `ok:true`, `status:ok` |
| 2 | Firestore Diag | `GET /api/ops/diag/firestore` | ✅ 200 | `ok:true`, latency ~240ms |
| 3 | Platform Users | `GET /api/platform/users` | ✅ 200 | X-Cache: `MISS`, count: 2 |
| 4 | Platform Orgs | `GET /api/platform/orgs` | ✅ 200 | X-Cache: `MISS` |
| 5 | Ops Center UI | `/os` | ✅ 200 | **System: HEALTHY** — "All systems operational" |
| 6 | Metrics Summary | `GET /api/ops/metrics/summary` | ✅ 200 | `systemStatus: HEALTHY`, `violations: []` |

---

## Worker Heartbeat Evidence

- **Endpoint:** `/api/worker/tick` → `{"ok":true,"workerId":"system-cron"}`
- **Heartbeat counter in Firestore:** `worker_heartbeat_total:workerId=system-cron: 3`
- **Cron schedule:** `0 0 * * *` (daily, Vercel Hobby plan limit)
- **Threshold Engine:** Uses `getFreshHeartbeatCount()` — age-aware, no false positives

## Resilience Layer Evidence (Phase 27C.8b)

| Feature | Status | Notes |
|---------|--------|-------|
| TTL Cache + X-Cache headers | ✅ Working | MISS → HIT → STALE lifecycle |
| Persistent Snapshot fallback | ✅ Working | PERSISTENT_STALE on cold start |
| Quota error classification | ✅ Working | `classifyFirestoreError()` active |
| Firestore diagnostics | ✅ Working | Protected (admin/owner only) |

## Endpoint Security Audit

| Endpoint | Access | Guard |
|----------|--------|-------|
| `/api/worker/tick` | 🔒 Protected | `CRON_SECRET` Bearer token |
| `/api/ops/diag/firestore` | 🔒 Protected | `getAuthContext()` — admin/owner |
| `/api/ops/metrics/summary` | 🌐 Public | Read-only metrics, no sensitive data |
| `/api/ops/health/users` | 🌐 Public | Read-only health check |
| `/api/platform/users` | 🔒 Protected | Auth middleware (existing) |
| `/api/platform/orgs` | 🔒 Protected | Auth middleware (existing) |

---

## Git History

```
f5dc967 fix(ops): adjust cron to daily for Vercel Hobby plan + trigger deploy
4207a7c fix(ops): resolve WORKER_HEARTBEAT_LOST — add Vercel Cron heartbeat + age-aware threshold
c4c0f88 Phase 27C.8b: Quota diagnostics + persistent snapshot fallback
```
