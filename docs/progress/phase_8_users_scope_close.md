# Phase 8.1 — Scope Close (Users Module)

**Date:** 2026-01-22  
**Phase:** 8  
**Module:** Users  
**Status:** ACTIVE — SCOPE LOCKED 🔒  
**Reference Baseline:** Phase 7 (Organizations)

---

## 🎯 Objective

ปิดขอบเขต (Scope Close) ของ **Phase 8 — Users Module Security Parity**  
เพื่อให้การพัฒนาเป็นไปตามหลัก:
- Phase-based execution
- No feature creep
- Security-first
- API as Authority

Phase นี้มีเป้าหมาย **เฉพาะการทำ Security Parity**  
❌ ไม่เพิ่ม feature ใหม่  
❌ ไม่ปรับ UX/Design นอกเหนือจาก permission / 403 handling

---

## 🛡️ Target Security Model

Users Module ต้องมี **4-layer security** ครบถ้วน เทียบเท่า Organizations (Phase 7):

1. API Guards  
2. Audit Logging (Permission Denial)  
3. UI Permission Gating  
4. Forbidden UX (403) + i18n (EN / TH / ZH)

---

## ✅ IN SCOPE

### 1. API Permission Hardening
- ตรวจสอบและยืนยัน guard ของ Users endpoints ให้ตรงกับ Permission Matrix
- ใช้ guards มาตรฐาน: `requireOwner()`, `requireAdmin()`, `requirePlatformAccess()`
- ❗ ห้ามเปลี่ยน business logic / response shape

### 2. Permission Denial Audit Logging
- เพิ่ม audit log เมื่อ permission ถูกปฏิเสธ
- ใช้ schema เดียวกับ Phase 7

### 3. UI Permission Gating
- ซ่อน/แสดง Users actions ตาม role (Owner/Admin/User)
- ❗ ห้ามเพิ่ม fetch ใหม่
- ❗ ห้ามเปลี่ยนโครงสร้าง table / layout

### 4. Forbidden UX (403 Handling)
- ทุก Users mutation ที่ API ตอบ 403 ต้องแสดง error UX ที่เข้าใจง่าย
- รองรับ i18n: EN / TH / ZH

---

## ❌ OUT OF SCOPE

- เพิ่ม feature ใหม่ใน Users Module
- ปรับ UX / UI redesign
- ระบบ Invite workflow ใหม่
- Advanced filters / search / bulk actions
- Persist audit logs ลง database (Phase 10)
- Production hardening (Phase 11)

---

## 👥 Users Actions ที่ต้องครอบคลุม

- View users list
- Create user (ถ้ามี)
- Edit user
- Disable user (soft delete)
- Assign role
- Invite / resend invite (ถ้ามี)
- Reset password / security actions (ถ้ามี)

---

## 🧭 Definition of Done

Phase 8 จะถือว่า Complete & LOCKED เมื่อ:

1. Users Module มี 4-layer security ครบ
2. Permission ตรงกันทุก layer (API / UI / UX)
3. ทุก permission denial ถูก audit log
4. ทุก 403 มี Forbidden UX + i18n
5. Build ผ่าน
6. ไม่มี feature นอก scope ถูกเพิ่มเข้ามา

---

## 🔒 Scope Lock Declaration

**Scope นี้ถือว่า LOCKED**  
การเปลี่ยนแปลง scope ต้องเปิด Phase ใหม่เท่านั้น
