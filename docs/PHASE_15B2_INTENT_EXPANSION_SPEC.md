# Phase 15B.2 — Intent Expansion Specification

> **Version**: 1.0 (DRAFT)  
> **Date**: 2026-02-06  
> **Status**: IN REVIEW  
> **Precondition**: Phase 15B FROZEN (Commit 976a41a)

---

## 1. Overview

เพิ่ม 3 intent ใหม่ให้ Process Engine:

| Intent | Description |
|--------|-------------|
| `os.process.suspend` | หยุด execution ของ worker แบบ reversible |
| `os.process.resume` | กลับมาทำงานต่อ |
| `os.process.setPriority` | จัดลำดับความสำคัญ (scheduler semantics) |

**Constraint**: ห้ามแก้ไข frozen files (lib/process/*.ts, TaskManagerApp.tsx)

---

## 2. Intent Definitions

### 2.1 SUSPEND_PROCESS

```typescript
// Request
interface SuspendProcessRequest {
    action: 'os.process.suspend';
    pid: string;
    reason?: string;  // optional audit note
}

// Response
interface SuspendProcessResponse {
    success: boolean;
    action: 'os.process.suspend';
    pid: string;
    previousState: ProcessState;
    newState: 'SUSPENDED';
    opId: string;     // format: os.process.suspend-{timestamp}
    traceId: string;  // from x-trace-id header
    error?: string;
}
```

**Preconditions:**
- Process must exist
- Process state must be `RUNNING`
- Caller must have `process:suspend` permission

**Postconditions:**
- Worker receives `SUSPEND` IPC message
- Worker pauses heartbeat
- Registry updated: state = `SUSPENDED`
- Audit log created

### 2.2 RESUME_PROCESS

```typescript
// Request
interface ResumeProcessRequest {
    action: 'os.process.resume';
    pid: string;
}

// Response
interface ResumeProcessResponse {
    success: boolean;
    action: 'os.process.resume';
    pid: string;
    previousState: 'SUSPENDED';
    newState: 'RUNNING';
    opId: string;
    traceId: string;
    error?: string;
}
```

**Preconditions:**
- Process must exist
- Process state must be `SUSPENDED`
- Caller must have `process:resume` permission

**Postconditions:**
- Worker receives `RESUME` IPC message
- Worker resumes heartbeat
- Registry updated: state = `RUNNING`
- Audit log created

### 2.3 SET_PRIORITY

```typescript
// Request
interface SetPriorityRequest {
    action: 'os.process.setPriority';
    pid: string;
    priority: 'low' | 'normal' | 'high' | 'realtime';
}

// Response
interface SetPriorityResponse {
    success: boolean;
    action: 'os.process.setPriority';
    pid: string;
    previousPriority: string;
    newPriority: string;
    opId: string;
    traceId: string;
    error?: string;
}
```

**Preconditions:**
- Process must exist
- Caller must have `process:priority` permission (admin only for `realtime`)

**Postconditions:**
- Registry updated with new priority
- Audit log created
- (Future) Scheduler adjusts CPU time allocation

---

## 3. State Machine

```
         spawn
           │
           ▼
    ┌──────────────┐
    │   RUNNING    │◄──────┐
    └──────────────┘       │
           │               │
    suspend│         resume│
           ▼               │
    ┌──────────────┐       │
    │  SUSPENDED   │───────┘
    └──────────────┘
           │
    terminate/forceQuit
           │
           ▼
    ┌──────────────┐
    │  TERMINATED  │
    └──────────────┘

    (crash at any point)
           │
           ▼
    ┌──────────────┐
    │   CRASHED    │
    └──────────────┘
```

**Allowed Transitions:**
| From | To | Action |
|------|----|--------|
| RUNNING | SUSPENDED | suspend |
| SUSPENDED | RUNNING | resume |
| RUNNING | TERMINATED | terminate/forceQuit |
| SUSPENDED | TERMINATED | forceQuit |
| RUNNING | CRASHED | error/timeout |
| SUSPENDED | CRASHED | timeout (heartbeat stopped too long) |

**Forbidden Transitions:**
- CRASHED → any (except cleanup)
- TERMINATED → any
- SUSPENDED → terminate (must forceQuit, or resume first)

---

## 4. Determinism Rules

### 4.1 Idempotency
- `suspend` on SUSPENDED → no-op, return current state
- `resume` on RUNNING → no-op, return current state
- `setPriority` to same value → no-op, no audit

### 4.2 Retry Semantics
- All intents are idempotent within same traceId
- Duplicate opId detection: warn, return previous result

### 4.3 Ordering
- Intent processing is serialized per-pid
- No concurrent suspend+resume on same process

---

## 5. Policy Rules

### 5.1 Permission Matrix

| Intent | Admin | Owner | Other |
|--------|-------|-------|-------|
| suspend | ✅ | ✅ | ❌ |
| resume | ✅ | ✅ | ❌ |
| setPriority (low/normal/high) | ✅ | ✅ | ❌ |
| setPriority (realtime) | ✅ | ❌ | ❌ |

### 5.2 Audit Fields
```typescript
interface ProcessIntentAuditRecord {
    opId: string;
    traceId: string;
    action: string;
    pid: string;
    actorId: string;
    actorRole: string;
    decision: 'ALLOW' | 'DENY';
    reason?: string;
    previousState?: string;
    newState?: string;
    timestamp: number;
}
```

---

## 6. Failure Modes

| Scenario | Behavior | Error Code |
|----------|----------|------------|
| Suspend non-existent PID | DENY | `PROCESS_NOT_FOUND` |
| Suspend TERMINATED | DENY | `INVALID_STATE` |
| Resume RUNNING | No-op | (success) |
| Resume CRASHED | DENY | `CANNOT_RESUME_CRASHED` |
| SetPriority without permission | DENY | `FORBIDDEN` |
| Worker doesn't respond to suspend | Timeout, mark CRASHED | `SUSPEND_TIMEOUT` |

---

## 7. Backward Compatibility

### 7.1 Coexistence Strategy
| Component | v1 (15B Frozen) | v2 (15B.2) |
|-----------|-----------------|------------|
| Types | lib/process/types.ts | lib/process-v2/types.ts |
| Manager | lib/process/ProcessManager.ts | lib/process-v2/ProcessManagerV2.ts |
| API | /api/platform/process-intents | /api/platform/process-intents-v2 |
| Registry | /api/platform/process-registry | /api/platform/process-registry-v2 |
| UI | TaskManagerApp.tsx | TaskManagerV2.tsx |

### 7.2 Migration Path
1. v2 endpoints deployed alongside v1
2. v2 ProcessManager wraps v1 (extends, not replaces)
3. TaskManagerV2 queries both registries initially
4. After Phase 16, v1 deprecated

---

## 8. File Structure (New Only)

```
lib/process-v2/
├── types.ts           # Extended types (priority, suspend reason)
├── ProcessManagerV2.ts # Extended manager with suspend/resume
├── dispatchProcessIntentV2.ts
└── index.ts

app/api/platform/
├── process-intents-v2/route.ts   # New intents
└── process-registry-v2/route.ts  # Extended registry

coreos/ui/
└── TaskManagerV2.tsx  # v2 panel with suspend/resume buttons
```

---

## 9. Verifier Gates (D1-D5)

| Gate | Test | Expected |
|------|------|----------|
| D1 | Suspend RUNNING worker | state=SUSPENDED, OS responsive |
| D2 | Resume SUSPENDED worker | state=RUNNING, heartbeat resumes |
| D3 | SetPriority deterministic | registry reflects expected value |
| D4 | Suspend then ForceQuit | terminate wins, audit shows forceQuit |
| D5 | Resume after crash | DENY with CANNOT_RESUME_CRASHED |

---

## 10. Approval Checklist

- [ ] Intent schemas reviewed
- [ ] State machine approved
- [ ] Policy rules approved
- [ ] Backward compatibility acceptable
- [ ] Ready for implementation
