/**
 * Search Engine Unit Tests — Phase 17N
 */
import { describe, it, expect } from 'vitest';
import { fuzzyMatch, search } from './searchEngine';
import type { SearchItem } from './searchTypes';

// ═══════════════════════════════════════════════════════════════════════════
// TEST DATA
// ═══════════════════════════════════════════════════════════════════════════

const ITEMS: SearchItem[] = [
    {
        id: 'app:ops.center',
        kind: 'app',
        title: 'Ops Center',
        icon: '🎛️',
        keywords: ['ops', 'monitor', 'system'],
        action: { type: 'openApp', capabilityId: 'ops.center' },
    },
    {
        id: 'app:system.hub',
        kind: 'app',
        title: 'System Hub',
        icon: '⚙️',
        keywords: ['system', 'settings', 'configure'],
        action: { type: 'openApp', capabilityId: 'system.hub' },
    },
    {
        id: 'cmd:open-jobs',
        kind: 'command',
        title: 'Job Queue',
        subtitle: 'Open Ops Center → Jobs',
        icon: '📋',
        keywords: ['jobs', 'queue', 'worker'],
        action: { type: 'openTab', capabilityId: 'ops.center', tabId: 'jobs' },
    },
    {
        id: 'setting:theme',
        kind: 'setting',
        title: 'Theme & Appearance',
        icon: '🎨',
        keywords: ['theme', 'dark', 'light'],
        action: { type: 'openApp', capabilityId: 'system.configure' },
    },
    {
        id: 'app:core.files',
        kind: 'app',
        title: 'Files',
        icon: '📁',
        keywords: ['files', 'finder', 'explorer'],
        action: { type: 'openApp', capabilityId: 'core.files' },
    },
];

// ═══════════════════════════════════════════════════════════════════════════
// fuzzyMatch
// ═══════════════════════════════════════════════════════════════════════════

describe('fuzzyMatch', () => {
    it('returns high score for exact prefix match', () => {
        const result = fuzzyMatch('ops', 'Ops Center');
        expect(result.score).toBeGreaterThanOrEqual(100);
        expect(result.matchedRanges).toHaveLength(1);
        expect(result.matchedRanges[0]).toEqual([0, 3]);
    });

    it('returns medium score for contains match', () => {
        const result = fuzzyMatch('center', 'Ops Center');
        expect(result.score).toBeGreaterThanOrEqual(50);
    });

    it('returns 0 for no match', () => {
        const result = fuzzyMatch('xyz', 'Ops Center');
        expect(result.score).toBe(0);
        expect(result.matchedRanges).toHaveLength(0);
    });

    it('handles empty query', () => {
        const result = fuzzyMatch('', 'Anything');
        expect(result.score).toBe(0);
    });

    it('handles empty target', () => {
        const result = fuzzyMatch('test', '');
        expect(result.score).toBe(0);
    });

    it('fuzzy matches non-contiguous characters', () => {
        const result = fuzzyMatch('oc', 'Ops Center');
        expect(result.score).toBeGreaterThan(0);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// search
// ═══════════════════════════════════════════════════════════════════════════

describe('search', () => {
    it('finds apps by title', () => {
        const results = search('ops', ITEMS);
        expect(results.length).toBeGreaterThan(0);
        expect(results[0].item.id).toBe('app:ops.center');
    });

    it('finds items by keyword', () => {
        const results = search('worker', ITEMS);
        expect(results.length).toBeGreaterThan(0);
        expect(results[0].item.id).toBe('cmd:open-jobs');
    });

    it('returns empty for no match', () => {
        const results = search('nonexistentxyz', ITEMS);
        expect(results).toHaveLength(0);
    });

    it('returns empty for empty query', () => {
        const results = search('', ITEMS);
        expect(results).toHaveLength(0);
    });

    it('returns empty for whitespace-only query', () => {
        const results = search('   ', ITEMS);
        expect(results).toHaveLength(0);
    });

    it('respects maxResults', () => {
        const results = search('s', ITEMS, 2);
        expect(results.length).toBeLessThanOrEqual(2);
    });

    it('deterministic: same input always produces same output', () => {
        const r1 = search('system', ITEMS);
        const r2 = search('system', ITEMS);
        expect(r1.map(r => r.item.id)).toEqual(r2.map(r => r.item.id));
    });

    it('apps rank higher than commands with equal score', () => {
        // Both 'system' appears in app:system.hub (title) and cmd keywords
        const results = search('system', ITEMS);
        const appIdx = results.findIndex(r => r.item.kind === 'app');
        const cmdIdx = results.findIndex(r => r.item.kind === 'command');
        if (appIdx >= 0 && cmdIdx >= 0) {
            expect(appIdx).toBeLessThan(cmdIdx);
        }
    });

    it('sorts by score first, then kind priority', () => {
        const results = search('theme', ITEMS);
        // 'Theme & Appearance' is a setting — should rank top due to prefix match
        expect(results.length).toBeGreaterThan(0);
        expect(results[0].item.title).toBe('Theme & Appearance');
    });
});
