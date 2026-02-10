/**
 * ═══════════════════════════════════════════════════════════════════════════
 * VFS APP ADAPTER TESTS (Phase 16A)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Tests AppVFSAdapter permission enforcement:
 * 1. ALLOW — app with correct permissions
 * 2. DENY — app without required intent
 * 3. DENY — app accessing disallowed scheme
 * 4. DENY — read-only app attempting write
 * 5. Default rule — unknown app gets read-only user://
 * 6. Permission set query (for UI)
 * 7. Audit logging at app level
 * 
 * Run: npx jest coreos/vfs/app-adapter.test.ts --verbose
 * 
 * @module coreos/vfs/app-adapter.test
 */

import {
    checkAppPermission,
    getAppPermissionRule,
    getAppPermissionSet,
} from './permission-matrix';

// ═══════════════════════════════════════════════════════════════════════════
// PERMISSION MATRIX TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('VFS Permission Matrix', () => {

    // ─── Known App Rules ────────────────────────────────────────────────

    describe('core.finder (full access)', () => {
        test('allows fs.list on user://', () => {
            const result = checkAppPermission('core.finder', 'fs.list', 'user');
            expect(result.allowed).toBe(true);
        });

        test('allows fs.write on user://', () => {
            const result = checkAppPermission('core.finder', 'fs.write', 'user');
            expect(result.allowed).toBe(true);
        });

        test('allows fs.read on system://', () => {
            const result = checkAppPermission('core.finder', 'fs.read', 'system');
            expect(result.allowed).toBe(true);
        });

        test('allows fs.delete on workspace://', () => {
            const result = checkAppPermission('core.finder', 'fs.delete', 'workspace');
            expect(result.allowed).toBe(true);
        });
    });

    describe('core.notes (user:// read+write)', () => {
        test('allows fs.list on user://', () => {
            const result = checkAppPermission('core.notes', 'fs.list', 'user');
            expect(result.allowed).toBe(true);
        });

        test('allows fs.read on user://', () => {
            const result = checkAppPermission('core.notes', 'fs.read', 'user');
            expect(result.allowed).toBe(true);
        });

        test('allows fs.write on user://', () => {
            const result = checkAppPermission('core.notes', 'fs.write', 'user');
            expect(result.allowed).toBe(true);
        });

        test('DENIES fs.delete on user:// (not in allowed intents)', () => {
            const result = checkAppPermission('core.notes', 'fs.delete', 'user');
            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('not allowed intent');
        });

        test('DENIES access to system://', () => {
            const result = checkAppPermission('core.notes', 'fs.read', 'system');
            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('not allowed to access scheme');
        });

        test('DENIES access to workspace://', () => {
            const result = checkAppPermission('core.notes', 'fs.list', 'workspace');
            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('not allowed to access scheme');
        });
    });

    // Phase 16B: system.explorer tests
    describe('system.explorer (full access — same as core.finder)', () => {
        test('allows fs.list on user://', () => {
            const result = checkAppPermission('system.explorer', 'fs.list', 'user');
            expect(result.allowed).toBe(true);
        });

        test('allows fs.write on user://', () => {
            const result = checkAppPermission('system.explorer', 'fs.write', 'user');
            expect(result.allowed).toBe(true);
        });

        test('allows fs.list on system://', () => {
            const result = checkAppPermission('system.explorer', 'fs.list', 'system');
            expect(result.allowed).toBe(true);
        });

        test('allows fs.delete on workspace://', () => {
            const result = checkAppPermission('system.explorer', 'fs.delete', 'workspace');
            expect(result.allowed).toBe(true);
        });
    });

    // Phase 16B: core.files tests
    describe('core.files (user + workspace, full access)', () => {
        test('allows fs.write on user://', () => {
            const result = checkAppPermission('core.files', 'fs.write', 'user');
            expect(result.allowed).toBe(true);
        });

        test('allows fs.list on workspace://', () => {
            const result = checkAppPermission('core.files', 'fs.list', 'workspace');
            expect(result.allowed).toBe(true);
        });

        test('DENIES access to system://', () => {
            const result = checkAppPermission('core.files', 'fs.read', 'system');
            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('not allowed to access scheme');
        });
    });

    describe('core.settings (system:// read-only)', () => {
        test('allows fs.list on system://', () => {
            const result = checkAppPermission('core.settings', 'fs.list', 'system');
            expect(result.allowed).toBe(true);
        });

        test('allows fs.read on system://', () => {
            const result = checkAppPermission('core.settings', 'fs.read', 'system');
            expect(result.allowed).toBe(true);
        });

        test('DENIES fs.write on system:// (read-only)', () => {
            const result = checkAppPermission('core.settings', 'fs.write', 'system');
            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('read-only access');
        });

        test('DENIES fs.mkdir on system:// (read-only)', () => {
            const result = checkAppPermission('core.settings', 'fs.mkdir', 'system');
            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('read-only access');
        });

        test('DENIES access to user://', () => {
            const result = checkAppPermission('core.settings', 'fs.read', 'user');
            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('not allowed to access scheme');
        });
    });

    // ─── Unknown App (Default Rule) ─────────────────────────────────────

    describe('Unknown app (default: read-only user://)', () => {
        test('allows fs.list on user://', () => {
            const result = checkAppPermission('some.random.app', 'fs.list', 'user');
            expect(result.allowed).toBe(true);
        });

        test('allows fs.read on user://', () => {
            const result = checkAppPermission('some.random.app', 'fs.read', 'user');
            expect(result.allowed).toBe(true);
        });

        test('DENIES fs.write on user:// (default is read-only)', () => {
            const result = checkAppPermission('some.random.app', 'fs.write', 'user');
            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('read-only access');
        });

        test('DENIES access to system://', () => {
            const result = checkAppPermission('some.random.app', 'fs.read', 'system');
            expect(result.allowed).toBe(false);
        });

        test('DENIES access to workspace://', () => {
            const result = checkAppPermission('some.random.app', 'fs.list', 'workspace');
            expect(result.allowed).toBe(false);
        });
    });

    // ─── Rule Lookup ────────────────────────────────────────────────────

    describe('getAppPermissionRule', () => {
        test('returns specific rule for known app', () => {
            const rule = getAppPermissionRule('core.finder');
            expect(rule.appId).toBe('core.finder');
            expect(rule.readOnly).toBe(false);
        });

        test('returns default rule for unknown app', () => {
            const rule = getAppPermissionRule('unknown.app');
            expect(rule.appId).toBe('unknown.app');
            expect(rule.readOnly).toBe(true);
            expect(rule.allowedSchemes).toEqual(['user']);
        });
    });

    // ─── Permission Set (for UI) ────────────────────────────────────────

    describe('getAppPermissionSet', () => {
        test('returns full permission set for core.finder', () => {
            const perms = getAppPermissionSet('core.finder');
            expect(perms.appId).toBe('core.finder');
            expect(perms.canList).toBe(true);
            expect(perms.canRead).toBe(true);
            expect(perms.canWrite).toBe(true);
            expect(perms.canMkdir).toBe(true);
            expect(perms.canDelete).toBe(true);
            expect(perms.readOnly).toBe(false);
        });

        test('returns read-only set for core.settings', () => {
            const perms = getAppPermissionSet('core.settings');
            expect(perms.canList).toBe(true);
            expect(perms.canRead).toBe(true);
            expect(perms.canWrite).toBe(false);
            expect(perms.canMkdir).toBe(false);
            expect(perms.canDelete).toBe(false);
            expect(perms.readOnly).toBe(true);
        });

        test('returns conservative set for unknown app', () => {
            const perms = getAppPermissionSet('evil.app');
            expect(perms.canList).toBe(true);
            expect(perms.canRead).toBe(true);
            expect(perms.canWrite).toBe(false);
            expect(perms.readOnly).toBe(true);
            expect(perms.schemes).toEqual(['user']);
        });
    });
});
