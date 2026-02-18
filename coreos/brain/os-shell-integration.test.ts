/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OS Shell Integration Tests (Phase 25B → Phase 38)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Tests covering:
 * - Manifest role enforcement
 * - getDockApps role filtering
 * - Registry completeness
 * - Phase 38: Ghost dock item cleanup verification
 *
 * Pure logic tests — no Firestore or Next.js runtime needed.
 */

import {
    APP_MANIFESTS,
    getDockApps,
    getFinderApps,
    roleHasAccess,
} from '@/components/os-shell/apps/manifest';

// ═══════════════════════════════════════════════════════════════════════════
// 1. MANIFEST ROLE ENFORCEMENT
// ═══════════════════════════════════════════════════════════════════════════

describe('Manifest Role Enforcement (Phase 25B)', () => {
    test('ops.center requires owner role', () => {
        expect(APP_MANIFESTS['ops.center']).toBeDefined();
        expect(APP_MANIFESTS['ops.center'].requiredRole).toBe('owner');
    });

    test('brain.assist still requires user role (unchanged)', () => {
        expect(APP_MANIFESTS['brain.assist']).toBeDefined();
        expect(APP_MANIFESTS['brain.assist'].requiredRole).toBe('user');
    });

    // Phase 38: brain.dashboard removed from shell manifests (merged into Monitor Hub)
    test('brain.dashboard is NOT in shell manifests (Phase 38)', () => {
        expect(APP_MANIFESTS['brain.dashboard']).toBeUndefined();
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. DOCK VISIBILITY BY ROLE
// ═══════════════════════════════════════════════════════════════════════════

describe('Dock Visibility by Role (Phase 25B + 38)', () => {
    test('owner sees ops.center in dock', () => {
        const dockApps = getDockApps('owner');
        const appIds = dockApps.map(a => a.appId);
        expect(appIds).toContain('ops.center');
    });

    // Phase 38: brain.dashboard no longer in dock (merged into Monitor Hub)
    test('owner does NOT see brain.dashboard in dock (Phase 38)', () => {
        const dockApps = getDockApps('owner');
        const appIds = dockApps.map(a => a.appId);
        expect(appIds).not.toContain('brain.dashboard');
    });

    test('user does NOT see ops.center in dock', () => {
        const dockApps = getDockApps('user');
        const appIds = dockApps.map(a => a.appId);
        expect(appIds).not.toContain('ops.center');
    });

    test('admin does NOT see ops.center in dock (tightened to owner)', () => {
        const dockApps = getDockApps('admin');
        const appIds = dockApps.map(a => a.appId);
        expect(appIds).not.toContain('ops.center');
    });

    // Phase 38: Removed dead shell manifest entries
    test('system.explorer is NOT in shell manifests (Phase 38)', () => {
        expect(APP_MANIFESTS['system.explorer']).toBeUndefined();
    });

    test('core.files is NOT in shell manifests (Phase 38)', () => {
        expect(APP_MANIFESTS['core.files']).toBeUndefined();
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. ROLE ACCESS FUNCTION (Sanity)
// ═══════════════════════════════════════════════════════════════════════════

describe('roleHasAccess (Sanity)', () => {
    test('owner has access to owner-level apps', () => {
        expect(roleHasAccess('owner', 'owner')).toBe(true);
    });

    test('admin does NOT have access to owner-level apps', () => {
        expect(roleHasAccess('admin', 'owner')).toBe(false);
    });

    test('user does NOT have access to owner-level apps', () => {
        expect(roleHasAccess('user', 'owner')).toBe(false);
    });

    test('null role does NOT have access to owner-level apps', () => {
        expect(roleHasAccess(null, 'owner')).toBe(false);
    });
});
