# Phase 21A — Immutable Audit Chain

> **Status:** ✅ IMPLEMENTED
> **Date:** 2026-02-12
> **Extends:** Phase 20 (Agent Execution Engine)

---

## Problem

The `undo()` function in `ExecutionEngine` mutated the original audit entry by changing `status` from `COMPLETED` to `ROLLED_BACK` (line 285). This invalidated the `recordHash` of that entry, causing `verifyAuditChain()` to return `valid: false`.

## Solution

### Invariant: Append-Only, Never Mutate

1. **EXECUTION entries** — immutable after creation. `status` never changes.
2. **ROLLBACK entries** — appended as new entries with `entryType: 'ROLLBACK'` and `referencesEntryId` pointing to the original.
3. **Double-undo** — detected by checking for an existing ROLLBACK entry (not by checking mutated status).

### Audit Schema v2

| Field | Description |
|-------|-------------|
| `entryType` | `'EXECUTION'` or `'ROLLBACK'` |
| `referencesEntryId` | ROLLBACK → original EXECUTION `entryId` |
| `auditVersion` | `2` = immutable; `1` or absent = legacy |

### Legacy Tolerance

- Entries with `auditVersion < 2` (or missing) are skipped during hash verification.
- No production data is modified retroactively.

## Verification

| Test | Result |
|------|--------|
| T1: execute → undo → verifyChain | ✅ `valid: true` |
| T2: execute ×2 → undo #2 → verify | ✅ `valid: true` (3 entries) |
| T3: double undo blocked | ✅ throws "already rolled back" |
| T4: ROLLBACK referencesEntryId | ✅ matches original |
| T5: prevHash chain linkage | ✅ every entry linked |
| T6: original entry immutable | ✅ status = COMPLETED, hash unchanged |
| Build | ✅ exit code 0 |
| CI guardrail | ✅ PASSED |

## Files Changed

| File | Change |
|------|--------|
| `coreos/brain/types.ts` | +3 fields on `ExecutionAuditEntry` |
| `coreos/brain/execution.ts` | undo refactor, computeHash, verifyAuditChain |
| `coreos/brain/execution.test.ts` | **NEW** — 6 vitest tests |
| `docs/specs/audit-chain-immutable.md` | Updated to IMPLEMENTED |
| `docs/reports/phase-21a-immutable-audit.md` | **NEW** — this report |
