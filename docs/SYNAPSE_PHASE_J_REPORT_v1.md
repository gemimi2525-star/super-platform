# SYNAPSE Phase J Compliance Report — v1.0

> *"Window Lifecycle & Cognitive State — Derived, Not Set"*

**Phase:** J — Window Lifecycle & Cognitive State Model (v1.8)
**Execution Date:** 2026-01-30T17:10:00+07:00
**Status:** ✅ COMPLETE — LAWFUL
**Authority:** SYNAPSE Governance Framework

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Executive Summary

Phase J ได้สร้าง **Window Lifecycle Model** และ
ทำให้ **Cognitive State (calm / focused / multitask)** ถูก derive จาก window states จริง
ไม่มี manual set อีกต่อไป — **cognitiveMode = f(windows, focusedWindowId)**

**ผลลัพธ์:**
- Build: ✅ PASS
- Scenario Runner: ✅ **56/56** PASS (เพิ่มจาก 50 — มี 6 J-tests ใหม่)
- Cognitive State: ✅ Pure derivation
- No Manual Set: ✅ Verified

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Guardrails Compliance

| Guardrail | Status |
|-----------|--------|
| ❌ No new capabilities | ✅ None added |
| ❌ No UI / components | ✅ None added |
| ❌ No routing/navigation | ✅ None added |
| ❌ No background tasks | ✅ None added |
| ✅ Intent → Kernel → WindowManager only | ✅ Unchanged |
| ✅ Architecture FROZEN v1.0 | ✅ Unchanged |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Deliverables Completed

### J1) Window Lifecycle Model ✅

**Location:** `/coreos/cognitive-deriver.ts`

**Lifecycle State Diagram:**
```
created → active → focused → minimized → restored (active) → closed
              ↑                          ↓
              └──────────────────────────┘
```

**Window Lifecycle States:**
```typescript
type WindowLifecycleState = 
    | 'active'    // Window is visible and usable
    | 'focused'   // Window is active AND has focus (derived)
    | 'minimized' // Window is in dock, not visible
    | 'hidden';   // Window is invisible (rare)
```

**Implementation:**
```typescript
function getWindowLifecycleState(
    window: Window,
    focusedWindowId: string | null
): WindowLifecycleState
```

---

### J2) Cognitive State Derivation Rules ✅

**Pure Derivation Function:**
```typescript
function deriveCognitiveMode(state: SystemState): CognitiveMode
```

**Canonical Rules:**

| Mode | Condition | Example |
|------|-----------|---------|
| `calm` | No focused window OR focusedWindowId is null | Desktop idle |
| `focused` | Exactly 1 active window with focus | Single task |
| `multitask` | 2+ active (non-minimized) windows | Multi-window |

**Key Insight:**
```typescript
cognitiveMode = f(state.windows, state.focusedWindowId)
// NO manual COGNITIVE_MODE_SET needed!
```

---

### J3) WindowManager Lifecycle Helpers ✅

**Location:** `/coreos/window-manager.ts`

**New Methods:**

| Method | Returns |
|--------|---------|
| `getFocusedWindowId()` | `string \| null` |
| `getActiveWindowIds()` | `readonly string[]` |
| `getMinimizedWindowIds()` | `readonly string[]` |
| `getWindowLifecycleState(windowId)` | `'active' \| 'focused' \| 'minimized' \| 'hidden' \| null` |
| `getWindowCounts()` | `{ total, active, focused, minimized, hidden }` |

---

### J4) Calm Detector Refactor ✅

**Location:** `/coreos/calm-detector.ts`

**Before (Phase I):**
```typescript
// Checked state.cognitiveMode manually
if (state.cognitiveMode !== 'calm') {
    reasons.push(`Cognitive mode is '${state.cognitiveMode}'`);
}
```

**After (Phase J):**
```typescript
// Derives cognitive mode from window states
const derivedMode = deriveCognitiveMode(state);
if (derivedMode !== 'calm') {
    const explanation = explainCognitiveMode(state);
    reasons.push(`Cognitive mode is '${derivedMode}': ${explanation.reason}`);
}
```

**Enhanced Interface:**
```typescript
interface CalmStateResult {
    readonly isCalm: boolean;
    readonly reasons: readonly string[];
    readonly derivedMode: 'calm' | 'focused' | 'multitask' | 'alert' | 'locked';
}
```

---

### J5) Tests ✅

**6 New Tests Added:**

| Test ID | Description | Status |
|---------|-------------|--------|
| `j-calm-when-no-focused-window` | No focus → calm | ✅ PASS |
| `j-focused-when-single-focused` | 1 focused → focused | ✅ PASS |
| `j-multitask-when-multiple-active` | 2+ active → multitask | ✅ PASS |
| `j-minimize-all-enters-calm` | Minimize all → calm | ✅ PASS |
| `j-restore-from-minimize-enters-focused` | Restore → focused/multitask | ✅ PASS |
| `j-close-focused-recalculates-state` | Close → recalculate | ✅ PASS |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Cognitive Mode Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     STATE CHANGE                            │
│   Window Created | Focused | Minimized | Restored | Closed  │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                   deriveCognitiveMode()                      │
│                                                              │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐  │
│   │    CALM     │     │  FOCUSED    │     │ MULTITASK   │  │
│   │ No focused  │     │ 1 active    │     │ 2+ active   │  │
│   │   window    │     │  + focus    │     │  windows    │  │
│   └─────────────┘     └─────────────┘     └─────────────┘  │
└─────────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                    DERIVED MODE                              │
│   isCalmState() → uses derived mode, not state.cognitiveMode│
└─────────────────────────────────────────────────────────────┘
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Evidence Pack

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
✅ i-* (6 tests): All PASS
✅ j-* (6 tests): All PASS   ← NEW PHASE J
✅ behavioral (22 tests): All PASS

───────────────────────────────────────────────────────────────
TOTAL: 56 passed, 0 failed
───────────────────────────────────────────────────────────────

🎉 ALL SCENARIOS PASSED — KERNEL IS VALID
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Files Created/Modified

| File | Change |
|------|--------|
| `/coreos/cognitive-deriver.ts` | **NEW** — Pure derivation functions |
| `/coreos/calm-detector.ts` | Refactored to use deriveCognitiveMode() |
| `/coreos/window-manager.ts` | Added lifecycle helper methods |
| `/coreos/index.ts` | Added cognitive-deriver exports |
| `/coreos/scenario-runner.ts` | 6 new J-tests |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Conclusion

Phase J ได้สร้าง:

1. **Window Lifecycle Model** — 4 canonical states (active/focused/minimized/hidden)
2. **Pure Derivation** — cognitiveMode = f(windows, focusedWindowId)
3. **No Manual Set** — ไม่ต้องใช้ COGNITIVE_MODE_SET action
4. **Helper Methods** — getFocusedWindowId(), getActiveWindowIds(), etc.
5. **Refactored Calm Detector** — ใช้ derived mode แทน state.cognitiveMode

> **Phase J = Cognitive State is Derived, Not Set**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Phase Status:** ✅ COMPLETE
**Architecture Status:** ✅ FROZEN v1.0 (Unchanged)
**Behavior Change:** ❌ NONE (UX unchanged)
**Test Suite:** 56/56 PASS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*SYNAPSE Phase J Compliance Report v1.0*
*Governance — Report*
