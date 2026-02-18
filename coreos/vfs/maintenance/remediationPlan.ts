/**
 * ═══════════════════════════════════════════════════════════════════════════
 * VFS REMEDIATION PLAN ENGINE (Phase 37C)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Deterministic remediation plan generator for VFS duplicate names.
 * Takes a ScanResult (Phase 37B) and produces a list of rename actions.
 *
 * RULES:
 *   1. canonicalKey เดียวกัน ใน parent เดียวกัน = duplicate group
 *   2. Winner selection (deterministic):
 *      a. prefer earliest createdAt (non-zero)
 *      b. tie-break: lexicographic sort on rawName
 *   3. Non-winners → renamed: "${base} (${n})" or "${base} (${n}).${ext}"
 *   4. system:// paths always skipped
 *   5. Pure function — no driver calls, no side effects
 *
 * @module coreos/vfs/maintenance/remediationPlan
 */

import type { ScanResult, DuplicateGroup, DuplicateEntry } from './duplicateScan';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type ActionType = 'RENAME' | 'SKIP' | 'KEEP';

export interface RemediationAction {
    /** Action type */
    type: ActionType;
    /** Original entry path */
    originalPath: string;
    /** Original name */
    originalName: string;
    /** New name (only for RENAME) */
    newName?: string;
    /** Reason for skip */
    reason?: string;
    /** Parent directory path */
    parentPath: string;
    /** Canonical key of the group */
    canonicalKey: string;
    /** Idempotency key for safe replay */
    idempotencyKey: string;
}

export interface RemediationPlan {
    /** Unique plan ID */
    planId: string;
    /** Timestamp of plan generation */
    timestamp: number;
    /** Total groups analyzed */
    groupsAnalyzed: number;
    /** Actions to execute */
    actions: RemediationAction[];
    /** Summary */
    summary: {
        keeps: number;
        renames: number;
        skips: number;
        total: number;
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// PLAN GENERATOR
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate a deterministic remediation plan from scan results.
 *
 * Pure function — no side effects, no driver calls.
 * Calling twice with the same input MUST produce identical output.
 */
export function generatePlan(scanResult: ScanResult): RemediationPlan {
    const planId = `plan-${scanResult.timestamp}-${scanResult.duplicateGroups.length}`;
    const actions: RemediationAction[] = [];

    for (const group of scanResult.duplicateGroups) {
        // Skip system:// paths
        if (group.parentPath.startsWith('system://')) {
            for (const entry of group.entries) {
                actions.push({
                    type: 'SKIP',
                    originalPath: entry.path,
                    originalName: entry.name,
                    parentPath: group.parentPath,
                    canonicalKey: group.canonicalKey,
                    reason: 'system:// path — protected',
                    idempotencyKey: makeIdempotencyKey(planId, entry.path, 'SKIP'),
                });
            }
            continue;
        }

        const sorted = selectWinnerAndSort(group.entries);
        // Track names already used in this parent to avoid suffix collisions
        const usedNames = new Set<string>(sorted.map(e => e.name.toLowerCase()));

        for (let i = 0; i < sorted.length; i++) {
            const entry = sorted[i];

            if (i === 0) {
                // Winner — keep as-is
                actions.push({
                    type: 'KEEP',
                    originalPath: entry.path,
                    originalName: entry.name,
                    parentPath: group.parentPath,
                    canonicalKey: group.canonicalKey,
                    idempotencyKey: makeIdempotencyKey(planId, entry.path, 'KEEP'),
                });
            } else {
                // Non-winner — generate suffixed name
                const newName = generateSuffixedName(entry.name, i, usedNames);
                usedNames.add(newName.toLowerCase());

                actions.push({
                    type: 'RENAME',
                    originalPath: entry.path,
                    originalName: entry.name,
                    newName,
                    parentPath: group.parentPath,
                    canonicalKey: group.canonicalKey,
                    idempotencyKey: makeIdempotencyKey(planId, entry.path, 'RENAME'),
                });
            }
        }
    }

    return {
        planId,
        timestamp: Date.now(),
        groupsAnalyzed: scanResult.duplicateGroups.length,
        actions,
        summary: {
            keeps: actions.filter(a => a.type === 'KEEP').length,
            renames: actions.filter(a => a.type === 'RENAME').length,
            skips: actions.filter(a => a.type === 'SKIP').length,
            total: actions.length,
        },
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// WINNER SELECTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Sort entries so that the winner is first.
 *
 * Winner rules (deterministic):
 *   1. Prefer earliest createdAt (non-zero)
 *   2. Tie-break: lexicographic order of rawName (ascending)
 *
 * Returns a NEW sorted array (does not mutate input).
 */
export function selectWinnerAndSort(entries: DuplicateEntry[]): DuplicateEntry[] {
    return [...entries].sort((a, b) => {
        // Both have valid createdAt
        const aTime = a.createdAt || 0;
        const bTime = b.createdAt || 0;

        if (aTime > 0 && bTime > 0) {
            if (aTime !== bTime) return aTime - bTime; // Earlier wins
        } else if (aTime > 0) {
            return -1; // a has time, b doesn't → a wins
        } else if (bTime > 0) {
            return 1;  // b has time, a doesn't → b wins
        }

        // Tie-break: lexicographic on raw name
        return a.name.localeCompare(b.name);
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// SUFFIX GENERATOR
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate a suffixed name that avoids collisions.
 *
 * "docs.txt" → "docs (1).txt"
 * "My Folder" → "My Folder (1)"
 * "file (1).txt" → "file (1) (1).txt" (if needed, but rare)
 *
 * @param originalName Original file/folder name
 * @param index        Position index (1-based counter start)
 * @param usedNames    Set of already-used names (lowercase) for collision avoidance
 */
export function generateSuffixedName(
    originalName: string,
    index: number,
    usedNames: Set<string>,
): string {
    const { base, ext } = splitNameAndExtension(originalName);
    let n = index;
    let candidate: string;

    // Find a suffix number that doesn't collide
    do {
        candidate = ext ? `${base} (${n})${ext}` : `${base} (${n})`;
        n++;
    } while (usedNames.has(candidate.toLowerCase()) && n < 1000);

    return candidate;
}

/**
 * Split a filename into base and extension.
 *
 * "docs.txt" → { base: "docs", ext: ".txt" }
 * "My Folder" → { base: "My Folder", ext: "" }
 * ".hidden" → { base: ".hidden", ext: "" }
 * "archive.tar.gz" → { base: "archive.tar", ext: ".gz" }
 */
export function splitNameAndExtension(name: string): { base: string; ext: string } {
    const lastDot = name.lastIndexOf('.');

    // No dot, starts with dot (hidden file), or dot is at position 0
    if (lastDot <= 0) {
        return { base: name, ext: '' };
    }

    return {
        base: name.substring(0, lastDot),
        ext: name.substring(lastDot),
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// IDEMPOTENCY KEY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate a deterministic idempotency key for a remediation step.
 */
function makeIdempotencyKey(planId: string, path: string, action: string): string {
    // Simple deterministic key: planId + path + action
    const raw = `${planId}:${path}:${action}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
        hash = ((hash << 5) - hash + raw.charCodeAt(i)) >>> 0;
    }
    return `idem-${hash.toString(36)}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// PLAN REPORT FORMATTER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Format a remediation plan as a markdown report.
 */
export function formatPlanReport(plan: RemediationPlan): string {
    const lines: string[] = [
        `# VFS Remediation Plan`,
        ``,
        `- **Plan ID**: \`${plan.planId}\``,
        `- **Generated**: ${new Date(plan.timestamp).toISOString()}`,
        `- **Groups Analyzed**: ${plan.groupsAnalyzed}`,
        `- **Actions**: ${plan.summary.keeps} keep, ${plan.summary.renames} rename, ${plan.summary.skips} skip`,
        ``,
    ];

    if (plan.actions.length === 0) {
        lines.push(`✅ No remediation needed.`);
        return lines.join('\n');
    }

    lines.push(`## Actions`);
    lines.push(``);
    lines.push(`| # | Type | Original | → New Name | Parent |`);
    lines.push(`|---|------|----------|------------|--------|`);

    for (let i = 0; i < plan.actions.length; i++) {
        const a = plan.actions[i];
        const newCol = a.type === 'RENAME' ? a.newName || '' : a.type === 'SKIP' ? `_(${a.reason})_` : '_(keep)_';
        lines.push(`| ${i + 1} | ${a.type} | \`${a.originalName}\` | ${newCol} | \`${a.parentPath}\` |`);
    }

    lines.push(``);
    return lines.join('\n');
}
