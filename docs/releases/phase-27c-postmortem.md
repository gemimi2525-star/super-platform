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
| 27C.stab | *(this commit)* | Post-hotfix gates + stability lock |

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

### Known Limitation

> **Vercel Bot Challenge (429):** Direct `curl` requests to authenticated routes may receive HTTP 429 from Vercel's bot protection. This is expected behavior. Verification for those routes should use browser `fetch()` or the static `/api/ops/*` endpoints that bypass bot protection.

---

## Files Changed (Aggregate)

| File | Phase | Change |
|:-----|:------|:-------|
| `coreos/system/shared/ui/orgs/OrganizationsPanel.tsx` | 27C.5, 27C.6 | API base fix, error handling, dark modal |
| `coreos/system/shared/ui/users/UsersPanel.tsx` | 27C.5, stab | 503 detection, backoff guard |
| `lib/auth/server.ts` | 27C.5 | Quota path → null → 401 |
| `app/api/platform/users/route.ts` | 27C.5 | Cache-Control header |
| `app/api/platform/orgs/route.ts` | 27C.5 | Cache-Control header |
| `app/api/ops/audit/route.ts` | 27C.5 | Cache-Control header |
| `app/api/ops/about/route.ts` | 27C.7 | New static endpoint |
| `app/api/ops/health/orgs/route.ts` | 27C.5 | New health endpoint |
| `coreos/system/ui/AboutView.tsx` | 27C.7 | New About view |
| `coreos/system/ui/SystemHubShell.tsx` | 27C.7 | About tab wired |
| `scripts/post-hotfix-27c.sh` | stab | Parity gate script |
