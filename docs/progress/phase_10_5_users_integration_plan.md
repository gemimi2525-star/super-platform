# Phase 10.5 — Users Audit Integration Plan

**Date:** 2026-01-22  
**Phase:** 10.5  
**Module:** Users  
**Status:** INTEGRATION PLAN (NO CODE)

---

## 🎯 Objective

วางแผนการ integrate **Users module** ให้ emit audit logs ผ่าน centralized helper

---

## 📋 Events Coverage

### Success Events

| Event | Trigger | Endpoint |
|-------|---------|----------|
| `user.created` | User created | POST `/api/platform/users` |
| `user.updated` | User info updated | PATCH `/api/platform/users/[uid]` |
| `user.disabled` | User disabled (soft delete) | DELETE `/api/platform/users/[uid]` |
| `user.enabled` | User re-enabled | PATCH `/api/platform/users/[uid]` (enabled: true) |
| `user.role_assigned` | Role changed | PATCH `/api/platform/users/[uid]` (role field) |

### Denial Events

| Event | Denial Scenario | Guard/Check |
|-------|-----------------|-------------|
| `permission.denied` | Not platform user | Platform access check |
| `permission.denied` | Missing users:read | `hasPermission('read')` |
| `permission.denied` | Missing users:write | `hasPermission('write')` |
| `permission.denied` | Missing users:delete | `hasPermission('delete')` |
| `permission.denied` | Missing roles:manage | `hasPermission('roles:manage')` |
| `permission.denied` | Hierarchy violation (modify higher) | Role hierarchy check |
| `permission.denied` | Owner protection | `assertCanAccessTargetUser()` |
| `permission.denied` | Self-delete prevention | Self-delete check |
| `permission.denied` | Owner role assignment | Owner-only promotion |

### Auth Events (Not in Users Module)

> Login/logout events are handled by Auth module, not Users.
> ไม่อยู่ใน scope ของ Users integration

---

## 📍 Integration Touchpoints

### 1. Success Endpoints

| File | Method | Action | Current State |
|------|--------|--------|---------------|
| `app/api/platform/users/route.ts` | POST | user.created | ✅ Has DB audit |
| `app/api/platform/users/[uid]/route.ts` | PATCH | user.updated | ✅ Has DB audit |
| `app/api/platform/users/[uid]/route.ts` | DELETE | user.disabled | ✅ Has DB audit |

**Note:** Users already has DB audit logging for success events!  
Change needed: Migrate to centralized helper for consistency.

### 2. Denial Scenarios (19 Points)

| File | Line | Denial Type | Current State |
|------|------|-------------|---------------|
| `route.ts` | 83 | Not platform user (GET) | ❌ No audit |
| `route.ts` | 89 | No users:read (GET) | ❌ No audit |
| `route.ts` | 146 | Not platform user (POST) | ❌ No audit |
| `route.ts` | 152 | No users:write (POST) | ❌ No audit |
| `route.ts` | 167 | Hierarchy violation (POST) | ❌ No audit |
| `[uid]/route.ts` | 48 | Not platform user (GET) | ❌ No audit |
| `[uid]/route.ts` | 53 | No users:read (GET) | ❌ No audit |
| `[uid]/route.ts` | 122 | Not platform user (PATCH) | ❌ No audit |
| `[uid]/route.ts` | 129 | No users:write (PATCH) | ❌ No audit |
| `[uid]/route.ts` | 150 | Owner protection (PATCH) | ❌ No audit |
| `[uid]/route.ts` | 157 | Hierarchy violation (PATCH) | ❌ No audit |
| `[uid]/route.ts` | 163 | No roles:manage (PATCH) | ❌ No audit |
| `[uid]/route.ts` | 172 | Owner role assignment (PATCH) | ❌ No audit |
| `[uid]/route.ts` | 177 | Promotion hierarchy (PATCH) | ❌ No audit |
| `[uid]/route.ts` | 235 | Not platform user (DELETE) | ❌ No audit |
| `[uid]/route.ts` | 241 | No users:delete (DELETE) | ❌ No audit |
| `[uid]/route.ts` | 262 | Owner protection (DELETE) | ❌ No audit |
| `[uid]/route.ts` | 269 | Hierarchy violation (DELETE) | ❌ No audit |
| `[uid]/route.ts` | 274 | Self-delete prevention | ❌ No audit |

**Gap Note (from Phase 8.5):** Users API denial logging was accepted as gap. Phase 10 will fix this.

---

## 🗺️ Field Mapping

### user.created

```
eventType: "user"
action: "created"
timestamp: [server timestamp]
actor:
  uid: [auth.uid]
  email: [auth.email]
  role: [currentUser.role]
target:
  uid: [new user uid]
  email: [new user email]
  type: "user"
success: true
method: "POST"
path: "/api/platform/users"
details:
  assignedRole: [role]
```

### user.updated

```
eventType: "user"
action: "updated"
timestamp: [server timestamp]
actor:
  uid: [auth.uid]
  email: [auth.email]
  role: [currentUser.role]
target:
  uid: [target uid]
  email: [target email]
  type: "user"
success: true
method: "PATCH"
path: "/api/platform/users/[uid]"
details:
  changedFields: [list]
```

### user.disabled

```
eventType: "user"
action: "disabled"
timestamp: [server timestamp]
actor:
  uid: [auth.uid]
  email: [auth.email]
  role: [currentUser.role]
target:
  uid: [target uid]
  email: [target email]
  type: "user"
success: true
method: "DELETE"
path: "/api/platform/users/[uid]"
```

### permission.denied (Users context)

```
eventType: "permission"
action: "denied"
timestamp: [server timestamp]
actor:
  uid: [auth.uid]
  email: [auth.email]
  role: [currentUser.role]
success: false
requiredPermission: "platform:users:write" | "platform:users:delete" | etc.
actualRole: [currentUser.role]
method: [HTTP method]
path: [request path]
details:
  reason: "insufficient_permission" | "hierarchy_violation" | "owner_protection" | "self_delete" | "owner_promotion"
  guard: "hasPermission" | "assertCanAccessTargetUser"
```

---

## 🛡️ PII & Safety Checklist

### ✅ Allowed

- Actor UID, email, role
- Target UID, email
- Changed field names (not values)
- HTTP method, path

### ❌ Prohibited

- Passwords
- Temporary passwords
- Auth tokens
- Full request body
- Personal details beyond email

---

## 🔧 Known Gaps & Resolution

| Gap | From Phase | Resolution in Phase 10 |
|-----|------------|----------------------|
| No denial audit logging | 8.5 | Add emit in each 403 return |
| Uses inline DB writes | - | Migrate to centralized helper |
| Different schema | - | Use new unified schema |

---

## 📊 Implementation Priority

1. **High:** Add denial logging (19 points)
2. **Medium:** Migrate success events to helper
3. **Low:** Ensure schema consistency

---

## ✅ Exit Criteria

- ✅ Events list complete (5 success, 9 denial types)
- ✅ Touchpoints identified (3 endpoints, 19 denial points)
- ✅ Field mapping defined
- ✅ Gap from Phase 8.5 addressed
- ✅ Ready for Phase 10.6

---

## ▶️ Next Step

**Phase 10.6 — Integration Plan: Roles**
