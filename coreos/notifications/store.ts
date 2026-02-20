/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NOTIFICATION CENTER — Zustand Store (Phase 18)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Client-side notification store with localStorage persistence.
 * Follows the same pattern as process-store (Phase 15B).
 *
 * Rules:
 * - Every mutation calls API route first (fire-and-forget audit)
 * - Deterministic ordering: ts DESC, then id
 * - Max 200 notifications (FIFO eviction for cleared items)
 * - No shadow logic — all policy flows through API
 *
 * @module coreos/notifications/store
 */

import { create } from 'zustand';
import type {
    NotificationStoreState,
    NotificationRecord,
    CreateNotificationInput,
} from './types';
import { dedupeKey } from './types';

// ─── Config ────────────────────────────────────────────────────────────

const STORAGE_KEY = 'coreos_notification_registry';
const MAX_NOTIFICATIONS = 200;
const DEDUPE_WINDOW_MS = 5_000; // 5 seconds

// ─── ID Generation (ULID-like: timestamp + random) ─────────────────────

function generateNotificationId(): string {
    const ts = Date.now().toString(36).padStart(9, '0');
    const rand = Math.random().toString(36).substring(2, 8);
    return `notif-${ts}-${rand}`;
}

// ─── Persistence ───────────────────────────────────────────────────────

function saveToStorage(notifications: Record<string, NotificationRecord>): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch {
        // localStorage full or unavailable — silent fail
    }
}

function loadFromStorage(): Record<string, NotificationRecord> {
    if (typeof window === 'undefined') return {};
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return {};
        return JSON.parse(raw) as Record<string, NotificationRecord>;
    } catch {
        return {};
    }
}

// ─── Audit Logger (fire-and-forget) ────────────────────────────────────

function emitNotificationAudit(
    route: string,
    data: Record<string, unknown>,
): void {
    fetch(`/api/os/notifications/${route}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    }).catch(() => {
        // Fire-and-forget: audit failure must not block UI
    });
}

// ─── Eviction ──────────────────────────────────────────────────────────

function evictIfNeeded(
    notifications: Record<string, NotificationRecord>,
): Record<string, NotificationRecord> {
    const entries = Object.entries(notifications);
    if (entries.length <= MAX_NOTIFICATIONS) return notifications;

    // Sort: cleared first, then oldest ts
    entries.sort(([, a], [, b]) => {
        if (a.clearedAt && !b.clearedAt) return -1;
        if (!a.clearedAt && b.clearedAt) return 1;
        return a.ts < b.ts ? -1 : 1;
    });

    // Remove oldest until under limit
    const toRemove = entries.length - MAX_NOTIFICATIONS;
    const removeIds = entries.slice(0, toRemove).map(([id]) => id);
    const result = { ...notifications };
    for (const id of removeIds) {
        delete result[id];
    }
    return result;
}

// ─── Store ─────────────────────────────────────────────────────────────

export const useNotificationStore = create<NotificationStoreState>((set, get) => ({
    notifications: loadFromStorage(),

    // ─── Create ────────────────────────────────────────────────────────
    create: (input: CreateNotificationInput): NotificationRecord => {
        const state = get();

        // Dedupe check: same key within window → skip
        const key = dedupeKey(input);
        const allNotifs = Object.values(state.notifications);
        const recentDupe = allNotifs.find(n => {
            if (n.clearedAt) return false;
            const nKey = dedupeKey({
                severity: n.severity,
                source: n.source,
                title: n.title,
                body: n.body,
                meta: n.meta,
            });
            if (nKey !== key) return false;
            const age = Date.now() - new Date(n.ts).getTime();
            return age < DEDUPE_WINDOW_MS;
        });

        if (recentDupe) return recentDupe;

        const now = new Date().toISOString();
        const id = generateNotificationId();

        const record: NotificationRecord = {
            id,
            ts: now,
            severity: input.severity,
            source: input.source,
            title: input.title,
            body: input.body,
            readAt: null,
            clearedAt: null,
            muted: false,
            meta: input.meta,
        };

        set(state => {
            const updated = evictIfNeeded({
                ...state.notifications,
                [id]: record,
            });
            saveToStorage(updated);
            return { notifications: updated };
        });

        // Fire-and-forget audit
        emitNotificationAudit('create', {
            id,
            severity: input.severity,
            source: input.source,
            title: input.title,
            body: input.body,
            meta: input.meta,
        });

        return record;
    },

    // ─── Mark Read ─────────────────────────────────────────────────────
    markRead: (id: string): void => {
        set(state => {
            const existing = state.notifications[id];
            if (!existing || existing.readAt) return state;

            const now = new Date().toISOString();
            const updated = {
                ...state.notifications,
                [id]: { ...existing, readAt: now },
            };
            saveToStorage(updated);
            return { notifications: updated };
        });

        emitNotificationAudit('read', { id });
    },

    // ─── Clear ─────────────────────────────────────────────────────────
    clear: (id: string): void => {
        set(state => {
            const existing = state.notifications[id];
            if (!existing || existing.clearedAt) return state;

            const now = new Date().toISOString();
            const updated = {
                ...state.notifications,
                [id]: { ...existing, clearedAt: now, readAt: existing.readAt || now },
            };
            saveToStorage(updated);
            return { notifications: updated };
        });

        emitNotificationAudit('clear', { id });
    },

    // ─── Mute Source ───────────────────────────────────────────────────
    muteSource: (appId: string, muted: boolean): void => {
        set(state => {
            const updated = { ...state.notifications };
            for (const [nid, n] of Object.entries(updated)) {
                if (n.source.appId === appId) {
                    updated[nid] = { ...n, muted };
                }
            }
            saveToStorage(updated);
            return { notifications: updated };
        });

        emitNotificationAudit('mute', { appId, muted });
    },

    // ─── Queries ───────────────────────────────────────────────────────
    listActive: (): NotificationRecord[] => {
        return Object.values(get().notifications)
            .filter(n => !n.clearedAt && !n.muted)
            .sort((a, b) => b.ts.localeCompare(a.ts));
    },

    listAll: (): NotificationRecord[] => {
        return Object.values(get().notifications)
            .sort((a, b) => b.ts.localeCompare(a.ts));
    },

    getUnreadCount: (): number => {
        return Object.values(get().notifications)
            .filter(n => !n.readAt && !n.clearedAt && !n.muted)
            .length;
    },
}));
