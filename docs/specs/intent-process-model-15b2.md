# Phase 15B.2 — Process Model: Suspend / Resume / Priority

> **Version:** 1.0.0  
> **Status:** APPROVED  
> **Depends on:** Phase 31 (Job System), Phase 32 (Audit Taxonomy)

## Terminology

| Term | Definition | Source |
|:---|:---|:---|
| **Job** | A unit of background work with a signed `JobTicket` | `coreos/jobs/types.ts` |
| **JobQueueRecord** | Firestore document representing a job in the queue | `coreos/jobs/types.ts` |
| **Intent** | A higher-level user/system request that may spawn jobs | `coreos/brain/types.ts` |

This phase extends the **Job** layer only. Intents remain unchanged.

---

## State Machine

### Before (Phase 31)
```
PENDING → PROCESSING → COMPLETED
                     → FAILED
                     → FAILED_RETRYABLE → (PENDING via retry)
                     → DEAD
```

### After (Phase 15B.2)
```
PENDING ──→ PROCESSING → COMPLETED
  ↑   ↓                → FAILED
  │   ↓                → FAILED_RETRYABLE → (PENDING via retry)
  │   ↓                → DEAD
  │   ↓
  │   SUSPENDED ←──────── (from PENDING or FAILED_RETRYABLE only)
  │       │
  └───────┘ (resume → PENDING)
```

### Transition Table

| From | To | Action | Allowed Actor |
|:---|:---|:---|:---|
| PENDING | SUSPENDED | `suspend()` | owner, admin, system |
| FAILED_RETRYABLE | SUSPENDED | `suspend()` | owner, admin, system |
| SUSPENDED | PENDING | `resume()` | owner, admin, system |
| PROCESSING | SUSPENDED | ❌ FORBIDDEN | — |
| COMPLETED | SUSPENDED | ❌ FORBIDDEN | — |
| FAILED | SUSPENDED | ❌ FORBIDDEN | — |
| DEAD | SUSPENDED | ❌ FORBIDDEN | — |

---

## Priority Model

| Property | Value |
|:---|:---|
| Type | `number` (integer) |
| Range | 0–100 |
| Default | 50 (NORMAL) |
| Claim order | `priority DESC`, then `nextRunAt ASC` |

**Preset mapping** (UI convenience):

| Label | Value |
|:---|:---|
| LOW | 10 |
| NORMAL | 50 |
| HIGH | 80 |
| CRITICAL | 100 |

**Rule:** Priority can be updated on any non-terminal status (`PENDING`, `PROCESSING`, `FAILED_RETRYABLE`, `SUSPENDED`). Cannot change priority of `COMPLETED`, `FAILED`, `DEAD`.

---

## Invariants

1. **SUSPENDED jobs MUST NOT be claimed** — claim query filters `status in ['PENDING', 'FAILED_RETRYABLE']`
2. **Resume is idempotent** — resuming a non-SUSPENDED job returns 200 no-op
3. **Suspend is idempotent** — suspending a SUSPENDED job returns 200 no-op
4. **No preemption** — PROCESSING jobs cannot be suspended; they run to completion
5. **Priority reflects in next claim** — after `updatePriority()`, the next `claimNextJob()` respects new ordering
6. **Backward compat** — records without `priority` field default to 50 at read time

---

## New Audit Events

| Event | Type String | Severity |
|:---|:---|:---|
| `JOB_SUSPENDED` | `job.lifecycle.suspended` | INFO |
| `JOB_RESUMED` | `job.lifecycle.resumed` | INFO |
| `JOB_PRIORITY_UPDATED` | `job.ops.priority_updated` | INFO |

Context fields:
```typescript
// suspend/resume
{ jobId, actorId, reason?, previousStatus }
// priority
{ jobId, actorId, previousPriority, newPriority }
```

---

## New Fields (JobQueueRecord)

```typescript
priority: number;            // 0-100, default 50
suspendedAt?: number;        // epoch ms
suspendedBy?: string;        // actor ID
resumedAt?: number;          // epoch ms  
priorityUpdatedAt?: number;  // epoch ms
```

**Migration:** Lazy — reader normalizes `priority ?? 50` at read time. No backfill.

---

## API Endpoints

| Method | Path | Body | Returns |
|:---|:---|:---|:---|
| POST | `/api/jobs/:id/suspend` | `{ reason? }` | Updated job snapshot |
| POST | `/api/jobs/:id/resume` | `{ reason? }` | Updated job snapshot |
| POST | `/api/jobs/:id/priority` | `{ value: number }` | Updated job snapshot |

---

## Firestore Index

New composite index required for priority-aware claiming:
```
Collection: job_queue
Fields: status ASC, nextRunAt ASC, priority DESC
```
