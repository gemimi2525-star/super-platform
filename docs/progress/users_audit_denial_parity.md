# Users Audit Denial Parity Report

**Date:** 2026-01-22  
**Phase:** 8.5  
**Module:** Users  
**Status:** ⚠️ GAP IDENTIFIED

---

## Summary

**Finding:** Users API has **SUCCESS logging** but **NO DENIAL logging**

- Success actions (create, update, delete) → ✅ Logged to `platform_audit_logs`
- Permission denials (403) → ❌ NOT logged

---

## A) Denial Coverage Table

| Action | Endpoint | Denial Points | Log Created? | Status |
|--------|----------|---------------|--------------|--------|
| List Users (GET) | `/api/platform/users` | 2 | ❌ No | Missing |
| Create User (POST) | `/api/platform/users` | 3 | ❌ No | Missing |
| View User (GET) | `/api/platform/users/[uid]` | 2 | ❌ No | Missing |
| Edit User (PATCH) | `/api/platform/users/[uid]` | 7 | ❌ No | Missing |
| Delete User (DELETE) | `/api/platform/users/[uid]` | 5 | ❌ No | Missing |

**Total Denial Points without Logging: 19**

---

## B) Schema Parity (Phase 7 Baseline)

Phase 7 uses console logging with this schema:

| Required Field | Users API | Phase 7 | Parity |
|---------------|-----------|---------|--------|
| `event: "permission.denied"` | ❌ Missing | ✅ Has | ❌ Gap |
| `requiredRole` | ❌ Missing | ✅ Has | ❌ Gap |
| `actualRole` | ❌ Missing | ✅ Has | ❌ Gap |
| `userId` | ❌ Missing | ✅ Has | ❌ Gap |
| `method` | ❌ Missing | ✅ Has | ❌ Gap |
| `path` | ❌ Missing | ✅ Has | ❌ Gap |
| `action` | ❌ Missing | ✅ Has | ❌ Gap |
| `timestamp` | ❌ Missing | ✅ Has | ❌ Gap |

---

## C) Where Logging Happens

### Phase 7 (Organizations) — Baseline
- **Location:** `lib/auth/server.ts` (lines 203-218, 236-250)
- **Mechanism:** Guards (`requireOwner()`, `requireAdmin()`) have logging built-in
- **Output:** Console log

### Users API — Current State
- **Success Logging:** `platform_audit_logs` collection (DB)
  - POST success → line 195-204
  - PATCH success → line 193-203
  - DELETE success → line 286-295
- **Denial Logging:** ❌ None
- **Reason:** Users API uses `hasPermission()` not guards with logging

---

## D) Gap Analysis

### Why the Gap Exists

1. **Different authorization pattern:**
   - Organizations: Uses `requireOwner()`/`requireAdmin()` guards with built-in logging
   - Users: Uses `hasPermission()` inline checks without logging

2. **Guards in `lib/auth/server.ts` have logging, but:**
   - Users API doesn't use those guards
   - `hasPermission()` returns boolean, doesn't log

### Options to Fix

| Option | Effort | Description |
|--------|--------|-------------|
| **A) Accept as-is** | None | Document gap, defer to Phase 10 |
| **B) Add console log** | Low | Add try/catch log before each 403 return |
| **C) Create shared helper** | Medium | Create `logPermissionDenial()` function |

---

## E) Recommendation

**Option A: Accept and Document**

Reasoning:
1. Phase 7 baseline uses **console logging** (not DB persistence)
2. Users API already has **DB logging for success** (better than Phase 7!)
3. Denial logging would be console-only anyway
4. Scope says "prefer zero-code"

**Documented Gap:**
- Permission denials not logged to console
- This is known and accepted for Phase 8
- Will be addressed in Phase 10 (Persistent Audit)

---

## F) Conclusion

| Aspect | Status |
|--------|--------|
| Denial logging exists | ❌ No |
| Schema parity | ❌ No |
| Success logging | ✅ Yes (better than Phase 7!) |
| **Recommendation** | Accept gap, document |

**Phase 8.5 Exit Criteria:**
- ✅ Denial logging coverage verified (none exists)
- ✅ Schema parity verified (gap documented)
- ✅ Document created for evidence
- ✅ Ready for Phase 8.6

---

## ▶️ Next Step

**Phase 8.6 — UI Permission Gating (Users)**
