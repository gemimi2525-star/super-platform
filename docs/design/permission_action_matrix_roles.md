# Permission & Action Matrix — Roles Module

**Version:** 1.0  
**Date:** 2026-01-22  
**Phase:** 9.3  
**Status:** LOCKED 🔒

---

## 🔑 Core Policy

> **Roles Module = Owner-only control plane**

- เฉพาะ Platform Owner เท่านั้นที่เข้าถึงได้
- Admin และ User ไม่สามารถ:
  - ❌ เข้าหน้า Roles
  - ❌ เรียก Roles mutation APIs
- Destructive actions → **Owner only (100%)**

---

## 🧩 Roles Actions (Canonical List)

| Action ID | Action Name | Description |
|-----------|-------------|-------------|
| `roles.list` | View Roles List | ดูรายการ roles ทั้งหมด |
| `roles.view` | View Role Detail | ดูรายละเอียด role |
| `roles.create` | Create Role | สร้าง role ใหม่ |
| `roles.edit` | Edit Role | แก้ไข role |
| `roles.delete` | Delete/Disable Role | ลบ role |
| `roles.copy` | Copy Role | คัดลอก role |
| `roles.assign_perms` | Assign Permissions | กำหนด permissions ให้ role |

---

## ✅ Permission Matrix (Final & Locked)

| Action | Owner | Admin | User |
|--------|-------|-------|------|
| `roles.list` | ✅ | ❌ | ❌ |
| `roles.view` | ✅ | ❌ | ❌ |
| `roles.create` | ✅ | ❌ | ❌ |
| `roles.edit` | ✅ | ❌ | ❌ |
| `roles.delete` | ✅ | ❌ | ❌ |
| `roles.copy` | ✅ | ❌ | ❌ |
| `roles.assign_perms` | ✅ | ❌ | ❌ |

> **Policy:** All Roles actions are Owner-only.

---

## 🔗 Endpoint → Action Mapping

| Endpoint | Method | Guard | Action | Allowed |
|----------|--------|-------|--------|---------|
| `/api/platform/roles` | GET | platform access | `roles.list` | Owner* |
| `/api/platform/roles` | PATCH | owner check | `roles.assign_perms` | Owner |
| `/api/roles/[id]` | GET | `requireOwner()` | `roles.view` | Owner |
| `/api/roles/[id]` | PUT | `requireOwner()` | `roles.edit` | Owner |
| `/api/roles/[id]` | DELETE | `requireOwner()` | `roles.delete` | Owner |
| `/api/roles/copy` | POST | `requireOwner()` | `roles.copy` | Owner |

*Note: Page-level guard blocks non-owners from accessing UI to call this API.

---

## 🛡️ Existing Protections

| Protection | Status | Layer |
|------------|--------|-------|
| Page-level `requireOwner()` | ✅ Active | Server |
| API `requireOwner()` guards | ✅ Active | API |
| System role immutability | ✅ Active | Service |
| Role hierarchy enforcement | ✅ Active | Service |

---

## 📊 Comparison: Roles vs Users vs Orgs

| Aspect | Organizations | Users | Roles |
|--------|--------------|-------|-------|
| Page Access | All | All | **Owner only** |
| View | Owner/Admin/User | Owner/Admin | Owner |
| Create | Owner/Admin | Owner/Admin | Owner |
| Edit | Owner/Admin | Owner/Admin | Owner |
| Delete | Owner | Owner | Owner |
| UI Gating | Button-level | Button-level | Page-level |

---

## 📝 Decision Notes

1. **Owner-only by design:** Roles are critical security configuration
2. **Page-level guard sufficient:** No need for button-level gating
3. **No Admin access:** Unlike Users/Orgs, Admins cannot manage Roles
4. **System roles protected:** Cannot delete owner/admin/user base roles

---

## 🔒 Scope Lock

This matrix is **LOCKED**.  
Changes require a new Phase.

---

## ▶️ Next Step

**Phase 9.4 — API Permission Hardening (Roles)**
