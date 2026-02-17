# CORE OS — Permanent Release Discipline

> Effective: Phase 32.5-lock (2026-02-17)
> Status: **PERMANENT** — applies to every Phase/commit

---

## Definition of Done (DoD)

Every Phase must pass **all 6 layers** with evidence before close.

### Layer 1: LOCAL FIRST
- All work done on local machine first
- `npm test` + `npm run build` + smoke → 100% pass
- Evidence: logs, screenshots, terminal capture

### Layer 2: LOCAL BROWSER SUBAGENT
- Antigravity browser subagent tests on `localhost:3000`
- Evidence: UI screenshots + endpoint JSON (no-cache)

### Layer 3: COMMIT + FIREBASE STATE
- Git commit on Phase branch
- If Firestore involved: deterministic migration/seed (no manual ops)
- Evidence: document IDs, collection snapshots, timestamps

### Layer 4: VERCEL PREVIEW
- Deploy to Vercel Preview (PR/branch)
- Run `verify-parity.sh staging/preview`
- Evidence: URL, screenshots, JSON responses

### Layer 5: PRODUCTION PROMOTION
- Deploy to production URL
- Evidence: URL, screenshots, JSON, Ops Center baseline card = OK

### Layer 6: HASH CHAIN = INTEGRITY PARITY
All 4 sources must match:
- Local git commit
- Firestore state (if applicable)
- Vercel deployment (build-info)
- Production runtime (integrity)

**Invariants (must hold):**
- `integrity.status` = `OK`
- `governance.kernelFrozen` = `true`
- `governance.hashValid` = `true`
- `errorCodes` = `[]`
- `build-info.shaResolved` = `true`
- `build-info.commit[:7]` == `integrity.checks.build.sha`

**If any invariant fails → Phase cannot close.**
