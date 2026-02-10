/**
 * ═══════════════════════════════════════════════════════════════════════════
 * VFS PERMISSION MATRIX (Phase 16A)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Static permission matrix defining which App can perform which 
 * VFS intents on which schemes.
 * 
 * This is a NEW layer on top of the FROZEN governance in lib/vfs/service.ts.
 * It does NOT replace governance — it adds app-level enforcement.
 * 
 * @module coreos/vfs/permission-matrix
 */

// ─── Types ────────────────────────────────────────────────────────────────

export type VFSIntent = 'fs.list' | 'fs.read' | 'fs.write' | 'fs.mkdir' | 'fs.delete' | 'fs.stat';
export type VFSSchemeScope = 'user' | 'system' | 'workspace';

export interface AppPermissionRule {
    /** App identifier (e.g., 'core.finder', 'core.notes') */
    readonly appId: string;
    /** Intents this app is allowed to perform */
    readonly allowedIntents: readonly VFSIntent[];
    /** VFS schemes this app can access */
    readonly allowedSchemes: readonly VFSSchemeScope[];
    /** If true, write intents (fs.write, fs.mkdir, fs.delete) are blocked regardless of allowedIntents */
    readonly readOnly: boolean;
}

export interface AppPermissionSet {
    readonly appId: string;
    readonly canList: boolean;
    readonly canRead: boolean;
    readonly canWrite: boolean;
    readonly canMkdir: boolean;
    readonly canDelete: boolean;
    readonly canStat: boolean;
    readonly schemes: readonly VFSSchemeScope[];
    readonly readOnly: boolean;
}

// ─── Permission Matrix (Static Rules) ─────────────────────────────────────

const WRITE_INTENTS: readonly VFSIntent[] = ['fs.write', 'fs.mkdir', 'fs.delete'];

/**
 * Static permission matrix for known apps.
 * 
 * GOVERNANCE: 
 * - core.finder has full access (it's the file manager)
 * - core.notes has read + write on user:// only
 * - Default: read-only on user:// for unknown apps
 */
export const PERMISSION_MATRIX: readonly AppPermissionRule[] = [
    {
        appId: 'core.finder',
        allowedIntents: ['fs.list', 'fs.read', 'fs.write', 'fs.mkdir', 'fs.delete', 'fs.stat'],
        allowedSchemes: ['user', 'system', 'workspace'],
        readOnly: false,
    },
    {
        appId: 'core.files',
        allowedIntents: ['fs.list', 'fs.read', 'fs.write', 'fs.mkdir', 'fs.delete', 'fs.stat'],
        allowedSchemes: ['user', 'workspace'],
        readOnly: false,
    },
    {
        appId: 'system.explorer',
        allowedIntents: ['fs.list', 'fs.read', 'fs.write', 'fs.mkdir', 'fs.delete', 'fs.stat'],
        allowedSchemes: ['user', 'system', 'workspace'],
        readOnly: false,
    },
    {
        appId: 'core.notes',
        allowedIntents: ['fs.list', 'fs.read', 'fs.write', 'fs.mkdir', 'fs.stat'],
        allowedSchemes: ['user'],
        readOnly: false,
    },
    {
        appId: 'core.settings',
        allowedIntents: ['fs.list', 'fs.read', 'fs.stat'],
        allowedSchemes: ['system'],
        readOnly: true,
    },
];

/**
 * Default rule for apps not in the matrix.
 * Conservative: read-only access to user:// only.
 */
const DEFAULT_RULE: AppPermissionRule = {
    appId: '__default__',
    allowedIntents: ['fs.list', 'fs.read', 'fs.stat'],
    allowedSchemes: ['user'],
    readOnly: true,
};

// ─── Lookup Functions ─────────────────────────────────────────────────────

/**
 * Get the permission rule for an app.
 * Falls back to DEFAULT_RULE for unknown apps.
 */
export function getAppPermissionRule(appId: string): AppPermissionRule {
    return PERMISSION_MATRIX.find(r => r.appId === appId) ?? { ...DEFAULT_RULE, appId };
}

/**
 * Check if an app is allowed to perform a specific intent on a specific scheme.
 */
export function checkAppPermission(
    appId: string,
    intent: VFSIntent,
    scheme: VFSSchemeScope
): { allowed: boolean; reason?: string } {
    const rule = getAppPermissionRule(appId);

    // 1. Check scheme access
    if (!rule.allowedSchemes.includes(scheme)) {
        return {
            allowed: false,
            reason: `App '${appId}' is not allowed to access scheme '${scheme}://'`,
        };
    }

    // 2. Check readOnly enforcement
    if (rule.readOnly && WRITE_INTENTS.includes(intent)) {
        return {
            allowed: false,
            reason: `App '${appId}' has read-only access (attempted: ${intent})`,
        };
    }

    // 3. Check intent whitelist
    if (!rule.allowedIntents.includes(intent)) {
        return {
            allowed: false,
            reason: `App '${appId}' is not allowed intent '${intent}'`,
        };
    }

    return { allowed: true };
}

/**
 * Get the full permission set for an app (for UI display).
 */
export function getAppPermissionSet(appId: string): AppPermissionSet {
    const rule = getAppPermissionRule(appId);
    return {
        appId: rule.appId,
        canList: rule.allowedIntents.includes('fs.list'),
        canRead: rule.allowedIntents.includes('fs.read'),
        canWrite: !rule.readOnly && rule.allowedIntents.includes('fs.write'),
        canMkdir: !rule.readOnly && rule.allowedIntents.includes('fs.mkdir'),
        canDelete: !rule.readOnly && rule.allowedIntents.includes('fs.delete'),
        canStat: rule.allowedIntents.includes('fs.stat'),
        schemes: rule.allowedSchemes,
        readOnly: rule.readOnly,
    };
}
