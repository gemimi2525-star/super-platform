# Phase 10.1 — Scope Close (Audit Infrastructure)

**Date:** 2026-01-22  
**Phase:** 10  
**Module:** Audit Infrastructure  
**Status:** ACTIVE — SCOPE LOCKED 🔒  
**Baseline:** Phase 7–9 (Organizations, Users, Roles)

---

## 🎯 Objective

ปิดขอบเขต (Scope Close) ของ **Phase 10 — Audit Infrastructure**  
เพื่อยกระดับ audit logs ให้:
- Persist ลง database อย่างเป็นระบบ
- ตรวจสอบย้อนหลังได้ (queryable)
- สอดคล้อง security/compliance
- ไม่กระทบ business logic

---

## ✅ IN SCOPE

### 1. Audit Event Model
- นิยาม unified event schema
- ครอบคลุม success และ denial events
- เก็บข้อมูลจำเป็น (PII minimal)

### 2. Database Persistence
- เขียนลง Firestore (`platform_audit_logs`)
- Server timestamps
- Append-only (immutable)

### 3. Centralized Helper
- `emitAuditEvent()` function
- ลด code duplication
- Consistent schema enforcement

### 4. Read APIs
- Filter by event type / actor / timestamp
- Pagination support
- Least-privilege access (Owner only)

### 5. Basic Policy
- Retention policy (ขั้นต่ำ)
- Redaction rules (PII)

---

## ❌ OUT OF SCOPE

- เปลี่ยน permission policy
- UI audit dashboard เต็มรูปแบบ
- Analytics / metrics / alerts
- Production hardening อื่น ๆ (Phase 11)
- External logging services integration

---

## 🧩 Audit Events (Coverage Target)

### Permission Events
- `permission.denied` - เมื่อถูกปฏิเสธสิทธิ์
- `permission.granted` - เมื่อได้รับอนุญาต (optional)

### Entity Events
- `org.created`, `org.updated`, `org.deleted`
- `user.created`, `user.updated`, `user.deleted`, `user.disabled`
- `role.created`, `role.updated`, `role.deleted`

### Auth Events (Optional)
- `auth.login.success`
- `auth.login.failed`

---

## 🛡️ Compliance Principles

1. **PII Minimal** - เก็บเฉพาะที่จำเป็น
2. **Server Timestamps** - ใช้เวลาจาก server เท่านั้น
3. **Immutability** - Append-only, ห้ามแก้ไข
4. **Least-privilege** - Read APIs เฉพาะ Owner

---

## 🔢 Phase 10 Structure

| Step | ชื่อ | วัตถุประสงค์ |
|------|-----|-------------|
| 10.1 | Scope Close | ล็อกขอบเขต |
| 10.2 | Audit Event Model & Schema | ออกแบบ schema |
| 10.3 | Centralized Emit Helper | สร้าง utility function |
| 10.4 | Integrate: Organizations | เพิ่ม emits ใน Orgs |
| 10.5 | Integrate: Users | เพิ่ม emits ใน Users |
| 10.6 | Integrate: Roles | เพิ่ม emits ใน Roles |
| 10.7 | Read API | สร้าง query endpoints |
| 10.8 | Verification | ทดสอบ + จบ phase |

---

## 🧭 Definition of Done

Phase 10 จะถือว่า Complete & LOCKED เมื่อ:

1. Audit events ทุกประเภท persist ลง DB
2. ใช้ centralized helper ทั้งหมด
3. Read API ทำงานได้
4. Build ผ่าน
5. ไม่มี feature นอก scope

---

## 🔒 Scope Lock Declaration

**Scope นี้ถือว่า LOCKED**  
การเปลี่ยนแปลง scope ต้องเปิด Phase ใหม่เท่านั้น

---

## ▶️ Next Step

**Phase 10.2 — Audit Event Model & Schema**
