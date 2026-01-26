# Permission & Action Matrix — Platform

**Version:** 1.0  
**Date:** 2026-01-22  
**Status:** Design (Reference Document)

---

## Scope

เอกสารนี้เป็นแหล่งอ้างอิงหลัก (Single Source of Truth)
สำหรับการตัดสินว่า Role ใด สามารถทำ Action ใดได้บ้าง
ทั้งใน API และ UI

**ใช้สำหรับ:**
- กำหนด API guards
- ออกแบบ UI permission checks
- ตรวจสอบ permission gaps
- อ้างอิงเมื่อมีข้อสงสัยเรื่องสิทธิ์

---

## Roles

### Platform Roles (Global)
Stored in: `platform_users.role`

- **owner** - Platform owner with full system access
- **admin** - Platform administrator
- **user** - Basic authenticated user

### Organization Roles (Reference)
Stored in: `platform_users.orgRole` + `orgId`

- **owner** - Organization owner
- **admin** - Organization administrator
- **member** - Regular organization member
- **viewer** - Read-only organization member

**Note:** Organization-level permissions are deferred to future phase.

---

## Action Categories

### Organizations (Platform-Level Management)
- `platform.orgs.list` - View all organizations
- `platform.orgs.view` - View organization details
- `platform.orgs.create` - Create new organization
- `platform.orgs.edit` - Edit organization
- `platform.orgs.disable` - Soft-delete organization

### Roles (Platform Role Management)
- `platform.roles.list` - View all roles
- `platform.roles.view` - View role details
- `platform.roles.create` - Create custom role
- `platform.roles.edit` - Edit role permissions
- `platform.roles.delete` - Delete custom role
- `platform.roles.assign` - Assign role to user

### Users (Platform User Management)
- `platform.users.list` - View all users
- `platform.users.view` - View user details
- `platform.users.invite` - Invite new user
- `platform.users.edit` - Edit user details
- `platform.users.remove` - Remove user from platform

### Audit / System
- `platform.audit.view` - View audit logs
- `platform.settings.manage` - Manage platform settings

---

## Permission Matrix

### Organizations Module

| Action | Owner | Admin | User | Notes |
|--------|-------|-------|------|-------|
| `platform.orgs.list` | ✅ | ✅ | ❌ | Owner/Admin only |
| `platform.orgs.view` | ✅ | ✅ | ❌ | Owner/Admin only |
| `platform.orgs.create` | ✅ | ✅ | ❌ | Owner/Admin can create |
| `platform.orgs.edit` | ✅ | ✅ | ❌ | Owner/Admin can edit |
| `platform.orgs.disable` | ✅ | ❌ | ❌ | Owner only (destructive) |

**API Guards:**
- List/View: `requirePlatformAccess()`
- Create: `requireAdmin()`
- Edit: `requireAdmin()`
- Disable: `requireOwner()`

---

### Roles Module

| Action | Owner | Admin | User | Notes |
|--------|-------|-------|------|-------|
| `platform.roles.list` | ✅ | ✅ | ❌ | Owner/Admin can view |
| `platform.roles.view` | ✅ | ✅ | ❌ | Owner/Admin can view details |
| `platform.roles.create` | ✅ | ❌ | ❌ | Owner only |
| `platform.roles.edit` | ✅ | ❌ | ❌ | Owner only |
| `platform.roles.delete` | ✅ | ❌ | ❌ | Owner only (system roles protected) |
| `platform.roles.assign` | ✅ | ❌ | ❌ | Owner only |

**API Guards:**
- All actions: `requireOwner()`

**Special Rules:**
- System roles (owner, admin, viewer) cannot be deleted
- Roles in use cannot be deleted

---

### Users Module

| Action | Owner | Admin | User | Notes |
|--------|-------|-------|------|-------|
| `platform.users.list` | ✅ | ✅ | ❌ | Owner/Admin can view all users |
| `platform.users.view` | ✅ | ✅ | ❌ | Owner/Admin can view details |
| `platform.users.invite` | ✅ | ✅ | ❌ | Owner/Admin can invite |
| `platform.users.edit` | ✅ | ✅ | ❌ | Owner/Admin can edit |
| `platform.users.remove` | ✅ | ❌ | ❌ | Owner only (destructive) |

**API Guards:**
- List/View: `requirePlatformAccess()`
- Invite/Edit: `requireAdmin()`
- Remove: `requireOwner()`

**Special Rules:**
- Users cannot edit their own role
- Cannot remove last owner

---

### Audit / System

| Action | Owner | Admin | User | Notes |
|--------|-------|-------|------|-------|
| `platform.audit.view` | ✅ | ✅ | ❌ | Owner/Admin can view logs |
| `platform.settings.manage` | ✅ | ❌ | ❌ | Owner only |

**API Guards:**
- Audit logs: `requirePlatformAccess()` or `requireAdmin()`
- Settings: `requireOwner()`

---

## Enforcement Rules

### 1. API Layer (Primary Authority)
- **API ต้อง enforce ตาม Matrix นี้เสมอ**
- Use appropriate guards: `requireOwner()`, `requireAdmin()`, `requirePlatformAccess()`
- Return `403 Forbidden` with clear error message when denied
- Log all permission denial attempts

### 2. UI Layer (Secondary)
- **UI ต้องสะท้อย Matrix นี้**
- Hide or disable buttons for actions user cannot perform
- Show tooltip explaining why action is unavailable
- Never rely on UI alone (API is final authority)

### 3. Error Handling
- 403 errors must include user-friendly message
- Example: "You don't have permission to perform this action"
- Include required role in error response (for debugging)

### 4. Audit Trail
- Log all successful admin actions
- Log all permission denial attempts
- Store in audit logs for accountability

---

## Implementation Status

### ✅ Fully Implemented (Phase 7 - Organizations)
- Organizations API guards
- Organizations UI permission checks
- 403 error handling with i18n
- Permission denial logging (console)

### ⚠️ Partially Implemented
- Roles: API protected, UI not permission-gated
- Users: API protected, UI not permission-gated
- Audit: No database logging yet (console only)

### ❌ Not Implemented
- Database audit logging for mutations
- Permission denial dashboard
- Role visualization in UI

---

## Notes / Deferred

### Organization-Level Permissions
**Status:** Deferred to future phase

Example future actions:
- `org.members.invite` - Org owner/admin can invite to their org
- `org.settings.edit` - Org owner/admin can edit org settings
- `org.billing.view` - Org owner can view billing

**Decision:** Focus on platform-level permissions first.

---

### Advanced RBAC / ABAC
**Status:** Out of scope

Features not planned:
- Custom permission sets beyond roles
- Attribute-based access control
- Dynamic permission evaluation
- Permission inheritance trees

**Decision:** Role-based model is sufficient for current needs.

---

### Self-Service Actions
**Question:** Can users edit their own profile?

**Decision:** Not addressed in this matrix. Assume users can edit own profile but not own role.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-22 | Initial matrix based on Phase 7 implementation |

---

## References

- [Phase 7 Organizations Complete](../progress/phase_organizations_complete.md)
- [Roles & Permissions Recon](../progress/roles_permissions_recon.md)
- Implementation: `lib/auth/server.ts` (guards)
- Permissions: `lib/permissions.ts` (definitions)
