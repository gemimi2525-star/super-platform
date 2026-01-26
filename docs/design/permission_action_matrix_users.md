# Permission & Action Matrix — Users Module

**Version:** 1.0  
**Date:** 2026-01-22  
**Phase:** 8.3  
**Status:** Design Document (Single Source of Truth)

---

## 🎯 Objective

เอกสารนี้เป็น **Single Source of Truth** สำหรับ Users module:
- นิยาม Actions และ Permissions ที่เกี่ยวข้อง
- กำหนดว่า role ไหน "ทำได้/ทำไม่ได้"
- ใช้อ้างอิงใน Phase 8.4-8.7

---

## 📋 Permission Mapping Rule

### Source: `lib/platform/types.ts` (Lines 55-69)

```typescript
DEFAULT_ROLE_PERMISSIONS = {
    owner: [ALL PERMISSIONS],
    admin: [
        'platform:users:read',
        'platform:users:write',
        'platform:roles:manage',
        // ... other non-users permissions
    ],
    user: [
        'platform:orgs:read',
        // NO users permissions
    ]
}
```

### Final Mapping (Confirmed)

| Permission | Owner | Admin | User |
|------------|-------|-------|------|
| `platform:users:read` | ✅ | ✅ | ❌ |
| `platform:users:write` | ✅ | ✅ | ❌ |
| `platform:users:delete` | ✅ | ❌ | ❌ |
| `platform:roles:manage` | ✅ | ✅ | ❌ |

**สรุป:**
- `read` → Owner, Admin
- `write` → Owner, Admin
- `delete` → **Owner only**
- `roles:manage` → Owner, Admin

---

## 🧩 Users Actions (Canonical List)

| Action ID | Action Name | Description | Required Permission |
|-----------|-------------|-------------|---------------------|
| `users.list` | View Users List | ดูรายการผู้ใช้ทั้งหมด | `platform:users:read` |
| `users.view` | View User Detail | ดูรายละเอียดผู้ใช้ | `platform:users:read` |
| `users.create` | Create User | สร้างผู้ใช้ใหม่ | `platform:users:write` |
| `users.edit` | Edit User | แก้ไขข้อมูลผู้ใช้ | `platform:users:write` |
| `users.disable` | Disable/Delete User | ปิดการใช้งาน (soft delete) | `platform:users:delete` |
| `users.assign_role` | Assign Role | เปลี่ยน role ของผู้ใช้ | `platform:roles:manage` |

### Actions Not Currently Implemented
- `users.invite` — Invite workflow ❌ (ไม่มีใน scope)
- `users.resend_invite` — Resend invite ❌ (ไม่มีใน scope)
- `users.reset_password` — Reset password ❌ (ไม่มีใน scope)

---

## ✅ Permission Matrix (Role-Based)

| Action | Owner | Admin | User | Notes |
|--------|-------|-------|------|-------|
| `users.list` | ✅ | ✅ | ❌ | Visibility filtering applied |
| `users.view` | ✅ | ✅ | ❌ | Owner protection (stealth 404) |
| `users.create` | ✅ | ✅ | ❌ | Role hierarchy enforced |
| `users.edit` | ✅ | ✅ | ❌ | Role hierarchy enforced |
| `users.disable` | ✅ | ❌ | ❌ | **Destructive = Owner only** |
| `users.assign_role` | ✅ | ✅ | ❌ | Can't assign equal/higher role |

### Special Rules

1. **Role Hierarchy Check**
   - Can't create/edit/delete user with equal or higher role
   - Owner (100) > Admin (50) > User (10)

2. **Owner Protection**
   - Non-owner cannot see owner users in list
   - Non-owner gets 404 (not 403) when viewing owner user detail
   - Non-owner gets 403 when trying to edit/delete owner user

3. **Self-Protection**
   - Cannot delete/disable yourself

4. **Owner Role Assignment**
   - Only owner can promote user to owner role

---

## 🔗 Endpoint → Action Mapping

| Endpoint | Method | Action | Guard | Allowed Roles |
|----------|--------|--------|-------|---------------|
| `/api/platform/users` | GET | `users.list` | `hasPermission('read')` | Owner, Admin |
| `/api/platform/users` | POST | `users.create` | `hasPermission('write')` | Owner, Admin |
| `/api/platform/users/[uid]` | GET | `users.view` | `hasPermission('read')` + owner protection | Owner, Admin |
| `/api/platform/users/[uid]` | PATCH | `users.edit` | `hasPermission('write')` + role hierarchy | Owner, Admin |
| `/api/platform/users/[uid]` | DELETE | `users.disable` | `hasPermission('delete')` | **Owner only** |

---

## 📊 UI Permission Gating (Phase 8.6)

### Required Boolean Checks

```typescript
// Based on platformRole from /api/platform/me
const canViewUsers = platformRole === 'owner' || platformRole === 'admin';
const canCreateUser = platformRole === 'owner' || platformRole === 'admin';
const canEditUser = platformRole === 'owner' || platformRole === 'admin';
const canDisableUser = platformRole === 'owner';
```

### UI Elements to Gate

| UI Element | Condition | Behavior |
|------------|-----------|----------|
| Users menu item | User has access to platform | Always show |
| Create button (header) | `canCreateUser` | Hide if false |
| Create button (empty state) | `canCreateUser` | Hide if false |
| Edit link (row) | `canEditUser` | Hide if false |
| Disable button | `canDisableUser` | Hide if false (if exists) |

---

## 🚨 Forbidden UX (Phase 8.7)

### i18n Keys Required

| Modal | Key | EN | TH | ZH |
|-------|-----|----|----|-----|
| Create | `platform.users.create.error.forbidden` | You don't have permission to create users | คุณไม่มีสิทธิ์สร้างผู้ใช้ | 你没有权限创建用户 |
| Edit | `platform.users.edit.error.forbidden` | You don't have permission to edit users | คุณไม่มีสิทธิ์แก้ไขผู้ใช้ | 你没有权限编辑用户 |
| Disable | `platform.users.disable.error.forbidden` | You don't have permission to disable users | คุณไม่มีสิทธิ์ปิดการใช้งานผู้ใช้ | 你没有权限停用用户 |

---

## 📌 Comparison: Users vs Organizations

| Aspect | Organizations (Phase 7) | Users (Phase 8) |
|--------|------------------------|-----------------|
| **List** | Owner/Admin/User | Owner/Admin |
| **Create** | Owner/Admin | Owner/Admin |
| **Edit** | Owner/Admin | Owner/Admin |
| **Disable/Delete** | Owner only | Owner only |
| **Guard Type** | `requireAdmin()`/`requireOwner()` | `hasPermission()` |
| **Owner Protection** | N/A | Stealth 404 + visibility filtering |

---

## ✅ Exit Criteria Met

- ✅ ทุก action มี decision ชัดเจน (ไม่มี TBD)
- ✅ read/write/delete mapping ถูกระบุชัด
- ✅ ตาราง Endpoint → Action ครบ
- ✅ พร้อมเข้าสู่ Phase 8.4

---

## ▶️ Next Step

**Phase 8.4 — API Permission Hardening**
- Verify guards align with this matrix
- No changes expected (API already correct from recon)
