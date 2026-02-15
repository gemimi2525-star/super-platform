# Phase 27C Post-Mortem — Infra Recovery + UI Parity

> **Date:** 2026-02-15  
> **Author:** APICOREDATA Ops  
> **Status:** Closed / Stable

---

## SHA Mapping

| Phase | Commit | Description |
|:------|:-------|:------------|
| 27C.5 | `8b25a43` | Emergency Infra Recovery Hotfix — quota resilience |
| 27C.6 | `8debabe` | Organizations Modal UI Parity (dark theme) |
| — | `8489a7e` | Evidence lock + `/api/ops/health/orgs` endpoint |
| 27C.7 | `7b4521e` | System Hub About tab parity |
| 27C.stab | `9a1818e` | Post-hotfix gates + stability lock |
| 27C.8 | *(this commit)* | Quota emergency mode (TTL cache + stale) |

---

## Root Causes & Fixes

### 27C.5 — Firestore Quota Exhaustion

**Root Cause:**  
High-frequency reads on `/api/platform/users`, `/api/platform/orgs`, and `/api/ops/audit` routes exceeded Firestore daily quota. `getAuthContext()` would throw a 500 HTML error on session verification failure, preventing route-level guards from returning JSON.

**Fixes Applied:**
1. `OrganizationsPanel` API base corrected from `/api/orgs` → `/api/platform/orgs` (was causing 404)
2. `getAuthContext()` outer catch now returns `null` (→ 401 JSON) for quota/infra errors instead of throwing 500
3. `Cache-Control: private, max-age=30` added to users, orgs, and audit routes
4. `UsersPanel` error handler detects 503 and shows user-friendly quota message

### 27C.6 — Organizations Modal Dark Theme

**Root Cause:**  
`OrgModal` in System Hub rendered with light-theme styles against dark background, making text invisible and layout broken.

**Fixes Applied:**
1. `variant="dark"` prop correctly passed from `OrganizationView`
2. Modal component refactored: dark background `#1C1F26`, white text, darker borders/shadows
3. Input fields and selects styled for dark mode
4. Close button contrast fixed

### 27C.7 — System Hub Missing About Tab

**Root Cause:**  
System Hub had no "About" equivalent — Legacy OS had `SettingsAboutContent` showing Architecture Stack and Governance info.

**Fixes Applied:**
1. New static endpoint `GET /api/ops/about` — returns system info JSON (no Firestore)
2. New `AboutView.tsx` — dark-themed component with Architecture Stack + Governance cards
3. `SystemHubShell.tsx` — wired "About" as the last tab

### 27C.8 — Quota Emergency Mode

**Root Cause:**  
Even with 27C.5 browser `Cache-Control: max-age=30`, every new browser session / hard reload still hits Firestore. During quota exhaustion, users see 503 and empty panels. No server-side caching existed to aggregate requests across different clients.

**Fixes Applied:**
1. `lib/cache/ttl-cache.ts` — in-memory TTL cache with stale-while-revalidate, stampede protection, manual invalidation
2. `users/route.ts` + `orgs/route.ts` GET handlers wrapped with `cachedFetch` — single Firestore read per 30s per lambda
3. `X-Cache: HIT|STALE|MISS` + `X-Cache-Key` response headers for observability
4. POST/PUT/DELETE handlers invalidate cache key immediately after mutation
5. Client panels (`UsersPanel`, `OrganizationsPanel`) show stale-data notice banner when `X-Cache=STALE`
6. `/api/ops/health/users` static health endpoint (no Firestore)

---

## Quota Root Cause & Mitigation

**Firestore Plan:** Spark (free tier) — limited daily reads/writes.

**Problem:** Each authenticated user visiting `/system/users` or `/system/organization` triggers a Firestore list query. With no server-side cache, N concurrent users = N Firestore reads per panel load. Quota exhausts quickly on Spark plan.

**Mitigation (27C.8):**
- Server-side in-memory cache reduces Firestore reads from N/request to 1/30s/lambda
- Stale-while-revalidate (5min window) allows panels to show data even during quota exhaustion
- `X-Cache` headers provide visibility into cache performance

**Long-term Recommendations:**
1. Upgrade to Blaze (pay-as-you-go) billing plan on Firebase Console: `console.firebase.google.com` → Project → Settings → Usage and Billing
2. Or increase daily quota limits if on legacy plan
3. Monitor reads via Firebase Console → Firestore → Usage tab

---

## Gates Checklist

All gates can be verified by running:

```bash
bash scripts/post-hotfix-27c.sh
# or with custom base:
bash scripts/post-hotfix-27c.sh https://www.apicoredata.com
```

| Gate | Check | Expected |
|:-----|:------|:---------|
| G1a | `GET /api/platform/orgs` | 200/401/503 JSON (not 404, not HTML 500) |
| G1b | `GET /api/platform/users` | 200/401/503 JSON (not HTML 500) |
| G1c | `GET /api/ops/about` | 200 JSON |
| G1d | `GET /api/ops/health/orgs` | 200 JSON static |
| G2a | `/api/platform/users` Cache-Control | `private, max-age=30` |
| G2b | `/api/platform/orgs` Cache-Control | `private, max-age=30` |
| G3a | `/api/ops/about` body | `product == "APICOREDATA Client OS"` |
| G3b | `/api/ops/health/orgs` body | `status == "ok"` |
| G6 | `GET /api/ops/health/users` + `/api/ops/health/orgs` | 200 JSON static |

### Known Limitation

> **Vercel Bot Challenge (429):** Direct `curl` requests to authenticated routes may receive HTTP 429 from Vercel's bot protection. This is expected behavior. Verification for those routes should use browser `fetch()` or the static `/api/ops/*` endpoints that bypass bot protection.

---

## Files Changed (Aggregate)

| File | Phase | Change |
|:-----|:------|:-------|
| `coreos/system/shared/ui/orgs/OrganizationsPanel.tsx` | 27C.5–27C.8 | API fix, dark modal, dedupe, stale banner |
| `coreos/system/shared/ui/users/UsersPanel.tsx` | 27C.5–27C.8 | 503 detection, backoff, stale banner |
| `coreos/system/shared/datasources/users-api.ts` | 27C.8 | X-Cache header tracking |
| `lib/auth/server.ts` | 27C.5 | Quota path → null → 401 |
| `lib/cache/ttl-cache.ts` | 27C.8 | In-memory TTL cache |
| `app/api/platform/users/route.ts` | 27C.5, 27C.8 | Cache-Control + cachedFetch |
| `app/api/platform/orgs/route.ts` | 27C.5, 27C.8 | Cache-Control + cachedFetch |
| `app/api/ops/audit/route.ts` | 27C.5 | Cache-Control header |
| `app/api/ops/about/route.ts` | 27C.7 | New static endpoint |
| `app/api/ops/health/orgs/route.ts` | 27C.5 | New health endpoint |
| `app/api/ops/health/users/route.ts` | 27C.8 | New health endpoint |
| `coreos/system/ui/AboutView.tsx` | 27C.7 | New About view |
| `coreos/system/ui/SystemHubShell.tsx` | 27C.7 | About tab wired |
| `scripts/post-hotfix-27c.sh` | stab | Parity gate script |
