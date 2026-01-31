# New Extension Proposal Template — v1.0

> *"Extension ต่อได้ แต่ครอบงำไม่ได้"*

**Template Version:** 1.0
**Authority:** SYNAPSE Extension Law v1.0

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Instructions

1. Copy this template to `/docs/proposals/[EXTENSION_ID]_EXTENSION_PROPOSAL_v1.md`
2. Fill in all sections marked `[REQUIRED]`
3. Complete all checklists
4. Submit for System Architect review
5. Wait for approval before implementation

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Extension Proposal: [EXTENSION_ID]

**Proposal Date:** [REQUIRED: YYYY-MM-DD]
**Submitter:** [REQUIRED: Name/Role]
**Status:** DRAFT | SUBMITTED | UNDER_REVIEW | APPROVED | REJECTED

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 1. Extension Identity

| Field | Value |
|-------|-------|
| **Proposed ID** | [REQUIRED] |
| **Type** | [REQUIRED: Capability | Intelligence | Policy | UI] |
| **Target Layers** | [REQUIRED: Which layers will this access?] |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 2. Justification

### 2.1 Purpose
[REQUIRED: Why is this extension needed?]

### 2.2 User Benefit
[REQUIRED: How does this benefit end users?]

### 2.3 Extension Law Alignment
[REQUIRED: How does this comply with Extension Law v1.0?]

- Can be attached but cannot dominate: [EXPLAIN]
- Removable without system impact: [EXPLAIN]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 3. Boundary Declaration

> Reference: `/docs/laws/SYNAPSE_EXTENSION_LAW_v1.md` Section 2

| Layer | Access Requested | Justification |
|-------|------------------|---------------|
| Kernel | ❌ NONE (Required) | Kernel is sacred |
| Policy Engine | [❌ NONE / ⚠️ LIMITED via PAL] | [REQUIRED] |
| Capability Graph | [✅ YES / ❌ NO] | [REQUIRED] |
| Intelligence Layer | [✅ YES (Read-only) / ❌ NO] | [REQUIRED] |
| Window Manager | ❌ NONE (Required) | Window behavior is deterministic |
| UI | [✅ YES (Skin only) / ❌ NO] | [REQUIRED] |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 4. Extension Certification Checklist

> Reference: `/docs/governance/CERTIFICATION_CHECKLIST_PACK_v1.md` Checklist B

### B1. Extension Boundary
- [ ] Does NOT access Kernel
- [ ] Does NOT access Window Manager directly
- [ ] Capability access via Manifest only
- [ ] Intelligence access is Read-Only only
- [ ] Policy access via PAL only
- [ ] UI access is Theme/Icons only

### B2. Extension Authority
- [ ] Does NOT emit Intent directly
- [ ] Does NOT mutate SystemState
- [ ] Does NOT bypass Policy
- [ ] Does NOT auto-execute
- [ ] Does NOT schedule future actions
- [ ] Does NOT run background process

### B3. Extension Stability
- [ ] Remove extension → System works 100%
- [ ] Extension error does NOT crash System
- [ ] Has graceful degradation
- [ ] Has clear lifecycle

### Checklist E: Blacklist Check
- [ ] ❌ NOT Autonomous Agent
- [ ] ❌ NOT Background Task
- [ ] ❌ NOT Auto-Execute
- [ ] ❌ NOT Intent Generator
- [ ] ❌ NOT State Mutator
- [ ] ❌ NOT Policy Bypass

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 5. Trigger Matrix Assessment

> Reference: `/docs/governance/GOVERNANCE_TRIGGER_MATRIX_v1_1.md`

| Change | Matrix Level | Justification |
|--------|--------------|---------------|
| Register Extension | 🟠 REVIEW | Certification required |
| [Other changes] | [LEVEL] | [JUSTIFICATION] |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 6. Risk Assessment

### 6.1 Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| [REQUIRED] | [LOW/MED/HIGH] | [LOW/MED/HIGH] | [REQUIRED] |

### 6.2 Rollback Plan

[REQUIRED: How to undo this extension if needed]

1. Suspend extension
2. Remove extension files
3. Verify system stability
4. Update registry

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 7. Evidence

### 7.1 Test Plan

| Test | Expected Result |
|------|-----------------|
| [REQUIRED] | [REQUIRED] |

### 7.2 Removal Test

[REQUIRED: Prove system works without this extension]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 8. Approval

| Role | Name | Date | Status |
|------|------|------|--------|
| Submitter | [NAME] | [DATE] | SUBMITTED |
| System Architect | | | PENDING |

### Reviewer Comments

[Space for reviewer feedback]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*New Extension Proposal Template v1.0*
