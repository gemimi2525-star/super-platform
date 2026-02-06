# PROCESS MANAGEMENT FREEZE DECLARATION — Phase 15B

> **🔒 CANONICAL FREEZE**  
> **Date**: 2026-02-06  
> **Status**: RATIFIED  

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## DECLARATION

By this document, we hereby declare:

> **Phase 15B — Process Management is COMPLETE and FROZEN.**

All sub-phases (15B.1, 15B.3, 15B.4) have been executed and verified.
All verification gates have passed.
All invariants are locked.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## PHASES COMPLETED

| Phase | Name | Gates | Status |
|-------|------|-------|--------|
| 15B.1 | Process Engine | B1–B6 | ✅ COMPLETE |
| 15B.3 | Worker Isolation | C1–C5 | ✅ COMPLETE |
| 15B.4 | Task Manager | B7–B11 | ✅ COMPLETE |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## FROZEN FILES

```
# Core Process Engine (FROZEN)
lib/process/types.ts
lib/process/ProcessManager.ts
lib/process/ProcessWorkerTemplate.ts
lib/process/dispatchProcessIntent.ts
lib/process/useProcessManager.ts
lib/process/index.ts

# Server APIs (FROZEN)
app/api/platform/process-intents/route.ts
app/api/platform/process-registry/route.ts

# Task Manager UI (FROZEN)
coreos/ui/TaskManagerApp.tsx
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## CANONICAL INVARIANTS

1. All process actions are intent-driven
2. Server policy = Source of Truth
3. Audit trail mandatory (traceId/opId)
4. Task Manager shows LOCAL/SERVER badge
5. Crash containment (worker crash ≠ OS block)
6. ForceQuit determinism
7. No client-side policy

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ALLOWED CHANGES

- Verifier gates (add new tests)
- Test workers (public/workers/*)
- Documentation improvements

## FORBIDDEN CHANGES

- Process lifecycle logic
- Intent handling
- Policy enforcement
- Registry APIs
- Task Manager core

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Phase 15B — FROZEN**
**Declaration Date:** 2026-02-06
**Commits:** 5748499 → d742c2b → c34279d
