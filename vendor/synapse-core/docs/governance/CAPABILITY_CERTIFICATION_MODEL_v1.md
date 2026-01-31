# Capability Certification Model — v1.0

> *"ไม่ใช่ทุก Capability ที่เท่าเทียมกัน"*

**Status:** CANONICAL — GOVERNANCE
**Authority:** SYNAPSE Canonical Pack v1.0
**Effective:** 2026-01-30
**Version:** 1.0

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## บทนำ

Capability ทุกตัวใน SYNAPSE ต้องผ่าน Certification
เพื่อรับประกันว่าจะไม่ทำลาย core principles

Certification ไม่ใช่ "อนุญาต" — แต่เป็น "รับรอง"
ว่า Capability นั้นสอดคล้องกับกฎหมาย SYNAPSE

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Section 1: Certification Tiers

### 1.1 Tier Overview

```
┌─────────────────────────────────────────────────────────┐
│                       CORE                              │
│                 (System-built, immutable)               │
│                    🔒 Highest Trust                     │
├─────────────────────────────────────────────────────────┤
│                     CERTIFIED                           │
│              (Reviewed, approved, stable)               │
│                    ✅ High Trust                        │
├─────────────────────────────────────────────────────────┤
│                    EXPERIMENTAL                         │
│          (In development, limited access)               │
│                    ⚠️ Low Trust                         │
├─────────────────────────────────────────────────────────┤
│                     REJECTED                            │
│          (Failed certification, blocked)                │
│                    ❌ No Trust                          │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Tier Definitions

| Tier | Trust Level | Who Creates | Review Required | Breaking Change Allowed |
|------|-------------|-------------|-----------------|------------------------|
| **CORE** | 🔒 Highest | System Architect | N/A (built-in) | Never |
| **CERTIFIED** | ✅ High | Developer | Full Certification | With Proposal |
| **EXPERIMENTAL** | ⚠️ Low | Developer | Basic Check | Yes (isolated) |
| **REJECTED** | ❌ None | - | Failed Review | Blocked |

### 1.3 Examples by Tier

| Tier | Examples |
|------|----------|
| CORE | `core.settings`, `user.manage`, `org.manage`, `audit.view`, `system.configure` |
| CERTIFIED | `report.generate`, `export.csv`, `notification.manage` (future) |
| EXPERIMENTAL | `plugin.analytics`, `custom.dashboard` (dev only) |
| REJECTED | `automation.agent`, `ai.autonomous`, `background.task` |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Section 2: Certification Requirements

### 2.1 Mandatory Checks (All Tiers)

| Check | Description | Failure = |
|-------|-------------|-----------|
| **Manifest Complete** | CapabilityManifest มีครบทุก field | REJECT |
| **Intent-Only** | ถูก activate ผ่าน kernel.emit เท่านั้น | REJECT |
| **Policy Compliant** | ผ่าน Policy evaluation | REJECT |
| **Deterministic** | Same input = Same output | REJECT |

### 2.2 CERTIFIED Tier Additional Requirements

| Check | Description |
|-------|-------------|
| **Calm-Safe** | ไม่ทำลาย Calm state โดยไม่จำเป็น |
| **Single-Instance Considered** | ถ้า singleInstance=true ต้องมีเหตุผล |
| **Step-Up Appropriate** | ถ้า requiresStepUp=true ต้องมี sensitive action จริง |
| **Window Behavior Defined** | windowMode ต้องชัดเจน (window/modal/none) |
| **Removal Safe** | ถอดออกแล้วระบบยังทำงาน |

### 2.3 Certification Checklist

```markdown
## Capability Certification Checklist

- [ ] Manifest provided
- [ ] Manifest fields complete
- [ ] Intent-based activation only
- [ ] Policy evaluation passes
- [ ] No direct state mutation
- [ ] No background execution
- [ ] No auto-trigger
- [ ] Deterministic behavior
- [ ] Calm-safe design
- [ ] Window mode appropriate
- [ ] Icon provided (if UI)
- [ ] Title meaningful
- [ ] Removal does not break system
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Section 3: Certification Process

### 3.1 Process Flow

```
PROPOSAL → REVIEW → TESTING → DECISION
                                 ↓
                    CERTIFIED / EXPERIMENTAL / REJECTED
```

### 3.2 Step-by-Step

| Step | Actor | Deliverable |
|------|-------|-------------|
| 1. **Proposal** | Developer | Capability Manifest + Justification |
| 2. **Review** | System Architect | Checklist Verification |
| 3. **Testing** | Automated + Manual | Scenario Tests |
| 4. **Decision** | System Architect | Tier Assignment |

### 3.3 Review Criteria

| Criteria | Weight | Description |
|----------|--------|-------------|
| **Law Compliance** | MANDATORY | ต้องไม่ละเมิด Extension Law |
| **Policy Fit** | MANDATORY | ต้อง fit กับ Policy model |
| **Calm Preservation** | HIGH | ต้องไม่ทำลาย Calm โดยไม่จำเป็น |
| **Determinism** | MANDATORY | ต้อง deterministic |
| **Utility** | MEDIUM | ต้องมีประโยชน์จริง |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Section 4: Blacklist (Never Certifiable)

### 4.1 Permanently Rejected Patterns

สิ่งต่อไปนี้ **จะไม่มีวัน certify**:

| Pattern | Reason |
|---------|--------|
| **Autonomous Agent** | AI ไม่มี authority |
| **Background Task** | ทุกอย่างต้อง intent-driven |
| **Auto-Execute** | ไม่มี action โดยไม่มี human intent |
| **Navigation Controller** | SYNAPSE ไม่มี navigation |
| **Router Extension** | SYNAPSE ไม่มี router |
| **Chat Interface** | Chat ไม่ใช่ command paradigm |
| **Dashboard** | Dashboard ละเมิด Calm-by-Default |
| **Notification Push** | การแจ้งเตือนต้อง opt-in และ minimal |
| **Widget System** | Widget ละเมิด Calm Desktop |
| **Sidebar App** | Sidebar ไม่ใช่ SYNAPSE pattern |

### 4.2 Blacklist Rationale

```
ทุก pattern ใน Blacklist ละเมิด 1 ใน 3 หลักการ:
1. Human Intent Authority
2. Calm-by-Default
3. Determinism

ไม่มี exception
ไม่มี special case
ไม่มีการต่อรอง
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Section 5: Tier Transitions

### 5.1 Allowed Transitions

| From | To | Condition |
|------|-----|-----------|
| EXPERIMENTAL → CERTIFIED | Full certification pass |
| CERTIFIED → CORE | System Architect promotion |
| CERTIFIED → EXPERIMENTAL | Stability issues found |
| EXPERIMENTAL → REJECTED | Failed certification |
| REJECTED → EXPERIMENTAL | Complete redesign + resubmit |

### 5.2 Forbidden Transitions

| Transition | Reason |
|------------|--------|
| REJECTED → CERTIFIED | ต้องผ่าน EXPERIMENTAL ก่อน |
| CORE → EXPERIMENTAL | CORE ไม่ demote |
| ANY → BLACKLISTED | ถ้าอยู่ใน Blacklist = ไม่มีทาง enter system |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Section 6: Capability Manifest Reference

### 6.1 Required Fields

```typescript
interface CapabilityManifest {
    // Identity
    id: CapabilityId;
    title: string;
    icon: string;
    
    // Policies
    requiredPolicies: string[];
    
    // Behavior
    singleInstance: boolean;
    requiresStepUp: boolean;
    stepUpMessage?: string;
    
    // Window
    windowMode: 'window' | 'modal' | 'none';
}
```

### 6.2 Certification Tier in Manifest

```typescript
// Proposed addition for future
interface CapabilityManifest {
    // ... existing fields
    certificationTier: 'core' | 'certified' | 'experimental';
    certifiedAt?: ISO8601String;
    certifiedBy?: string;
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Closing Statement

Certification ไม่ใช่ bureaucracy
Certification คือ quality gate

> **Capability ที่ไม่ certified = Capability ที่ไม่น่าเชื่อถือ**
> **Capability ที่อยู่ใน Blacklist = Capability ที่ไม่ควรมีอยู่**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*Capability Certification Model v1.0*
*Canonical — Governance*
