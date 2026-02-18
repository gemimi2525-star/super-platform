/**
 * ═══════════════════════════════════════════════════════════════════════════
 * VFS NAMING KERNEL — TESTS (Phase 37)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 12+ test cases covering:
 *   - normalizeName: case, space, trim, NFKC, unicode
 *   - makeCanonicalKey: stability, case-insensitive, different parent
 *   - checkUniqueSibling: conflict, allow, mixed-case, empty dir
 *
 * Run: npx jest coreos/vfs/naming.test.ts --verbose
 *
 * @module coreos/vfs/naming.test
 */

import { normalizeName, makeCanonicalKey } from './naming';
import { checkUniqueSibling } from './constraints';
import { VFSError } from '@/lib/vfs/types';
import type { IVFSDriver, VFSMetadata } from '@/lib/vfs/types';

// ─── Mock Driver Factory ────────────────────────────────────────────────

function createMockDriver(siblings: { name: string }[] = []): IVFSDriver {
    return {
        name: 'TestDriver',
        isAvailable: jest.fn().mockResolvedValue(true),
        list: jest.fn().mockResolvedValue(
            siblings.map((s, i) => ({
                id: `${i}`,
                name: s.name,
                type: 'file' as const,
                path: `user://${s.name}`,
                parentId: 'user://',
                size: 0,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            }))
        ),
        stat: jest.fn().mockResolvedValue(null),
        read: jest.fn().mockResolvedValue(new ArrayBuffer(0)),
        write: jest.fn().mockResolvedValue({} as VFSMetadata),
        mkdir: jest.fn().mockResolvedValue({} as VFSMetadata),
        delete: jest.fn().mockResolvedValue(undefined),
        rename: jest.fn().mockRejectedValue(new VFSError('NOT_SUPPORTED', 'N/A')),
        move: jest.fn().mockRejectedValue(new VFSError('NOT_SUPPORTED', 'N/A')),
    };
}

function createEmptyDirDriver(): IVFSDriver {
    return createMockDriver([]);
}

function createNotFoundDriver(): IVFSDriver {
    const driver = createMockDriver();
    (driver.list as jest.Mock).mockRejectedValue(
        new VFSError('NOT_FOUND', 'Directory not found')
    );
    return driver;
}

// ═══════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('VFS Naming Kernel (Phase 37)', () => {

    // ─── normalizeName ──────────────────────────────────────────────────

    describe('normalizeName', () => {

        test('1. case folding: "Documents" → "documents"', () => {
            expect(normalizeName('Documents')).toBe('documents');
            expect(normalizeName('DOCUMENTS')).toBe('documents');
            expect(normalizeName('DocuMENTS')).toBe('documents');
        });

        test('2. space collapse: "My  Files" → "my files"', () => {
            expect(normalizeName('My  Files')).toBe('my files');
            expect(normalizeName('My    Files')).toBe('my files');
            expect(normalizeName('a\t b')).toBe('a b');
        });

        test('3. trim: " Docs " → "docs"', () => {
            expect(normalizeName(' Docs ')).toBe('docs');
            expect(normalizeName('  hello  world  ')).toBe('hello world');
        });

        test('4. NFKC: "ﬁle" (fi ligature U+FB01) → "file"', () => {
            // U+FB01 = ﬁ (fi ligature)
            expect(normalizeName('\uFB01le')).toBe('file');
        });

        test('5. unicode café normalization', () => {
            // café with combining accent (NFD) vs precomposed (NFC)
            const nfd = 'cafe\u0301'; // e + combining acute
            const nfc = 'caf\u00E9';  // precomposed é
            expect(normalizeName(nfd)).toBe(normalizeName(nfc));
        });
    });

    // ─── makeCanonicalKey ───────────────────────────────────────────────

    describe('makeCanonicalKey', () => {

        test('6. stable: same input → same hash', async () => {
            const key1 = await makeCanonicalKey('user://', 'Documents');
            const key2 = await makeCanonicalKey('user://', 'Documents');
            expect(key1).toBe(key2);
            expect(key1.length).toBeGreaterThan(0);
        });

        test('7. case-insensitive: "Docs" and "docs" → same key', async () => {
            const key1 = await makeCanonicalKey('user://', 'Docs');
            const key2 = await makeCanonicalKey('user://', 'docs');
            const key3 = await makeCanonicalKey('user://', 'DOCS');
            expect(key1).toBe(key2);
            expect(key2).toBe(key3);
        });

        test('8. different parent → different key', async () => {
            const key1 = await makeCanonicalKey('user://A', 'docs');
            const key2 = await makeCanonicalKey('user://B', 'docs');
            expect(key1).not.toBe(key2);
        });
    });

    // ─── checkUniqueSibling ─────────────────────────────────────────────

    describe('checkUniqueSibling', () => {

        test('9. sibling conflict (same parent) → DENY', async () => {
            const driver = createMockDriver([{ name: 'Documents' }]);

            await expect(
                checkUniqueSibling('user://', 'Documents', driver)
            ).rejects.toThrow('ชื่อซ้ำ');
        });

        test('10. no siblings → ALLOW', async () => {
            const driver = createEmptyDirDriver();

            await expect(
                checkUniqueSibling('user://', 'NewFolder', driver)
            ).resolves.toBeUndefined();
        });

        test('11. mixed case conflict → DENY', async () => {
            const driver = createMockDriver([{ name: 'Docs' }]);

            await expect(
                checkUniqueSibling('user://', 'docs', driver)
            ).rejects.toThrow('ชื่อซ้ำ');

            await expect(
                checkUniqueSibling('user://', 'DOCS', driver)
            ).rejects.toThrow('ชื่อซ้ำ');
        });

        test('12. parent not found (first item) → ALLOW', async () => {
            const driver = createNotFoundDriver();

            await expect(
                checkUniqueSibling('user://newdir', 'file.txt', driver)
            ).resolves.toBeUndefined();
        });

        test('13. different names → ALLOW', async () => {
            const driver = createMockDriver([
                { name: 'Photos' },
                { name: 'Music' },
            ]);

            await expect(
                checkUniqueSibling('user://', 'Documents', driver)
            ).resolves.toBeUndefined();
        });

        test('14. error code is VFS_DUPLICATE_NAME', async () => {
            const driver = createMockDriver([{ name: 'Report.pdf' }]);

            try {
                await checkUniqueSibling('user://', 'report.pdf', driver);
                fail('Should have thrown');
            } catch (err: any) {
                expect(err).toBeInstanceOf(VFSError);
                expect(err.code).toBe('VFS_DUPLICATE_NAME');
            }
        });
    });
});
