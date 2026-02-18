/**
 * ═══════════════════════════════════════════════════════════════════════════
 * VFS DUPLICATE SCANNER (Phase 37B)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Read-only scanner that detects duplicate names within VFS directories.
 * Uses Phase 37 normalizeName + makeCanonicalKey for detection.
 *
 * SAFETY:
 * - NEVER modifies any data
 * - Read-only via driver.list()
 * - Skips system:// by default (configurable)
 *
 * @module coreos/vfs/maintenance/duplicateScan
 */

import { normalizeName, makeCanonicalKey } from '../naming';
import type { IVFSDriver, VFSMetadata } from '@/lib/vfs/types';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface DuplicateEntry {
    name: string;
    type: string;
    size: number;
    createdAt: number;
    path: string;
}

export interface DuplicateGroup {
    parentPath: string;
    canonicalKey: string;
    normalizedName: string;
    entries: DuplicateEntry[];
}

export interface ScanResult {
    scannedDirs: number;
    totalEntries: number;
    duplicateGroups: DuplicateGroup[];
    timestamp: number;
    scope: string;
}

export interface ScanOptions {
    /** Skip system:// paths (default: true) */
    skipSystem?: boolean;
    /** Maximum depth to scan (default: 10) */
    maxDepth?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// SCANNER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Scan a VFS directory tree for duplicate names.
 *
 * Read-only — uses driver.list() only. Never modifies data.
 *
 * @param driver   VFS driver to use for listing
 * @param rootPath Root path to scan (e.g., 'user://')
 * @param options  Scan options
 * @returns ScanResult with duplicate groups
 */
export async function scanForDuplicates(
    driver: IVFSDriver,
    rootPath: string,
    options: ScanOptions = {},
): Promise<ScanResult> {
    const { skipSystem = true, maxDepth = 10 } = options;

    const result: ScanResult = {
        scannedDirs: 0,
        totalEntries: 0,
        duplicateGroups: [],
        timestamp: Date.now(),
        scope: rootPath,
    };

    // Recursive scan
    await scanDirectory(driver, rootPath, 0, maxDepth, skipSystem, result);

    return result;
}

/**
 * Scan a single directory and recurse into subdirectories.
 */
async function scanDirectory(
    driver: IVFSDriver,
    dirPath: string,
    depth: number,
    maxDepth: number,
    skipSystem: boolean,
    result: ScanResult,
): Promise<void> {
    if (depth > maxDepth) return;

    // Skip system:// if configured
    if (skipSystem && dirPath.startsWith('system://')) return;

    // List children
    let children: VFSMetadata[] = [];
    try {
        children = await driver.list(dirPath);
    } catch {
        // Directory not found or inaccessible — skip silently
        return;
    }

    result.scannedDirs++;
    result.totalEntries += children.length;

    // Group by canonical key
    const keyMap = new Map<string, DuplicateEntry[]>();

    for (const child of children) {
        const key = await makeCanonicalKey(dirPath, child.name);
        const entry: DuplicateEntry = {
            name: child.name,
            type: child.type || 'file',
            size: child.size || 0,
            createdAt: child.createdAt || 0,
            path: child.path || `${dirPath}/${child.name}`,
        };

        const existing = keyMap.get(key);
        if (existing) {
            existing.push(entry);
        } else {
            keyMap.set(key, [entry]);
        }
    }

    // Extract duplicate groups (2+ entries per key)
    for (const [key, entries] of keyMap) {
        if (entries.length >= 2) {
            result.duplicateGroups.push({
                parentPath: dirPath,
                canonicalKey: key,
                normalizedName: normalizeName(entries[0].name),
                entries,
            });
        }
    }

    // Recurse into subdirectories
    for (const child of children) {
        if (child.type === 'folder' || child.type === 'directory') {
            const childPath = dirPath.endsWith('/')
                ? `${dirPath}${child.name}`
                : `${dirPath}/${child.name}`;
            await scanDirectory(driver, childPath, depth + 1, maxDepth, skipSystem, result);
        }
    }
}

/**
 * Format scan results as a markdown evidence report.
 */
export function formatScanReport(result: ScanResult): string {
    const lines: string[] = [
        `# VFS Duplicate Scan Report`,
        ``,
        `- **Scope**: \`${result.scope}\``,
        `- **Scanned**: ${result.scannedDirs} directories, ${result.totalEntries} entries`,
        `- **Duplicates Found**: ${result.duplicateGroups.length} group(s)`,
        `- **Timestamp**: ${new Date(result.timestamp).toISOString()}`,
        ``,
    ];

    if (result.duplicateGroups.length === 0) {
        lines.push(`✅ No duplicates found.`);
    } else {
        lines.push(`## Duplicate Groups`);
        lines.push(``);

        for (let i = 0; i < result.duplicateGroups.length; i++) {
            const group = result.duplicateGroups[i];
            lines.push(`### Group ${i + 1}: "${group.normalizedName}"`);
            lines.push(`- **Parent**: \`${group.parentPath}\``);
            lines.push(`- **Canonical Key**: \`${group.canonicalKey.substring(0, 16)}…\``);
            lines.push(`- **Entries**:`);
            for (const entry of group.entries) {
                lines.push(`  - \`${entry.name}\` (${entry.type}, ${entry.size} bytes)`);
            }
            lines.push(``);
        }
    }

    return lines.join('\n');
}
