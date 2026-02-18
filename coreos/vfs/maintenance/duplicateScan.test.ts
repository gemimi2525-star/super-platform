/**
 * ═══════════════════════════════════════════════════════════════════════════
 * VFS DUPLICATE SCANNER — TESTS (Phase 37B)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Tests covering:
 *   - Empty directory → 0 duplicates
 *   - No duplicates → 0 groups
 *   - Case-insensitive match → 1 group
 *   - Multiple groups in same parent
 *   - Nested directory scan
 *   - system:// skipped by default
 *   - Markdown report generation
 *
 * Run: npx jest coreos/vfs/maintenance/duplicateScan.test.ts --verbose
 *
 * @module coreos/vfs/maintenance/duplicateScan.test
 */

import { scanForDuplicates, formatScanReport } from './duplicateScan';
import { VFSError } from '@/lib/vfs/types';
import type { IVFSDriver, VFSMetadata } from '@/lib/vfs/types';

// ─── Mock Driver Factory ────────────────────────────────────────────────

type DirTree = Record<string, { name: string; type: string; size?: number }[]>;

function createTreeDriver(tree: DirTree): IVFSDriver {
    return {
        name: 'TestTreeDriver',
        isAvailable: jest.fn().mockResolvedValue(true),
        list: jest.fn().mockImplementation(async (path: string) => {
            const children = tree[path];
            if (!children) {
                throw new VFSError('NOT_FOUND', `Directory not found: ${path}`);
            }
            return children.map((c, i) => ({
                id: `${path}/${c.name}-${i}`,
                name: c.name,
                type: c.type as any,
                path: `${path}/${c.name}`,
                parentId: path,
                size: c.size ?? 0,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            }));
        }),
        stat: jest.fn().mockResolvedValue(null),
        read: jest.fn().mockResolvedValue(new ArrayBuffer(0)),
        write: jest.fn().mockResolvedValue({} as VFSMetadata),
        mkdir: jest.fn().mockResolvedValue({} as VFSMetadata),
        delete: jest.fn().mockResolvedValue(undefined),
        rename: jest.fn().mockRejectedValue(new VFSError('NOT_SUPPORTED', 'N/A')),
        move: jest.fn().mockRejectedValue(new VFSError('NOT_SUPPORTED', 'N/A')),
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('VFS Duplicate Scanner (Phase 37B)', () => {

    // ─── Empty Directory ─────────────────────────────────────────────────

    test('1. empty directory → 0 duplicates', async () => {
        const driver = createTreeDriver({ 'user://': [] });
        const result = await scanForDuplicates(driver, 'user://');

        expect(result.duplicateGroups).toHaveLength(0);
        expect(result.scannedDirs).toBe(1);
        expect(result.totalEntries).toBe(0);
    });

    // ─── No Duplicates ──────────────────────────────────────────────────

    test('2. no duplicates → 0 groups', async () => {
        const driver = createTreeDriver({
            'user://': [
                { name: 'Documents', type: 'folder' },
                { name: 'Photos', type: 'folder' },
                { name: 'readme.txt', type: 'file' },
            ],
        });
        const result = await scanForDuplicates(driver, 'user://');

        expect(result.duplicateGroups).toHaveLength(0);
        expect(result.totalEntries).toBe(3);
    });

    // ─── Case-Insensitive Match ─────────────────────────────────────────

    test('3. case-insensitive match → 1 group', async () => {
        const driver = createTreeDriver({
            'user://': [
                { name: 'Documents', type: 'folder' },
                { name: 'documents', type: 'folder' },
            ],
        });
        const result = await scanForDuplicates(driver, 'user://');

        expect(result.duplicateGroups).toHaveLength(1);
        expect(result.duplicateGroups[0].entries).toHaveLength(2);
        expect(result.duplicateGroups[0].normalizedName).toBe('documents');
    });

    // ─── Multiple Groups ────────────────────────────────────────────────

    test('4. multiple duplicate groups in same parent', async () => {
        const driver = createTreeDriver({
            'user://': [
                { name: 'Docs', type: 'folder' },
                { name: 'docs', type: 'folder' },
                { name: 'DOCS', type: 'folder' },
                { name: 'Photos', type: 'folder' },
                { name: 'photos', type: 'folder' },
                { name: 'Music', type: 'folder' },
            ],
        });
        const result = await scanForDuplicates(driver, 'user://');

        expect(result.duplicateGroups).toHaveLength(2);

        const docsGroup = result.duplicateGroups.find(g => g.normalizedName === 'docs');
        expect(docsGroup?.entries).toHaveLength(3);

        const photosGroup = result.duplicateGroups.find(g => g.normalizedName === 'photos');
        expect(photosGroup?.entries).toHaveLength(2);
    });

    // ─── Nested Directory Scan ──────────────────────────────────────────

    test('5. nested directory scan detects duplicates at depth', async () => {
        const driver = createTreeDriver({
            'user://': [
                { name: 'Projects', type: 'folder' },
            ],
            'user://Projects': [
                { name: 'App.tsx', type: 'file', size: 1024 },
                { name: 'app.tsx', type: 'file', size: 512 },
            ],
        });
        const result = await scanForDuplicates(driver, 'user://');

        expect(result.scannedDirs).toBe(2);
        expect(result.duplicateGroups).toHaveLength(1);
        expect(result.duplicateGroups[0].parentPath).toBe('user://Projects');
    });

    // ─── System Skip ────────────────────────────────────────────────────

    test('6. system:// skipped by default', async () => {
        const driver = createTreeDriver({
            'system://': [
                { name: 'Config', type: 'folder' },
                { name: 'config', type: 'folder' },
            ],
        });
        const result = await scanForDuplicates(driver, 'system://');

        // Should skip entirely
        expect(result.scannedDirs).toBe(0);
        expect(result.duplicateGroups).toHaveLength(0);
    });

    test('7. system:// scanned when skipSystem=false', async () => {
        const driver = createTreeDriver({
            'system://': [
                { name: 'Config', type: 'folder' },
                { name: 'config', type: 'folder' },
            ],
        });
        const result = await scanForDuplicates(driver, 'system://', { skipSystem: false });

        expect(result.scannedDirs).toBe(1);
        expect(result.duplicateGroups).toHaveLength(1);
    });

    // ─── Directory Not Found ────────────────────────────────────────────

    test('8. non-existent directory → 0 results (no crash)', async () => {
        const driver = createTreeDriver({}); // empty tree
        const result = await scanForDuplicates(driver, 'user://nonexistent');

        expect(result.scannedDirs).toBe(0);
        expect(result.duplicateGroups).toHaveLength(0);
    });

    // ─── Max Depth ──────────────────────────────────────────────────────

    test('9. maxDepth limits recursion', async () => {
        const driver = createTreeDriver({
            'user://': [{ name: 'A', type: 'folder' }],
            'user://A': [{ name: 'B', type: 'folder' }],
            'user://A/B': [
                { name: 'dup.txt', type: 'file' },
                { name: 'DUP.txt', type: 'file' },
            ],
        });

        // maxDepth=1 scans user:// and user://A but NOT user://A/B
        const result = await scanForDuplicates(driver, 'user://', { maxDepth: 1 });

        expect(result.scannedDirs).toBe(2); // root + A
        expect(result.duplicateGroups).toHaveLength(0); // B not scanned
    });

    // ─── Report Generation ──────────────────────────────────────────────

    test('10. formatScanReport generates valid markdown', async () => {
        const driver = createTreeDriver({
            'user://': [
                { name: 'Docs', type: 'folder' },
                { name: 'docs', type: 'folder' },
            ],
        });
        const result = await scanForDuplicates(driver, 'user://');
        const report = formatScanReport(result);

        expect(report).toContain('# VFS Duplicate Scan Report');
        expect(report).toContain('Duplicates Found**: 1 group(s)');
        expect(report).toContain('docs');
        expect(report).toContain('Docs');
    });

    test('11. formatScanReport for clean result', async () => {
        const driver = createTreeDriver({ 'user://': [] });
        const result = await scanForDuplicates(driver, 'user://');
        const report = formatScanReport(result);

        expect(report).toContain('No duplicates found');
    });
});
