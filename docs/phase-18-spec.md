# Phase 18 — Notification Center (Spec Skeleton)

> **Status**: SPEC DRAFT — Not yet implemented
> **Baseline**: v0.44.2 @ 3e48b6d
> **Depends on**: Phase 15B (Process Model), Audit taxonomy, Governance Kernel

---

## Objective

Build a deterministic, governance-bound Notification Center that provides real-time user feedback for system events, process lifecycle changes, and cross-app communication.

The Notification Center is the **primary consumer** of the Process Model (Phase 15B), turning process state transitions into visible, actionable notifications.

### Key Outcomes
1. Users see real-time notifications for system events (app open/close, errors, security alerts)
2. Notifications are auditable and deterministic (same input → same notification)
3. Tray icon with unread badge in the menu bar
4. Notification list with filter/clear/mute capabilities
5. Governance-integrated: all notification events are audit-logged

---

## Non-Goals (Phase 18 Scope)

- ❌ Push notifications (browser/OS-level) — future phase
- ❌ Email/SMS notification delivery — out of scope
- ❌ Notification preferences per-app — v2 feature
- ❌ Rich media in notifications (images, video) — text-only for v1
- ❌ Notification grouping/threading — v2 feature

---

## Data Model

### NotificationRecord

```typescript
interface NotificationRecord {
    /** Unique notification ID */
    id: string;

    /** ISO 8601 timestamp */
    createdAt: string;

    /** Source that generated the notification */
    source: {
        type: 'system' | 'process' | 'app' | 'governance';
        id: string;           // e.g. pid, appId, 'kernel'
        label: string;        // Human-readable source name
    };

    /** Notification content */
    title: string;
    body: string;
    icon?: string;             // Emoji or icon identifier

    /** Severity level (maps to audit taxonomy) */
    severity: 'info' | 'warn' | 'error' | 'critical';

    /** Read/dismissed state */
    read: boolean;
    dismissedAt: string | null;

    /** Optional action (deep link or callback) */
    action?: {
        type: 'open_app' | 'navigate' | 'dismiss';
        target: string;       // capabilityId or URL
    };

    /** Integrity */
    integrity: {
        hash: string;          // SHA-256 of (source + title + body + createdAt)
    };
}
```

### NotificationState (Zustand Store)

```typescript
interface NotificationStoreState {
    notifications: NotificationRecord[];
    unreadCount: number;
    muted: boolean;

    // Actions
    push: (notification: Omit<NotificationRecord, 'id' | 'createdAt' | 'read' | 'dismissedAt' | 'integrity'>) => void;
    markRead: (id: string) => void;
    markAllRead: () => void;
    dismiss: (id: string) => void;
    clearAll: () => void;
    toggleMute: () => void;

    // Queries
    getBySource: (sourceId: string) => NotificationRecord[];
    getUnread: () => NotificationRecord[];
}
```

---

## Governance + Audit Requirements

### Audit Events (to add to taxonomy)

| Event | Severity | When |
|:---|:---|:---|
| `notification.pushed` | INFO | New notification created |
| `notification.read` | INFO | Notification marked as read |
| `notification.dismissed` | INFO | Notification dismissed |
| `notification.cleared` | WARN | All notifications cleared |
| `notification.mute.toggled` | INFO | Mute state changed |

### Governance Rules
1. All notifications MUST have an `integrity.hash` (SHA-256)
2. Notifications with `severity: 'critical'` MUST NOT be auto-dismissed
3. Governance/security notifications MUST NOT be mutable by user
4. Notification store MUST use the same persistence pattern as process store (localStorage)
5. Maximum 200 notifications retained (FIFO eviction for read notifications)

---

## UX Specification

### 🔔 Tray Icon (Menu Bar)
- Location: Top-right menu bar, next to "Logs" indicator
- States:
  - Default: 🔔 (no badge)
  - Unread: 🔔 with red badge showing count (max "99+")
  - Muted: 🔕 (no badge, greyed out)
- Click: Opens notification panel (dropdown or side panel)

### 📋 Notification List (Panel)
- Layout: Vertical list, newest first
- Each item shows:
  - Source icon + label
  - Title (bold) + body (truncated)
  - Timestamp (relative: "2m ago", "1h ago")
  - Severity indicator (color-coded left border)
  - Read/unread indicator (dot)
- Actions per item:
  - Click: Mark read + execute action (if defined)
  - Swipe/dismiss button: Remove from list

### 🧹 Controls (Panel Header)
- "Mark All Read" button
- "Clear All" button (with confirmation for unread items)
- "Mute" toggle
- Filter pills: All | Unread | Critical | System

### 🎨 Visual Design
- Follow NEXUS design system (`--nx-` tokens)
- Glassmorphism panel background (consistent with Spotlight overlay)
- Smooth entry/exit animations (slide from top-right)
- Severity colors:
  - Info: `--nx-text-secondary`
  - Warn: `--nx-warning` (amber)
  - Error: `--nx-error` (red)
  - Critical: `--nx-error` + pulse animation

---

## Determinism Rules

1. **Same event → same notification**: Given identical input (source, title, body, timestamp), the generated NotificationRecord MUST be identical
2. **Hash determinism**: `integrity.hash = SHA-256(stableStringify({source, title, body, createdAt}))` — uses the same `stableStringify` + `sha256Hex` from Phase 15B `hash-utils.ts`
3. **State machine**: Notification state transitions are one-way: `unread → read → dismissed`
4. **No side effects in push**: The `push()` action only adds to the store; it does NOT trigger external calls (audit is fire-and-forget)

---

## API Endpoints (JSON-Only)

All endpoints are server-side audit sinks — the client store is the source of truth.

| Method | Path | Purpose |
|:---|:---|:---|
| POST | `/api/os/notification/push` | Audit log: notification created |
| POST | `/api/os/notification/read` | Audit log: notification read |
| POST | `/api/os/notification/clear` | Audit log: notifications cleared |
| GET | `/api/os/notification/config` | Get notification config (mute state, retention) |

### Request Schema (push)
```json
{
    "source": { "type": "process", "id": "proc-xxx", "label": "Notes" },
    "title": "Note saved",
    "body": "Your note has been saved to user://notes/",
    "severity": "info"
}
```

### Response Schema
```json
{
    "ok": true,
    "auditId": "notif-push-1234567890",
    "timestamp": "2026-02-20T20:00:00.000Z"
}
```

---

## Storage Strategy

### Primary: localStorage (Client-Side)
- Key: `coreos_notification_registry`
- Format: JSON array of NotificationRecord
- Retention: Max 200 items (FIFO eviction for read items)
- Sync: On every push/dismiss/clear action

### Secondary: Firestore (Server-Side Audit Only)
- Collection: `audit_notifications`
- Purpose: Audit trail only — NOT used for notification display
- Retention: 90 days (configurable)
- Written via API endpoints (fire-and-forget from client)

### Why Not Firestore-First?
- Notifications must be **immediate** (no network latency)
- Offline support required (Phase 36 Offline Kernel)
- Process model (Phase 15B) established the localStorage-first pattern
- Firestore is audit sink, not source of truth

---

## Integration Points

### Phase 15B Process Model → Notification Center
```
Process state change → emit notification
  - spawn → "📱 {appTitle} opened"
  - terminate → "⏹️ {appTitle} closed"
  - error/crash → "⚠️ {appTitle} encountered an error" (severity: error)
```

### Governance Kernel → Notification Center
```
  - Integrity check failure → "🔒 Integrity check failed" (severity: critical)
  - Security escalation → "🛡️ Security event detected" (severity: warn)
```

### VFS (Phase 15A) → Notification Center
```
  - Permission denied → "🚫 Permission denied for {path}" (severity: warn)
  - File saved → "💾 File saved to {path}" (severity: info)
```

---

## Test Plan

### Unit Tests (Vitest)
| Test | Description |
|:---|:---|
| `push()` creates valid NotificationRecord | Fields populated, hash computed |
| `push()` enforces 200-item limit | Oldest read item evicted |
| `markRead()` transitions unread → read | Read flag set, dismissedAt null |
| `dismiss()` removes from active list | Record removed or marked |
| `clearAll()` clears all non-critical | Critical notifications preserved |
| `toggleMute()` toggles mute state | Muted flag toggled |
| `integrity.hash` is deterministic | Same input → same hash |
| `severity: critical` cannot be auto-dismissed | Explicit user action required |

### Integration Tests (Browser Subagent)
| Test | Description |
|:---|:---|
| Open app → notification appears | Spawn event triggers "App opened" notification |
| Close app → notification appears | Terminate event triggers "App closed" notification |
| Click notification → marks read | Unread count decrements |
| Mute → no visual badge | Bell icon changes to muted state |
| 200+ notifications → oldest evicted | FIFO eviction working |

---

## Exit Criteria

| Criteria | Verification |
|:---|:---|
| NotificationRecord type defined + exported | TypeScript compile |
| Zustand store with push/read/dismiss/clear/mute | Unit tests |
| SHA-256 integrity hash per notification | Unit test: determinism check |
| Audit taxonomy: +5 notification events | grep search |
| 4 API routes (push/read/clear/config) | build pass + integration |
| Tray icon with unread badge | Browser subagent screenshot |
| Notification panel with list/filter/clear | Browser subagent screenshot |
| Process model integration (spawn/terminate → notification) | Browser subagent: open app → notification |
| Build exit 0 | `npm run build` |
| Unit tests PASS | `npx vitest run` |
| Production deploy + parity table | 4-layer parity PASS |
| Manifest registered (`system.notifications`) | `coreos/manifests/index.ts` |

---

## File Plan (Estimated)

| File | Type | Purpose |
|:---|:---|:---|
| `coreos/notification/types.ts` | NEW | NotificationRecord, NotificationState types |
| `coreos/notification/notification-store.ts` | NEW | Zustand store + localStorage persistence |
| `coreos/notification/ui/NotificationTray.tsx` | NEW | Menu bar bell icon + badge |
| `coreos/notification/ui/NotificationPanel.tsx` | NEW | Dropdown panel with list/controls |
| `coreos/notification/ui/NotificationItem.tsx` | NEW | Individual notification row |
| `coreos/notification/notification-store.test.ts` | NEW | Unit tests |
| `app/api/os/notification/push/route.ts` | NEW | Audit: notification created |
| `app/api/os/notification/read/route.ts` | NEW | Audit: notification read |
| `app/api/os/notification/clear/route.ts` | NEW | Audit: notifications cleared |
| `app/api/os/notification/config/route.ts` | NEW | Get notification config |
| `coreos/manifests/system.notifications.ts` | NEW | Manifest for notification capability |
| `coreos/audit/taxonomy.ts` | MODIFY | +5 notification events |
| `coreos/types.ts` | MODIFY | +`system.notifications` in CapabilityId |
| `components/os-shell/OSShell.tsx` | MODIFY | Mount NotificationTray |
| `components/os-shell/OSShell.tsx` | MODIFY | Process lifecycle → notification push |
