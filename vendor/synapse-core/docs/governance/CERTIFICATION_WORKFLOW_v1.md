# Certification Workflow — v1.0

> *"ขั้นตอนที่ต้องผ่านก่อนมีสิทธิ์อยู่ในระบบ"*

**Status:** CANONICAL — GOVERNANCE
**Authority:** SYNAPSE Governance Framework (Phase C/D/E)
**Effective:** 2026-01-30
**Version:** 1.0

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## บทนำ

Certification Workflow กำหนดขั้นตอนที่ต้องปฏิบัติก่อนที่ Capability หรือ Extension
จะได้รับอนุญาตให้ทำงานใน SYNAPSE

**หลักการ:**
- ไม่มีทางลัด
- ทุกขั้นตอนต้องมีหลักฐาน
- การอนุมัติมีผลผูกพัน

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Workflow Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    1. PROPOSAL                              │
│                  (Submitter creates)                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    2. REVIEW                                │
│               (System Architect reviews)                    │
└────────────────────────┬────────────────────────────────────┘
                         │
            ┌────────────┴────────────┐
            │                         │
            ▼                         ▼
┌───────────────────┐     ┌───────────────────────────────────┐
│     REJECTED      │     │         3. TESTING                │
│   (End of flow)   │     │      (Submitter implements)       │
└───────────────────┘     └────────────────────┬──────────────┘
                                               │
                                               ▼
                          ┌───────────────────────────────────┐
                          │         4. VALIDATION             │
                          │    (Automated + Manual check)     │
                          └────────────────────┬──────────────┘
                                               │
                          ┌────────────────────┴───────────────┐
                          │                                    │
                          ▼                                    ▼
              ┌───────────────────┐            ┌───────────────────┐
              │  FAIL (Re-submit) │            │   5. APPROVAL     │
              └───────────────────┘            │ (System Architect)│
                                               └─────────┬─────────┘
                                                         │
                                                         ▼
                                               ┌───────────────────┐
                                               │   6. REGISTER     │
                                               │ (Update Registry) │
                                               └─────────┬─────────┘
                                                         │
                                                         ▼
                                               ┌───────────────────┐
                                               │   7. ACTIVATE     │
                                               │ (Merge to main)   │
                                               └───────────────────┘
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Step-by-Step Process

### Step 1: Proposal Submission

**Who:** Submitter (Developer/Contributor)

**Action:**
1. Use template from `/docs/proposals/templates/NEW_CAPABILITY_PROPOSAL_v1.md`
2. Fill all required sections
3. Complete certification checklists (A1-A7, E1)
4. Submit to System Architect

**Deliverable:**
- Proposal document in `/docs/proposals/[ID]_PROPOSAL_v1.md`

**Timeline:** No limit (submitter-driven)

---

### Step 2: Architectural Review

**Who:** System Architect

**Action:**
1. Review proposal completeness
2. Verify alignment with SYNAPSE principles
3. Check Trigger Matrix compliance
4. Assess risk

**Decision Points:**
| Decision | Condition |
|----------|-----------|
| APPROVED | Checklists complete, aligned with principles |
| REVISE | Minor issues, resubmission required |
| REJECTED | Fundamental violation (blacklist, principle violation) |

**Deliverable:**
- Reviewer comments in proposal document
- Status update: APPROVED / REVISE / REJECTED

**Timeline:** 24-72 hours (typical)

---

### Step 3: Implementation & Testing

**Who:** Submitter

**Prerequisites:** Step 2 = APPROVED

**Action:**
1. Create manifest file in `/coreos/manifests/[id].ts`
2. Update `manifests/index.ts` to include new manifest
3. Add to CapabilityId union in `types.ts`
4. Write scenario tests
5. Run local validation

**Deliverable:**
- Manifest file
- Test cases
- Local validation output

**Required Evidence:**
```bash
# Build must pass
npm run build

# Scenario runner must pass (including new tests)
npx tsx coreos/scenario-runner.ts

# Validation gate must pass
# (Automatic when scenario runner runs)
```

---

### Step 4: Validation (Gate)

**Who:** Automated + System Architect

**Action:**
1. Run build verification
2. Run scenario runner (all tests)
3. Verify enforcement gate passes
4. Manual review of code changes

**Validation Criteria:**

| Check | Pass Condition |
|-------|----------------|
| Build | Exit code 0 |
| Scenario Runner | All tests pass |
| Enforcement Gate | `validateManifestRegistry().valid === true` |
| Blacklist | No blacklisted patterns |
| Removal Safe | Delete manifest → core tests still pass |

**Fail Action:** Return to Step 3 with specific feedback

---

### Step 5: Final Approval

**Who:** System Architect

**Prerequisites:** Step 4 = PASS

**Action:**
1. Final review of all evidence
2. Assign certification tier
3. Sign off on proposal

**Tier Assignment Rules:**

| Tier | Condition |
|------|-----------|
| **CORE** | System-built only. New capabilities cannot be CORE. |
| **CERTIFIED** | Full review passed, production-ready |
| **EXPERIMENTAL** | Review passed with caveats, limited access |

**Deliverable:**
- Signed proposal with tier assignment
- Status: APPROVED + TIER

---

### Step 6: Registry Update

**Who:** Submitter (with SA oversight)

**Prerequisites:** Step 5 = APPROVED

**Action:**
1. Update `/docs/governance/CAPABILITY_REGISTRY_v1.md`
2. Add entry with all manifest details
3. Update changelog

**Registry Entry Template:**
```markdown
### [index]. [capability.id]

| Property | Value |
|----------|-------|
| **ID** | `[id]` |
| **Title** | [title] |
| **Icon** | [icon] |
| **Tier** | [CERTIFIED/EXPERIMENTAL] |
| **Required Policies** | `[policies]` |
| ...
```

**Ref:** `/docs/governance/REGISTRY_UPDATE_PROTOCOL_v1.md`

---

### Step 7: Activation

**Who:** Submitter

**Prerequisites:** Step 6 complete

**Action:**
1. Merge code to main branch
2. Verify CI/CD passes
3. Notify System Architect of completion

**Final Verification:**
```bash
# On main branch
npm run build
npx tsx coreos/scenario-runner.ts
# All must pass
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Roles and Responsibilities

| Role | Responsibilities |
|------|------------------|
| **Submitter** | Create proposal, implement, test, update docs |
| **System Architect** | Review, approve/reject, assign tier, oversight |
| **CI/CD** | Automated validation (build, tests) |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Required Evidence Checklist

Before final approval, the following evidence must exist:

| Evidence | Location | Required |
|----------|----------|----------|
| Proposal document | `/docs/proposals/[ID]_PROPOSAL_v1.md` | ✅ |
| Manifest file | `/coreos/manifests/[id].ts` | ✅ |
| Index update | `/coreos/manifests/index.ts` | ✅ |
| Type update | `/coreos/types.ts` (CapabilityId) | ✅ |
| Test cases | `/coreos/scenario-runner.ts` | ✅ |
| Build output | CI/CD or local | ✅ |
| Scenario runner output | CI/CD or local | ✅ |
| Registry entry | `/docs/governance/CAPABILITY_REGISTRY_v1.md` | ✅ |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Rejection Reasons

Proposals will be REJECTED if:

| Reason | Reference |
|--------|-----------|
| Blacklisted pattern | Certification Model §4 |
| Violates Extension Law boundaries | Extension Law §2 |
| Violates Window Contract | Window Semantics Contract |
| Incomplete checklists | Checklist Pack |
| No rollback plan | Proposal Template §6.2 |
| Fails validation gate | Enforcement Gate |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Expedited Process (Emergency)

For critical security fixes or blocked production issues:

1. System Architect may approve EXPERIMENTAL tier immediately
2. Full certification must follow within 7 days
3. Emergency decisions must be documented
4. If full certification fails → immediate rollback

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Closing Statement

Certification Workflow ไม่ใช่ bureaucracy
Certification Workflow คือ quality gate ที่ปกป้องระบบ

> **ผ่าน Workflow = สิทธิ์ในการอยู่**
> **ข้าม Workflow = ไร้สิทธิ์ในการอยู่**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*Certification Workflow v1.0*
*Canonical — Governance*
