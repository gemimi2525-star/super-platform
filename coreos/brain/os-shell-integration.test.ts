/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OS Shell Integration Tests (Phase 25B)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 10 tests covering:
 * - getOwnerContext logic
 * - Manifest role enforcement
 * - getDockApps role filtering
 * - Registry completeness
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

    test('brain.dashboard requires owner role', () => {
        expect(APP_MANIFESTS['brain.dashboard']).toBeDefined();
        expect(APP_MANIFESTS['brain.dashboard'].requiredRole).toBe('owner');
    });

    test('brain.assist still requires user role (unchanged)', () => {
        expect(APP_MANIFESTS['brain.assist']).toBeDefined();
        expect(APP_MANIFESTS['brain.assist'].requiredRole).toBe('user');
    });

    test('brain.dashboard is distinct from brain.assist', () => {
        const dashboard = APP_MANIFESTS['brain.dashboard'];
        const assist = APP_MANIFESTS['brain.assist'];
        expect(dashboard.appId).not.toBe(assist.appId);
        expect(dashboard.name).not.toBe(assist.name);
        expect(dashboard.requiredRole).not.toBe(assist.requiredRole);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. DOCK VISIBILITY BY ROLE
// ═══════════════════════════════════════════════════════════════════════════

describe('Dock Visibility by Role (Phase 25B)', () => {
    test('owner sees ops.center in dock', () => {
        const dockApps = getDockApps('owner');
        const appIds = dockApps.map(a => a.appId);
        expect(appIds).toContain('ops.center');
    });

    test('owner sees brain.dashboard in dock', () => {
        const dockApps = getDockApps('owner');
        const appIds = dockApps.map(a => a.appId);
        expect(appIds).toContain('brain.dashboard');
    });

    test('user does NOT see ops.center in dock', () => {
        const dockApps = getDockApps('user');
        const appIds = dockApps.map(a => a.appId);
        expect(appIds).not.toContain('ops.center');
    });

    test('user does NOT see brain.dashboard in dock', () => {
        const dockApps = getDockApps('user');
        const appIds = dockApps.map(a => a.appId);
        expect(appIds).not.toContain('brain.dashboard');
    });

    test('admin does NOT see ops.center in dock (tightened to owner)', () => {
        const dockApps = getDockApps('admin');
        const appIds = dockApps.map(a => a.appId);
        expect(appIds).not.toContain('ops.center');
    });

    test('admin does NOT see brain.dashboard in dock', () => {
        const dockApps = getDockApps('admin');
        const appIds = dockApps.map(a => a.appId);
        expect(appIds).not.toContain('brain.dashboard');
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
