# Phase 9.1 — Scope Close (Roles Module)

**Date:** 2026-01-22  
**Phase:** 9  
**Module:** Roles  
**Status:** ACTIVE — SCOPE LOCKED 🔒  
**Reference Baseline:** Phase 7 (Organizations), Phase 8 (Users)

---

## 🎯 Objective

ปิดขอบเขต (Scope Close) ของ **Phase 9 — Roles Module Security Parity**  
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

Roles Module ต้องมี **4-layer security** ครบถ้วน เทียบเท่า Phase 7/8:

1. API Guards  
2. Audit Logging (Permission Denial)  
3. UI Permission Gating  
4. Forbidden UX (403) + i18n (EN / TH / ZH)

---

## ✅ IN SCOPE

### 1. API Permission Hardening
- ตรวจสอบและยืนยัน guard ของ Roles endpoints ให้ตรงกับ Permission Matrix
- ใช้ guards มาตรฐาน: `requireOwner()`, `requireAdmin()`
- ❗ ห้ามเปลี่ยน business logic / response shape

### 2. Permission Denial Audit Logging
- ตรวจสอบว่ามี denial logging หรือไม่
- Document parity vs Phase 7 baseline

### 3. UI Permission Gating
- ซ่อน/แสดง Roles actions ตาม role:
  - View Roles
  - Create Role
  - Edit Role
  - Delete Role
  - Copy Role
- ❗ ห้ามเพิ่ม fetch ใหม่
- ❗ ห้ามเปลี่ยนโครงสร้าง table / layout

### 4. Forbidden UX (403 Handling)
- ทุก Roles mutation ที่ API ตอบ 403 ต้องแสดง error UX ที่เข้าใจง่าย
- รองรับ i18n: EN / TH / ZH

---

## ❌ OUT OF SCOPE

- เพิ่ม feature ใหม่ใน Roles Module
- ปรับ UX / UI redesign
- Advanced role management (inheritance, custom permissions)
- Persist audit logs ลง database (Phase 10)
- Production hardening (Phase 11)

---

## 🎭 Roles Actions ที่ต้องครอบคลุม

- View Roles List
- Create Role
- Edit Role
- Delete Role
- Copy Role (ถ้ามี)

---

## 🧭 Definition of Done

Phase 9 จะถือว่า Complete & LOCKED เมื่อ:

1. Roles Module มี 4-layer security ครบ
2. Permission ตรงกันทุก layer (API / UI / UX)
3. ทุก permission denial มีหลักฐาน (logged or documented)
4. ทุก 403 มี Forbidden UX + i18n
5. Build ผ่าน
6. ไม่มี feature นอก scope ถูกเพิ่มเข้ามา

---

## 🔒 Scope Lock Declaration

**Scope นี้ถือว่า LOCKED**  
การเปลี่ยนแปลง scope ต้องเปิด Phase ใหม่เท่านั้น

---

## ▶️ Next Step

**Phase 9.2 — Roles Permissions Recon**
(วิเคราะห์ Roles module ทั้งหมด โดยไม่แก้โค้ด)
