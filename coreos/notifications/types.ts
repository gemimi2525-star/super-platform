/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NOTIFICATION CENTER — Types (Phase 18)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Defines the data model for the Notification Center.
 * Every notification is deterministic: same input → same output.
 *
 * @module coreos/notifications/types
 */

// ─── Severity ──────────────────────────────────────────────────────────

export type NotificationSeverity = 'info' | 'warning' | 'error';

// ─── Source ────────────────────────────────────────────────────────────

export type NotificationDomain = 'os' | 'app' | 'system';

export interface NotificationSource {
    readonly appId: string;
    readonly domain: NotificationDomain;
}

// ─── Metadata ──────────────────────────────────────────────────────────

export interface NotificationMeta {
    readonly pid?: string;
    readonly capabilityId?: string;
    readonly traceId?: string;
    readonly route?: string;
}

// ─── NotificationRecord ────────────────────────────────────────────────

export interface NotificationRecord {
    /** Unique notification ID (ULID-like: timestamp + random) */
    readonly id: string;

    /** ISO 8601 creation timestamp */
    readonly ts: string;

    /** Severity level */
    readonly severity: NotificationSeverity;

    /** Origin of the notification */
    readonly source: NotificationSource;

    /** Title (required, short) */
    readonly title: string;

    /** Body (optional, longer description) */
    readonly body?: string;

    /** Marked-read timestamp (null = unread) */
    readAt: string | null;

    /** Cleared timestamp (null = active, non-null = terminal) */
    clearedAt: string | null;

    /** Whether this source is muted */
    muted?: boolean;

    /** Optional metadata for tracing */
    readonly meta?: NotificationMeta;
}

// ─── Store State ───────────────────────────────────────────────────────

export interface NotificationStoreState {
    notifications: Record<string, NotificationRecord>;

    // Actions
    create: (input: CreateNotificationInput) => NotificationRecord;
    markRead: (id: string) => void;
    clear: (id: string) => void;
    muteSource: (appId: string, muted: boolean) => void;

    // Queries
    listActive: () => NotificationRecord[];
    listAll: () => NotificationRecord[];
    getUnreadCount: () => number;
}

// ─── Input ─────────────────────────────────────────────────────────────

export interface CreateNotificationInput {
    severity: NotificationSeverity;
    source: NotificationSource;
    title: string;
    body?: string;
    meta?: NotificationMeta;
}

// ─── Dedupe Key ────────────────────────────────────────────────────────

/**
 * Generate a dedupe key for a notification to prevent duplicates.
 * Two notifications with the same key within a short window are considered duplicates.
 */
export function dedupeKey(input: CreateNotificationInput): string {
    return `${input.source.appId}:${input.source.domain}:${input.severity}:${input.title}`;
}
