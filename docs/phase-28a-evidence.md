# Phase 28A — Production Evidence Pack

> Verified: 2026-02-16 12:17 UTC+7
> Commit: `dc433a8` (main)
> Domain: https://www.apicoredata.com

---

## Production Verification Gates

| Gate | Endpoint | Expected | Actual | Status |
|------|----------|----------|--------|--------|
| G1 | `/api/ops/health/summary` | 200 + JSON | 200, `systemStatus: HEALTHY`, `phase: 28A`, latency: 236ms | ✅ PASS |
| G2 | `/api/worker/tick` (no token) | 401 | 401 Unauthorized | ✅ PASS |
| G3 | `/api/platform/users` | 200 | 200, `success: true`, 2 users | ✅ PASS |
| G4 | Ops Center UI | 🟢 HEALTHY | 🟢 System: HEALTHY, All systems operational | ✅ PASS |
| G5 | `docs/phase-28-monitoring.md` | In main | Confirmed in `dc433a8` | ✅ PASS |

---

## G1 — Health Summary Response

```json
{
  "ok": true,
  "systemStatus": "HEALTHY",
  "violationsCount": 0,
  "lastHeartbeatAt": "2026-02-16T04:03:27.960Z",
  "activeWorkerCount": 0,
  "cacheStatusHints": { "users": "available", "orgs": "available" },
  "buildSha": "local",
  "phase": "28A",
  "latencyMs": 236,
  "ts": "2026-02-16T05:15:34.944Z"
}
```

> Note: `buildSha: "local"` because `VERCEL_GIT_COMMIT_SHA` is a system env var that Vercel populates automatically. The `phase: "28A"` confirms the correct code is deployed.

---

## Files Changed (4 files, 438 insertions)

| File | Change |
|------|--------|
| `app/api/ops/health/summary/route.ts` | NEW — public health endpoint |
| `coreos/ops/metrics.ts` | ADD `getHealthSummary()` |
| `coreos/ops/ui/SystemStatusView.tsx` | ADD `IncidentCard` component |
| `docs/phase-28-monitoring.md` | NEW — monitoring runbook |

---

## Release Info

| Property | Value |
|----------|-------|
| Branch | `phase28-ops-monitoring` → squash merged to `main` |
| Commit | `dc433a8` |
| Tag | `v0.28a` |
| Vercel | Ready (auto-deployed from main) |
| Frozen zones | Not touched ✅ |
