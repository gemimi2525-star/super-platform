# Phase 10.4 — Organizations Audit Integration Plan

**Date:** 2026-01-22  
**Phase:** 10.4  
**Module:** Organizations  
**Status:** INTEGRATION PLAN (NO CODE)

---

## 🎯 Objective

วางแผนการ integrate **Organizations module** ให้ emit audit logs ผ่าน centralized helper

---

## 📋 Events Coverage

### Success Events

| Event | Trigger | Endpoint |
|-------|---------|----------|
| `org.created` | Organization created | POST `/api/platform/orgs` |
| `org.updated` | Organization updated | PATCH `/api/platform/orgs/[id]` |
| `org.disabled` | Organization disabled | DELETE `/api/platform/orgs/[id]` |

### Denial Events

| Event | Trigger | Guard |
|-------|---------|-------|
| `permission.denied` | Non-admin/owner tries mutation | `requireAdmin()` |
| `permission.denied` | Non-owner tries disable | `requireOwner()` |

---

## 📍 Integration Touchpoints

### 1. API Endpoints (Success Events)

| File | Method | Line | Current Audit | Change Needed |
|------|--------|------|---------------|---------------|
| `app/api/platform/orgs/route.ts` | POST | ~90 | None | Add emit |
| `app/api/platform/orgs/[id]/route.ts` | PATCH | ~85 | None | Add emit |
| `app/api/platform/orgs/[id]/route.ts` | DELETE | ~183 | None | Add emit |

### 2. Guards (Denial Events)

| File | Guard | Line | Current Audit | Change Needed |
|------|-------|------|---------------|---------------|
| `lib/auth/server.ts` | `requireOwner()` | ~202 | Console only | Persist to DB |
| `lib/auth/server.ts` | `requireAdmin()` | ~232 | Console only | Persist to DB |

---

## 🗺️ Field Mapping

### org.created

```
eventType: "org"
action: "created"
timestamp: [server timestamp]
actor:
  uid: [auth.uid]
  email: [auth.email]
  role: [currentUser.role]
target:
  id: [created org ID]
  name: [org.name]
  type: "org"
success: true
method: "POST"
path: "/api/platform/orgs"
details:
  slug: [org.slug]
```

### org.updated

```
eventType: "org"
action: "updated"
timestamp: [server timestamp]
actor:
  uid: [auth.uid]
  email: [auth.email]
  role: [currentUser.role]
target:
  id: [org ID]
  name: [org.name]
  type: "org"
success: true
method: "PATCH"
path: "/api/platform/orgs/[id]"
details:
  changedFields: [list of changed fields]
```

### org.disabled

```
eventType: "org"
action: "disabled"
timestamp: [server timestamp]
actor:
  uid: [auth.uid]
  email: [auth.email]
  role: [currentUser.role]
target:
  id: [org ID]
  name: [org.name]
  type: "org"
success: true
method: "DELETE"
path: "/api/platform/orgs/[id]"
```

### permission.denied (Orgs context)

```
eventType: "permission"
action: "denied"
timestamp: [server timestamp]
actor:
  uid: [context.uid]
  email: [context.email]
  role: [context.role]
success: false
requiredRole: "owner" | "admin"
actualRole: [context.role]
method: [HTTP method]
path: [request path]
details:
  guard: "requireOwner" | "requireAdmin"
  resource: "org"
```

---

## 🛡️ PII & Safety Checklist

### ✅ Allowed to Log

- Actor UID, email
- Actor role
- Org ID, name, slug
- HTTP method, path
- Changed field names (not values)

### ❌ Prohibited from Logging

- Full request/response body
- Auth tokens
- Org owner personal details
- Subscription/billing info
- Customer data

---

## 🔧 Implementation Steps (for Phase 10.X)

1. Create `lib/audit/emit.ts` with helper functions
2. Import helper in Orgs API routes
3. Add emit call after successful POST
4. Add emit call after successful PATCH
5. Add emit call after successful DELETE
6. Update guards to persist denial logs

---

## ⚠️ Open Questions / Risks

| # | Question | Proposed Answer |
|---|----------|-----------------|
| 1 | Should we log org reads? | No (too noisy) |
| 2 | What if Firestore write fails? | Log error, continue (log-safe) |
| 3 | Should we track changed values? | Only field names, not values |

---

## ✅ Exit Criteria

- ✅ Events list complete (3 success, 2 denial)
- ✅ Touchpoints identified (3 endpoints, 2 guards)
- ✅ Field mapping defined
- ✅ PII checklist verified
- ✅ Ready for Phase 10.5

---

## ▶️ Next Step

**Phase 10.5 — Integration Plan: Users**
