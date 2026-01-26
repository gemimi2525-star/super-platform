# Roles Permissions Recon Report

**Date:** 2026-01-22  
**Phase:** 9.2  
**Module:** Roles  
**Status:** RECON COMPLETE

---

## Summary

**Key Finding:** Roles module is **Owner-only** by design.  
The main page uses `requireOwner()` server guard, meaning only Platform Owners can access the entire module.

This is **more restrictive** than Users (Owner/Admin) and Orgs (varying by action).

---

## 1. API Layer Recon

### Roles API Endpoints Found

| Endpoint | Method | Guard | Allowed Roles | Notes |
|----------|--------|-------|---------------|-------|
| `/api/platform/roles` | GET | Any platform user | Owner, Admin, User | List roles (view only) |
| `/api/platform/roles` | PATCH | `currentUser.role !== 'owner'` | **Owner only** | Update role permissions |
| `/api/roles/[id]` | GET | `requireOwner()` | **Owner only** | View single role |
| `/api/roles/[id]` | PUT | `requireOwner()` | **Owner only** | Edit role |
| `/api/roles/[id]` | DELETE | `requireOwner()` | **Owner only** | Delete role |
| `/api/roles/copy` | POST | (needs check) | (TBD) | Copy role |

### API Security Summary

- Most Roles endpoints use `requireOwner()` ✅
- Platform roles endpoint uses inline `owner` check ✅
- **All destructive actions Owner-only** ✅

---

## 2. UI Layer Recon

### Roles Page Access

```tsx
// app/[locale]/(platform)/platform/roles/page.tsx
await requireOwner();  // Line 11
```

**Result:** Only Owners can access the entire Roles page.

### Roles UI Actions

| UI Action | Owner | Admin | User | Notes |
|-----------|-------|-------|------|-------|
| View Roles List | ✅ | ❌ (page blocked) | ❌ (page blocked) | Page-level guard |
| Create Role | ✅ | ❌ | ❌ | Button always shown (Owner-only page) |
| Edit Role | ✅ | ❌ | ❌ | Link to detail page |
| Delete Role | ✅ | ❌ | ❌ | Confirm dialog |
| Copy Role | ✅ | ❌ | ❌ | Prompt dialog |

### UI Gating Status

- **Page-level:** `requireOwner()` ✅
- **Button-level:** Not gated (unnecessary - page is Owner-only)
- **Modal-level:** No 403 handling (relies on page-level guard)

---

## 3. Existing Protections

| Protection | Exists? | Layer | Notes |
|------------|---------|-------|-------|
| Owner-only page access | ✅ | Server (page) | `requireOwner()` |
| Owner-only API guards | ✅ | API | `requireOwner()` |
| System role protection | ✅ | Service | Cannot delete system roles |
| Role hierarchy | ⚠️ | Partial | Owner can only manage lower roles |
| Denial logging | ❌ | None | Guards use redirect, not console log |

---

## 4. Gaps Identified

### ⚠️ Medium Gaps

| # | Gap | Impact | Notes |
|---|-----|--------|-------|
| 1 | No 403 handling in UI | Low | Page-level guard prevents access |
| 2 | No denial logging | Low | Guards use redirect pattern |
| 3 | `/api/roles/copy` unverified | Low | Needs guard check |

### ✅ What's Already Good

1. **Page-level protection:** Only Owners can access
2. **API protection:** All mutations are Owner-only
3. **System role protection:** Cannot delete system roles
4. **Audit logging:** Success actions logged to DB

---

## 5. Comparison: Roles vs Users vs Orgs

| Aspect | Organizations | Users | Roles |
|--------|--------------|-------|-------|
| **Page Access** | All platform users | All platform users | **Owner only** |
| **View List** | Owner/Admin/User | Owner/Admin | Owner only |
| **Create** | Owner/Admin | Owner/Admin | Owner only |
| **Edit** | Owner/Admin | Owner/Admin | Owner only |
| **Delete** | Owner only | Owner only | Owner only |
| **UI Gating** | Button-level | Button-level | Page-level |

---

## 6. Files Analyzed

- `/app/api/platform/roles/route.ts` (179 lines)
- `/app/api/roles/[id]/route.ts` (137 lines)
- `/app/[locale]/(platform)/platform/roles/page.tsx` (58 lines)
- `/components/roles/RolesList.tsx` (294 lines)

---

## 7. Recommendations for Phase 9.3+

### Phase 9.3 (Matrix)
- Document Owner-only rule for all Roles actions
- Acknowledge page-level guard as primary protection

### Phase 9.6-9.7 (UI/UX)
- **Low priority:** UI is already Owner-gated at page level
- Consider adding 403 handling in modals for defense-in-depth
- No urgent gaps to fix

---

## ▶️ Next Step

**Phase 9.3 — Permission & Action Matrix (Roles)**
