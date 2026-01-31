# SYNAPSE Phase F Compliance Report — v1.0

> *"ท่อมาตรฐานสำหรับการเพิ่ม Capability ใหม่"*

**Phase:** F — Capability Addition Pipeline (v1.4)
**Execution Date:** 2026-01-30T16:23:18+07:00
**Status:** ✅ COMPLETE — LAWFUL
**Authority:** SYNAPSE Governance Framework (Phase C/D/E)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Executive Summary

Phase F สร้าง **"ท่อมาตรฐาน"** สำหรับการเพิ่ม Capability ใหม่แบบถูกกฎหมาย:

```
PROPOSAL → CERTIFICATION → REGISTRY → MANIFEST → GRAPH → TESTS
```

พิสูจน์ pipeline ด้วยการเพิ่ม `plugin.analytics` เป็น EXPERIMENTAL capability

**ผลลัพธ์:**
- Build: ✅ PASS
- Scenario Runner: ✅ **33/33** PASS (เพิ่มจาก 27)
- No core behavior change
- Candidate capability removal-safe

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Deliverables Completed

### F1) Proposal Templates ✅

**Location:** `/docs/proposals/templates/`

| File | Purpose |
|------|---------|
| `NEW_CAPABILITY_PROPOSAL_v1.md` | Template for proposing new capabilities |
| `NEW_EXTENSION_PROPOSAL_v1.md` | Template for proposing new extensions |

**Embedded References:**
- ✅ Certification Checklist Pack (D2)
- ✅ Governance Trigger Matrix (D4)
- ✅ Rollback requirements

---

### F2) Certification Workflow ✅

**Location:** `/docs/governance/CERTIFICATION_WORKFLOW_v1.md`

**Workflow Steps:**
1. Proposal Submission
2. Architectural Review
3. Implementation & Testing
4. Validation (Gate)
5. Final Approval
6. Registry Update
7. Activation

**Includes:**
- ✅ Who approves what
- ✅ Required evidence (tests, validation gate)
- ✅ Tier assignment rules

---

### F3) Registry Update Protocol ✅

**Location:** `/docs/governance/REGISTRY_UPDATE_PROTOCOL_v1.md`

**Covers:**
- ✅ When registry can be updated
- ✅ Required notifications (Matrix levels)
- ✅ How to record change log

---

### F4) Candidate Capability: `plugin.analytics` ✅

**Location:** `/coreos/manifests/plugin.analytics.ts`

| Property | Value |
|----------|-------|
| **ID** | `plugin.analytics` |
| **Title** | Analytics |
| **Icon** | 📊 |
| **Tier** | 🧪 EXPERIMENTAL |
| **Required Policies** | `audit.view` |
| **Window Mode** | `single` |
| **Requires Step-Up** | ❌ No |

**Governance Compliance:**
- ❌ No new UI (reuses window system)
- ❌ No background tasks
- ❌ No auto-trigger
- ✅ User-initiated only
- ✅ Passes validation gate
- ✅ Removal-safe

**Registry Entry:**
- Added to `/docs/governance/CAPABILITY_REGISTRY_v1.md`
- Changelog updated

---

### F5) Scenario Runner — Pipeline Tests ✅

**New Tests (6):**

| Test ID | Description | Status |
|---------|-------------|--------|
| `f-analytics-registered` | Candidate is in registry | ✅ PASS |
| `f-analytics-tier` | Tier is EXPERIMENTAL | ✅ PASS |
| `f-analytics-valid` | Passes validation gate | ✅ PASS |
| `f-blacklist-clean` | No blacklisted patterns | ✅ PASS |
| `f-experimental-count` | Exactly 1 experimental | ✅ PASS |
| `f-removal-safe-core` | Core unaffected by experimental | ✅ PASS |

**Result:**
```
TOTAL: 33 passed, 0 failed (up from 27)
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Pipeline Demonstration

### Step-by-Step Execution

```
1. PROPOSAL     → (Implicit for Phase F demo)
2. CERTIFICATION → Checklist passed
3. REGISTRY     → CAPABILITY_REGISTRY_v1.md updated
4. MANIFEST     → /coreos/manifests/plugin.analytics.ts created
5. GRAPH        → manifests/index.ts updated
6. TYPE         → types.ts CapabilityId union extended
7. TESTS        → scenario-runner.ts F-tests added
8. VALIDATION   → 33/33 PASS
```

### Evidence

**Manifest File:**
```typescript
export const PLUGIN_ANALYTICS_MANIFEST: CapabilityManifest = {
    id: 'plugin.analytics',
    title: 'Analytics',
    icon: '📊',
    hasUI: true,
    windowMode: 'single',
    requiredPolicies: ['audit.view'],
    requiresStepUp: false,
    dependencies: [],
    contextsSupported: ['global'],
    showInDock: true,
    certificationTier: 'experimental',
    certifiedAt: '2026-01-30T16:23:18+07:00',
    certifiedBy: 'System Architect (Phase F Pipeline)',
};
```

**Registry Entry:**
- Section: EXPERIMENTAL Tier Capabilities
- ID: X1. plugin.analytics

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Governance Compliance Verification

### Constraint Compliance

| Constraint | Compliance |
|------------|------------|
| Add only 1 experimental capability | ✅ Only `plugin.analytics` |
| No dashboards / sidebars / widgets | ✅ None added |
| No background execution | ✅ Plugin is user-initiated |
| No AI authority | ✅ Not applicable |
| No routing/navigation | ✅ None added |
| Calm-by-Default maintained | ✅ No auto-open, no noise |

### Extension Law Compliance

| Principle | Status |
|-----------|--------|
| Can extend but not dominate | ✅ `plugin.analytics` is a leaf capability |
| Removable without system impact | ✅ Tested (core capabilities unaffected) |

### Window Contract Compliance

| Principle | Status |
|-----------|--------|
| windowMode specified | ✅ `single` |
| Not `none` | ✅ |
| User-initiated | ✅ |

### Certification Model Compliance

| Principle | Status |
|-----------|--------|
| Tier assigned | ✅ `experimental` |
| Certified metadata | ✅ `certifiedAt`, `certifiedBy` |
| Registry entry | ✅ Added |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Files Created

| File | Type | Purpose |
|------|------|---------|
| `/docs/proposals/templates/NEW_CAPABILITY_PROPOSAL_v1.md` | Template | Capability proposal |
| `/docs/proposals/templates/NEW_EXTENSION_PROPOSAL_v1.md` | Template | Extension proposal |
| `/docs/governance/CERTIFICATION_WORKFLOW_v1.md` | Governance | Workflow doc |
| `/docs/governance/REGISTRY_UPDATE_PROTOCOL_v1.md` | Governance | Update protocol |
| `/coreos/manifests/plugin.analytics.ts` | Code | Candidate manifest |

## Files Modified

| File | Change |
|------|--------|
| `/coreos/types.ts` | Added `plugin.analytics` to CapabilityId |
| `/coreos/manifests/index.ts` | Imported and exported analytics manifest |
| `/coreos/scenario-runner.ts` | Added 6 F-tests |
| `/docs/governance/CAPABILITY_REGISTRY_v1.md` | Added plugin.analytics entry |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Validation Results

### Build

```
Exit code: 0
Status: ✅ PASS
```

### Scenario Runner

```
═══════════════════════════════════════════════════════════════
CORE OS KERNEL — SCENARIO RUNNER (Phase E Enforcement)
═══════════════════════════════════════════════════════════════

ENFORCEMENT GATE E0: Manifest Registry Validation
PHASE F PIPELINE: Experimental Capability Validation
SCENARIO 1: Boot → Calm
... (7 behavioral scenarios)

═══════════════════════════════════════════════════════════════
SCENARIO RUNNER RESULTS
═══════════════════════════════════════════════════════════════

✅ e0-registry-valid: PASS
✅ e0-graph-valid: PASS
✅ e0-core-count: PASS
✅ e0-user-stepup-message: PASS
✅ e0-system-stepup-message: PASS
✅ f-analytics-registered: PASS
✅ f-analytics-tier: PASS
✅ f-analytics-valid: PASS
✅ f-blacklist-clean: PASS
✅ f-experimental-count: PASS
✅ f-removal-safe-core: PASS
... (22 behavioral assertions)

───────────────────────────────────────────────────────────────
TOTAL: 33 passed, 0 failed
───────────────────────────────────────────────────────────────

🎉 ALL SCENARIOS PASSED — KERNEL IS VALID
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Directory Structure After Phase F

```
/docs/
├── proposals/
│   ├── templates/                               # 🆕 F1
│   │   ├── NEW_CAPABILITY_PROPOSAL_v1.md
│   │   └── NEW_EXTENSION_PROPOSAL_v1.md
│   └── PURGE_LEGACY_FILES_v1.md
├── governance/
│   ├── CERTIFICATION_WORKFLOW_v1.md             # 🆕 F2
│   ├── REGISTRY_UPDATE_PROTOCOL_v1.md           # 🆕 F3
│   ├── CAPABILITY_REGISTRY_v1.md                # Updated
│   ├── CAPABILITY_CERTIFICATION_MODEL_v1.md
│   ├── CERTIFICATION_CHECKLIST_PACK_v1.md
│   └── GOVERNANCE_TRIGGER_MATRIX_v1_1.md
...

/coreos/
├── manifests/
│   ├── index.ts                  # Updated
│   ├── core.finder.ts
│   ├── core.settings.ts
│   ├── user.manage.ts
│   ├── org.manage.ts
│   ├── audit.view.ts
│   ├── system.configure.ts
│   └── plugin.analytics.ts       # 🆕 F4 (EXPERIMENTAL)
├── types.ts                      # Updated
├── capability-graph.ts
├── scenario-runner.ts            # Updated (F5)
...
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Conclusion

Phase F ได้สร้าง **ท่อมาตรฐาน** สำหรับการขยายระบบอย่างถูกกฎหมาย:

1. **Proposal Templates** — จุดเริ่มต้นที่ชัดเจน
2. **Certification Workflow** — ขั้นตอนที่โปร่งใส
3. **Registry Protocol** — การบันทึกที่เป็นระบบ
4. **Pipeline Validation** — พิสูจน์ด้วย `plugin.analytics`
5. **Automated Tests** — ตรวจสอบ pipeline อัตโนมัติ

> **Phase F = ขยายได้อย่างถูกกฎหมาย**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Phase Status:** ✅ COMPLETE
**Architecture Status:** ✅ FROZEN v1.0 (Unchanged)
**Lawful Status:** ✅ LAWFUL
**Capabilities:**
- CORE: 6
- CERTIFIED: 0
- EXPERIMENTAL: 1 (`plugin.analytics`)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*SYNAPSE Phase F Compliance Report v1.0*
*Governance — Report*
