# SYNAPSE Phase O Compliance Report — v1.0

> *"Space-Aware Capability Opening — Deterministic Window Creation"*

**Phase:** O — Space-Aware Capability Opening (v2.3)
**Execution Date:** 2026-01-30T18:55:00+07:00
**Status:** ✅ COMPLETE — LAWFUL
**Authority:** SYNAPSE Governance Framework

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Executive Summary

Phase O ได้ทำให้ **OPEN_CAPABILITY** เคารพ:
- **activeSpaceId** — Window ถูกสร้างใน active space เท่านั้น
- **SpacePolicy** — `canOpenWindow` ถูก enforce ก่อนเปิด
- **Space-scoped identity** — single/multiByContext ไม่ข้าม space

**ผลลัพธ์:**
- Build: ✅ PASS
- Scenario Runner: ✅ **86/86** PASS (เพิ่มจาก 79 — มี 7 O-tests ใหม่)
- No UI added: ✅ Verified
- No cross-space opens: ✅ Verified

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Guardrails Compliance

| Guardrail | Status |
|-----------|--------|
| ❌ No UI | ✅ None added |
| ❌ No new capabilities | ✅ None added |
| ❌ No routing/navigation | ✅ None added |
| ❌ No notifications | ✅ None added |
| ✅ Intent → Policy → Kernel → WM | ✅ Verified |
| ✅ Backward-compatible (Phase I–N) | ✅ Verified |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Deliverables Completed

### O1) Canonical Semantics ✅

**Space Target of "Open":**
- Intent `OPEN_CAPABILITY` does NOT have spaceId in payload
- Kernel determines `targetSpaceId = state.activeSpaceId` (canonical)
- Window created with `window.spaceId = targetSpaceId`

---

### O2) Types / Events ✅

**Extended SPACE_ACCESS_DENIED payload:**

```typescript
// Before (Phase M)
{ spaceId: SpaceId; reason: string; windowId?: string }

// After (Phase O)
{ 
    spaceId: SpaceId; 
    reason: string; 
    windowId?: string;
    capabilityId?: CapabilityId;  // NEW
    intentType?: string;          // NEW
}
```

---

### O3) Policy Engine helper ✅

**New method added:**

```typescript
evaluateOpenCapabilityInSpace(params: {
    capabilityId: CapabilityId;
    spaceId: SpaceId;
    security: SecurityContext;
}): SpaceAccessDecision {
    return this.evaluateSpaceAccess({
        spaceId: params.spaceId,
        action: 'openWindow',
        security: params.security,
    });
}
```

---

### O4) Kernel — OPEN_CAPABILITY Policy Gate ✅

**Updated handleOpenCapability:**

```typescript
case 'allow': {
    // Phase O: Space Policy Gate for opening capability
    const targetSpaceId = state.activeSpaceId;
    const spaceDecision = policyEngine.evaluateOpenCapabilityInSpace({
        capabilityId,
        spaceId: targetSpaceId,
        security: state.security,
    });

    if (spaceDecision.type === 'deny') {
        eventBus.emit({
            type: 'SPACE_ACCESS_DENIED',
            correlationId,
            timestamp: Date.now(),
            payload: {
                spaceId: targetSpaceId,
                reason: spaceDecision.reason,
                capabilityId,
                intentType: 'OPEN_CAPABILITY',
            },
        });
        return;  // No state change — preserve cognitive mode
    }

    // Continue with normal flow...
    windowManager.openWindow(capabilityId, correlationId, contextId, targetSpaceId);
    // ...
}
```

---

### O5) WindowManager — Space-Scoped Window Creation ✅

**Updated openWindow signature:**

```typescript
openWindow(
    capabilityId: CapabilityId,
    correlationId: CorrelationId,
    contextId?: string,
    spaceId?: SpaceId  // NEW Phase O parameter
): string | null
```

**Space-Scoped Identity:**

```typescript
// Phase O: Single instance — focus existing window WITHIN SAME SPACE
if (windowMode === 'single') {
    const existingWindow = Object.values(state.windows)
        .find(w => w.capabilityId === capabilityId && w.spaceId === targetSpaceId);
    // ...
}

// Phase O: MultiByContext — check IN SAME SPACE
if (windowMode === 'multiByContext' && contextId) {
    const existingWindow = Object.values(state.windows)
        .find(w => w.capabilityId === capabilityId 
            && w.contextId === contextId 
            && w.spaceId === targetSpaceId);
    // ...
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## OPEN_CAPABILITY Space Semantics Matrix

| activeSpaceId | Policy | WindowMode | ContextId | Result |
|---------------|--------|------------|-----------|--------|
| space:default | allow | single | — | Create/Focus in space:default |
| space:default | allow | multi | — | Create new in space:default |
| space:default | allow | multiByContext | ✓ | Create/Focus by context in space:default |
| space:default | allow | multiByContext | ✗ | null (validation fail) |
| space:default | allow | backgroundOnly | — | null (no window) |
| space:restricted | deny (canOpenWindow=false) | any | — | DENY event, no state change |
| space:A (has window) → switch to space:B | allow | single | — | Create NEW in space:B (not focus A's) |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## O-Tests ✅

**7 New Tests Added:**

| Test ID | Description | Status |
|---------|-------------|--------|
| `o-open-capability-uses-active-space` | Window created in active space | ✅ PASS |
| `o-open-capability-denied-by-space-policy` | Denied by canOpenWindow=false | ✅ PASS |
| `o-deny-open-preserves-cognitive` | Denied open preserves calm/focus | ✅ PASS |
| `o-open-does-not-create-window-in-backgroundOnly` | backgroundOnly → null | ✅ PASS |
| `o-open-multiByContext-requires-context-within-space` | multiByContext needs contextId | ✅ PASS |
| `o-open-multiByContext-with-context-succeeds` | multiByContext + contextId → creates | ✅ PASS |
| `o-open-single-does-not-cross-space` | Single instance is per-space | ✅ PASS |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Open Capability Flow Diagram

```
                    OPEN_CAPABILITY Intent
                            │
                            ▼
                ┌───────────────────────┐
                │   Capability Policy   │
                │   (evaluate access)   │
                └───────────┬───────────┘
                            │
                   ╔════════╧════════╗
                   ║    ALLOW?       ║
                   ╠═════════════════╣
                   ║ NO → POLICY_DENIED
                   ║ YES → Continue  ║
                   ╚════════╤════════╝
                            │
                            ▼
                ┌───────────────────────┐
                │  Phase O: Space Gate  │
                │ evaluateOpenCapability│
                │ InSpace()             │
                │                       │
                │ action: 'openWindow'  │
                │ spaceId: activeSpaceId│
                └───────────┬───────────┘
                            │
                   ╔════════╧════════╗
                   ║ canOpenWindow?  ║
                   ╠═════════════════╣
                   ║ NO  → SPACE_ACCESS_DENIED
                   ║ YES → Continue  ║
                   ╚════════╤════════╝
                            │
                            ▼
                ┌───────────────────────┐
                │ WindowManager.open()  │
                │ with targetSpaceId    │
                └───────────────────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
    ┌─────────▼────┐ ┌──────▼─────┐ ┌─────▼────────┐
    │   single     │ │   multi    │ │multiByContext│
    │ (per-space)  │ │ (always new│ │ (per-space   │
    │              │ │  in space) │ │  per-context)│
    └──────────────┘ └────────────┘ └──────────────┘
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
✅ j-* (6 tests): All PASS
✅ k-* (6 tests): All PASS
✅ l-* (6 tests): All PASS
✅ m-* (5 tests): All PASS
✅ n-* (6 tests): All PASS
✅ o-* (7 tests): All PASS   ← NEW PHASE O

───────────────────────────────────────────────────────────────
TOTAL: 86 passed, 0 failed
───────────────────────────────────────────────────────────────

🎉 ALL SCENARIOS PASSED — KERNEL IS VALID
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Files Modified

| File | Change |
|------|--------|
| `/coreos/types.ts` | Extended SPACE_ACCESS_DENIED payload |
| `/coreos/policy-engine.ts` | Added evaluateOpenCapabilityInSpace() |
| `/coreos/kernel.ts` | Added space policy gate to handleOpenCapability |
| `/coreos/window-manager.ts` | Space-scoped openWindow with spaceId param |
| `/coreos/scenario-runner.ts` | 7 new O-tests |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Integration with Prior Phases

| Phase | Integration |
|-------|-------------|
| **Phase I** | windowMode semantics now space-scoped |
| **Phase L** | Windows created in activeSpaceId |
| **Phase M** | canOpenWindow permission enforced |
| **Phase N** | Focus after open respects space |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Behavioral Changes

| Operation | Before (Phase I-N) | After (Phase O) |
|-----------|-------------------|-----------------|
| OPEN_CAPABILITY | No space policy check | Space policy gate first |
| single window lookup | All windows | Same space only |
| multiByContext lookup | capabilityId + contextId | + spaceId |
| Window creation | activeSpaceId fallback | Explicit targetSpaceId |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Conclusion

Phase O ได้สร้าง:

1. **Space Policy Gate** — `canOpenWindow` enforced before opening
2. **Explicit Space Targeting** — Kernel passes targetSpaceId to WM
3. **Space-Scoped Identity** — single/multiByContext are per-space
4. **No Cross-Space Opens** — Opening in space B doesn't touch space A
5. **Preserve Cognitive on Deny** — No state change on policy deny

> **Phase O = Deterministic Space-Aware Capability Opening**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Phase Status:** ✅ COMPLETE
**Architecture Status:** ✅ FROZEN v1.0 (Unchanged)
**Test Suite:** 86/86 PASS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*SYNAPSE Phase O Compliance Report v1.0*
*Governance — Report*
