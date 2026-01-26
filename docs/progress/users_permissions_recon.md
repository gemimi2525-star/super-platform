# Users Roles & Permissions Recon Report

**Date:** 2026-01-22  
**Phase:** 8.2  
**Module:** Users  
**Status:** RECON COMPLETE

---

## 1. API Layer Recon

### API Endpoints Found

| Endpoint | Method | Current Guard | Allowed Roles | Notes |
|----------|--------|---------------|---------------|-------|
| `/api/platform/users` | GET | `hasPermission('platform:users:read')` | Owner, Admin (via default perms) | Permission-based, not role guard |
| `/api/platform/users` | POST | `hasPermission('platform:users:write')` | Owner, Admin | + Role hierarchy check |
| `/api/platform/users/[uid]` | GET | `hasPermission('platform:users:read')` + `assertCanAccessTargetUser()` | Owner, Admin | Stealth 404 for owner protection |
| `/api/platform/users/[uid]` | PATCH | `hasPermission('platform:users:write')` + `assertCanAccessTargetUser()` | Owner, Admin | + Role hierarchy check |
| `/api/platform/users/[uid]` | DELETE | `hasPermission('platform:users:delete')` + `assertCanAccessTargetUser()` | Owner only (via default perms) | Soft delete (disabled:true) |

### Permission System Used

Users API uses **permission-based** authorization instead of **role guards**:
- Checks `hasPermission(currentUser, 'platform:users:read|write|delete')`
- Permissions are derived from role via `DEFAULT_ROLE_PERMISSIONS` mapping

### Default Role Permissions (from types.ts)

```typescript
DEFAULT_ROLE_PERMISSIONS = {
    owner: ['platform:users:read', 'platform:users:write', 'platform:users:delete', ...],
    admin: ['platform:users:read', 'platform:users:write'],
    user: [] // No platform permissions
}
```

### Additional Security Checks

1. **Role Hierarchy Check** - Can't create/modify user with equal or higher role
2. **Owner Protection** - `assertCanAccessTargetUser()` blocks non-owner from accessing owner users
3. **Stealth 404** - GET returns 404 (not 403) to hide owner existence
4. **Self-delete Prevention** - Can't delete yourself
5. **Owner Role Assignment** - Only owner can promote to owner

---

## 2. UI Layer Recon

### Users List Page (`/platform/users/page.tsx`)

| UI Action | Owner | Admin | User | Current State | Notes |
|-----------|-------|-------|------|---------------|-------|
| View List | ✅ | ✅ | ❓ | Always shown | API blocks via permission |
| Create Button (Header) | ✅ | ✅ | ❓ | **Always visible** | ❌ No permission check |
| Create Button (Empty) | ✅ | ✅ | ❓ | **Always visible** | ❌ No permission check |
| Edit Button (Row) | ✅ | ✅ | ❓ | **Always visible** | ❌ No permission check |
| Disable Button | — | — | — | **Not in UI** | Uses Edit page |

### Findings

1. **NO UI Permission Gating Exists**
   - No `platformRole` state fetched
   - No `canCreateUser`, `canEditUser` checks
   - All buttons visible to everyone

2. **No 403 Handling in Create Modal**
   - Lines 487-489: Generic error only
   ```tsx
   if (!res.ok) {
       throw new Error(data.error || 'Failed to create user');
   }
   ```
   - No specific 403 handling
   - No i18n for forbidden errors

3. **Edit is Link, Not Button**
   - Line 405-410: Edit is a navigation link
   - Goes to detail page `/platform/users/[uid]`
   - Detail page not analyzed (out of immediate scope)

---

## 3. Permission Gaps Identified

### 🔴 Critical Gaps

| # | Gap | Impact | Fix Required |
|---|-----|--------|--------------|
| 1 | **Create button visible to all** | User clicks → API 403 → Poor UX | Add `canCreateUser` check |
| 2 | **Edit link visible to all** | User clicks → navigates → API 403 on actions | Add `canEditUser` check |
| 3 | **No 403 handling in Create Modal** | Generic "Failed to create user" message | Add specific 403 i18n |

### ⚠️ Medium Gaps

| # | Gap | Impact | Notes |
|---|-----|--------|-------|
| 4 | Uses `hasPermission()` not `requireAdmin()` | Inconsistent with Orgs pattern | Consider aligning patterns |
| 5 | Detail page not gated | Edit form accessible even if can't edit | Need to check detail page |

### 💡 Minor Observations

| # | Observation | Notes |
|---|-------------|-------|
| 6 | Audit logging exists on mutations | Already logs to `platform_audit_logs` |
| 7 | Role hierarchy already enforced | API blocks cross-role actions |
| 8 | Owner protection (stealth 404) works | Good security pattern |

---

## 4. Comparison: Users vs Organizations

| Aspect | Organizations (Phase 7) | Users (Current) |
|--------|------------------------|-----------------|
| **API Authorization** | `requireOwner()` / `requireAdmin()` | `hasPermission()` |
| **UI Permission Gating** | ✅ `canCreateOrg`, `canEditOrg`, `canDisableOrg` | ❌ None |
| **403 Handling** | ✅ Specific i18n messages | ❌ Generic error |
| **Audit Logging** | Console only | Database (`platform_audit_logs`) ✅ |

---

## 5. Recommendations for Phase 8.3+

### Priority Actions

1. **Add UI Permission Gating (Phase 8.6)**
   - Fetch `platformRole` from `/api/platform/me`
   - Create `canCreateUser`, `canEditUser` booleans
   - Hide Create button for non-admin
   - Hide Edit link for non-admin

2. **Add 403 Handling (Phase 8.7)**
   - Add 403 check in Create Modal
   - Add i18n keys for forbidden errors
   - Pattern: `platform.users.create.error.forbidden`

3. **Decision Point: Align Authorization Pattern?**
   - Option A: Keep `hasPermission()` (more granular)
   - Option B: Switch to `requireAdmin()` (simpler, matches Orgs)
   - Recommendation: **Keep hasPermission()** - it's more fine-grained

---

## 6. Files Analyzed

- `/app/api/platform/users/route.ts` (237 lines)
- `/app/api/platform/users/[uid]/route.ts` (305 lines)
- `/app/[locale]/(platform)/platform/users/page.tsx` (613 lines)
- `/lib/platform/types.ts` (for DEFAULT_ROLE_PERMISSIONS)

---

## ▶️ Next Step

**Phase 8.3 — Permission & Action Matrix (Users)**

Use this recon data to create Single Source of Truth for Users permissions.
