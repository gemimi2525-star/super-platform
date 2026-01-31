# SYNAPSE Phase G Compliance Report — v1.0

> *"UI Semantics บังคับใช้ — Dock/Finder/Window ไม่ drift"*

**Phase:** G — UI Semantics + Dock & Finder Contract (v1.5)
**Execution Date:** 2026-01-30T16:32:43+07:00
**Status:** ✅ COMPLETE — LAWFUL
**Authority:** SYNAPSE Governance Framework

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Executive Summary

Phase G สร้าง **กฎหมายและ contract** สำหรับ Finder, Dock, และ Window Identity
และทำ enforcement ใน code ให้ UI ไม่ drift ไปเป็น dashboard/launcher

**ผลลัพธ์:**
- Build: ✅ PASS
- Scenario Runner: ✅ **39/39** PASS (เพิ่มจาก 33)
- No behavior change
- UI semantics enforced at manifest level

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Deliverables Completed

### G0) Terminology Compliance Fix ✅

**Target:** `/coreos/manifests/plugin.analytics.ts`

| Before | After |
|--------|-------|
| "Read-only dashboard of usage data" | "Read-only report view of usage data" |

**Window Semantics Contract aligned:** ✅

---

### G1) Finder Contract ✅

**Location:** `/docs/contracts/FINDER_CONTRACT_v1.md`

**Key Definitions:**
- Finder = Intent Origin, NOT App Marketplace
- Finder shows only Registry-listed capabilities
- Finder cannot auto-open, recommend, or notify
- Finder output = human-intent selection only
- Alphabetical sort (deterministic), no usage-based priority

---

### G2) Dock Contract ✅

**Location:** `/docs/contracts/DOCK_CONTRACT_v1.md`

**Key Definitions:**
- Dock contains Pinned + Running only
- No badges, no unread counts, no bouncing, no alerts
- Dock is Calm-by-Default
- Dock is NOT task manager

---

### G3) Window Identity Contract ✅

**Location:** `/docs/contracts/WINDOW_IDENTITY_CONTRACT_v1.md`

**Key Definitions:**
- Title/Icon source = Manifest
- Title rules: 2-30 chars, human-readable
- windowMode → identity mapping:
  - `single`: capabilityId = identity
  - `multi`: windowId = identity
  - `multiByContext`: capabilityId + contextId = identity

---

### G4) Manifest/UI Consistency Rules ✅

**Location:** `/docs/specs/MANIFEST_UI_CONSISTENCY_RULES_v1.md`

**10 Rules Defined:**
1. showInDock=true requires hasUI=true
2. windowMode cannot be 'none'
3. hasUI determines windowMode validity
4. Title: 2-30 chars
5. Icon is required
6. Finder shows only Registry-listed
7. Finder visibility flags
8. Reserved namespace enforcement
9. Blocked IDs (dashboard, chat, launcher, widget, sidebar)
10. Forbidden terminology

---

### G5) Enforcement Gate Update ✅

**Location:** `/coreos/capability-graph.ts`

**New Checks Added:**
| Check | Error Type |
|-------|------------|
| showInDock implies hasUI | `showInDock_hasUI_mismatch` |
| hasUI/windowMode consistency | `hasUI_windowMode_mismatch` |
| Title too short (<2) | `title_too_short` |
| Title too long (>30) | `title_too_long` |
| Missing icon | `missing_icon` |
| Blocked ID | `blocked_id` |
| Forbidden terminology | `forbidden_terminology` |

**Blocked IDs:**
- `core.dashboard`
- `core.chat`

**Blocked Patterns:**
- `launcher`, `widget`, `sidebar`, `notification`

---

### G6) Scenario Runner Tests ✅

**New Tests (6):**

| Test ID | Description | Status |
|---------|-------------|--------|
| `g-dock-consistency` | showInDock implies hasUI | ✅ PASS |
| `g-finder-listing-rules` | At least 1 findable capability | ✅ PASS |
| `g-window-identity-rules` | hasUI → valid windowMode | ✅ PASS |
| `g-title-length-rules` | Title 2-30 chars | ✅ PASS |
| `g-icon-required` | All have icons | ✅ PASS |
| `g-no-blocked-ids` | No blocked patterns | ✅ PASS |

**Result:**
```
TOTAL: 39 passed, 0 failed (up from 33)
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Constraint Compliance

| Constraint | Compliance |
|------------|------------|
| No new capabilities | ✅ None added |
| No new UI features | ✅ None added |
| No routing/navigation | ✅ None added |
| No background tasks | ✅ None added |
| No notifications/badges | ✅ Explicitly forbidden |
| Kernel/policy/state untouched | ✅ Only validation layer updated |
| Behavior change | ❌ NONE (contracts + enforcement only) |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Files Created

| File | Type | Purpose |
|------|------|---------|
| `/docs/contracts/FINDER_CONTRACT_v1.md` | Contract | Finder role & rules |
| `/docs/contracts/DOCK_CONTRACT_v1.md` | Contract | Dock role & rules |
| `/docs/contracts/WINDOW_IDENTITY_CONTRACT_v1.md` | Contract | Window identity rules |
| `/docs/specs/MANIFEST_UI_CONSISTENCY_RULES_v1.md` | Spec | 10 consistency rules |

## Files Modified

| File | Change |
|------|--------|
| `/coreos/manifests/plugin.analytics.ts` | G0: "dashboard" → "report view" |
| `/coreos/capability-graph.ts` | G5: New validation checks, getAllManifests() |
| `/coreos/scenario-runner.ts` | G6: 6 new tests |

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
PHASE G: UI Semantics + Contract Enforcement
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
✅ g-dock-consistency: PASS
✅ g-finder-listing-rules: PASS
✅ g-window-identity-rules: PASS
✅ g-title-length-rules: PASS
✅ g-icon-required: PASS
✅ g-no-blocked-ids: PASS
... (22 behavioral assertions)

───────────────────────────────────────────────────────────────
TOTAL: 39 passed, 0 failed
───────────────────────────────────────────────────────────────

🎉 ALL SCENARIOS PASSED — KERNEL IS VALID
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Contract Summary

### Finder Contract v1.0
> Finder = Intent Origin
> Shows capabilities, User chooses, Intent emits
> No recommendations, no auto-open, no AI authority

### Dock Contract v1.0
> Dock = Calm Presence
> Pinned + Running only
> No badges, no counts, no bouncing

### Window Identity Contract v1.0
> Title/Icon from Manifest
> Title: 2-30 chars
> windowMode determines identity model

### Manifest/UI Consistency Rules v1.0
> 10 deterministic rules
> Enforced at validation gate
> UI cannot deviate from Manifest

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Directory Structure After Phase G

```
/docs/contracts/
├── FINDER_CONTRACT_v1.md              # 🆕 G1
├── DOCK_CONTRACT_v1.md                # 🆕 G2
├── WINDOW_IDENTITY_CONTRACT_v1.md     # 🆕 G3
└── WINDOW_SEMANTICS_CONTRACT_v1.md    # (existing)

/docs/specs/
├── MANIFEST_UI_CONSISTENCY_RULES_v1.md  # 🆕 G4
└── ...

/coreos/
├── capability-graph.ts       # Updated (G5 validation)
├── scenario-runner.ts        # Updated (G6 tests)
├── manifests/
│   └── plugin.analytics.ts   # Updated (G0 terminology)
└── ...
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Conclusion

Phase G ได้สร้าง **กฎหมาย UI Semantics** ที่ครบถ้วน:

1. **Finder Contract** — Intent Origin กฎ
2. **Dock Contract** — Calm Presence กฎ
3. **Window Identity Contract** — Manifest = Truth
4. **Consistency Rules** — 10 rules, deterministic
5. **Enforcement Gate** — 7 new error types
6. **Automated Tests** — 6 UI semantics tests

> **Phase G = UI ไม่ drift ไปเป็น dashboard/launcher**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Phase Status:** ✅ COMPLETE
**Architecture Status:** ✅ FROZEN v1.0 (Unchanged)
**Lawful Status:** ✅ LAWFUL
**Test Suite:** 39/39 PASS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*SYNAPSE Phase G Compliance Report v1.0*
*Governance — Report*
