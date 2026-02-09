/**
 * ═══════════════════════════════════════════════════════════════════════════
 * VFS PATH SAFETY TESTS (Phase 15A)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Verifies canonical path normalization and security blocking.
 * 
 * @module lib/vfs/path.test
 */

import { VFSPath } from './path';

describe('VFS Path Safety', () => {

    // 1. Canonical Schemes
    test('allows valid schemes', () => {
        expect(VFSPath.normalize('user://Docs/A')).toBe('user://Docs/A');
        expect(VFSPath.normalize('system://Apps/Finder')).toBe('system://Apps/Finder');
        expect(VFSPath.normalize('workspace://123/Data')).toBe('workspace://123/Data');
    });

    test('blocks invalid schemes', () => {
        expect(() => VFSPath.normalize('http://google.com')).toThrow('Invalid scheme');
        expect(() => VFSPath.normalize('file:///etc/passwd')).toThrow('Invalid scheme');
        expect(() => VFSPath.normalize('/etc/passwd')).toThrow('Path must start with a valid scheme');
    });

    // 2. Traversal Attacks
    test('blocks .. traversal', () => {
        expect(() => VFSPath.normalize('user://../etc/passwd')).toThrow('Path traversal');
        expect(() => VFSPath.normalize('user://Docs/../../Secrets')).toThrow('Path traversal');
    });

    test('blocks encoded traversal', () => {
        expect(() => VFSPath.normalize('user://%2e%2e/etc/passwd')).toThrow('Path traversal');
        expect(() => VFSPath.normalize('user://Docs/%2E%2E/Secrets')).toThrow('Path traversal');
    });

    // 3. Normalization Rules
    test('normalizes slashes', () => {
        expect(VFSPath.normalize('user://Docs//A')).toBe('user://Docs/A');
        expect(VFSPath.normalize('user://Docs\\A')).toBe('user://Docs/A');
    });

    test('allows benign dots', () => {
        expect(VFSPath.normalize('user://Docs/file.v1.txt')).toBe('user://Docs/file.v1.txt');
        expect(VFSPath.normalize('user://.config')).toBe('user://.config'); // Hidden file OK
        expect(VFSPath.normalize('user://my..file')).toBe('user://my..file'); // Weird name OK if not path segment
    });
});
