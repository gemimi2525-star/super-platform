# Capability Model v1

> **Phase**: 16 — App Runtime / Third-Party SDK  
> **Status**: ACTIVE  
> **Version**: 1.0

---

## Overview

Capabilities define what actions an app can perform. Apps REQUEST capabilities in their manifest; the OS GRANTS capabilities based on server-side policy.

---

## Capability Hierarchy

```
├── fs (File System)
│   ├── fs.read      — Read files from VFS
│   ├── fs.write     — Write files to VFS
│   └── fs.temp      — Access temp:// namespace only
│
├── process (Process Management)
│   └── process.spawn — Spawn child processes (first-party only)
│
├── net (Network)
│   └── net.fetch    — HTTP requests (allowlist policy)
│
├── ui (User Interface)
│   ├── ui.window    — Open/manage windows
│   └── ui.notify    — Show notifications
│
└── audit (Governance)
    └── audit.read   — Read audit logs (admin-only)
```

---

## Capability Definitions

### fs.read

| Property | Value |
|----------|-------|
| Description | Read files from Virtual File System |
| Constraint | Uses VFS intents only (no raw fs) |
| Policy | Allow for verified apps |
| Audit | Full path logged |

### fs.write

| Property | Value |
|----------|-------|
| Description | Write files to Virtual File System |
| Constraint | Uses VFS intents only |
| Policy | Restricted by path policy |
| Audit | Path + size logged |

### fs.temp

| Property | Value |
|----------|-------|
| Description | Access temp:// namespace |
| Constraint | Temp files auto-deleted on crash |
| Policy | Allow by default |
| Audit | Path logged |

### process.spawn

| Property | Value |
|----------|-------|
| Description | Spawn child processes |
| Constraint | **First-party only in v1** |
| Policy | Deny for third-party |
| Audit | Child appId logged |

### net.fetch

| Property | Value |
|----------|-------|
| Description | Make HTTP requests |
| Constraint | Must be on domain allowlist |
| Policy | Explicit allowlist per app |
| Audit | URL + status logged |

### ui.window

| Property | Value |
|----------|-------|
| Description | Open/manage windows |
| Constraint | Uses window intent |
| Policy | Allow for UI apps |
| Audit | Window action logged |

### ui.notify

| Property | Value |
|----------|-------|
| Description | Show system notifications |
| Constraint | Rate limited |
| Policy | Allow with rate limit |
| Audit | Message hash logged |

### audit.read

| Property | Value |
|----------|-------|
| Description | Read audit logs |
| Constraint | **Admin-only** |
| Policy | Deny for non-admin |
| Audit | Query params logged |

---

## Policy Enforcement

```
┌─────────────────────────────────────────────────────────────────┐
│                        POLICY FLOW                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  App Manifest                                                   │
│      │                                                          │
│      ▼                                                          │
│  requestedCapabilities: ["fs.read", "net.fetch"]                │
│      │                                                          │
│      ▼                                                          │
│  ┌─────────────────────────────────────────────┐                │
│  │         SERVER POLICY (Source of Truth)     │                │
│  │  ─────────────────────────────────────────  │                │
│  │  • Check appId trust level                  │                │
│  │  • Check capability restrictions            │                │
│  │  • Check user role (admin-only caps)        │                │
│  │  • Check rate limits                        │                │
│  └─────────────────────────────────────────────┘                │
│      │                                                          │
│      ▼                                                          │
│  grantedCapabilities: ["fs.read"]  (net.fetch DENIED)           │
│      │                                                          │
│      ▼                                                          │
│  Inject into Runtime via SDK bridge                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Permission Matrix

| Capability | First-Party | Third-Party Verified | Third-Party Unverified | Admin Required |
|------------|-------------|---------------------|------------------------|----------------|
| fs.read | ✅ | ✅ | ❌ | ❌ |
| fs.write | ✅ | ⚠️ (path restricted) | ❌ | ❌ |
| fs.temp | ✅ | ✅ | ✅ | ❌ |
| process.spawn | ✅ | ❌ | ❌ | ❌ |
| net.fetch | ✅ | ⚠️ (allowlist) | ❌ | ❌ |
| ui.window | ✅ | ✅ | ⚠️ (limited) | ❌ |
| ui.notify | ✅ | ✅ (rate limited) | ❌ | ❌ |
| audit.read | ✅ | ❌ | ❌ | ✅ |

Legend:
- ✅ = Allowed
- ⚠️ = Conditional
- ❌ = Denied

---

## SDK Behavior

```typescript
// SDK guards (UX only, not policy)
if (!grantedCapabilities.includes('fs.read')) {
    throw new CapabilityDeniedError('fs.read');
}

// All actual enforcement happens server-side
// SDK guards are convenience, not security
```

---

## Audit Fields

Every capability usage is logged with:

```typescript
interface CapabilityAuditEntry {
    traceId: string;
    opId: string;
    appId: string;
    capability: Capability;
    action: string;           // e.g., "read", "write", "fetch"
    target?: string;          // e.g., path, URL
    decision: 'ALLOW' | 'DENY';
    reason?: string;          // if denied
    timestamp: Date;
    latencyMs: number;
}
```

---

## Security Notes

> [!CAUTION]
> - **Server policy is the ONLY source of truth**
> - SDK guards are UX convenience, NOT security
> - Apps cannot bypass policy by calling API directly (blocked by RuntimeIPC)
> - All capability usage is audited with traceId/opId correlation
