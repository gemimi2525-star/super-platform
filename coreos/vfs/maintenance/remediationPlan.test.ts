/**
 * ═══════════════════════════════════════════════════════════════════════════
 * VFS REMEDIATION PLAN — UNIT TESTS (Phase 37C)
 * ═══════════════════════════════════════════════════════════════════════════
 */

import {
    generatePlan,
    selectWinnerAndSort,
    generateSuffixedName,
    splitNameAndExtension,
    formatPlanReport,
} from './remediationPlan';
import type { ScanResult, DuplicateEntry } from './duplicateScan';

// ─── Helpers ────────────────────────────────────────────────────────────

function makeScanResult(groups: {
    parentPath: string;
    canonicalKey: string;
    normalizedName: string;
    entries: DuplicateEntry[];
}[]): ScanResult {
    return {
        scannedDirs: 1,
        totalEntries: groups.reduce((sum, g) => sum + g.entries.length, 0),
        duplicateGroups: groups,
        timestamp: 1700000000000,
        scope: 'user://',
    };
}

function makeEntry(name: string, createdAt: number = 0, type = 'file'): DuplicateEntry {
    return {
        name,
        type,
        size: 100,
        createdAt,
        path: `user://docs/${name}`,
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE
// ═══════════════════════════════════════════════════════════════════════════

describe('remediationPlan — Phase 37C', () => {

    // ─── 1. Winner = earliest createdAt ─────────────────────────────────

    test('winner is the entry with earliest createdAt', () => {
        const scan = makeScanResult([{
            parentPath: 'user://docs',
            canonicalKey: 'abc123',
            normalizedName: 'readme',
            entries: [
                makeEntry('README', 3000),
                makeEntry('readme', 1000),
                makeEntry('Readme', 2000),
            ],
        }]);

        const plan = generatePlan(scan);

        // Winner = readme (createdAt=1000, earliest)
        const keep = plan.actions.find(a => a.type === 'KEEP');
        expect(keep).toBeDefined();
        expect(keep!.originalName).toBe('readme');

        // Others get renamed
        const renames = plan.actions.filter(a => a.type === 'RENAME');
        expect(renames).toHaveLength(2);
    });

    // ─── 2. Tie-break = lexical order ───────────────────────────────────

    test('tie-break uses lexicographic order when createdAt is same', () => {
        const scan = makeScanResult([{
            parentPath: 'user://docs',
            canonicalKey: 'abc123',
            normalizedName: 'notes',
            entries: [
                makeEntry('Notes', 1000),
                makeEntry('NOTES', 1000),
                makeEntry('notes', 1000),
            ],
        }]);

        const plan = generatePlan(scan);

        // localeCompare deterministic order → winner is first in sort
        const keep = plan.actions.find(a => a.type === 'KEEP');
        expect(keep).toBeDefined();
        // Verify determinism: run twice → same winner
        const plan2 = generatePlan(scan);
        const keep2 = plan2.actions.find(a => a.type === 'KEEP');
        expect(keep!.originalName).toBe(keep2!.originalName);
    });

    // ─── 3. Suffix generation ───────────────────────────────────────────

    test('suffixed names use (1), (2), ... pattern', () => {
        const scan = makeScanResult([{
            parentPath: 'user://docs',
            canonicalKey: 'abc123',
            normalizedName: 'report',
            entries: [
                makeEntry('report', 1000),
                makeEntry('Report', 2000),
                makeEntry('REPORT', 3000),
            ],
        }]);

        const plan = generatePlan(scan);
        const renames = plan.actions.filter(a => a.type === 'RENAME');

        expect(renames[0].newName).toBe('Report (1)');
        expect(renames[1].newName).toBe('REPORT (2)');
    });

    // ─── 4. File extension preserved ────────────────────────────────────

    test('extension is preserved in suffixed names', () => {
        const scan = makeScanResult([{
            parentPath: 'user://docs',
            canonicalKey: 'abc123',
            normalizedName: 'doc.txt',
            entries: [
                makeEntry('doc.txt', 1000),
                makeEntry('Doc.txt', 2000),
            ],
        }]);

        const plan = generatePlan(scan);
        const rename = plan.actions.find(a => a.type === 'RENAME');

        expect(rename!.newName).toBe('Doc (1).txt');
    });

    // ─── 5. System paths skipped ────────────────────────────────────────

    test('system:// paths are always skipped', () => {
        const scan = makeScanResult([{
            parentPath: 'system://config',
            canonicalKey: 'sys001',
            normalizedName: 'settings',
            entries: [
                makeEntry('settings', 1000),
                makeEntry('Settings', 2000),
            ],
        }]);

        const plan = generatePlan(scan);

        expect(plan.actions).toHaveLength(2);
        expect(plan.actions.every(a => a.type === 'SKIP')).toBe(true);
        expect(plan.summary.skips).toBe(2);
        expect(plan.summary.renames).toBe(0);
    });

    // ─── 6. Deterministic — same input = same output ────────────────────

    test('two calls with same input produce identical actions', () => {
        const scan = makeScanResult([{
            parentPath: 'user://docs',
            canonicalKey: 'abc123',
            normalizedName: 'readme',
            entries: [
                makeEntry('README', 3000),
                makeEntry('readme', 1000),
                makeEntry('Readme', 2000),
            ],
        }]);

        const plan1 = generatePlan(scan);
        const plan2 = generatePlan(scan);

        // Same planId, same action order, same names
        expect(plan1.planId).toBe(plan2.planId);
        expect(plan1.actions.map(a => `${a.type}:${a.originalName}:${a.newName || ''}`))
            .toEqual(plan2.actions.map(a => `${a.type}:${a.originalName}:${a.newName || ''}`));
    });

    // ─── 7. Empty groups = empty plan ───────────────────────────────────

    test('no duplicate groups produces an empty plan', () => {
        const scan = makeScanResult([]);
        const plan = generatePlan(scan);

        expect(plan.actions).toHaveLength(0);
        expect(plan.summary.total).toBe(0);
    });

    // ─── 8. splitNameAndExtension edge cases ────────────────────────────

    test('splitNameAndExtension handles various formats', () => {
        expect(splitNameAndExtension('doc.txt')).toEqual({ base: 'doc', ext: '.txt' });
        expect(splitNameAndExtension('My Folder')).toEqual({ base: 'My Folder', ext: '' });
        expect(splitNameAndExtension('.hidden')).toEqual({ base: '.hidden', ext: '' });
        expect(splitNameAndExtension('archive.tar.gz')).toEqual({ base: 'archive.tar', ext: '.gz' });
        expect(splitNameAndExtension('noext')).toEqual({ base: 'noext', ext: '' });
    });

    // ─── 9. Winner selection with mixed createdAt ───────────────────────

    test('entry with createdAt beats entry without', () => {
        const entries: DuplicateEntry[] = [
            makeEntry('Bravo', 0),  // no timestamp
            makeEntry('Alpha', 5000),
        ];

        const sorted = selectWinnerAndSort(entries);
        expect(sorted[0].name).toBe('Alpha'); // has createdAt → wins
    });

    // ─── 10. No createdAt on any → pure lexical ────────────────────────

    test('no createdAt on any entry → lexical order determines winner', () => {
        const entries: DuplicateEntry[] = [
            makeEntry('Zeta', 0),
            makeEntry('Alpha', 0),
            makeEntry('Beta', 0),
        ];

        const sorted = selectWinnerAndSort(entries);
        expect(sorted[0].name).toBe('Alpha');
        expect(sorted[1].name).toBe('Beta');
        expect(sorted[2].name).toBe('Zeta');
    });

    // ─── 11. formatPlanReport output ────────────────────────────────────

    test('formatPlanReport generates valid markdown', () => {
        const scan = makeScanResult([{
            parentPath: 'user://docs',
            canonicalKey: 'abc123',
            normalizedName: 'readme',
            entries: [
                makeEntry('readme', 1000),
                makeEntry('README', 2000),
            ],
        }]);

        const plan = generatePlan(scan);
        const report = formatPlanReport(plan);

        expect(report).toContain('# VFS Remediation Plan');
        expect(report).toContain('KEEP');
        expect(report).toContain('RENAME');
        expect(report).toContain('readme');
    });

    // ─── 12. Suffix collision avoidance ─────────────────────────────────

    test('suffix avoids collision with existing names', () => {
        const usedNames = new Set(['report (1)']);
        const result = generateSuffixedName('Report', 1, usedNames);
        // (1) is taken → should get (2)
        expect(result).toBe('Report (2)');
    });
});
