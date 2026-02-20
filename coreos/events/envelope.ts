/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OS EVENT BUS — Envelope Factory (Phase 18.5)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Deterministic envelope creation with monotonic sequencing.
 * Same ts+seq+payload → same identity (no random components in id).
 *
 * @module coreos/events/envelope
 */

import type { OSEventEnvelope, OSEventInput } from './types';

// ─── Monotonic Counter ─────────────────────────────────────────────────

let _seq = 0;

/** Reset sequence counter (dev/test only) */
export function resetSeq(): void {
    _seq = 0;
}

// ─── ID Generator ──────────────────────────────────────────────────────

/**
 * Deterministic event ID: timestamp (ms hex) + seq (4-digit padded)
 * Format: `evt-{tsHex}-{seqPadded}`
 */
function generateEventId(ts: number, seq: number): string {
    return `evt-${ts.toString(16)}-${seq.toString().padStart(6, '0')}`;
}

// ─── Envelope Factory ──────────────────────────────────────────────────

export function createEventEnvelope(input: OSEventInput): OSEventEnvelope {
    const now = Date.now();
    const seq = ++_seq;
    const ts = new Date(now).toISOString();

    return {
        id: generateEventId(now, seq),
        ts,
        seq,
        type: input.type,
        domain: input.domain,
        actor: {}, // Filled by bus or caller if session available
        source: input.source,
        severity: input.severity ?? 'info',
        dedupeKey: input.dedupeKey,
        payload: input.payload ?? {},
    };
}
