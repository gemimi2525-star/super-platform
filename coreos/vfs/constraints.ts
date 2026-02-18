/**
 * ═══════════════════════════════════════════════════════════════════════════
 * VFS CONSTRAINTS ENGINE (Phase 37)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Kernel-level constraint checks for VFS operations.
 * Enforces STRICT OS MODE: duplicate names in the same parent are DENIED.
 *
 * @module coreos/vfs/constraints
 */

import { makeCanonicalKey } from './naming';
import type { IVFSDriver } from '@/lib/vfs/types';
import { VFSError } from '@/lib/vfs/types';

// ─── Audit Helper ───────────────────────────────────────────────────────

interface ConstraintAuditEvent {
    type: 'VFS_CONSTRAINT';
    constraint: 'UNIQUE_SIBLING';
    parentPath: string;
    name: string;
    canonicalKey: string;
    decision: 'ALLOW' | 'DENY';
    conflictWith?: string;
    timestamp: number;
}

function emitConstraintAudit(event: ConstraintAuditEvent): void {
    console.info('[VFS:Constraint:Audit]', JSON.stringify(event));
}

// ─── Unique Sibling Check ───────────────────────────────────────────────

/**
 * Check that no sibling in `parentPath` has the same canonical name.
 *
 * STRICT OS MODE:
 *   "Docs" and "docs" in the same parent → VFS_DUPLICATE_NAME
 *
 * @throws VFSError with code 'VFS_DUPLICATE_NAME' if a conflict is found.
 */
export async function checkUniqueSibling(
    parentPath: string,
    name: string,
    driver: IVFSDriver,
): Promise<void> {
    const newKey = await makeCanonicalKey(parentPath, name);

    // List existing siblings
    let siblings: { name: string }[] = [];
    try {
        siblings = await driver.list(parentPath);
    } catch (e: any) {
        // If parent doesn't exist yet (first item), no conflict possible → ALLOW
        if (e?.code === 'NOT_FOUND' || e?.message?.includes('NOT_FOUND')) {
            emitConstraintAudit({
                type: 'VFS_CONSTRAINT',
                constraint: 'UNIQUE_SIBLING',
                parentPath,
                name,
                canonicalKey: newKey,
                decision: 'ALLOW',
                timestamp: Date.now(),
            });
            return;
        }
        throw e; // Re-throw unexpected errors
    }

    // Check each sibling's canonical key
    for (const sibling of siblings) {
        const siblingKey = await makeCanonicalKey(parentPath, sibling.name);
        if (siblingKey === newKey) {
            // CONFLICT — DENY
            emitConstraintAudit({
                type: 'VFS_CONSTRAINT',
                constraint: 'UNIQUE_SIBLING',
                parentPath,
                name,
                canonicalKey: newKey,
                decision: 'DENY',
                conflictWith: sibling.name,
                timestamp: Date.now(),
            });

            throw new VFSError(
                'VFS_DUPLICATE_NAME',
                `ชื่อซ้ำในโฟลเดอร์เดียวกัน: "${name}" conflicts with "${sibling.name}" (Strict OS Mode)`,
            );
        }
    }

    // No conflict — ALLOW
    emitConstraintAudit({
        type: 'VFS_CONSTRAINT',
        constraint: 'UNIQUE_SIBLING',
        parentPath,
        name,
        canonicalKey: newKey,
        decision: 'ALLOW',
        timestamp: Date.now(),
    });
}
