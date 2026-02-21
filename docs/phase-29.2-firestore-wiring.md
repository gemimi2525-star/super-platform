# Phase 29.2 — Multi-tenant Data Reality (Firestore Wiring)

> **Baseline:** `v0.49.1` @ `b2badf5`
> **Flag:** `MULTI_TENANT_ENABLED` (default: `false`)
> **Kernel:** ❄️ FROZEN

---

## Firestore Data Model

```
tenants/{tenantId}
├── members/{userId}          — role, status, joinedAt
├── sessions/{sessionId}      — userId, roleSnapshot, lastSeenAt, revokedAt?
└── audit/{eventId}           — ctx fields + eventType + severity + payload
```

## What's Wired

### 1. Firestore Service (`coreos/tenant/firestore.ts`) [NEW]
- `createTenant()` — writes tenant + owner membership
- `getMemberships(userId)` — returns all tenant memberships
- `validateMembership(tenantId, userId)` — checks active member doc
- `createSession()` — writes session doc under tenant
- `validateSession()` — checks ownership, revocation, expiry
- `revokeSession()` — sets revokedAt
- `touchSession()` — updates lastSeenAt (fire-and-forget)
- `writeTenantAudit()` — per-tenant audit entry
- `queryTenantAudit()` — tenant-scoped audit query

### 2. Guard Upgrade (`coreos/tenant/guard.ts`) [OVERWRITE]
- Explicit error codes: `TENANT_HEADERS_MISSING`, `TENANT_MEMBER_REQUIRED`, `TENANT_SESSION_INVALID`
- Real Firestore membership + session validation when flag ON
- Fire-and-forget session touch (non-blocking)
- Legacy fallback when flag OFF (unchanged)

### 3. API Routes (All overwritten with real Firestore)
- `POST /api/dev/tenants/bootstrap` — writes to Firestore when flag ON
- `GET /api/tenants/my` — real membership query when flag ON
- `POST /api/tenants/sessions/start` — validates membership + creates session doc
- `POST /api/tenants/sessions/end` — revokes session doc

### 4. Per-tenant Audit (Step 1)
- New writes go to `tenants/{tenantId}/audit/{eventId}`
- Read scoped by tenantId
- Legacy global audit unchanged when flag OFF

## Decision Log

| # | Decision | Rationale |
|:---:|:---|:---|
| 1 | Membership query scans tenants (no collectionGroup) | MVP scale is small, avoids index complexity |
| 2 | Session touch is fire-and-forget | Avoids write storm, non-critical |
| 3 | Integrity chain stays global in 29.2 | Split = high risk, deferred to 29.3 |
| 4 | Dev bootstrap writes real Firestore when flag ON | Enables E2E testing with real data |
