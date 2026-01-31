# New Capability Proposal Template — v1.0

> *"ทุก Capability ต้องผ่านท่อนี้"*

**Template Version:** 1.0
**Authority:** SYNAPSE Governance Framework (Phase C/D/E)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Instructions

1. Copy this template to `/docs/proposals/[CAPABILITY_ID]_PROPOSAL_v1.md`
2. Fill in all sections marked `[REQUIRED]`
3. Complete all checklists
4. Submit for System Architect review
5. Wait for approval before implementation

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Capability Proposal: [CAPABILITY_ID]

**Proposal Date:** [REQUIRED: YYYY-MM-DD]
**Submitter:** [REQUIRED: Name/Role]
**Status:** DRAFT | SUBMITTED | UNDER_REVIEW | APPROVED | REJECTED

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 1. Capability Identity

| Field | Value |
|-------|-------|
| **Proposed ID** | [REQUIRED: namespace.action format] |
| **Title** | [REQUIRED: Human-readable, 2-30 chars] |
| **Icon** | [REQUIRED: Emoji or icon name] |
| **Proposed Tier** | [REQUIRED: CERTIFIED or EXPERIMENTAL] |

> **Note:** Only System-built capabilities can be CORE. New proposals must be CERTIFIED or EXPERIMENTAL.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 2. Justification

### 2.1 Purpose
[REQUIRED: Why is this capability needed? What problem does it solve?]

### 2.2 User Benefit
[REQUIRED: How does this benefit end users?]

### 2.3 Alignment with SYNAPSE
[REQUIRED: How does this align with:]
- Human Intent Authority
- Calm-by-Default
- Determinism

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 3. Proposed Manifest

```typescript
const [CAPABILITY_ID]_MANIFEST: CapabilityManifest = {
    id: '[REQUIRED]',
    title: '[REQUIRED]',
    icon: '[REQUIRED]',
    hasUI: [REQUIRED: boolean],
    windowMode: '[REQUIRED: single|multi|multiByContext]',
    requiredPolicies: ['[REQUIRED]'],
    requiresStepUp: [REQUIRED: boolean],
    stepUpMessage: '[REQUIRED if requiresStepUp=true]',
    dependencies: [],
    contextsSupported: ['[REQUIRED: global|organization|user|document]'],
    showInDock: [REQUIRED: boolean],
    certificationTier: '[REQUIRED: certified|experimental]',
};
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 4. Certification Checklist

> Reference: `/docs/governance/CERTIFICATION_CHECKLIST_PACK_v1.md`

### Checklist A: Capability Certification

**A1. Manifest Completeness**
- [ ] `id` specified (namespace.action format)
- [ ] `title` specified (2-30 characters)
- [ ] `icon` specified
- [ ] `requiredPolicies` specified
- [ ] `singleInstance` specified
- [ ] `requiresStepUp` specified
- [ ] `stepUpMessage` specified (if requiresStepUp=true)
- [ ] `windowMode` specified (not 'none')
- [ ] `certificationTier` specified

**A2. Intent-Based Activation**
- [ ] Activated via kernel.emit() only
- [ ] No direct activation from code
- [ ] No auto-activate
- [ ] No scheduled activation
- [ ] No URL parameter activation
- [ ] No external event activation

**A3. Policy Compliance**
- [ ] requiredPolicies complete
- [ ] No Policy Engine bypass
- [ ] No hardcoded permissions
- [ ] Policy evaluation before activation
- [ ] Step-up enforced if required

**A4. Determinism**
- [ ] Same input → Same output
- [ ] No random behavior
- [ ] No external state dependency
- [ ] No time-based logic (unless explicit)
- [ ] No unpredictable side effects

**A5. Calm Preservation**
- [ ] No auto-open
- [ ] No auto-focus grab
- [ ] No notification push
- [ ] No sound
- [ ] No attention-grabbing animation
- [ ] No periodic refresh
- [ ] User-initiated only

**A6. Window Behavior**
- [ ] windowMode appropriate
- [ ] singleInstance justified (if true)
- [ ] Window can minimize/close
- [ ] No excessive blocking
- [ ] Modal only when necessary

**A7. Removal Safety**
- [ ] Remove capability → System works
- [ ] No breaking dependencies
- [ ] No hardcoded core references
- [ ] Graceful fail for dependents

### Checklist E: Blacklist Check

- [ ] ❌ NOT Autonomous Agent
- [ ] ❌ NOT Background Task
- [ ] ❌ NOT Auto-Execute
- [ ] ❌ NOT Navigation Controller
- [ ] ❌ NOT Router Extension
- [ ] ❌ NOT Chat Interface
- [ ] ❌ NOT Dashboard
- [ ] ❌ NOT Notification Push (aggressive)
- [ ] ❌ NOT Widget System
- [ ] ❌ NOT Sidebar App
- [ ] ❌ NOT AI Authority
- [ ] ❌ NOT Intent Generator
- [ ] ❌ NOT State Mutator
- [ ] ❌ NOT Policy Bypass

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 5. Trigger Matrix Assessment

> Reference: `/docs/governance/GOVERNANCE_TRIGGER_MATRIX_v1_1.md`

| Change | Matrix Level | Justification |
|--------|--------------|---------------|
| Add new manifest file | 🟠 REVIEW | New capability requires certification |
| Add to CapabilityId type | 🟠 REVIEW | Type contract change |
| Add to Registry | 🟡 NOTIFY | After certification approval |
| Add tests | 🟢 PROCEED | Test-only |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 6. Risk Assessment

### 6.1 Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| [REQUIRED: Describe risk] | [LOW/MED/HIGH] | [LOW/MED/HIGH] | [REQUIRED] |

### 6.2 Rollback Plan

[REQUIRED: How to undo this change if needed]

1. Remove manifest file from `/coreos/manifests/`
2. Remove from `manifests/index.ts`
3. Remove from `types.ts` CapabilityId union
4. Remove from Registry document
5. Run scenario-runner to verify no breakage
6. Commit with rollback message

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 7. Evidence

### 7.1 Test Plan

| Test | Expected Result |
|------|-----------------|
| [REQUIRED] | [REQUIRED] |

### 7.2 Validation Gate

[REQUIRED: How will you verify the capability passes the enforcement gate?]

```bash
# Command to verify
npx tsx coreos/scenario-runner.ts
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 8. Approval

| Role | Name | Date | Status |
|------|------|------|--------|
| Submitter | [NAME] | [DATE] | SUBMITTED |
| System Architect | | | PENDING |

### Reviewer Comments

[Space for reviewer feedback]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*New Capability Proposal Template v1.0*
