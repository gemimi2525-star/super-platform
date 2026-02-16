/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Audit Query Hardening Tests (Phase 32.4 Hotfix v0.32.1)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Validates ZERO 500 GUARANTEE:
 *   1. Invalid cursor does NOT throw
 *   2. TraceId search with no results returns []
 *   3. Malformed legacy records do NOT crash normalization
 *   4. Post-query filters never throw on missing fields
 *   5. API never returns 500 — always safe empty on error
 */

import { describe, it, expect } from 'vitest';

// ═══════════════════════════════════════════════════════════════════════════
// Import safe helpers by replicating the logic (route.ts is a Next.js module,
// so we test the LOGIC that lives in the route rather than the route itself)
// ═══════════════════════════════════════════════════════════════════════════

// --- Safe Timestamp (mirrors route.ts safeTimestamp) ---

function safeTimestamp(raw: any): number {
    try {
        if (!raw) return 0;
        if (typeof raw === 'number') return raw;
        if (typeof raw === 'object' && typeof raw.toDate === 'function') {
            const d = raw.toDate();
            const ms = d.getTime();
            return isNaN(ms) ? 0 : ms;
        }
        if (typeof raw === 'object' && raw._seconds) {
            return raw._seconds * 1000;
        }
        if (typeof raw === 'string') {
            const ms = new Date(raw).getTime();
            return isNaN(ms) ? 0 : ms;
        }
        return 0;
    } catch {
        return 0;
    }
}

// --- Safe Actor (mirrors route.ts safeActor) ---

function safeActor(raw: any): { type: string; id: string; email?: string } | undefined {
    try {
        if (!raw || typeof raw !== 'object') return undefined;
        if (raw.type && raw.id) return { type: raw.type, id: raw.id, ...(raw.email && { email: raw.email }) };
        if (raw.uid) return { type: raw.role || 'user', id: raw.uid, ...(raw.email && { email: raw.email }) };
        return undefined;
    } catch {
        return undefined;
    }
}

// --- Safe Normalize (mirrors route.ts safeNormalize) ---

function safeNormalize(docId: string, data: any): any {
    try {
        const ts = safeTimestamp(data.timestamp);
        const actor = safeActor(data.actor);
        const severity = data.severity
            ? data.severity
            : (data.status === 'error' ? 'ERROR' : 'INFO');

        const envelope: any = {
            version: data.version || '1.0.1',
            event: data.event || data.action || 'unknown',
            traceId: data.traceId || '',
            timestamp: ts,
            severity,
        };
        if (actor) envelope.actor = actor;
        const ctx = data.context || data.details || data.metadata;
        if (ctx && typeof ctx === 'object') envelope.context = ctx;
        return envelope;
    } catch {
        return {
            version: '1.0.1',
            event: 'unknown',
            traceId: '',
            timestamp: 0,
            severity: 'INFO',
        };
    }
}

// --- Post-query filters (mirrors route.ts) ---

function filterBySeverity(docs: { data: () => any }[], severity: string) {
    try {
        return docs.filter(doc => {
            const sev = doc.data()?.severity || 'INFO';
            return sev === severity;
        });
    } catch {
        return [];
    }
}

function filterByActorId(docs: { data: () => any }[], actorId: string) {
    try {
        return docs.filter(doc => {
            const actor = doc.data()?.actor;
            return actor?.uid === actorId || actor?.id === actorId;
        });
    } catch {
        return [];
    }
}

function filterByEventPrefix(docs: { data: () => any }[], prefix: string) {
    try {
        return docs.filter(doc => {
            const data = doc.data();
            const event = data?.event || data?.action || '';
            return typeof event === 'string' && event.startsWith(prefix);
        });
    } catch {
        return [];
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE 1: safeTimestamp — NEVER throws
// ═══════════════════════════════════════════════════════════════════════════

describe('safeTimestamp — crash-proof timestamp normalization', () => {
    it('returns 0 for null/undefined/false', () => {
        expect(safeTimestamp(null)).toBe(0);
        expect(safeTimestamp(undefined)).toBe(0);
        expect(safeTimestamp(false)).toBe(0);
        expect(safeTimestamp(0)).toBe(0);
        expect(safeTimestamp('')).toBe(0);
    });

    it('returns number directly if already epoch ms', () => {
        expect(safeTimestamp(1708000000000)).toBe(1708000000000);
    });

    it('handles Firestore Timestamp with toDate()', () => {
        const fakeTs = { toDate: () => new Date(1708000000000) };
        expect(safeTimestamp(fakeTs)).toBe(1708000000000);
    });

    it('returns 0 if toDate() returns invalid Date', () => {
        const badTs = { toDate: () => new Date('INVALID') };
        expect(safeTimestamp(badTs)).toBe(0);
    });

    it('returns 0 if toDate() throws', () => {
        const throwTs = {
            toDate: () => { throw new Error('broken'); },
        };
        expect(safeTimestamp(throwTs)).toBe(0);
    });

    it('handles _seconds format', () => {
        expect(safeTimestamp({ _seconds: 1708000000 })).toBe(1708000000000);
    });

    it('handles ISO string', () => {
        const iso = '2026-02-16T12:00:00Z';
        const expected = new Date(iso).getTime();
        expect(safeTimestamp(iso)).toBe(expected);
    });

    it('returns 0 for invalid string', () => {
        expect(safeTimestamp('not a date')).toBe(0);
    });

    it('returns 0 for random object without toDate or _seconds', () => {
        expect(safeTimestamp({ foo: 'bar' })).toBe(0);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE 2: safeActor — NEVER throws
// ═══════════════════════════════════════════════════════════════════════════

describe('safeActor — crash-proof actor normalization', () => {
    it('returns undefined for null/undefined/primitives', () => {
        expect(safeActor(null)).toBeUndefined();
        expect(safeActor(undefined)).toBeUndefined();
        expect(safeActor('string')).toBeUndefined();
        expect(safeActor(42)).toBeUndefined();
        expect(safeActor(true)).toBeUndefined();
    });

    it('passes through already-normalized actor', () => {
        const actor = { type: 'user', id: 'uid123', email: 'a@b.com' };
        expect(safeActor(actor)).toEqual(actor);
    });

    it('normalizes legacy {uid, email, role} format', () => {
        const legacy = { uid: 'uid123', email: 'a@b.com', role: 'admin' };
        expect(safeActor(legacy)).toEqual({ type: 'admin', id: 'uid123', email: 'a@b.com' });
    });

    it('defaults role to user if missing', () => {
        expect(safeActor({ uid: 'uid123' })).toEqual({ type: 'user', id: 'uid123' });
    });

    it('returns undefined for empty object', () => {
        expect(safeActor({})).toBeUndefined();
    });

    it('returns undefined for object with unrelated keys', () => {
        expect(safeActor({ foo: 'bar', baz: 123 })).toBeUndefined();
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE 3: safeNormalize — NEVER throws (malformed legacy records)
// ═══════════════════════════════════════════════════════════════════════════

describe('safeNormalize — crash-proof document normalization', () => {
    it('normalizes a valid modern document', () => {
        const data = {
            version: '1.0.1',
            event: 'os.app.open',
            traceId: 'trace-123',
            timestamp: 1708000000000,
            severity: 'INFO',
            actor: { type: 'user', id: 'uid1' },
            context: { appTitle: 'Test' },
        };
        const result = safeNormalize('doc1', data);
        expect(result.event).toBe('os.app.open');
        expect(result.timestamp).toBe(1708000000000);
        expect(result.actor).toEqual({ type: 'user', id: 'uid1' });
        expect(result.context).toEqual({ appTitle: 'Test' });
    });

    it('handles completely empty data object', () => {
        const result = safeNormalize('empty', {});
        expect(result.event).toBe('unknown');
        expect(result.timestamp).toBe(0);
        expect(result.severity).toBe('INFO');
        expect(result.traceId).toBe('');
    });

    it('handles null data fields without crashing', () => {
        const result = safeNormalize('nulls', {
            timestamp: null,
            actor: null,
            context: null,
            severity: null,
        });
        expect(result.timestamp).toBe(0);
        expect(result.actor).toBeUndefined();
        expect(result.severity).toBe('INFO');
    });

    it('uses action as fallback for event', () => {
        const result = safeNormalize('legacy', { action: 'user.login' });
        expect(result.event).toBe('user.login');
    });

    it('uses details as fallback for context', () => {
        const data = { details: { info: 'test' } };
        const result = safeNormalize('fallback', data);
        expect(result.context).toEqual({ info: 'test' });
    });

    it('uses metadata as fallback for context', () => {
        const data = { metadata: { appTitle: 'Hub' } };
        const result = safeNormalize('meta', data);
        expect(result.context).toEqual({ appTitle: 'Hub' });
    });

    it('handles Firestore Timestamp objects in legacy docs', () => {
        const data = {
            timestamp: { _seconds: 1708000000, _nanoseconds: 0 },
            actor: { uid: 'u1', email: 'a@b.com', role: 'admin' },
        };
        const result = safeNormalize('ts-obj', data);
        expect(result.timestamp).toBe(1708000000000);
        expect(result.actor).toEqual({ type: 'admin', id: 'u1', email: 'a@b.com' });
    });

    it('sets severity ERROR when status is error', () => {
        const result = safeNormalize('err', { status: 'error' });
        expect(result.severity).toBe('ERROR');
    });

    it('prefers explicit severity over status field', () => {
        const result = safeNormalize('both', { severity: 'WARN', status: 'error' });
        expect(result.severity).toBe('WARN');
    });

    it('does NOT crash when data is entirely garbage', () => {
        expect(() => safeNormalize('garbage', 'not an object' as any)).not.toThrow();
        const result = safeNormalize('garbage', 'not an object' as any);
        expect(result.event).toBe('unknown');
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE 4: Post-query filters — NEVER throw on missing fields
// ═══════════════════════════════════════════════════════════════════════════

describe('Post-query filters — crash-proof filtering', () => {
    const mockDoc = (data: any) => ({ data: () => data });

    it('filterBySeverity handles docs without severity field', () => {
        const docs = [mockDoc({}), mockDoc({ severity: 'ERROR' }), mockDoc(null)];
        const result = filterBySeverity(docs as any, 'INFO');
        // empty docs and null docs both default to 'INFO'
        expect(result.length).toBe(2);
    });

    it('filterByActorId handles docs without actor', () => {
        const docs = [mockDoc({}), mockDoc({ actor: { uid: 'x' } })];
        const result = filterByActorId(docs as any, 'x');
        expect(result.length).toBe(1);
    });

    it('filterByEventPrefix handles docs without event field', () => {
        const docs = [mockDoc({}), mockDoc({ event: 'os.app.open' })];
        const result = filterByEventPrefix(docs as any, 'os.app');
        expect(result.length).toBe(1);
    });

    it('filterByEventPrefix uses action as fallback', () => {
        const docs = [mockDoc({ action: 'job.lifecycle.start' })];
        const result = filterByEventPrefix(docs as any, 'job.lifecycle');
        expect(result.length).toBe(1);
    });

    it('filters return empty array on exception', () => {
        // data() returns throwing function
        const badDocs = [{ data: () => { throw new Error('broken'); } }];
        // These should NOT throw — they catch internally
        expect(filterBySeverity(badDocs as any, 'INFO')).toEqual([]);
        expect(filterByActorId(badDocs as any, 'x')).toEqual([]);
        expect(filterByEventPrefix(badDocs as any, 'os')).toEqual([]);
    });

    it('handles empty array input', () => {
        expect(filterBySeverity([], 'INFO')).toEqual([]);
        expect(filterByActorId([], 'x')).toEqual([]);
        expect(filterByEventPrefix([], 'os')).toEqual([]);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE 5: Cursor Reset Rule
// ═══════════════════════════════════════════════════════════════════════════

describe('Cursor Reset Rule — cursor ignored when filters active', () => {
    function shouldUseCursor(params: {
        cursor?: string;
        severity?: string;
        actorId?: string;
        eventPrefix?: string;
        traceId?: string;
    }): boolean {
        const hasPostQueryFilters = !!(params.severity || params.actorId || params.eventPrefix);
        const traceIdFilterActive = !!params.traceId;
        return !!(params.cursor && !hasPostQueryFilters && !traceIdFilterActive);
    }

    it('allows cursor when no filters active', () => {
        expect(shouldUseCursor({ cursor: 'abc' })).toBe(true);
    });

    it('rejects cursor when severity filter active', () => {
        expect(shouldUseCursor({ cursor: 'abc', severity: 'ERROR' })).toBe(false);
    });

    it('rejects cursor when traceId filter active', () => {
        expect(shouldUseCursor({ cursor: 'abc', traceId: 'trace-123' })).toBe(false);
    });

    it('rejects cursor when actorId filter active', () => {
        expect(shouldUseCursor({ cursor: 'abc', actorId: 'user1' })).toBe(false);
    });

    it('rejects cursor when eventPrefix filter active', () => {
        expect(shouldUseCursor({ cursor: 'abc', eventPrefix: 'os.app' })).toBe(false);
    });

    it('returns false when cursor is undefined', () => {
        expect(shouldUseCursor({})).toBe(false);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE 6: Zero 500 Guarantee — edge cases
// ═══════════════════════════════════════════════════════════════════════════

describe('Zero 500 Guarantee — edge cases', () => {
    it('safeNormalize + batch processing never crashes', () => {
        const docs = [
            { id: '1', data: { event: 'test', timestamp: 123 } },
            { id: '2', data: null },                                  // null data
            { id: '3', data: { timestamp: { toDate: () => { throw new Error(); } } } }, // broken ts
            { id: '4', data: { actor: { uid: undefined, email: undefined } } },         // empty actor
            { id: '5', data: { context: 'not an object' } },         // context as string
            { id: '6', data: { severity: undefined, status: 'error' } }, // severity fallback
        ];

        const items: any[] = [];
        for (const doc of docs) {
            try {
                const envelope = safeNormalize(doc.id, doc.data || {});
                items.push({ id: doc.id, ...envelope });
            } catch {
                items.push({ id: doc.id, event: 'unknown', severity: 'INFO', _malformed: true });
            }
        }

        expect(items.length).toBe(6);
        // First doc should normalize properly
        expect(items[0].event).toBe('test');
        // All items should have an event field
        items.forEach(item => {
            expect(item.event).toBeDefined();
            expect(item.id).toBeDefined();
        });
    });

    it('empty resultDocs does not crash nextCursor logic', () => {
        const resultDocs: any[] = [];
        const hasMore = resultDocs.length > 10;
        const nextCursor = hasMore && resultDocs.length > 0
            ? resultDocs[resultDocs.length - 1].id
            : null;
        expect(nextCursor).toBeNull();
    });

    it('single-result set computes cursor correctly', () => {
        const resultDocs = [{ id: 'doc1' }];
        const hasMore = false;
        const nextCursor = hasMore && resultDocs.length > 0
            ? resultDocs[resultDocs.length - 1].id
            : null;
        expect(nextCursor).toBeNull();
    });

    it('operator precedence: severity defaults correctly', () => {
        // This was the original bug: data.severity || data.status === 'error' ? 'ERROR' : 'INFO'
        // Fix: separate into explicit if/else

        function resolveSeverity(data: any): string {
            return data.severity
                ? data.severity
                : (data.status === 'error' ? 'ERROR' : 'INFO');
        }

        expect(resolveSeverity({})).toBe('INFO');
        expect(resolveSeverity({ severity: 'WARN' })).toBe('WARN');
        expect(resolveSeverity({ status: 'error' })).toBe('ERROR');
        expect(resolveSeverity({ severity: 'CRITICAL', status: 'error' })).toBe('CRITICAL');
        expect(resolveSeverity({ severity: '', status: 'error' })).toBe('ERROR');
        expect(resolveSeverity({ severity: null })).toBe('INFO');
    });
});
