# Audit Chain — Immutable Design (Phase 21A)

> **Status:** ✅ IMPLEMENTED (Phase 21A)
> **Date:** 2026-02-12
> **Component:** `coreos/brain/execution.ts`

---

## Problem (Resolved)

`undo()` mutated the original audit entry (`auditEntry.status = 'ROLLED_BACK'`), breaking `verifyAuditChain()` because the SHA-256 hash was computed with `status: "COMPLETED"`.

## Solution: Append-Only Rollback

**Invariant:** No audit entry is ever mutated after creation.

| Entry Type | Behavior |
|-----------|----------|
| `EXECUTION` | Immutable — status stays `COMPLETED` forever |
| `ROLLBACK` | New entry appended with `referencesEntryId` → original |

### Schema v2 Fields

| Field | Type | Purpose |
|-------|------|---------|
| `entryType` | `'EXECUTION' \| 'ROLLBACK'` | Classify entry |
| `referencesEntryId` | `string?` | ROLLBACK → original EXECUTION |
| `auditVersion` | `number` | `2` = immutable, `1`/absent = legacy |

### Double-Undo Detection

Old: checked `auditEntry.status === 'ROLLED_BACK'` (required mutation)
New: checks if any ROLLBACK entry exists with `referencesEntryId === auditEntry.entryId`

### Legacy Tolerance

Entries with `auditVersion < 2` are skipped during hash verification. No production data modified.

## Verification

6/6 vitest tests pass. Build exit 0. CI guardrail PASSED.

See: [phase-21a-immutable-audit.md](../reports/phase-21a-immutable-audit.md)

