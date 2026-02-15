# Phase 27C.5 + 27C.6 — Production Evidence Lock

> **Status:** ✅ PASSED — Evidence Locked  
> **Verified:** 2026-02-15 19:42 ICT (UTC+7)  
> **Vercel Project:** apicoredata-core-os  
> **Production Domain:** www.apicoredata.com

---

## Commits

| Phase | SHA | Message |
|:------|:----|:--------|
| 27C.5 | `8b25a43` | hotfix(27C.5): infra recovery — fix orgs 404, harden auth quota, add cache-control |
| 27C.6 | `8debabe` | hotfix(27c6): lock Organizations modal UI parity (legacy vs system hub) |

---

## Production Gate Results

### G0 — Deploy Verification
- **Vercel Status:** 🟢 Ready (Production)
- **SHA on Production:** `8debabe`
- **Domains:** `www.apicoredata.com`, `apicoredata-core-os.vercel.app`
- **Method:** Vercel Dashboard → Project → Overview → Production Deployment

### G1 — API Route (`GET /api/platform/orgs`)
- **Result:** ✅ **200 OK** (via browser `fetch()`)
- **Previous state:** 404 (OrganizationsPanel used wrong path `/api/orgs`)
- **Fix:** Changed `API_BASE` to `/api/platform/orgs` in `OrganizationsPanel.tsx`

### G2 — System Hub Dark Modal
- **Result:** ✅ Computed background = `rgb(28, 31, 38)` = **#1C1F26**
- **Labels visible:** Name ✅, Plan ✅, Status ✅
- **Placeholder:** "Organization name" ✅
- **Close (✕):** Visible ✅
- **Cancel / Save:** Present and functional ✅
- **Screenshot:** [system-hub-dark-modal.png](./evidence/phase-27c6/system-hub-dark-modal.png)

### G3 — Legacy Light Modal (No Regression)
- **Result:** ✅ Computed background = `rgb(255, 255, 255)` = **#FFFFFF**
- **Labels visible:** Name ✅, Plan ✅, Status ✅
- **No visual regression** — identical to pre-hotfix
- **Screenshot:** [legacy-light-modal.png](./evidence/phase-27c6/legacy-light-modal.png)

---

## Changes Summary

### Phase 27C.5 (Infra Recovery)
| File | Change |
|:-----|:-------|
| `coreos/system/shared/ui/orgs/OrganizationsPanel.tsx` | Fixed `API_BASE` from `/api/orgs` → `/api/platform/orgs` + added `parseApiError()` for 503 |
| `lib/auth/server.ts` | Hardened `getAuthContext()` — GRPC 8/14 errors return `null` (→ 401) instead of throwing (→ 500) |
| `coreos/system/shared/ui/users/UsersPanel.tsx` | Added quota-specific error message detection for 503 |
| `app/api/platform/users/route.ts` | Added `Cache-Control: private, max-age=30` |
| `app/api/platform/orgs/route.ts` | Added `Cache-Control: private, max-age=30` |
| `app/api/ops/audit/route.ts` | Added `Cache-Control: private, max-age=30` |

### Phase 27C.6 (Modal UI Parity)
| File | Change |
|:-----|:-------|
| `coreos/system/shared/ui/orgs/OrganizationsPanel.tsx` | `Modal` + `FieldLabel` accept `isDark` prop; dark bg/text/border/shadow; input/select variant-aware |

---

## ⚠️ Note on `curl` Returning 429

When testing API endpoints via `curl`, you may see:

```
HTTP/2 429
x-vercel-mitigated: challenge
```

**This is NOT a system error.** It is Vercel's Bot Protection (WAF) issuing a JavaScript challenge to automated clients. The API is functioning correctly.

**How to verify API health instead:**
1. **Browser `fetch()`** — Open DevTools Console on any `apicoredata.com` page and run:
   ```js
   fetch('/api/platform/orgs').then(r => console.log(r.status))
   ```
   This bypasses bot protection because the browser has already passed the challenge.

2. **Dedicated Health Endpoint** — Use the lightweight endpoint:
   ```
   GET /api/ops/health/orgs
   ```
   Returns `{ ok: true, route: "/api/platform/orgs", ... }` without touching Firestore.

3. **Vercel Dashboard** — Check Function Logs for real-time invocation status.

---

## Build Verification
```
npx next build → exit 0 (both commits)
No type errors, no warnings
```
