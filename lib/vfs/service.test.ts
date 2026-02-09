/**
 * ═══════════════════════════════════════════════════════════════════════════
 * VFS SERVICE INTEGRATION TESTS (Phase 15A M3)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Tests VFSService → Governance → Driver interaction:
 * 1. Feature flag gating
 * 2. Path traversal blocking
 * 3. Intent naming (fs.*)
 * 4. Audit logging
 * 5. system:// write protection
 * 
 * Strategy: mock getDriver() to inject a test driver.
 * Run: npx jest lib/vfs/service.test.ts --verbose
 * 
 * @module lib/vfs/service.test
 */

import { VFSError } from './types';
import type { VFSMetadata, IVFSDriver } from './types';

// ═══════════════════════════════════════════════════════════════════════════
// TEST DRIVER MOCK
// ═══════════════════════════════════════════════════════════════════════════

const mockDriver: IVFSDriver = {
    name: 'TestDriver',
    isAvailable: jest.fn().mockResolvedValue(true),
    list: jest.fn().mockResolvedValue([
        { id: '1', name: 'test.txt', type: 'file', path: 'user://test.txt', size: 100, createdAt: Date.now(), updatedAt: Date.now() },
    ] as VFSMetadata[]),
    stat: jest.fn().mockResolvedValue({ id: '1', name: 'test.txt', type: 'file', path: 'user://test.txt', size: 100, createdAt: Date.now(), updatedAt: Date.now() } as VFSMetadata),
    read: jest.fn().mockResolvedValue(new TextEncoder().encode('Hello VFS').buffer),
    write: jest.fn().mockResolvedValue({ id: '2', name: 'new.txt', type: 'file', path: 'user://new.txt', size: 50, createdAt: Date.now(), updatedAt: Date.now() } as VFSMetadata),
    mkdir: jest.fn().mockResolvedValue({ id: '3', name: 'NewFolder', type: 'folder', path: 'user://NewFolder', size: 0, createdAt: Date.now(), updatedAt: Date.now() } as VFSMetadata),
    delete: jest.fn().mockResolvedValue(undefined),
    rename: jest.fn().mockRejectedValue(new VFSError('NOT_SUPPORTED', 'Not implemented')),
    move: jest.fn().mockRejectedValue(new VFSError('NOT_SUPPORTED', 'Not implemented')),
};

// Mock the driver module to return our test driver
jest.mock('./driver', () => ({
    getDriver: () => mockDriver,
}));

// ═══════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════

const ctx = { userId: 'test-user', appId: 'test-app' };

describe('VFS Service Integration', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ─── Feature Flag Tests ─────────────────────────────────────────────
    describe('Feature Flag Gate', () => {

        test('BLOCKS all operations when VFS is disabled', async () => {
            // Default env: NEXT_PUBLIC_FEATURE_VFS is not set → disabled
            // Since the module is already loaded, we need a fresh import
            jest.resetModules();

            // Ensure flag is OFF
            const originalEnv = process.env.NEXT_PUBLIC_FEATURE_VFS;
            process.env.NEXT_PUBLIC_FEATURE_VFS = 'false';

            // Re-mock driver for the fresh module
            jest.mock('./driver', () => ({
                getDriver: () => mockDriver,
            }));

            const { VFSService } = await import('./service');
            const svc = new VFSService();

            await expect(svc.list('user://Docs', ctx)).rejects.toThrow('VFS subsystem is currently disabled');
            await expect(svc.read('user://test.txt', ctx)).rejects.toThrow('VFS subsystem is currently disabled');
            await expect(svc.write('user://test.txt', 'data', ctx)).rejects.toThrow('VFS subsystem is currently disabled');
            await expect(svc.mkdir('user://NewFolder', ctx)).rejects.toThrow('VFS subsystem is currently disabled');
            await expect(svc.delete('user://trash.txt', ctx)).rejects.toThrow('VFS subsystem is currently disabled');

            // Verify driver was NOT called
            expect(mockDriver.list).not.toHaveBeenCalled();
            expect(mockDriver.write).not.toHaveBeenCalled();
            expect(mockDriver.mkdir).not.toHaveBeenCalled();

            process.env.NEXT_PUBLIC_FEATURE_VFS = originalEnv;
        });

        test('ALLOWS operations when VFS is enabled', async () => {
            jest.resetModules();
            process.env.NEXT_PUBLIC_FEATURE_VFS = 'true';

            jest.mock('./driver', () => ({
                getDriver: () => mockDriver,
            }));

            const { VFSService } = await import('./service');
            const svc = new VFSService();

            const items = await svc.list('user://Docs', ctx);
            expect(items).toBeDefined();
            expect(mockDriver.list).toHaveBeenCalledWith('user://Docs');
        });
    });

    // ─── Path Safety Tests ──────────────────────────────────────────────
    describe('Path Safety', () => {

        test('blocks path traversal via ..', async () => {
            jest.resetModules();
            process.env.NEXT_PUBLIC_FEATURE_VFS = 'true';
            jest.mock('./driver', () => ({ getDriver: () => mockDriver }));
            const { VFSService } = await import('./service');
            const svc = new VFSService();

            await expect(svc.list('user://../etc/passwd', ctx)).rejects.toThrow('Path traversal');
        });

        test('blocks encoded traversal %2e%2e', async () => {
            jest.resetModules();
            process.env.NEXT_PUBLIC_FEATURE_VFS = 'true';
            jest.mock('./driver', () => ({ getDriver: () => mockDriver }));
            const { VFSService } = await import('./service');
            const svc = new VFSService();

            await expect(svc.list('user://%2e%2e/etc', ctx)).rejects.toThrow('Path traversal');
        });

        test('blocks invalid schemes', async () => {
            jest.resetModules();
            process.env.NEXT_PUBLIC_FEATURE_VFS = 'true';
            jest.mock('./driver', () => ({ getDriver: () => mockDriver }));
            const { VFSService } = await import('./service');
            const svc = new VFSService();

            await expect(svc.list('http://evil.com', ctx)).rejects.toThrow('Invalid scheme');
            await expect(svc.read('file:///etc/passwd', ctx)).rejects.toThrow('Invalid scheme');
        });
    });

    // ─── Service → Driver Flow ──────────────────────────────────────────
    describe('Service → Driver Delegation', () => {

        let svc: InstanceType<typeof import('./service').VFSService>;

        beforeAll(async () => {
            jest.resetModules();
            process.env.NEXT_PUBLIC_FEATURE_VFS = 'true';
            jest.mock('./driver', () => ({ getDriver: () => mockDriver }));
            const mod = await import('./service');
            svc = new mod.VFSService();
        });

        beforeEach(() => jest.clearAllMocks());

        test('list() delegates to driver.list()', async () => {
            await svc.list('user://Docs', ctx);
            expect(mockDriver.list).toHaveBeenCalledWith('user://Docs');
        });

        test('read() delegates to driver.read()', async () => {
            const data = await svc.read('user://test.txt', ctx);
            expect(mockDriver.read).toHaveBeenCalledWith('user://test.txt');
            expect(data).toBeInstanceOf(ArrayBuffer);
        });

        test('write() delegates to driver.write()', async () => {
            const meta = await svc.write('user://new.txt', 'Hello', ctx);
            expect(mockDriver.write).toHaveBeenCalledWith('user://new.txt', 'Hello');
            expect(meta.name).toBe('new.txt');
        });

        test('mkdir() delegates to driver.mkdir()', async () => {
            const meta = await svc.mkdir('user://NewFolder', ctx);
            expect(mockDriver.mkdir).toHaveBeenCalledWith('user://NewFolder');
            expect(meta.type).toBe('folder');
        });

        test('delete() delegates to driver.delete()', async () => {
            await svc.delete('user://trash.txt', ctx);
            expect(mockDriver.delete).toHaveBeenCalledWith('user://trash.txt');
        });

        test('stat() delegates to driver.stat()', async () => {
            const meta = await svc.stat('user://test.txt', ctx);
            expect(mockDriver.stat).toHaveBeenCalledWith('user://test.txt');
            expect(meta?.name).toBe('test.txt');
        });
    });

    // ─── system:// Write Protection ─────────────────────────────────────
    describe('system:// Write Protection', () => {

        test('blocks write to system://', async () => {
            jest.resetModules();
            process.env.NEXT_PUBLIC_FEATURE_VFS = 'true';
            jest.mock('./driver', () => ({ getDriver: () => mockDriver }));
            const { VFSService } = await import('./service');
            const svc = new VFSService();

            await expect(svc.write('system://Apps/evil.txt', 'hack', ctx))
                .rejects.toThrow('Cannot write to system://');
        });

        test('blocks mkdir on system://', async () => {
            jest.resetModules();
            process.env.NEXT_PUBLIC_FEATURE_VFS = 'true';
            jest.mock('./driver', () => ({ getDriver: () => mockDriver }));
            const { VFSService } = await import('./service');
            const svc = new VFSService();

            await expect(svc.mkdir('system://EvilDir', ctx))
                .rejects.toThrow('Cannot write to system://');
        });

        test('allows reading from system://', async () => {
            jest.resetModules();
            process.env.NEXT_PUBLIC_FEATURE_VFS = 'true';
            jest.mock('./driver', () => ({ getDriver: () => mockDriver }));
            const { VFSService } = await import('./service');
            const svc = new VFSService();

            await expect(svc.list('system://Apps', ctx)).resolves.toBeDefined();
            await expect(svc.read('system://config.json', ctx)).resolves.toBeDefined();
        });
    });

    // ─── Audit Logging ──────────────────────────────────────────────────
    describe('Audit Logging', () => {

        test('emits audit event for ALLOW decisions', async () => {
            jest.resetModules();
            process.env.NEXT_PUBLIC_FEATURE_VFS = 'true';
            jest.mock('./driver', () => ({ getDriver: () => mockDriver }));
            const { VFSService } = await import('./service');
            const svc = new VFSService();

            const spy = jest.spyOn(console, 'info').mockImplementation();

            await svc.list('user://Docs', ctx);

            expect(spy).toHaveBeenCalled();
            const auditCall = spy.mock.calls.find(c => c[0] === '[VFS:Audit]');
            expect(auditCall).toBeDefined();
            const event = JSON.parse(auditCall![1]);
            expect(event.intent).toBe('fs.list');
            expect(event.decision).toBe('ALLOW');
            expect(event.path).toBe('user://Docs');

            spy.mockRestore();
        });

        test('emits audit event for DENY decisions (flag OFF)', async () => {
            jest.resetModules();
            process.env.NEXT_PUBLIC_FEATURE_VFS = 'false';
            jest.mock('./driver', () => ({ getDriver: () => mockDriver }));
            const { VFSService } = await import('./service');
            const svc = new VFSService();

            const spy = jest.spyOn(console, 'info').mockImplementation();

            await expect(svc.list('user://Docs', ctx)).rejects.toThrow();

            const auditCall = spy.mock.calls.find(c => c[0] === '[VFS:Audit]');
            expect(auditCall).toBeDefined();
            const event = JSON.parse(auditCall![1]);
            expect(event.decision).toBe('DENY');
            expect(event.reason).toContain('Feature Flag OFF');

            spy.mockRestore();
        });
    });
});
