/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OS EVENT BUS — Core (Phase 18.5)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Deterministic in-memory event bus for CORE OS.
 * Module singleton — no React/Zustand coupling.
 *
 * Design principles:
 * - publish() creates canonical envelope, checks dedupe, notifies subscribers
 * - subscribe() returns unsubscribe() cleanup
 * - Bus is runtime pipeline only — NOT a source of truth (audit remains canonical)
 * - No network calls — sinks handle I/O
 *
 * @module coreos/events/bus
 */

import type {
    OSEventEnvelope,
    OSEventInput,
    OSEventHandler,
    OSEventFilter,
} from './types';
import { createEventEnvelope, resetSeq } from './envelope';
import {
    incrementPublished,
    incrementDelivered,
    incrementDeduped,
    incrementDropped,
    setBufferSize,
    resetMetrics,
} from './metrics';
import { shouldPublish, resetGuards } from './guards';

// ─── Configuration ─────────────────────────────────────────────────────

const MAX_EVENTS = 200;
const DEDUPE_WINDOW_MS = 2000;

// ─── Internal State ────────────────────────────────────────────────────

interface Subscription {
    id: number;
    filter: OSEventFilter;
    handler: OSEventHandler;
}

let _events: OSEventEnvelope[] = [];
let _subscriptions: Subscription[] = [];
let _subIdCounter = 0;

/** Map of dedupeKey → last seen timestamp (ms) */
const _dedupeMap = new Map<string, number>();

// ─── Filter Matching ───────────────────────────────────────────────────

function matchesFilter(event: OSEventEnvelope, filter: OSEventFilter): boolean {
    if (typeof filter === 'function') {
        return filter(event);
    }
    if (filter.endsWith('.*')) {
        const prefix = filter.slice(0, -2);
        return event.type.startsWith(prefix + '.');
    }
    return event.type === filter;
}

// ─── Dedupe Check ──────────────────────────────────────────────────────

function isDuplicate(dedupeKey: string | undefined): boolean {
    if (!dedupeKey) return false;

    const now = Date.now();
    const lastSeen = _dedupeMap.get(dedupeKey);

    if (lastSeen && now - lastSeen < DEDUPE_WINDOW_MS) {
        if (process.env.NODE_ENV === 'development') {
            console.debug('[EventBus] Dedupe skip:', dedupeKey);
        }
        return true;
    }

    _dedupeMap.set(dedupeKey, now);
    return false;
}

/** Prune stale dedupe entries (older than window) */
function pruneDedupe(): void {
    const now = Date.now();
    for (const [key, ts] of _dedupeMap) {
        if (now - ts > DEDUPE_WINDOW_MS * 2) {
            _dedupeMap.delete(key);
        }
    }
}

// ─── Public API ────────────────────────────────────────────────────────

/**
 * Publish an event to the bus.
 * Creates a canonical envelope, checks dedupe, stores in ring buffer,
 * and notifies all matching subscribers.
 *
 * @returns The created envelope, or null if deduped
 */
export function publish(input: OSEventInput): OSEventEnvelope | null {
    // Dedupe check
    if (isDuplicate(input.dedupeKey)) {
        incrementDeduped(); // Phase 23: metrics
        return null;
    }

    // Phase 23: Guard check (throttle high-frequency events)
    const guard = shouldPublish(input.type);
    if (!guard.allowed) {
        incrementDropped();
        if (process.env.NODE_ENV === 'development') {
            console.debug(`[EventBus] Guard denied: ${input.type} — ${guard.reason}`);
        }
        return null;
    }

    // Create canonical envelope
    const envelope = createEventEnvelope(input);

    // Store in ring buffer (FIFO eviction)
    _events.push(envelope);
    if (_events.length > MAX_EVENTS) {
        _events = _events.slice(-MAX_EVENTS);
    }
    setBufferSize(_events.length); // Phase 23: metrics

    // Prune stale dedupe entries periodically
    if (_events.length % 50 === 0) {
        pruneDedupe();
    }

    // Notify subscribers
    let deliveredCount = 0;
    for (const sub of _subscriptions) {
        try {
            if (matchesFilter(envelope, sub.filter)) {
                sub.handler(envelope);
                deliveredCount++;
            }
        } catch (err) {
            console.error('[EventBus] Subscriber error:', err);
        }
    }

    // Phase 23: metrics
    incrementPublished(envelope.type);
    incrementDelivered(deliveredCount);

    if (process.env.NODE_ENV === 'development') {
        console.debug(`[EventBus] Published: ${envelope.type} (seq=${envelope.seq})`);
    }

    return envelope;
}

/**
 * Subscribe to events matching a filter.
 *
 * @param filter - Event type string, wildcard pattern (`process.*`), or predicate function
 * @param handler - Callback receiving the event envelope
 * @returns Unsubscribe function
 */
export function subscribe(
    filter: OSEventFilter,
    handler: OSEventHandler,
): () => void {
    const id = ++_subIdCounter;
    const sub: Subscription = { id, filter, handler };
    _subscriptions.push(sub);

    return () => {
        _subscriptions = _subscriptions.filter(s => s.id !== id);
    };
}

/**
 * List recent events from the ring buffer.
 * Ordered by (ts asc, seq asc) — most recent last.
 */
export function listRecent(limit = 200): readonly OSEventEnvelope[] {
    return _events.slice(-limit);
}

/**
 * Reset all bus state. Dev/test only.
 */
export function reset(): void {
    if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test') {
        console.warn('[EventBus] reset() called in non-dev environment — ignored');
        return;
    }
    _events = [];
    _subscriptions = [];
    _subIdCounter = 0;
    _dedupeMap.clear();
    resetSeq();
    resetMetrics(); // Phase 23
    resetGuards(); // Phase 23
    console.log('[EventBus] Reset complete');
}
