# Phase 29 — Multi-tenant Threat Model (STRIDE)
# แบบจำลองภัยคุกคาม Multi-tenant

> **Standard:** STRIDE (Spoofing, Tampering, Repudiation, Info Disclosure, DoS, Elevation)
> **Scope:** APICOREDATA Core OS Multi-tenant Isolation

---

## 1. System Boundary

```
┌─ Trust Boundary ────────────────────────────┐
│  Client Shell (Browser)                      │
│    SessionContext (React)                     │
│    VFS Client (OPFS)                         │
│    Zustand Stores (scoped)                   │
├──────────────────────────────────────────────┤
│  API Layer (Next.js Server)                  │
│    requireSessionContext() guard             │
│    Firestore DAL (tenant-scoped)             │
│    Integrity Ledger (per-tenant)             │
├──────────────────────────────────────────────┤
│  Firebase Auth (external)                    │
│  Firestore (external)                        │
└──────────────────────────────────────────────┘
```

---

## 2. Threat Analysis

### T1: Cross-tenant Data Leakage
| Field | Value |
|:---|:---|
| **STRIDE** | Information Disclosure |
| **Scenario** | VFS path escape: user crafts `../../otherTenant/` from client |
| **Impact** | 🔴 CRITICAL — data of other tenant exposed |
| **Mitigation** | 1) Path resolve within root, reject `..` always 2) VFS adapter validates `tenantId` prefix 3) OPFS root mounted per-tenant at session start |
| **Mitigation** | 4) Firestore queries ALWAYS include `tenantId` as path segment (not filter) — structural isolation |
| **Test** | Unit: path traversal → reject. Integration: cross-tenant read → deny |

### T2: Session Fixation / Replay
| Field | Value |
|:---|:---|
| **STRIDE** | Spoofing |
| **Scenario** | Attacker captures `sessionId` and replays in different browser |
| **Impact** | 🟡 HIGH — impersonation within tenant |
| **Mitigation** | 1) Session doc includes creating `deviceId` hash 2) `lastSeenAt` freshness check 3) Sessions expire after 24h inactivity 4) Explicit revoke on logout |
| **Test** | Replay old sessionId after revoke → 401 |

### T3: Privilege Escalation via Role Mismatch
| Field | Value |
|:---|:---|
| **STRIDE** | Elevation of Privilege |
| **Scenario** | User modifies `x-tenant-id` header to access tenant where they have higher role |
| **Impact** | 🔴 CRITICAL — admin actions in wrong tenant |
| **Mitigation** | 1) `requireSessionContext()` validates membership per-request 2) Role derived from Firestore, never from client 3) `roleSnapshot` in session doc for audit trail |
| **Test** | Switch tenantId header → membership check → 403 |

### T4: Rate-limit Bypass via Tenant Switching
| Field | Value |
|:---|:---|
| **STRIDE** | Denial of Service |
| **Scenario** | User switches tenants rapidly to reset rate counters |
| **Impact** | 🟡 MEDIUM — circumvents per-tenant rate limits |
| **Mitigation** | 1) Rate limit key includes `userId` (not just tenant) 2) Global per-user rate limit cap 3) Session creation itself rate-limited (max 5/min) |
| **Test** | Create sessions rapidly → 429 after limit |

### T5: Audit Omission / Shadow Governance
| Field | Value |
|:---|:---|
| **STRIDE** | Repudiation |
| **Scenario** | Action executed without audit entry (bypass logging) |
| **Impact** | 🔴 CRITICAL — violates core governance principle |
| **Mitigation** | 1) `assertContext()` at every service boundary 2) TypeScript compile-time: functions require `SessionContext` param 3) No "default context" fallback in production |
| **Test** | Call service without context → compile error / runtime throw |

### T6: Integrity Chain Fork
| Field | Value |
|:---|:---|
| **STRIDE** | Tampering |
| **Scenario** | Two concurrent writes to same tenant chain → fork (different prevHash) |
| **Impact** | 🟡 HIGH — integrity verification fails |
| **Mitigation** | 1) Firestore transaction for chain append (atomic read + write) 2) Per-tenant mutex (server-side) 3) Chain height monotonic check |
| **Test** | Concurrent writes → verify serial ordering, no forks |

### T7: Cross-tenant Capability Call
| Field | Value |
|:---|:---|
| **STRIDE** | Information Disclosure + Elevation |
| **Scenario** | Capability in Tenant A calls capability registered in Tenant B |
| **Impact** | 🟡 HIGH — data/privilege leakage |
| **Mitigation** | 1) callGuard checks tenantId match 2) Cross-tenant calls require explicit policy + break-glass role 3) Denied by default |
| **Test** | Cross-tenant call → DENY + audit entry |

---

## 3. Mitigation Summary

| # | Control | Layer | Status |
|:---:|:---|:---|:---:|
| 1 | `requireSessionContext()` on all APIs | Server | 🔧 New |
| 2 | Firestore path-based tenant isolation | Data | 🔧 New |
| 3 | VFS root scoping per-tenant | Storage | 🔧 New |
| 4 | `assertContext()` at service boundaries | Code | 🔧 New |
| 5 | TypeScript required params for SessionContext | Compile | 🔧 New |
| 6 | Session revocation + expiry | Auth | 🔧 New |
| 7 | Rate limit keyed by userId + tenantId | Runtime | 🔧 Extend |
| 8 | Integrity chain per-tenant with Tx | Integrity | 🔧 New |
| 9 | Cross-tenant deny-by-default in callGuard | Isolation | 🔧 Extend |
| 10 | Audit includes full SessionContext | Audit | 🔧 Extend |

---

## 4. Residual Risks

| Risk | Likelihood | Impact | Acceptance |
|:---|:---:|:---:|:---|
| Client-side state leak via shared browser storage | Low | Medium | Mitigate with ns-prefixed keys |
| Firestore admin SDK bypass (service account) | Very Low | Critical | Accept: admin access is operational |
| Performance regression with per-tenant queries | Medium | Low | Monitor: add tenant-scoped indexes |
