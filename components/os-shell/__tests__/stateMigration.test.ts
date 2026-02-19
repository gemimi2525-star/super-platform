/**
 * ═══════════════════════════════════════════════════════════════════════════
 * STATE MIGRATION — Unit Tests (Phase 39)
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { migrateSnapshotV1toV2, normalizeWindows, migrateSnapshot, CAPABILITY_ALIAS_MAP, HUB_TAB_MAP } from '../stateMigration';
import type { ShellSnapshot, WindowSnapshot } from '../shell-persistence';

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function makeWindow(overrides: Partial<WindowSnapshot> = {}): WindowSnapshot {
    return {
        id: `win-${Math.random().toString(36).slice(2, 8)}`,
        capabilityId: 'core.finder',
        title: 'Finder',
        state: 'active',
        zIndex: 0,
        bounds: { x: 100, y: 100, width: 500, height: 400 },
        ...overrides,
    };
}

function makeSnapshot(windows: WindowSnapshot[], version: 1 | 2 = 1): ShellSnapshot {
    return {
        version,
        savedAt: Date.now(),
        focusedWindowId: null,
        activeSpaceId: null,
        windows,
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// ALIAS MAP TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('CAPABILITY_ALIAS_MAP', () => {
    it('maps core.files to core.finder', () => {
        expect(CAPABILITY_ALIAS_MAP['core.files']).toBe('core.finder');
    });

    it('maps system.explorer to core.finder', () => {
        expect(CAPABILITY_ALIAS_MAP['system.explorer']).toBe('core.finder');
    });

    it('maps brain.dashboard to null (ghost)', () => {
        expect(CAPABILITY_ALIAS_MAP['brain.dashboard']).toBeNull();
    });

    it('maps core.store to null (ghost)', () => {
        expect(CAPABILITY_ALIAS_MAP['core.store']).toBeNull();
    });

    it('does not contain valid capabilities', () => {
        expect(CAPABILITY_ALIAS_MAP['core.finder']).toBeUndefined();
        expect(CAPABILITY_ALIAS_MAP['ops.center']).toBeUndefined();
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// HUB TAB MAP TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('HUB_TAB_MAP', () => {
    it('routes user.manage to Hub users tab', () => {
        expect(HUB_TAB_MAP['user.manage']).toBe('users');
    });

    it('routes org.manage to Hub organization tab', () => {
        expect(HUB_TAB_MAP['org.manage']).toBe('organization');
    });

    it('does not route system.hub itself', () => {
        expect(HUB_TAB_MAP['system.hub']).toBeUndefined();
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// v1 → v2 MIGRATION TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('migrateSnapshotV1toV2', () => {
    it('remaps alias capabilityIds to canonical', () => {
        const snapshot = makeSnapshot([
            makeWindow({ id: 'w1', capabilityId: 'core.files', title: 'Files' }),
        ]);
        const result = migrateSnapshotV1toV2(snapshot);
        expect(result.windows[0].capabilityId).toBe('core.finder');
    });

    it('removes ghost capabilities (null alias)', () => {
        const snapshot = makeSnapshot([
            makeWindow({ id: 'w1', capabilityId: 'brain.dashboard', title: 'Dashboard' }),
            makeWindow({ id: 'w2', capabilityId: 'core.finder', title: 'Finder' }),
        ]);
        const result = migrateSnapshotV1toV2(snapshot);
        expect(result.windows).toHaveLength(1);
        expect(result.windows[0].capabilityId).toBe('core.finder');
    });

    it('keeps valid capabilities unchanged', () => {
        const snapshot = makeSnapshot([
            makeWindow({ id: 'w1', capabilityId: 'ops.center', title: 'Monitor' }),
        ]);
        const result = migrateSnapshotV1toV2(snapshot);
        expect(result.windows[0].capabilityId).toBe('ops.center');
    });

    it('bumps version to 2', () => {
        const snapshot = makeSnapshot([]);
        const result = migrateSnapshotV1toV2(snapshot);
        expect(result.version).toBe(2);
    });

    it('deduplicates single-instance after alias remap', () => {
        // core.files → core.finder, plus existing core.finder = 2 finders
        // Should dedup to 1 (keeping higher zIndex)
        const snapshot = makeSnapshot([
            makeWindow({ id: 'w1', capabilityId: 'core.files', title: 'Files', zIndex: 0 }),
            makeWindow({ id: 'w2', capabilityId: 'core.finder', title: 'Finder', zIndex: 1 }),
        ]);
        const result = migrateSnapshotV1toV2(snapshot);
        // core.finder is single-instance, so only 1 should remain
        const finderWindows = result.windows.filter(w => w.capabilityId === 'core.finder');
        expect(finderWindows).toHaveLength(1);
        // The one with higher zIndex (w2) should survive
        expect(finderWindows[0].id).toBe('w2');
    });

    it('handles empty snapshot', () => {
        const snapshot = makeSnapshot([]);
        const result = migrateSnapshotV1toV2(snapshot);
        expect(result.version).toBe(2);
        expect(result.windows).toHaveLength(0);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// NORMALIZE WINDOWS TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('normalizeWindows', () => {
    it('removes duplicate single-instance windows, keeps highest zIndex', () => {
        const windows = [
            makeWindow({ id: 'w1', capabilityId: 'ops.center', zIndex: 0 }),
            makeWindow({ id: 'w2', capabilityId: 'ops.center', zIndex: 5 }),
            makeWindow({ id: 'w3', capabilityId: 'ops.center', zIndex: 3 }),
        ];
        const result = normalizeWindows(windows);
        const opsWindows = result.filter(w => w.capabilityId === 'ops.center');
        expect(opsWindows).toHaveLength(1);
        expect(opsWindows[0].id).toBe('w2'); // highest zIndex
    });

    it('recalculates z-indices contiguously', () => {
        const windows = [
            makeWindow({ id: 'w1', capabilityId: 'core.finder', zIndex: 10 }),
            makeWindow({ id: 'w2', capabilityId: 'ops.center', zIndex: 20 }),
        ];
        const result = normalizeWindows(windows);
        expect(result.map(w => w.zIndex)).toEqual([0, 1]);
    });

    it('handles empty input', () => {
        expect(normalizeWindows([])).toEqual([]);
    });

    it('preserves stacking order after dedup', () => {
        const windows = [
            makeWindow({ id: 'w1', capabilityId: 'core.finder', zIndex: 0 }),
            makeWindow({ id: 'w2', capabilityId: 'ops.center', zIndex: 1 }),
            makeWindow({ id: 'w3', capabilityId: 'brain.assist', zIndex: 2 }),
        ];
        const result = normalizeWindows(windows);
        expect(result.map(w => w.capabilityId)).toEqual([
            'core.finder',
            'ops.center',
            'brain.assist',
        ]);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// MIGRATION PIPELINE TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('migrateSnapshot', () => {
    it('migrates v1 to v2', () => {
        const snapshot = makeSnapshot([
            makeWindow({ id: 'w1', capabilityId: 'core.files' }),
        ]);
        const result = migrateSnapshot(snapshot);
        expect(result).not.toBeNull();
        expect(result!.version).toBe(2);
    });

    it('is idempotent — running twice gives same result', () => {
        const snapshot = makeSnapshot([
            makeWindow({ id: 'w1', capabilityId: 'core.files' }),
            makeWindow({ id: 'w2', capabilityId: 'brain.dashboard' }),
            makeWindow({ id: 'w3', capabilityId: 'ops.center', zIndex: 2 }),
        ]);
        const first = migrateSnapshot(snapshot)!;
        const second = migrateSnapshot(first)!;
        expect(second.version).toBe(first.version);
        expect(second.windows.length).toBe(first.windows.length);
        expect(second.windows.map(w => w.capabilityId)).toEqual(
            first.windows.map(w => w.capabilityId)
        );
    });

    it('removes all ghosts from a polluted snapshot', () => {
        const snapshot = makeSnapshot([
            makeWindow({ id: 'w1', capabilityId: 'brain.dashboard' }),
            makeWindow({ id: 'w2', capabilityId: 'core.store' }),
        ]);
        const result = migrateSnapshot(snapshot)!;
        expect(result.windows).toHaveLength(0);
    });
});
