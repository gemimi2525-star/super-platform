# Phase 29 — Multi-tenant Execution Plan
# แผนดำเนินการ Multi-tenant แบบ Step-by-step

> **Approach:** Feature-flagged scaffolding → local test → preview → production → freeze
> **Feature Flag:** `MULTI_TENANT_ENABLED` (default `false`)
> **Target Tag:** `v0.49.0`

---

## Step 1: Core Types + Feature Flag

### Files
| # | Path | Action |
|:---:|:---|:---:|
| 1 | `coreos/tenant/types.ts` | NEW |
| 2 | `coreos/tenant/featureFlag.ts` | NEW |

### Details
- `types.ts`: `TenantId`, `UserId`, `SessionId`, `TenantRole`, `SessionContext`
- `featureFlag.ts`: `isMultiTenantEnabled()` reads `MULTI_TENANT_ENABLED` env var

### Test
- TypeScript compile: types export correctly
- Flag returns `false` by default

---

## Step 2: Namespace Utilities

### Files
| # | Path | Action |
|:---:|:---|:---:|
| 3 | `coreos/tenant/namespace.ts` | NEW |

### Details
- `scopedKey(ns, key)` → namespaced storage key
- `tenantVfsRoot(tenantId, userId)` → OPFS path
- `rateLimitKey(tenantId, userId, capId, action)` → rate key
- `assertNoPathTraversal(path)` → security guard

### Test
- Path traversal rejection
- Key format validation

---

## Step 3: Session Context Provider (Client)

### Files
| # | Path | Action |
|:---:|:---|:---:|
| 4 | `coreos/tenant/context.ts` | NEW |

### Details
- `SessionProvider` React context
- `useSessionContext()` hook
- Auto-resolve from API on mount (if flag enabled)
- Returns `null` context when flag disabled (backward compatible)

### Test
- Context available in child components
- Null when flag off

---

## Step 4: Firestore Collection Helpers

### Files
| # | Path | Action |
|:---:|:---|:---:|
| 5 | `coreos/tenant/collections.ts` | NEW |

### Details
- `tenantDoc(tenantId)` → `/tenants/{id}`
- `memberDoc(tenantId, userId)` → `/tenants/{id}/members/{uid}`
- `sessionDoc(tenantId, sessionId)` → `/tenants/{id}/sessions/{sid}`
- `tenantAuditCol(tenantId)` → `/tenants/{id}/audit`
- `tenantIntegrityCol(tenantId)` → `/tenants/{id}/integrity/ledger`
- All return typed Firestore references

### Test
- Correct path construction
- Required tenantId argument (compile-time)

---

## Step 5: API Guard Middleware

### Files
| # | Path | Action |
|:---:|:---|:---:|
| 6 | `coreos/tenant/guard.ts` | NEW |

### Details
```typescript
async function requireSessionContext(req: Request): Promise<SessionContext>
  1. If flag off → return legacy context (single tenant)
  2. Extract x-tenant-id, x-session-id headers
  3. Validate Firebase user
  4. Validate Firestore membership
  5. Validate session (not revoked, not expired)
  6. Return SessionContext

function assertContext(ctx: SessionContext | null): asserts ctx is SessionContext
  → throws if null (production safety)
```

### Test
- Missing headers → 401
- Invalid sessionId → 401
- Revoked session → 401
- Valid → returns context

---

## Step 6: Dev Bootstrap Endpoint

### Files
| # | Path | Action |
|:---:|:---|:---:|
| 7 | `/api/dev/tenants/bootstrap/route.ts` | NEW |

### Details
- POST: Create tenant + owner membership (dev-only, 404 in prod)
- Returns: `{ tenantId, userId, role: 'owner' }`

### Test
- Dev: creates tenant → 200
- Prod: → 404

---

## Step 7: Tenant Resolution APIs

### Files
| # | Path | Action |
|:---:|:---|:---:|
| 8 | `/api/tenants/my/route.ts` | NEW |
| 9 | `/api/tenants/sessions/start/route.ts` | NEW |
| 10 | `/api/tenants/sessions/end/route.ts` | NEW |

### Details
- `GET /api/tenants/my` → list user's tenant memberships
- `POST /api/tenants/sessions/start` → create session, return sessionId
- `POST /api/tenants/sessions/end` → revoke session

### Test
- Full flow: my → start → headers work → end → old session rejected

---

## Step 8: Build + Deploy + Verify

### 8.1 Local
```bash
next build  # exit 0
```

### 8.2 Production Safety
- Feature flag `false` → all multi-tenant code inactive
- No Dev Console changes (multi-tenant tab = future)
- Dev bootstrap → 404 in prod
- Existing APIs unaffected

### 8.3 Browser Verification
- Navigate to `/os` → OS works normally
- Tenant APIs respond correctly when flag off (N/A or 404)
- No regression in existing functionality

### 8.4 Freeze
```bash
git tag v0.49.0
git push origin v0.49.0
```

---

## Summary: File Count

| Category | Files | Status |
|:---|:---:|:---:|
| Core types + flag | 2 | NEW |
| Namespace utilities | 1 | NEW |
| Context provider | 1 | NEW |
| Firestore helpers | 1 | NEW |
| API guard | 1 | NEW |
| Dev bootstrap API | 1 | NEW |
| Tenant resolution APIs | 3 | NEW |
| **Total** | **10** | **NEW** |

**Modified files:** 1 (`package.json` for version bump)
**Kernel:** ❄️ UNTOUCHED

---

## Future Expansions (NOT in this phase)

- UI: Tenant Switcher in System Hub
- UI: Dev Console "Tenants" tab
- Data: Migration tool for existing single-tenant data
- API: Tenant invitation/removal endpoints
- API: Cross-tenant break-glass flow
- Integration: VFS adapter tenant-aware wiring
- Integration: Audit/integrity per-tenant chain activation
