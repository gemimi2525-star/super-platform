# Governance Trigger Matrix — v1.1

> *"รู้ว่าเมื่อไหร่ต้องถามก่อนทำ"*

**Status:** CANONICAL — GOVERNANCE
**Authority:** SYNAPSE Canonical Pack v1.0 + Appendix Pack v1.0 (Section B)
**Effective:** 2026-01-30
**Version:** 1.1 (Updated from Appendix B)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## บทนำ

Governance Trigger Matrix กำหนดว่า **การเปลี่ยนแปลงใดต้องผ่านการ Review**
ก่อนที่จะ implement หรือ deploy

Matrix นี้ป้องกัน "Architectural Drift" โดยบังคับให้:
- การเปลี่ยนแปลงสำคัญต้องถูก review
- การเปลี่ยนแปลงอันตรายต้องถูก block
- การเปลี่ยนแปลงเล็กน้อยสามารถดำเนินการได้

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Trigger Levels

| Level | Name | Action Required |
|-------|------|-----------------|
| 🔴 **BLOCK** | Constitutional Violation | ห้ามดำเนินการ — ต้อง Constitutional Amendment |
| 🟠 **REVIEW** | Architecture Decision Required | ต้อง System Architect Review ก่อน |
| 🟡 **NOTIFY** | Awareness Required | แจ้ง System Architect แต่ดำเนินการได้ |
| 🟢 **PROCEED** | Safe to Execute | ดำเนินการได้โดยไม่ต้องขออนุญาต |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Matrix: Code Changes

### Kernel Layer

| Change | Level | Notes |
|--------|-------|-------|
| แก้ไข kernel.ts | 🔴 BLOCK | Constitutional change |
| แก้ไข policy-engine.ts | 🔴 BLOCK | Authority model change |
| แก้ไข state.ts | 🔴 BLOCK | State model change |
| แก้ไข types.ts (core types) | 🔴 BLOCK | Contract change |
| แก้ไข window-manager.ts | 🟠 REVIEW | Window behavior change |
| แก้ไข event-bus.ts | 🟠 REVIEW | Event model change |
| แก้ไข calm-detector.ts | 🟠 REVIEW | Calm detection change |

### Capability Layer

| Change | Level | Notes |
|--------|-------|-------|
| เพิ่ม Capability ใหม่ | 🟠 REVIEW | Requires certification |
| แก้ไข Capability manifest | 🟠 REVIEW | Contract change |
| ลบ Capability | 🟠 REVIEW | Removal impact assessment |
| แก้ไข Capability UI | 🟡 NOTIFY | Visual change only |

### Intelligence Layer

| Change | Level | Notes |
|--------|-------|-------|
| เปลี่ยน AI Provider | 🟠 REVIEW | Integration change |
| เพิ่ม AI capability | 🔴 BLOCK | Must remain read-only |
| AI emit intent | 🔴 BLOCK | Constitutional violation |
| AI mutate state | 🔴 BLOCK | Constitutional violation |
| แก้ไข AI explanation | 🟢 PROCEED | Content only |

### UI Layer

| Change | Level | Notes |
|--------|-------|-------|
| เปลี่ยน Theme | 🟢 PROCEED | Visual only |
| เพิ่ม Animation | 🟡 NOTIFY | Could affect Calm |
| เพิ่ม Sound | 🔴 BLOCK | Violates Calm |
| เปลี่ยน Dock behavior | 🟠 REVIEW | Core UX change |
| เปลี่ยน Menu Bar | 🟠 REVIEW | Core UX change |
| เพิ่ม Sidebar | 🔴 BLOCK | Not SYNAPSE pattern |
| เพิ่ม Dashboard | 🔴 BLOCK | Violates Calm-by-Default |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Matrix: Architecture Changes

### Model Changes

| Change | Level | Notes |
|--------|-------|-------|
| เปลี่ยน Authority Model | 🔴 BLOCK | Constitutional |
| เปลี่ยน Intent Model | 🔴 BLOCK | Constitutional |
| เปลี่ยน Policy Model | 🔴 BLOCK | Constitutional |
| เปลี่ยน Window Model | 🔴 BLOCK | Constitutional |
| เพิ่ม Model ใหม่ | 🟠 REVIEW | Architecture extension |

### Pattern Changes

| Change | Level | Notes |
|--------|-------|-------|
| เพิ่ม Router | 🔴 BLOCK | Constitutional violation |
| เพิ่ม Navigation | 🔴 BLOCK | Constitutional violation |
| เพิ่ม URL State | 🔴 BLOCK | Constitutional violation |
| เพิ่ม Background Process | 🔴 BLOCK | Constitutional violation |
| เพิ่ม Auto-Trigger | 🔴 BLOCK | Constitutional violation |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Matrix: Documentation Changes

### Canonical Documents

| Change | Level | Notes |
|--------|-------|-------|
| แก้ไข Canonical Pack | 🔴 BLOCK | Constitutional |
| แก้ไข Whitepaper | 🟠 REVIEW | Principle change |
| แก้ไข Appendix Pack | 🟠 REVIEW | Enforcement change |
| แก้ไข Extension Law | 🟠 REVIEW | Governance change |
| แก้ไข Contracts | 🟠 REVIEW | Contract change |

### Registry & Governance

| Change | Level | Notes |
|--------|-------|-------|
| อัปเดต Capability Registry | 🟡 NOTIFY | After certification |
| อัปเดต Checklist Pack | 🟠 REVIEW | Governance criteria change |
| สร้าง Proposal | 🟢 PROCEED | Just creating |
| Execute Proposal | 🟠 REVIEW | Requires approval |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Matrix: Extension Changes

### Extension Registration

| Change | Level | Notes |
|--------|-------|-------|
| Register Extension | 🟠 REVIEW | Certification required |
| Update Extension | 🟠 REVIEW | Re-certification may be needed |
| Remove Extension | 🟡 NOTIFY | Removal impact |
| Suspend Extension | 🟢 PROCEED | Safety action |

### Extension Behavior

| Change | Level | Notes |
|--------|-------|-------|
| Extension access Kernel | 🔴 BLOCK | Boundary violation |
| Extension emit Intent | 🔴 BLOCK | Authority violation |
| Extension mutate State | 🔴 BLOCK | Authority violation |
| Extension bypass Policy | 🔴 BLOCK | Authority violation |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Matrix: Legacy/External

### Legacy Routes

| Change | Level | Notes |
|--------|-------|-------|
| แก้ไข /v2/* routes | 🟡 NOTIFY | Outside SYNAPSE core |
| เพิ่ม /v2/* route ใหม่ | 🟡 NOTIFY | Not recommended |
| ลบ /v2/* route | 🟢 PROCEED | Cleanup |
| เปลี่ยน /v2/* เป็น SYNAPSE style | 🟠 REVIEW | Migration |

### External Integration

| Change | Level | Notes |
|--------|-------|-------|
| เพิ่ม External API | 🟠 REVIEW | Security assessment |
| เปลี่ยน Auth Provider | 🟠 REVIEW | Security impact |
| เพิ่ม Third-party SDK | 🟠 REVIEW | Dependency assessment |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Quick Reference: Decision Tree

```
1. Does this change touch Kernel?
   → Yes → 🔴 BLOCK (unless Constitutional Amendment)
   → No → Continue

2. Does this violate any Whitepaper Chapter 4 refusal?
   → Yes → 🔴 BLOCK
   → No → Continue

3. Does this change Authority/Policy/Intent model?
   → Yes → 🔴 BLOCK
   → No → Continue

4. Does this change Capability/Window behavior?
   → Yes → 🟠 REVIEW
   → No → Continue

5. Does this add Extension/Capability?
   → Yes → 🟠 REVIEW (Certification)
   → No → Continue

6. Does this change documentation/governance?
   → Canonical → 🔴 BLOCK
   → Other canonical → 🟠 REVIEW
   → Non-canonical → 🟡 NOTIFY

7. Is this purely visual/content change?
   → Yes → 🟢 PROCEED
   → No → 🟡 NOTIFY
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Escalation Path

### 🔴 BLOCK
1. ห้ามดำเนินการ
2. ต้องมี Constitutional Amendment Proposal
3. ต้อง System Architect + Core Team approve
4. ต้อง impact assessment เต็มรูปแบบ

### 🟠 REVIEW
1. สร้าง Proposal (Appendix D format)
2. Submit to System Architect
3. รอ Review (24-72 hours typical)
4. ได้รับ Approval → Proceed
5. ได้รับ Rejection → Revise หรือ Cancel

### 🟡 NOTIFY
1. Document การเปลี่ยนแปลง
2. แจ้ง System Architect (async)
3. Proceed กับงาน
4. รับ Feedback (ถ้ามี)

### 🟢 PROCEED
1. ดำเนินการได้ทันที
2. Document ตาม standard
3. ไม่ต้องรอ approval

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Alignment with Phase C

| Phase C Document | Matrix Enforcement |
|------------------|-------------------|
| Extension Law | Extension boundary violations → 🔴 BLOCK |
| Certification Model | New capability → 🟠 REVIEW |
| PAL Spec | Policy model change → 🔴 BLOCK |
| Window Contract | Window behavior change → 🟠 REVIEW |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Change Log

| Version | Date | Changes |
|---------|------|---------|
| v1.0 | 2026-01-30 | Initial (Appendix B) |
| v1.1 | 2026-01-30 | Expanded with Phase C/D alignment |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Closing Statement

Matrix นี้คือ "ด่านตรวจ" ก่อนทุกการเปลี่ยนแปลง
ถ้าไม่แน่ใจ → ดู Matrix

> **🔴 = หยุด**
> **🟠 = ถาม**
> **🟡 = แจ้ง**
> **🟢 = ทำ**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*Governance Trigger Matrix v1.1*
*Canonical — Governance*
