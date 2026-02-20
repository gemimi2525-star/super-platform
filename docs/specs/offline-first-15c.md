# Offline-First Architecture — Phase 15C

> Core OS Offline Experience: Ops/Jobs Tier 1

## 1. Scope Lock

Phase 15C covers **Ops/Jobs offline** only:
- ✅ Read-only offline (cached jobs list)
- ✅ Queued actions offline (suspend/resume/priority via outbox)
- ✅ Background sync on reconnect
- ❌ VFS offline (future)
- ❌ Notes offline (future)
- ❌ App Runtime offline (future)

## 2. Offline Tiers

| Tier | Capability | Implementation |
|:---|:---|:---|
| **0: Read-only** | Shell + Ops load offline, show cached data | SW navigation cache + `useOfflineData` hook |
| **1: Queued writes** | Actions persist to outbox, replay on reconnect | `SyncQueue` + `OfflineBanner` auto-replay |
| **2: Background sync** | Conflict detection + resolution | Server-side idempotency + `ConflictStore` |

## 3. Existing Infrastructure (Phase 36)

| Module | Purpose |
|:---|:---|
| `public/sw.js` | Navigation cache (/os, /ops), static asset cache, offline.html fallback |
| `coreos/connectivity.ts` | ConnectivityMonitor: ONLINE / OFFLINE / DEGRADED |
| `coreos/offline/offlineStore.ts` | localStorage TTL cache |
| `coreos/offline/syncQueue.ts` | Outbox: enqueue, processQueue, idempotencyKey, retry (3x), X-Idempotency-Key header |
| `coreos/offline/useOfflineData.ts` | React hook: fetch → cache → offline fallback + stale indicator |
| `coreos/offline/OfflineBanner.tsx` | Banner: offline / syncing / reconnecting / conflict states |

## 4. Outbox Model

Already implemented in `syncQueue.ts`:

```typescript
interface SyncQueueItem {
    id: string;
    url: string;
    method: 'POST' | 'PUT' | 'PATCH';
    body: unknown;
    headers?: Record<string, string>;
    createdAt: number;
    retryCount: number;
    idempotencyKey: string;  // crypto.randomUUID()
    status: 'pending' | 'processing' | 'completed' | 'failed';
    lastError?: string;
}
```

Headers sent on replay:
- `X-Idempotency-Key: <uuid>`
- `X-Offline-Queued: true`

## 5. Replay Rules

- **Trigger**: `OfflineBanner` calls `processQueue()` when connectivity returns to ONLINE
- **Idempotent**: Server-side operations are no-op on duplicate state transitions
- **Retry**: 3 attempts with server-error retry; 4xx = permanent failure
- **Dedupe**: Each outbox item has a unique `idempotencyKey`

## 6. Conflict Policy

| Domain | Policy | Rationale |
|:---|:---|:---|
| Priority update | Last-write-wins | Safe metadata; server always authoritative |
| Suspend/Resume | Validate allowed states | State machine enforced server-side; returns 4xx if invalid |
| Terminal jobs | Reject (4xx) | Cannot modify COMPLETED/FAILED/DEAD |

If conflict: item marked `failed` with lastError, **no auto-destructive action**.

## 7. Data Flow

```
User clicks "Pause" (offline)
    ↓
navigator.onLine === false?
    ├─ YES → fetch('/api/jobs/:id/suspend')  (normal path)
    └─ NO  → getSyncQueue().enqueue(url, 'POST', {})
              ↓
           UI shows "QUEUED" badge (optimistic)
              ↓
           [user reconnects]
              ↓
           OfflineBanner detects ONLINE
              ↓
           processQueue() → replays POST /api/jobs/:id/suspend
              ↓
           Server responds 200 → markAcked → refresh jobs list
```
