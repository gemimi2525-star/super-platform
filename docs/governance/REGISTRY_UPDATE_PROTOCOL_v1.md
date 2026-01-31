# Registry Update Protocol — v1.0

> *"Registry คือความจริง — อัปเดตด้วยความระวัง"*

**Status:** CANONICAL — GOVERNANCE
**Authority:** SYNAPSE Governance Framework
**Effective:** 2026-01-30
**Version:** 1.0

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## บทนำ

Registry Update Protocol กำหนดว่า:
- **เมื่อไหร่** Registry สามารถถูกอัปเดตได้
- **ใคร** มีสิทธิ์อัปเดต
- **อย่างไร** ที่ต้องทำการบันทึกและแจ้ง

**กฎเหล็ก:**
- Registry = Single Source of Truth
- อัปเดตผิด = System confusion

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## When Registry Can Be Updated

### Allowed Update Triggers

| Trigger | Condition | Matrix Level |
|---------|-----------|--------------|
| **New Capability Certified** | Certification Workflow Step 6 complete | 🟡 NOTIFY |
| **Capability Promotion** | EXPERIMENTAL → CERTIFIED approved | 🟠 REVIEW |
| **Capability Suspension** | Security issue or stability problem | 🟢 PROCEED |
| **Capability Removal** | Formal deprecation approved | 🟠 REVIEW |
| **Metadata Correction** | Typo, icon change (non-breaking) | 🟢 PROCEED |

### Forbidden Updates

| Update | Reason | Matrix Level |
|--------|--------|--------------|
| Add without certification | Bypasses governance | 🔴 BLOCK |
| Change ID of existing | Breaking change | 🔴 BLOCK |
| Promote without approval | Bypasses review | 🔴 BLOCK |
| Remove CORE capability | Constitutional violation | 🔴 BLOCK |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Update Process

### Step 1: Verify Prerequisites

Before updating, ensure:
- [ ] Certification Workflow complete (for new capabilities)
- [ ] Approval documented in proposal
- [ ] Code changes already merged
- [ ] Scenario runner passes
- [ ] Validation gate passes

### Step 2: Prepare Update

File: `/docs/governance/CAPABILITY_REGISTRY_v1.md`

**For New Capability:**
```markdown
### [N]. [capability.id]

| Property | Value |
|----------|-------|
| **ID** | `[id]` |
| **Title** | [title] |
| **Icon** | [icon] |
| **Tier** | [CERTIFIED/EXPERIMENTAL] |
| **Required Policies** | `[policies]` |
| **Single Instance** | [✅ Yes / ❌ No] |
| **Requires Step-Up** | [✅ Yes / ❌ No] |
| **Step-Up Message** | "[message]" |
| **Window Mode** | `[mode]` |
| **Status** | ✅ ACTIVE |

**Description:**
[Brief description]

**Certification:**
- Tier: [TIER]
- Certified: [DATE]
- Certified By: [NAME]
```

**For Status Change:**
Update the `Status` field and add note.

**For Removal:**
Move entry to "Archived Capabilities" section.

### Step 3: Update Changelog

Add entry to `Registry Change Log` section:

```markdown
| Date | Change | By |
|------|--------|-----|
| [YYYY-MM-DD] | [Description] | [Name] |
```

### Step 4: Update Statistics

Update the `Registry Statistics` section:
- Total Capabilities
- CORE count
- CERTIFIED count
- EXPERIMENTAL count

### Step 5: Commit and Notify

**Commit Message Format:**
```
docs(registry): [action] [capability.id]

- [Brief description]
- Certified by: [name]
- Tier: [tier]

Ref: [proposal link]
```

**Notify:**
- System Architect (always)
- Team channel (if CERTIFIED tier)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Notification Requirements

| Update Type | Notify | Channel |
|-------------|--------|---------|
| New EXPERIMENTAL | System Architect | Direct |
| New CERTIFIED | System Architect + Team | Team channel |
| Promotion | System Architect + Team | Team channel |
| Suspension | System Architect + Team | Urgent channel |
| Removal | System Architect + Team | Team channel |
| Metadata fix | System Architect | Direct |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Registry Consistency Rules

### Code ↔ Registry Sync

| Location | Must Match |
|----------|------------|
| `/coreos/manifests/index.ts` | Registry entries |
| `/coreos/types.ts` CapabilityId | Registry IDs |
| Scenario runner assertions | Registry state |

### Verification Command

```bash
# Verify code and registry are in sync
npx tsx coreos/scenario-runner.ts
# Should include registry validation tests
```

### Inconsistency Resolution

If Registry and Code disagree:
1. **Code wins** for active capabilities (code is runtime truth)
2. **Registry must be updated** to match code
3. Inconsistency = governance violation
4. Must be resolved within 24 hours

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Changelog Format

The Registry changelog must include:

| Column | Description |
|--------|-------------|
| Date | ISO8601 date |
| Change | Brief description of what changed |
| By | Who made the change |

**Example:**
```markdown
| 2026-01-30 | Added plugin.analytics (EXPERIMENTAL) | System Architect |
| 2026-01-30 | Promoted plugin.analytics to CERTIFIED | System Architect |
| 2026-01-31 | Suspended custom.report (stability issue) | System Architect |
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Rollback Procedure

If a registry update causes issues:

1. **Identify:** Which entry is problematic
2. **Revert:** Git revert the registry change
3. **Code Sync:** Ensure code matches reverted state
4. **Notify:** Alert System Architect
5. **Document:** Add incident to changelog

**Rollback Commit Message:**
```
revert(registry): rollback [capability.id]

Reason: [brief description]
Original commit: [hash]
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Audit Trail

Registry updates are part of the governance audit trail:

| Record | Purpose |
|--------|---------|
| Git history | Who changed what, when |
| Changelog | Human-readable summary |
| Proposal docs | Justification for changes |
| CI/CD logs | Validation evidence |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Closing Statement

Registry Update Protocol ทำให้:
- Registry เป็นแหล่งความจริง
- การเปลี่ยนแปลงถูกติดตาม
- ความไม่สอดคล้องถูกจัดการ

> **Registry ถูกต้อง = System ถูกต้อง**
> **Registry ผิด = System สับสน**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*Registry Update Protocol v1.0*
*Canonical — Governance*
