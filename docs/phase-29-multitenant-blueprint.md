# Phase 29 — Multi-tenant Architecture Blueprint
# แผนสถาปัตยกรรม Multi-tenant ฉบับ Canonical

> **Baseline:** `v0.48.0` @ `193578b`
> **Kernel:** ❄️ FROZEN — ไม่แก้ไข `kernel.ts`
> **Feature Flag:** `MULTI_TENANT_ENABLED=true` (default: `false` in prod)
> **เป้าหมาย:** แยก session/namespace อย่างสมบูรณ์ ครบทุก layer โดยไม่กระทบ Kernel

---

## 1. นิยาม Multi-tenant ใน APICOREDATA OS

Multi-tenant = **หลาย organizational context + หลาย user sessions** ทำงานบนระบบเดียวกัน
โดยแต่ละ session มี **namespace แยกขาด** ใน:

| Resource | Scope | Isolation |
|:---|:---|:---|
| OS State (Zustand) | per-tenant + per-user | ❄️ Complete |
| VFS (OPFS) | per-tenant + per-user paths | ❄️ Complete |
| Capabilities (install/enable) | per-tenant | ❄️ Complete |
| Audit Trail | per-tenant | ❄️ Complete |
| Integrity Hash Chain | per-tenant | ❄️ Complete |
| Process List | per-tenant + per-user | ❄️ Complete |
| Job Queue | per-tenant + per-user | ❄️ Complete |
| Rate Limiting | per-tenant + per-user + per-cap | ❄️ Complete |

---

## 2. Session Context Layer (SCL)

### 2.1 Type Shape

```typescript
type TenantId = string;     // org/tenant identifier
type UserId = string;        // Firebase UID
type SessionId = string;     // opaque UUID v4
type TenantRole = 'owner' | 'admin' | 'user' | 'viewer';

interface SessionContext {
  readonly tenantId: TenantId;
  readonly userId: UserId;
  readonly sessionId: SessionId;
  readonly role: TenantRole;
  readonly issuedAt: number;           // ms epoch
  readonly authMode: 'REAL' | 'DEV';
  readonly deviceId?: string;
}
```

### 2.2 Propagation Rules

```
ทุก mutation / read MUST include SessionContext:

Client (Shell)
  → React Context (SessionProvider)
    → API headers: x-tenant-id, x-session-id, x-trace-id
      → Server middleware: requireSessionContext()
        → Service layer: receives SessionContext argument
          → Firestore: tenantId in collection path
            → Audit: tenantId + userId + sessionId ใน every entry
```

### 2.3 Namespace Key

```
ns = `${tenantId}:${userId}`

สำหรับ:
- Zustand store key scoping
- localStorage key prefix
- OPFS path root
- Rate limiter window key
```

---

## 3. Namespace Isolation Model

### 3.1 State Namespace

```
State Hierarchy:
├── global/        ← System constants, theme defaults (ไม่ scope)
├── tenant:{id}/   ← Tenant-scoped (capabilities, settings)
└── user:{ns}/     ← User-scoped (window positions, preferences)
    └── session:{sid}/  ← Session-transient (current focus, temp state)
```

**Helper API:**
```typescript
function scopedKey(ns: string, key: string): string;
function getTenantStore(tenantId: TenantId): TenantState;
function getUserStore(ns: string): UserState;
```

### 3.2 VFS Namespace

```
OPFS Root:
/tenants/
├── {tenantId}/
│   ├── shared/           ← Tenant shared space
│   └── users/
│       └── {userId}/
│           └── home/     ← Personal space (user:// scheme)
```

**Security:**
- Path traversal blocked: `..` always rejected
- All paths resolved within tenant root
- `VFSContext` derived from `SessionContext` (readonly)

### 3.3 Capability Namespace

```
Registry key: ${tenantId}:${capabilityId}

Rules:
- Install: per-tenant (owner/admin only)
- Enable/Disable: per-tenant or per-user (depends on policy)
- Cross-tenant capability access: DENIED by default
```

### 3.4 Audit + Integrity Namespace

```
Every audit entry includes:
  { tenantId, userId, sessionId, role, traceId, ... }

Integrity chain: **per-tenant**
  /tenants/{tenantId}/integrity/state → { rootHash, lastHash, height }
  /tenants/{tenantId}/integrity/ledger/{entryId}

Cross-tenant action:
  → Write to BOTH actor + target chains
  → Requires break-glass role + explicit audit
```

### 3.5 Process & Job Namespace

```
Process key: ${tenantId}:${userId}:${processId}
Job key:     ${tenantId}:${userId}:${jobId}

Rate limiter key: ${tenantId}:${userId}:${capabilityId}:${action}
```

---

## 4. Firestore Collections

```
/tenants/{tenantId}
  ├── name, createdAt, plan, ownerUserId, status
  │
  ├── /members/{userId}
  │     ├── role, status, invitedAt, joinedAt
  │
  ├── /sessions/{sessionId}
  │     ├── userId, roleSnapshot, createdAt, lastSeenAt, deviceId, revokedAt?
  │
  ├── /capabilities/{capabilityId}
  │     ├── version, state, installedBy, installedAt, manifestHash
  │
  ├── /audit/{eventId}
  │     ├── envelope (with context), redaction, traceId
  │
  └── /integrity/
        ├── state → { rootHash, lastHash, height, updatedAt }
        └── ledger/{entryId} → { hash, prevHash, payloadHash, ts, env }
```

---

## 5. Auth & Boot Flow

### 5.1 Production (REAL mode)

```
1. User login → Firebase session cookie
2. GET /api/tenants/my → list memberships [{tenantId, role}]
3. User picks tenant (or auto → last tenant / default)
4. POST /api/tenants/sessions/start → create session → sessionId
5. Shell stores sessionId → propagates via React Context
6. All API calls carry headers: x-tenant-id, x-session-id, x-trace-id
7. Logout/switch: POST /api/tenants/sessions/end → revoke
```

### 5.2 Development (DEV mode)

```
- POST /api/dev/tenants/bootstrap → create tenant + owner (404 in prod)
- Auto-resolve to "default-dev" tenant if no tenant headers
```

### 5.3 Server-Side Guard

```typescript
async function requireSessionContext(req): Promise<SessionContext> {
  1. Validate Firebase user (existing auth)
  2. Extract x-tenant-id, x-session-id
  3. Validate membership in tenant
  4. Validate session belongs to user + not revoked
  5. Return SessionContext with role
  // Deny-by-default: missing headers → 401
}
```

---

## 6. UI/UX (Calm-first)

### 6.1 Tenant Switcher
- **ตำแหน่ง:** Top-left profile menu หรือ System Hub → Account tab
- **พฤติกรรม:** เปลี่ยน tenant → reload scoped state + VFS context
- **ข้อจำกัด:** ไม่แสดงข้อมูล cross-tenant เด็ดขาด

### 6.2 Session Indicator
- Subtle badge ใน Ops Center: `tenant:name • role`
- Copyable "Session Report" สำหรับ debug

### 6.3 Dev Console
- Tab ใหม่ "Tenants" (dev-only) สำหรับ bootstrap + inspect

---

## 7. Compatibility & Migration

### 7.1 Feature Flag
```
MULTI_TENANT_ENABLED=false  (production default)
MULTI_TENANT_ENABLED=true   (opt-in, dev/preview)
```

- Flag `false`: ระบบทำงานเหมือนเดิมทุกประการ
- Flag `true`: activate tenant resolution + namespace scoping

### 7.2 Legacy Migration
- สร้าง "default" tenant สำหรับ owner ปัจจุบัน
- Existing data → legacy tenant pointer
- Audit/integrity ย้ายไปอยู่ใต้ default tenant root

---

## 8. Decision Log

| # | Decision | Rationale |
|:---:|:---|:---|
| 1 | Separate integrity chain per tenant | Prevent cross-tenant chain corruption |
| 2 | Feature flag `false` by default | Zero production risk until verified |
| 3 | Context NOT in kernel | Kernel stays ❄️ FROZEN |
| 4 | Namespace key = `tenantId:userId` | Simple, deterministic, index-friendly |
| 5 | Deny-by-default cross-tenant | Security-first posture |
| 6 | OPFS path = `/tenants/{id}/users/{uid}/home/` | Clear directory isolation |
| 7 | Session stored in Firestore | Revocable, auditable, persistent |
