# 🚫 Quarantine Import Ban — SYNAPSE v1.0

**Status:** CANONICAL — ENFORCEMENT GUARD
**Authority:** SYNAPSE Canonical Pack v1.0 + Appendix Pack v1.0
**Effective:** 2026-01-30

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Purpose

This document lists files that are **QUARANTINED** and **MUST NOT BE IMPORTED**
in any production code within the SYNAPSE v1.x codebase.

## Banned Imports

| File | Status | Superseded By | Reason |
|------|--------|---------------|--------|
| `coreos/mock-ui.tsx` | 🗑️ PURGED | `coreos/desktop-ui.tsx` | Legacy mock UI — **FILE DELETED 2026-01-30** |
| `coreos/test.ts` | 🗑️ PURGED | `coreos/scenario-runner.ts` | Legacy test — **FILE DELETED 2026-01-30** |

> ✅ These files have been permanently removed from the repository.

## Verification Commands

Run these commands to verify no banned imports exist:

```bash
# Check for mock-ui imports
rg -n "mock-ui|coreos/mock-ui" --type ts --type tsx .

# Check for test.ts imports
rg -n "from './test'|from \"./test\"|coreos/test" --type ts .
```

**Expected Result:** No import statements found (only self-references)

## Violation Policy

If a banned import is detected:
1. ❌ Build should be blocked (future CI integration)
2. ❌ PR should not be merged
3. ✅ Developer must use the superseding file instead

## Authority

This guard document is issued under:
- SYNAPSE Canonical Pack v1.0
- Appendix Pack v1.0 (Section A — Design Review Checklist)

> **If code violates this ban → Code is wrong**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*SYNAPSE Quarantine Import Ban v1.0*
*Enforcement Document*
