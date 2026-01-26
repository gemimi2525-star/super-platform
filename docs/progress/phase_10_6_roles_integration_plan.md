# Phase 10.6 — Roles Audit Integration Plan

**Date:** 2026-01-22  
**Phase:** 10.6  
**Module:** Roles  
**Status:** INTEGRATION PLAN (NO CODE)

---

## 🎯 Objective

วางแผนการ integrate **Roles module** ให้ emit audit logs ผ่าน centralized helper

---

## 📋 Events Coverage

### Success Events

| Event | Trigger | Endpoint |
|-------|---------|----------|
| `role.created` | Role created | POST `/api/roles` |
| `role.updated` | Role updated | PUT `/api/roles/[id]` |
| `role.deleted` | Role deleted | DELETE `/api/roles/[id]` |
| `role.copied` | Role copied | POST `/api/roles/copy` |
| `role.permissions_assigned` | Permissions changed | PATCH `/api/platform/roles` |

### Denial Events

| Event | Denial Scenario | Guard/Check |
|-------|-----------------|-------------|
| `permission.denied` | Non-owner access | `requireOwner()` |
| `permission.denied` | System role modification | System role check (service) |

Note: Roles is **Owner-only** module, so denial scenarios are simpler than Users.

---

## 📍 Integration Touchpoints

### 1. Management Endpoints (Success)

| File | Method | Action | Current State |
|------|--------|--------|---------------|
| `app/api/roles/route.ts` | GET | - | No emit (listing) |
| `app/api/roles/route.ts` | POST | role.created | ❌ No audit |
| `app/api/roles/[id]/route.ts` | GET | - | No emit (view) |
| `app/api/roles/[id]/route.ts` | PUT | role.updated | ❌ No audit |
| `app/api/roles/[id]/route.ts` | DELETE | role.deleted | ❌ No audit |
| `app/api/roles/copy/route.ts` | POST | role.copied | ❌ No audit |
| `app/api/platform/roles/route.ts` | PATCH | role.permissions_assigned | ✅ Has DB audit |

### 2. Denial Points

| File | Guard | Current State |
|------|-------|---------------|
| `app/api/roles/route.ts` | `requireOwner()` | ✅ Console log (via guard) |
| `app/api/roles/[id]/route.ts` | `requireOwner()` | ✅ Console log (via guard) |
| `app/api/roles/copy/route.ts` | `requireOwner()` | ✅ Console log (via guard) |
| `lib/roles/service.ts` | System role protection | ❌ No audit |

**Note:** `requireOwner()` guard already has console logging from Phase 7.5.  
Phase 10 will persist these to DB.

### 3. Reference Endpoint Decision

| Endpoint | Purpose | Emit Audit? |
|----------|---------|-------------|
| GET `/api/platform/roles` | Role dropdown for Users | ❌ **NO** |

**Decision:** Do not emit audit for GET `/api/platform/roles`

**Reason:**
- High volume (called every time Users page loads)
- Read-only reference data
- No security-sensitive action
- Would create excessive noise in audit logs

---

## 🗺️ Field Mapping

### role.created

```
eventType: "role"
action: "created"
timestamp: [server timestamp]
actor:
  uid: [auth.uid]
  email: [auth.email]
  role: "owner"
target:
  id: [new role id]
  name: [role name]
  type: "role"
success: true
method: "POST"
path: "/api/roles"
details:
  permissionsCount: [number]
```

### role.updated

```
eventType: "role"
action: "updated"
timestamp: [server timestamp]
actor:
  uid: [auth.uid]
  email: [auth.email]
  role: "owner"
target:
  id: [role id]
  name: [role name]
  type: "role"
success: true
method: "PUT"
path: "/api/roles/[id]"
details:
  changedFields: [list]
```

### role.deleted

```
eventType: "role"
action: "deleted"
timestamp: [server timestamp]
actor:
  uid: [auth.uid]
  email: [auth.email]
  role: "owner"
target:
  id: [role id]
  name: [role name]
  type: "role"
success: true
method: "DELETE"
path: "/api/roles/[id]"
```

### role.copied

```
eventType: "role"
action: "copied"
timestamp: [server timestamp]
actor:
  uid: [auth.uid]
  email: [auth.email]
  role: "owner"
target:
  id: [new role id]
  name: [new role name]
  type: "role"
success: true
method: "POST"
path: "/api/roles/copy"
details:
  sourceRoleId: [original id]
  sourceRoleName: [original name]
```

### role.permissions_assigned

```
eventType: "role"
action: "permissions_assigned"
timestamp: [server timestamp]
actor:
  uid: [auth.uid]
  email: [auth.email]
  role: "owner"
target:
  id: [role id]
  name: [role name]
  type: "role"
success: true
method: "PATCH"
path: "/api/platform/roles"
details:
  permissionsCount: [number]
```

### permission.denied (Roles context)

```
eventType: "permission"
action: "denied"
timestamp: [server timestamp]
actor:
  uid: [context.uid]
  email: [context.email]
  role: [context.role]
success: false
requiredRole: "owner"
actualRole: [context.role]
method: [HTTP method]
path: [request path]
details:
  guard: "requireOwner"
  resource: "role"
```

---

## 🛡️ PII & Safety Checklist

### ✅ Allowed

- Actor UID, email, role
- Role ID, name
- Permissions count (not list)
- HTTP method, path

### ❌ Prohibited

- Full permissions list
- Auth tokens
- Request body

---

## ⚠️ Risks & Notes

| # | Risk/Note | Mitigation |
|---|-----------|------------|
| 1 | System role protection not logged | Add emit in service layer |
| 2 | requireOwner denial already logged | Migrate from console to DB |
| 3 | platform/roles PATCH has different pattern | Handle separately |

---

## 📊 Implementation Summary

| Endpoint | Current | Change |
|----------|---------|--------|
| POST /api/roles | None | Add emit |
| PUT /api/roles/[id] | None | Add emit |
| DELETE /api/roles/[id] | None | Add emit |
| POST /api/roles/copy | None | Add emit |
| PATCH /api/platform/roles | ✅ DB | Migrate to helper |
| requireOwner denial | Console | Persist to DB |

---

## ✅ Exit Criteria

- ✅ Events list complete (5 success, 2 denial)
- ✅ Touchpoints identified (6 endpoints + guard)
- ✅ Reference endpoint decision made
- ✅ Field mapping defined
- ✅ Ready for Phase 10.7

---

## ▶️ Next Step

**Phase 10.7 — Read API Plan**
