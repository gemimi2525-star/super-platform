/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Registry Dedup Tests (Phase 38)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Ensures no ghost dock items, no duplicate registrations, and cross-layer
 * consistency between SYNAPSE manifests, shell manifests, and component registry.
 *
 * @module coreos/manifests/registryDedup.test
 * @version 1.0.0
 */

import { CAPABILITY_MANIFESTS } from './index';
import { APP_MANIFESTS, getDockApps } from '@/components/os-shell/apps/manifest';
import { appRegistry } from '@/components/os-shell/apps/registry';

// ═══════════════════════════════════════════════════════════════════════════
// 1. SYNAPSE MANIFEST INTEGRITY
// ═══════════════════════════════════════════════════════════════════════════

describe('SYNAPSE Manifest Integrity (Phase 38)', () => {
    test('no duplicate capability IDs in CAPABILITY_MANIFESTS', () => {
        // Record keys are inherently unique, but verify id field matches key
        for (const [key, manifest] of Object.entries(CAPABILITY_MANIFESTS)) {
            expect(manifest.id).toBe(key);
        }
    });

    test('every showInDock=true manifest has hasUI=true (or is handled)', () => {
        const violations: string[] = [];
        for (const [id, manifest] of Object.entries(CAPABILITY_MANIFESTS)) {
            if (manifest.showInDock && !manifest.hasUI) {
                violations.push(`${id}: showInDock=true but hasUI=false`);
            }
        }
        expect(violations).toEqual([]);
    });

    test('brain.dashboard is NOT shown in dock (Phase 38 cleanup)', () => {
        const bd = CAPABILITY_MANIFESTS['brain.dashboard'];
        expect(bd).toBeDefined();
        expect(bd.showInDock).toBe(false);
    });

    test('core.store is NOT shown in dock (Phase 38 cleanup)', () => {
        const cs = CAPABILITY_MANIFESTS['core.store'];
        expect(cs).toBeDefined();
        expect(cs.showInDock).toBe(false);
    });

    test('core.files is NOT shown in dock (Phase 38 — core.finder is canonical)', () => {
        const cf = CAPABILITY_MANIFESTS['core.files'];
        expect(cf).toBeDefined();
        expect(cf.showInDock).toBe(false);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. SHELL MANIFEST CONSISTENCY
// ═══════════════════════════════════════════════════════════════════════════

describe('Shell Manifest Consistency (Phase 38)', () => {
    test('APP_MANIFESTS key matches appId field', () => {
        for (const [key, manifest] of Object.entries(APP_MANIFESTS)) {
            expect(manifest.appId).toBe(key);
        }
    });

    test('no dead entries remain (system.explorer, core.files)', () => {
        expect(APP_MANIFESTS['system.explorer']).toBeUndefined();
        expect(APP_MANIFESTS['core.files']).toBeUndefined();
    });

    test('no duplicate appIds in getDockApps for any role', () => {
        for (const role of ['guest', 'user', 'admin', 'owner'] as const) {
            const dockApps = getDockApps(role);
            const ids = dockApps.map(a => a.appId);
            const unique = new Set(ids);
            expect(ids.length).toBe(unique.size);
        }
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. COMPONENT REGISTRY CROSS-CHECK
// ═══════════════════════════════════════════════════════════════════════════

describe('Component Registry Cross-Check (Phase 38)', () => {
    test('no dead aliases in appRegistry', () => {
        expect(appRegistry['system.explorer']).toBeUndefined();
        expect(appRegistry['core.files']).toBeUndefined();
    });

    test('core.finder is registered as canonical Finder', () => {
        expect(appRegistry['core.finder']).toBeDefined();
    });

    test('every showInDock=true SYNAPSE manifest has a component or shell gating', () => {
        const dockManifests = Object.entries(CAPABILITY_MANIFESTS)
            .filter(([_, m]) => m.showInDock);

        for (const [id] of dockManifests) {
            const hasComponent = id in appRegistry;
            const hasShellManifest = id in APP_MANIFESTS;
            expect(hasComponent || hasShellManifest).toBe(true);
        }
    });
});
