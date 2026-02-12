# Audit Chain — Immutable Design Note

> **Status:** Known Design Consideration  
> **Phase:** 20 (current) → Target fix: Phase 21+  
> **Priority:** Medium  
> **Component:** `coreos/brain/execution.ts`

---

## Current Behavior

When `undo()` is called, the `ExecutionEngine` **mutates** the original audit entry:

```typescript
// execution.ts — undo() method
auditEntry.status = 'ROLLED_BACK';  // ← mutates in-place
```

This causes `verifyAuditChain()` to return `chainValid: false` because the SHA-256 hash was computed with `status: "COMPLETED"` but now the entry has `status: "ROLLED_BACK"`.

**Chain linkage (prevHash → recordHash) is intact.** Only the hash-to-content verification fails.

---

## Root Cause

`computeHash()` includes `status` in its hash input:

```typescript
private computeHash(entry: ExecutionAuditEntry): string {
    const data = JSON.stringify({
        entryId: entry.entryId,
        executionId: entry.executionId,
        // ...
        status: entry.status,  // ← included in hash
        // ...
    });
    return createHash('sha256').update(data).digest('hex').substring(0, 16);
}
```

When `undo()` changes `status` from `"COMPLETED"` to `"ROLLED_BACK"`, the recomputed hash no longer matches `recordHash`.

---

## Recommended Fix (Phase 21+)

### Option A: Append-Only Rollback Entry (Recommended)

Instead of mutating the original entry, append a **new** entry with type `"ROLLBACK"`:

```typescript
// Instead of:
auditEntry.status = 'ROLLED_BACK';

// Do:
this.appendAuditEntry({
    ...rollbackResult,
    status: 'ROLLBACK',
    referencesEntryId: originalEntry.entryId,
}, approval);
```

**Benefits:**
- Original entries are never mutated → hashes remain valid
- `verifyAuditChain()` always returns `true`
- Full history preserved (who executed, who rolled back, when)

### Option B: Exclude `status` from Hash

Remove `status` from `computeHash()` input. This allows status changes without breaking hashes.

**Drawback:** Reduces the integrity guarantee (status changes become invisible to hash verification).

---

## Decision

**Option A (Append-Only) is recommended** for Phase 21+. It preserves full cryptographic integrity while supporting undo operations.
