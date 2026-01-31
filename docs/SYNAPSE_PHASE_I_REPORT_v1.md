# SYNAPSE Phase I Compliance Report — v1.0

> *"Window Manager Wiring — Intent → Window Deterministically"*

**Phase:** I — Window Manager Wiring + UI Hookup (v1.7)
**Execution Date:** 2026-01-30T16:55:00+07:00
**Status:** ✅ COMPLETE — LAWFUL
**Authority:** SYNAPSE Governance Framework

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Executive Summary

Phase I ได้ **wiring Finder/Dock MVP เข้ากับ WindowManager** ให้ทำงานผ่าน Intent pattern
ทุก operation (open/focus/minimize/restore/close) ถูกควบคุมโดย windowMode semantics

**ผลลัพธ์:**
- Build: ✅ PASS
- Scenario Runner: ✅ **50/50** PASS (เพิ่มจาก 44 — มี 6 I-tests ใหม่)
- WindowMode Semantics: ✅ All 4 modes enforced
- Intent-Only: ✅ No direct window.open()

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Guardrails Compliance (I0)

| Guardrail | Status |
|-----------|--------|
| ❌ No new capabilities | ✅ None added |
| ❌ No routing/navigation | ✅ None added |
| ❌ No background tasks/polling | ✅ None added |
| ❌ No notifications/badges | ✅ None added |
| ❌ Finder/Dock no direct window.open | ✅ Intent-only |
| ✅ All actions via kernel.emit() | ✅ Enforced |
| ✅ Respect contracts | ✅ All contracts honored |
| ✅ windowMode vs windowDisplay (Phase H0) | ✅ Unchanged |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Deliverables Completed

### I1) IntentFactory — Already Complete ✅

IntentFactory in `/coreos/types.ts` already contains all required window operations:

| Intent | Status |
|--------|--------|
| `openCapability(capabilityId, contextId?)` | ✅ Exists |
| `focusWindow(windowId)` | ✅ Exists |
| `minimizeWindow(windowId)` | ✅ Exists |
| `restoreWindow(windowId)` | ✅ Exists |
| `closeWindow(windowId)` | ✅ Exists |
| `minimizeAll()` | ✅ Exists |

---

### I2) WindowManager — Mode Semantics ✅

**Location:** `/coreos/window-manager.ts`

**Enhancements:**

| Mode | Behavior | Implementation |
|------|----------|----------------|
| `single` | Focus existing if any | ✅ finds & focuses |
| `multi` | Always create new | ✅ always creates |
| `multiByContext` | Same context → focus, different → create | ✅ contextId check |
| `backgroundOnly` | No window created | ✅ returns null |

**Validation Added:**
- `multiByContext` without `contextId` → returns null (validation fail)
- `backgroundOnly` or `hasUI=false` → returns null (no window)
- Window ID format: `win-{capabilityId}-{timestamp}-{random}`
- z-index management: tracks highest z-index

**New Methods:**
- `getRunningCapabilityIds()` — for Dock integration
- `getPrimaryWindowIdForCapability()` — for Dock focus resolution

---

### I3) Finder Click → Intent ✅

**Location:** `/coreos/ui/FinderMVP.ts`

**New Functions:**
```typescript
// Basic intent (for UI layer)
createFinderOpenIntent(capabilityId, contextId?)

// Full intent with correlationId (for kernel.emit())
createFinderIntent(capabilityId, contextId?)
```

**Contract Compliance:**
- Returns intent descriptor only
- Never calls window.open() or windowManager directly
- Includes contextId support for multiByContext capabilities

---

### I4) Dock Click → Intent ✅

**Location:** `/coreos/ui/DockMVP.ts`

**Enhanced Functions:**
```typescript
// Full intent with windowId resolution
getDockClickAction(item, getPrimaryWindowId?)
→ FOCUS_WINDOW { windowId } | OPEN_CAPABILITY { capabilityId }

// Legacy/simple version
getDockClickActionLegacy(item)
→ FOCUS_CAPABILITY | OPEN_CAPABILITY
```

**Click Behavior:**
- `isRunning=true` → FOCUS_WINDOW (with resolved windowId)
- `isRunning=false` → OPEN_CAPABILITY (let WindowManager handle mode)

---

### I5) RunningCapabilities Source ✅

**Location:** `/coreos/window-manager.ts`

```typescript
// Get capabilities with open windows
getRunningCapabilityIds(): readonly CapabilityId[]

// Get primary window for focus
getPrimaryWindowIdForCapability(capabilityId): string | null
```

**Integration:**
- DockMVP can call `updateRunningCapabilities(state, wmForI.getRunningCapabilityIds())`
- Dock derives running state from actual WindowManager state
- No separate "active capabilities" tracking needed

---

### I6) Tests ✅

**6 New Tests Added:**

| Test ID | Description | Status |
|---------|-------------|--------|
| `i-single-reopen-focuses-same-window` | Single mode focuses existing | ✅ PASS |
| `i-multi-opens-new-window-each-time` | Multi mode creates new | ✅ PASS |
| `i-multiByContext-same-context-focuses` | Same context focuses | ✅ PASS |
| `i-multiByContext-different-context-creates-new` | Different context creates | ✅ PASS |
| `i-backgroundOnly-creates-no-window` | Background returns null | ✅ PASS |
| `i-dock-focus-emits-focus-intent-only` | Dock emits FOCUS intent | ✅ PASS |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## WindowMode Behavior Summary

### single (e.g., core.settings)
```
openWindow("core.settings") → creates window A
openWindow("core.settings") → returns window A (focused, not created)
```

### multi (e.g., user.manage)
```
openWindow("user.manage") → creates window A
openWindow("user.manage") → creates window B (different ID)
```

### multiByContext (e.g., audit.view)
```
openWindow("audit.view", "org-abc") → creates window A
openWindow("audit.view", "org-abc") → returns window A (same context)
openWindow("audit.view", "org-xyz") → creates window B (different context)
openWindow("audit.view") → returns null (missing contextId)
```

### backgroundOnly (e.g., core.finder)
```
openWindow("core.finder") → returns null (no window created)
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Evidence Pack (I7)

### Build
```
npm run build
Exit code: 0
Status: ✅ PASS
```

### Scenario Runner
```
═══════════════════════════════════════════════════════════════
SCENARIO RUNNER RESULTS
═══════════════════════════════════════════════════════════════

✅ e0-* (5 tests): All PASS
✅ f-* (6 tests): All PASS
✅ g-* (6 tests): All PASS
✅ h-* (5 tests): All PASS
✅ i-* (6 tests): All PASS   ← NEW
✅ behavioral (22 tests): All PASS

───────────────────────────────────────────────────────────────
TOTAL: 50 passed, 0 failed
───────────────────────────────────────────────────────────────

🎉 ALL SCENARIOS PASSED — KERNEL IS VALID
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Files Modified

| File | Change |
|------|--------|
| `/coreos/window-manager.ts` | Mode semantics, getRunningCapabilityIds, z-index |
| `/coreos/ui/FinderMVP.ts` | createFinderIntent with contextId/correlationId |
| `/coreos/ui/DockMVP.ts` | getDockClickAction with windowId resolver |
| `/coreos/ui/index.ts` | New exports for Phase I |
| `/coreos/scenario-runner.ts` | 6 new I-tests |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Intent Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        USER ACTION                          │
│   Finder Click  |  Dock Click  |  Keyboard Shortcut        │
└────────────┬────────────┬────────────────────────────────────┘
             │            │
             ▼            ▼
┌─────────────────────────────────────────────────────────────┐
│                    INTENT CREATION                          │
│   createFinderIntent()  |  getDockClickAction()             │
│   → { type: 'OPEN_CAPABILITY', payload: {...} }             │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                    KERNEL.EMIT(intent)                      │
│   - Validates policy                                        │
│   - Checks step-up requirement                              │
│   - Routes to WindowManager                                 │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                    WINDOW MANAGER                           │
│   openWindow(capabilityId, correlationId, contextId?)      │
│   - Reads windowMode from Manifest                          │
│   - Applies mode semantics (single/multi/mBC/bgOnly)       │
│   - Creates/focuses window accordingly                      │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                    STATE UPDATE                             │
│   - state.windows updated                                   │
│   - state.activeCapabilities updated                        │
│   - Events emitted (WINDOW_CREATED, WINDOW_FOCUSED)        │
└─────────────────────────────────────────────────────────────┘
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Conclusion

Phase I ได้สร้าง **wiring layer** ที่:

1. **Intent-Only** — ทุก UI action ผ่าน Intent เท่านั้น
2. **Mode-Deterministic** — windowMode semantics ถูกต้องครบ 4 แบบ
3. **Dock-Integrated** — Running state มาจาก WindowManager
4. **Context-Aware** — multiByContext ต้องมี contextId
5. **Calm-Compliant** — backgroundOnly ไม่สร้าง window

> **Phase I = Window Operations ผ่าน Intent เท่านั้น**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Phase Status:** ✅ COMPLETE
**Architecture Status:** ✅ FROZEN v1.0 (Unchanged)
**Lawful Status:** ✅ LAWFUL
**Test Suite:** 50/50 PASS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*SYNAPSE Phase I Compliance Report v1.0*
*Governance — Report*
