# Phase 20 — Production Report

> **Status:** ✅ PRODUCTION  
> **Date:** 2026-02-12  
> **Commit SHA:** `af8e1a5`  
> **Deployment:** `3YSjjrpxB`  
> **Branch:** `main`

---

## Overview

Phase 20 introduces the **Agent Execution Engine** — the gated execution pipeline for Brain AI actions. All execution is protected by Ed25519 signed approvals, nonce replay protection, audit chain logging, and a kill switch (`BRAIN_AGENT_KILL`).

**The kill switch is ON by default.** Execution is disabled in production until explicitly approved for Phase 21+.

---

## Production Configuration

| Variable | Value | Scope |
|----------|-------|-------|
| `BRAIN_AGENT_KILL` | `true` | All Environments |

---

## Files Changed (9 files, +1047 / -19 lines)

| File | Status | Purpose |
|------|--------|---------|
| `app/api/brain/execute/route.ts` | NEW | Execute API endpoint (gated) |
| `app/api/brain/route.ts` | MODIFIED | Brain API integration |
| `coreos/brain/execution.ts` | NEW | ExecutionEngine (core logic) |
| `coreos/brain/gateway.ts` | MODIFIED | Gateway integration |
| `coreos/brain/shield.ts` | MODIFIED | Shield hardening |
| `coreos/brain/snapshot.ts` | NEW | Snapshot/undo system |
| `coreos/brain/trust.ts` | MODIFIED | Trust attestation |
| `coreos/brain/types.ts` | MODIFIED | Type definitions |
| `next.config.ts` | MODIFIED | Build configuration |

---

## Production Checkpoints (5/5 PASS)

| # | Checkpoint | Result |
|---|-----------|--------|
| 1 | `/os` loads normally | ✅ Desktop + dock visible |
| 2 | Brain UI in safe mode | ✅ DRAFTER Mode, Phase 19 |
| 3 | `/api/brain/execute` blocked by kill switch | ✅ 503 response |
| 4 | Audit logs accessible | ✅ Healthy |
| 5 | `/api/brain/verify-ui` removed | ✅ 404 |

---

## UI-Level Verification (6/6 PASS)

Tested on Vercel Preview (`phase20-agent-staging`) with `BRAIN_AGENT_KILL=false`:

| # | Test | Result |
|---|------|--------|
| 1 | Status (kill switch OFF) | ✅ `killSwitchActive: false` |
| 2 | Execute (signed approval) | ✅ `status: "COMPLETED"` |
| 3 | Undo (rollback) | ✅ `status: "ROLLED_BACK"` |
| 4 | Double-Undo (rejection) | ✅ `blocked: true` |
| 5 | Replay Attack (nonce) | ✅ `blocked: true` |
| 6 | Audit Chain (entries) | ✅ `totalEntries: 2` |

---

## Security Features

- **Ed25519 Signed Approvals** — every execution requires cryptographic signature
- **Nonce Replay Protection** — each nonce can only be used once
- **Rate Limiting** — max 10 executions per minute
- **Scope Restriction** — Phase 20 allows only `core.notes`
- **Kill Switch** — `BRAIN_AGENT_KILL=true` disables all execution
- **Audit Chain** — every execution is logged with SHA-256 linked hashes
- **Snapshot/Undo** — every execution creates a rollback snapshot

---

## Known Design Considerations

### Audit Chain `chainValid` after Undo

The `undo()` method mutates the original audit entry's `status` field from `"COMPLETED"` to `"ROLLED_BACK"`, which invalidates the pre-computed SHA-256 hash. The chain **linkage** (prevHash → recordHash) remains intact.

**Recommendation for Phase 21+:** Append a new immutable rollback entry instead of mutating the original. See `docs/specs/audit-chain-immutable.md`.

---

## Release Tag

```
git tag -a phase20-prod -m "Phase 20 Production Ready (af8e1a5)"
```
