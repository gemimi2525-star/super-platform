# Phase 29.1 — Multi-tenant Activation MVP

> **Baseline:** `v0.49.0` @ `bb4757d`
> **Flag:** `MULTI_TENANT_ENABLED` (default: `false`)
> **Kernel:** ❄️ FROZEN — ไม่แก้ไข

---

## สิ่งที่ Wire แล้ว

### 1. Client-side Tenant Store (`coreos/tenant/store.ts`)
- Zustand store: `useTenantStore`
- Auto-initialize: fetch `/api/tenants/my` → resolve memberships → start session
- `switchTenant()`: end current session → start new → update store
- `getTenantHeaders()`: inject `x-tenant-id` + `x-session-id` into fetch

### 2. OS Shell Integration (`OSShell.tsx`)
- `<TenantInitializer />`: invisible, bootstraps tenant on mount
- `<TenantIndicator />`: subtle badge (bottom-right) showing tenant + role
- `<TenantSwitcher />`: dev-only dropdown (shown when MT enabled + multiple tenants)

### 3. VFS Sandbox Isolation (`coreos/vfs/sandbox.ts`)
- `SandboxContext` extended with optional `tenantId`
- When tenantId present: paths prefixed with `tenants/{tenantId}/`
  - `user://docs/` → `tenants/acme/users/uid/docs/`
  - `app://config` → `tenants/acme/apps/appId/config`
- When absent: legacy paths (backward compatible)

### 4. API Routes (from Phase 29 — unchanged)
- `GET /api/tenants/my` → returns memberships + flag status
- `POST /api/tenants/sessions/start` → creates sessionId
- `POST /api/tenants/sessions/end` → revokes session
- `POST /api/dev/tenants/bootstrap` → dev-only (404 in prod)

---

## Decision Log

| # | Decision | Rationale |
|:---:|:---|:---|
| 1 | Audit stays global, tagged with tenantId | Per-tenant ledger too risky for MVP |
| 2 | Integrity chain stays global, ctx-tagged | Split = future phase |
| 3 | VFS prefix is additive (optional tenantId) | Zero regression risk — absent = legacy |
| 4 | TenantSwitcher dev-only | Calm-first, avoid prod clutter |
| 5 | Flag OFF in production | Safety-first activation |

---

## Known Gaps (Phase 29.2)

- [ ] Firestore membership validation in guard
- [ ] Per-tenant audit ledger
- [ ] Per-tenant integrity chain
- [ ] Tenant invitation/removal UI
- [ ] Capability registry tenant scoping
- [ ] Cross-tenant break-glass flow
