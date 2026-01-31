# Certification Checklist Pack — v1.0

> *"ทุก Checklist คือ Gate ที่ต้องผ่าน"*

**Status:** CANONICAL — GOVERNANCE
**Authority:** SYNAPSE Canonical Pack v1.0 + Certification Model v1.0
**Effective:** 2026-01-30
**Version:** 1.0

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## บทนำ

Checklist Pack นี้รวบรวม **checklist ทั้งหมด** ที่ใช้ในกระบวนการ Certification
ใช้สำหรับ:
- Capability Certification
- Extension Certification
- Policy Rule Certification
- Change Proposal Review

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Checklist A: Capability Certification

### A1. Manifest Completeness

```markdown
## Manifest Completeness Checklist

- [ ] `id` — ระบุและถูกต้องตาม format (namespace.action)
- [ ] `title` — มีชื่อที่อ่านได้ (2-30 characters)
- [ ] `icon` — มี icon ที่เหมาะสม
- [ ] `requiredPolicies` — ระบุ policies ที่ต้องการ
- [ ] `singleInstance` — ระบุ boolean
- [ ] `requiresStepUp` — ระบุ boolean
- [ ] `stepUpMessage` — ระบุถ้า requiresStepUp=true
- [ ] `windowMode` — ระบุ 'window' หรือ 'modal'
- [ ] `windowMode` — ไม่ใช่ 'none'
```

### A2. Intent-Based Activation

```markdown
## Intent-Based Activation Checklist

- [ ] Capability ถูก activate ผ่าน kernel.emit() เท่านั้น
- [ ] ไม่มีการ activate โดยตรงจาก code
- [ ] ไม่มีการ auto-activate
- [ ] ไม่มีการ schedule activation
- [ ] ไม่มีการ activate จาก URL parameter
- [ ] ไม่มีการ activate จาก external event
```

### A3. Policy Compliance

```markdown
## Policy Compliance Checklist

- [ ] requiredPolicies ครบถ้วน
- [ ] ไม่มีการ bypass Policy Engine
- [ ] ไม่มีการ hardcode permissions
- [ ] Policy evaluation เกิดก่อน activation
- [ ] Step-up ถูก enforce ถ้าต้องการ
```

### A4. Determinism

```markdown
## Determinism Checklist

- [ ] Same input → Same output (ทุกครั้ง)
- [ ] ไม่มี random behavior
- [ ] ไม่มีการพึ่งพา external state
- [ ] ไม่มีการพึ่งพา time-based logic (ยกเว้น explicit)
- [ ] ไม่มี side effects ที่ unpredictable
```

### A5. Calm Preservation

```markdown
## Calm Preservation Checklist

- [ ] ไม่มี auto-open
- [ ] ไม่มี auto-focus grab
- [ ] ไม่มี notification push
- [ ] ไม่มี sound
- [ ] ไม่มี animation ที่ grab attention
- [ ] ไม่มี periodic refresh
- [ ] User-initiated only
```

### A6. Window Behavior

```markdown
## Window Behavior Checklist

- [ ] windowMode เหมาะสมกับ use case
- [ ] singleInstance มีเหตุผลถ้า true
- [ ] Window สามารถ minimize/close ได้
- [ ] Window ไม่ block desktop เกินจำเป็น
- [ ] Modal ใช้เฉพาะกรณีที่ต้องการ blocking
```

### A7. Removal Safety

```markdown
## Removal Safety Checklist

- [ ] ถอด Capability ออก → System ยังทำงาน
- [ ] ไม่มี dependency ที่ทำให้ system พัง
- [ ] ไม่มี hardcoded reference จาก core
- [ ] Other capabilities ไม่ depend on this (หรือ graceful fail)
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Checklist B: Extension Certification

### B1. Extension Boundary

```markdown
## Extension Boundary Checklist

- [ ] ไม่เข้าถึง Kernel
- [ ] ไม่เข้าถึง Window Manager โดยตรง
- [ ] Capability via Manifest only
- [ ] Intelligence via Read-Only only
- [ ] Policy via PAL only
- [ ] UI via Theme/Icons only
```

### B2. Extension Authority

```markdown
## Extension Authority Checklist

- [ ] ไม่ emit Intent โดยตรง
- [ ] ไม่ mutate SystemState
- [ ] ไม่ bypass Policy
- [ ] ไม่ auto-execute
- [ ] ไม่ schedule future actions
- [ ] ไม่มี background process
```

### B3. Extension Stability

```markdown
## Extension Stability Checklist

- [ ] ถอดออก → System ทำงาน 100%
- [ ] Error ใน Extension ไม่ crash System
- [ ] Extension มี graceful degradation
- [ ] Extension มี clear lifecycle
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Checklist C: Policy Rule Certification

### C1. Policy Syntax

```markdown
## Policy Syntax Checklist

- [ ] ใช้ PAL syntax (declarative)
- [ ] มี PRIORITY ระบุ
- [ ] มี ACTION (ALLOW/DENY/REQUIRE_STEPUP)
- [ ] มี TARGET (capability/role)
- [ ] CONDITION ชัดเจน (WHEN/UNLESS)
```

### C2. Policy Determinism

```markdown
## Policy Determinism Checklist

- [ ] Same context → Same decision
- [ ] ไม่มี random evaluation
- [ ] ไม่ conflict กับ Core policies
- [ ] Priority ไม่ override Core policies โดยไม่ได้รับอนุญาต
```

### C3. Policy Safety

```markdown
## Policy Safety Checklist

- [ ] ไม่ grant excessive permissions
- [ ] ไม่ open security holes
- [ ] ไม่ bypass step-up requirements
- [ ] ไม่ allow blacklisted patterns
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Checklist D: Change Proposal Review

### D1. Proposal Completeness

```markdown
## Proposal Completeness Checklist

- [ ] Proposal Name ชัดเจน
- [ ] Affected Layers ระบุ
- [ ] Compendium References ระบุ
- [ ] Refusal Check (Chapter 4) ผ่าน
- [ ] Determinism Statement มี
- [ ] Rollback Plan มี
```

### D2. Impact Assessment

```markdown
## Impact Assessment Checklist

- [ ] ไม่กระทบ Kernel
- [ ] ไม่เปลี่ยน Authority Model
- [ ] ไม่ละเมิด Calm principles
- [ ] ไม่เพิ่ม noise
- [ ] Scenario Runner ยังผ่าน
- [ ] Build ยังผ่าน
```

### D3. Risk Review

```markdown
## Risk Review Checklist

- [ ] ระบุ Risks ทั้งหมด
- [ ] ระบุ Likelihood และ Impact
- [ ] ระบุ Mitigation
- [ ] Rollback Plan tested (if applicable)
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Checklist E: Blacklist Check

### E1. Blacklisted Patterns

```markdown
## Blacklist Check

ต้องยืนยันว่า **ไม่มี** patterns ต่อไปนี้:

- [ ] ❌ Autonomous Agent
- [ ] ❌ Background Task
- [ ] ❌ Auto-Execute
- [ ] ❌ Navigation Controller
- [ ] ❌ Router Extension
- [ ] ❌ Chat Interface
- [ ] ❌ Dashboard
- [ ] ❌ Notification Push (aggressive)
- [ ] ❌ Widget System
- [ ] ❌ Sidebar App
- [ ] ❌ AI Authority
- [ ] ❌ Intent Generator (from Extension)
- [ ] ❌ State Mutator (from Extension)
- [ ] ❌ Policy Bypass
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Quick Reference: Certification Decision

### Tier Assignment

```
IF all A1-A7 passed AND E1 clean:
    IF reviewed by System Architect → CERTIFIED
    ELSE → EXPERIMENTAL

IF any A1-A7 failed OR E1 has violation:
    → REJECTED
```

### Pass/Fail Criteria

| Check | FAIL Threshold |
|-------|---------------|
| A1 Manifest | Any field missing |
| A2 Intent | Any direct activation |
| A3 Policy | Any bypass detected |
| A4 Determinism | Any non-deterministic behavior |
| A5 Calm | Any auto/noise behavior |
| A6 Window | windowMode:none |
| A7 Removal | System breaks on removal |
| E1 Blacklist | Any blacklisted pattern |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Alignment with Phase C

| Phase C Document | Checklist Enforcement |
|------------------|----------------------|
| Extension Law | B1, B2, B3 |
| Certification Model | A1-A7, E1 |
| PAL Spec | C1, C2, C3 |
| Window Contract | A5, A6 |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Closing Statement

Checklist ไม่ใช่ bureaucracy
Checklist คือ quality gate ที่ป้องกัน drift

> **ผ่าน Checklist = มีสิทธิ์อยู่ใน System**
> **ไม่ผ่าน Checklist = ไม่มีสิทธิ์อยู่ใน System**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*Certification Checklist Pack v1.0*
*Canonical — Governance*
