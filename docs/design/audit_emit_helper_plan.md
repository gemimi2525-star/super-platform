# Audit Emit Helper Plan

**Version:** 1.0  
**Date:** 2026-01-22  
**Phase:** 10.3  
**Status:** DESIGN DOCUMENT

---

## 🎯 Design Goals

1. **Single Entry Point** - ทุก module ใช้ helper เดียวกันในการ emit audit
2. **Schema Consistency** - บังคับใช้ schema จาก Phase 10.2 โดยอัตโนมัติ
3. **Reduce Duplication** - ลดการเขียน audit code ซ้ำซ้อน
4. **Separation of Concerns** - Module ไม่ต้องรู้รายละเอียด persistence
5. **Type Safety** - ใช้ TypeScript interface บังคับ payload

---

## 🧩 Responsibilities

### ✅ Helper ต้องรับผิดชอบ

| # | Responsibility | Description |
|---|----------------|-------------|
| 1 | **Validate Payload** | ตรวจสอบ event payload ตาม schema |
| 2 | **Enrich Common Fields** | เติม timestamp, actor context อัตโนมัติ |
| 3 | **Semantic Separation** | แยก success/denial events ชัดเจน |
| 4 | **PII Protection** | ป้องกัน sensitive data leakage |
| 5 | **Persistence Abstraction** | ซ่อนรายละเอียด Firestore จาก module |
| 6 | **Error Handling** | จัดการ error แบบ log-safe |

### ❌ Helper ไม่ควรรับผิดชอบ

| # | Non-Responsibility | Reason |
|---|-------------------|--------|
| 1 | Permission Decision | Not security layer |
| 2 | Retry / Queue | Keep simple |
| 3 | Analytics / Aggregation | Out of scope |
| 4 | Business Logic | Separation of concerns |
| 5 | UI Rendering | Not presentation layer |

---

## 🔄 Usage Flow

```
┌─────────────────┐
│   Module Code   │
│ (Orgs/Users/    │
│  Roles/Auth)    │
└────────┬────────┘
         │
         │ 1. Call emit helper
         │    with event data
         ▼
┌─────────────────┐
│  Audit Emit     │
│    Helper       │
│                 │
│ • Validate      │
│ • Enrich        │
│ • Sanitize      │
└────────┬────────┘
         │
         │ 2. Write to
         │    Firestore
         ▼
┌─────────────────┐
│   Firestore     │
│ platform_audit  │
│    _logs        │
└─────────────────┘
```

### Flow Description

1. **Module → Helper**
   - Module ส่ง event type, action, target info
   - Helper เติม actor context จาก request/session
   - Helper เติม server timestamp

2. **Helper → Persistence**
   - Validate ตาม AuditEvent interface
   - Sanitize PII ถ้าจำเป็น
   - Write to Firestore collection

3. **Error Path**
   - ถ้า write ล้มเหลว → log error, ไม่ throw
   - Audit failure ไม่ควรทำให้ business operation ล้ม

---

## ⚠️ Error Handling Philosophy

### Log-Safe Pattern

```
┌─────────────────────────────────────────┐
│           PRINCIPLE                     │
│                                         │
│   Audit failure should NEVER break      │
│   the main business operation           │
│                                         │
│   • Log error to console                │
│   • Return silently (no throw)          │
│   • Module continues normally           │
└─────────────────────────────────────────┘
```

### Rationale

- Audit เป็น observability ไม่ใช่ business logic
- User experience สำคัญกว่า audit completeness
- ถ้า Firestore มีปัญหา → module ต้องทำงานต่อได้

---

## 📦 Helper Variants (Conceptual)

| Variant | Purpose |
|---------|---------|
| **emitSuccessEvent** | สำหรับ successful operations |
| **emitDenialEvent** | สำหรับ permission denied |
| **emitAuthEvent** | สำหรับ login/logout (optional) |

### Common Enrichment

ทุก variant ต้องเติม:
- `timestamp` จาก server
- `actor.uid`, `actor.email`, `actor.role` จาก context
- `success` boolean

---

## 🔗 Compatibility Notes (Phase 7–9)

### Current State

| Module | Current Audit | Location |
|--------|---------------|----------|
| Organizations | Inline DB write | API routes |
| Users | Inline DB write | API routes |
| Roles | Inline DB write | API routes |
| Permission Denial | Console only | Guards |

### Migration Path

1. **Step 1:** Create helper (Phase 10.4+)
2. **Step 2:** Integrate in Orgs (Phase 10.4)
3. **Step 3:** Integrate in Users (Phase 10.5)
4. **Step 4:** Integrate in Roles (Phase 10.6)
5. **Step 5:** Update guards for denial → DB

### Backward Compatibility

- Old audit records remain valid
- Read API handles both formats
- No data migration required

---

## 📊 Location Decision

| Option | Location | Pros | Cons |
|--------|----------|------|------|
| A | `lib/audit/emit.ts` | Dedicated, clean | New directory |
| B | `lib/platform/audit.ts` | Near platform code | Mixing concerns |
| C | `lib/services/audit.ts` | Service pattern | Generic |

**Recommendation:** Option A - `lib/audit/emit.ts`

Reason: Audit เป็น cross-cutting concern ควรแยกออกมาชัดเจน

---

## ✅ Design Lock

This helper design is **LOCKED** for Phase 10.

---

## ▶️ Next Step

**Phase 10.4 — Integration Plan: Organizations**
