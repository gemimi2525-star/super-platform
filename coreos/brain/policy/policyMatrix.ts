/**
 * ═══════════════════════════════════════════════════════════════════════════
 * POLICY MATRIX (Phase 35C — Runtime Isolation Level 2)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Static allowlist/denylist and risk classification matrix.
 * Single source of truth for what tools are allowed in which scope.
 *
 * @module coreos/brain/policy/policyMatrix
 */

import type {
    ScopeAllowlistEntry,
    ToolRiskEntry,
    RoleRequirementMap,
    ToolActionType,
    RiskLevel,
} from './policyTypes';

// ═══════════════════════════════════════════════════════════════════════════
// POLICY VERSION
// ═══════════════════════════════════════════════════════════════════════════

export const POLICY_VERSION = '35C.1';

// ═══════════════════════════════════════════════════════════════════════════
// SCOPE → TOOL ALLOWLIST
// ═══════════════════════════════════════════════════════════════════════════
// Only tools matching these patterns are allowed for each app scope.
// Missing scope = default deny (no tools allowed).

export const SCOPE_TOOL_ALLOWLIST: Record<string, ScopeAllowlistEntry> = {
    'core.notes': {
        allowedPatterns: [
            'read_*',
            'explain_*',
            'search_*',
            'propose_note_*',
            'validate_*',
            'draft_note_*',
            'apply_note_*',
        ],
        maxAutoRiskLevel: 'MEDIUM',
    },
    'core.files': {
        allowedPatterns: [
            'read_*',
            'explain_*',
            'search_*',
            'propose_file_*',
            'validate_*',
            'draft_file_*',
        ],
        maxAutoRiskLevel: 'LOW',
    },
    'core.settings': {
        allowedPatterns: [
            'read_*',
            'explain_*',
            'search_*',
            'propose_setting_*',
            'validate_*',
        ],
        maxAutoRiskLevel: 'LOW',
    },
    'core.ops': {
        allowedPatterns: [
            'read_*',
            'explain_*',
            'search_*',
        ],
        maxAutoRiskLevel: 'LOW',
    },
};

// ═══════════════════════════════════════════════════════════════════════════
// DESTRUCTIVE DENYLIST
// ═══════════════════════════════════════════════════════════════════════════
// Tools matching these patterns are ALWAYS denied without explicit owner approval.

export const DESTRUCTIVE_DENYLIST: string[] = [
    'execute_*',
    'delete_*',
    'install_*',
    'update_*',
    'drop_*',
    'purge_*',
    'reset_*',
];

// ═══════════════════════════════════════════════════════════════════════════
// TOOL RISK CLASSIFICATION
// ═══════════════════════════════════════════════════════════════════════════
// Prefix-based risk scoring. First match wins.

export const TOOL_RISK_MAP: ToolRiskEntry[] = [
    // CRITICAL — destructive / irreversible
    { pattern: 'delete_', actionType: 'DELETE', riskLevel: 'CRITICAL' },
    { pattern: 'drop_', actionType: 'DELETE', riskLevel: 'CRITICAL' },
    { pattern: 'purge_', actionType: 'DELETE', riskLevel: 'CRITICAL' },
    { pattern: 'reset_', actionType: 'ADMIN', riskLevel: 'CRITICAL' },

    // HIGH — write/execute
    { pattern: 'execute_', actionType: 'EXECUTE', riskLevel: 'HIGH' },
    { pattern: 'install_', actionType: 'EXECUTE', riskLevel: 'HIGH' },
    { pattern: 'update_', actionType: 'EXECUTE', riskLevel: 'HIGH' },
    { pattern: 'apply_', actionType: 'EXECUTE', riskLevel: 'HIGH' },

    // MEDIUM — propose / draft (side-effect-free but can influence)
    { pattern: 'propose_', actionType: 'PROPOSE', riskLevel: 'MEDIUM' },
    { pattern: 'draft_', actionType: 'PROPOSE', riskLevel: 'MEDIUM' },
    { pattern: 'validate_', actionType: 'READ', riskLevel: 'LOW' },

    // LOW — read-only
    { pattern: 'read_', actionType: 'READ', riskLevel: 'LOW' },
    { pattern: 'explain_', actionType: 'READ', riskLevel: 'LOW' },
    { pattern: 'search_', actionType: 'READ', riskLevel: 'LOW' },
    { pattern: 'list_', actionType: 'READ', riskLevel: 'LOW' },
    { pattern: 'get_', actionType: 'READ', riskLevel: 'LOW' },
];

// ═══════════════════════════════════════════════════════════════════════════
// ROLE REQUIREMENTS
// ═══════════════════════════════════════════════════════════════════════════
// Minimum role required per action type.

export const ROLE_REQUIREMENTS: RoleRequirementMap = {
    'READ': 'user',
    'PROPOSE': 'user',
    'EXECUTE': 'admin',
    'DELETE': 'owner',
    'ADMIN': 'owner',
};

// ═══════════════════════════════════════════════════════════════════════════
// RATE LIMITS
// ═══════════════════════════════════════════════════════════════════════════

/** Rate limit config per action type (per minute window) */
export const RATE_LIMITS: Record<ToolActionType, number> = {
    'READ': 60,
    'PROPOSE': 20,
    'EXECUTE': 5,
    'DELETE': 2,
    'ADMIN': 2,
};

// ═══════════════════════════════════════════════════════════════════════════
// PAYLOAD LIMITS
// ═══════════════════════════════════════════════════════════════════════════

/** Maximum tool call arguments size in bytes */
export const MAX_ARGS_PAYLOAD_BYTES = 65536; // 64KB

/** Nonce TTL in milliseconds (10 minutes) */
export const NONCE_TTL_MS = 10 * 60 * 1000;

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/** Check if a tool name matches a pattern (prefix with wildcard support) */
export function matchesPattern(toolName: string, pattern: string): boolean {
    if (pattern.endsWith('*')) {
        return toolName.startsWith(pattern.slice(0, -1));
    }
    return toolName === pattern;
}

/** Classify a tool name into action type and risk level */
export function classifyTool(toolName: string): { actionType: ToolActionType; riskLevel: RiskLevel } {
    const normalized = toolName.toLowerCase().trim();
    for (const entry of TOOL_RISK_MAP) {
        if (normalized.startsWith(entry.pattern)) {
            return { actionType: entry.actionType, riskLevel: entry.riskLevel };
        }
    }
    // Unknown tools default to HIGH risk ADMIN action
    return { actionType: 'ADMIN', riskLevel: 'HIGH' };
}

/** Check if a role meets the minimum requirement */
export function roleMeetsRequirement(
    actorRole: 'owner' | 'admin' | 'user' | 'system',
    requiredRole: 'owner' | 'admin' | 'user'
): boolean {
    const hierarchy: Record<string, number> = { 'user': 1, 'admin': 2, 'owner': 3, 'system': 3 };
    return (hierarchy[actorRole] || 0) >= (hierarchy[requiredRole] || 0);
}

/** Check if a tool is allowed for a given app scope */
export function isToolAllowedForScope(toolName: string, appScope: string): boolean {
    const entry = SCOPE_TOOL_ALLOWLIST[appScope];
    if (!entry) return false;
    return entry.allowedPatterns.some(p => matchesPattern(toolName, p));
}

/** Check if a tool matches the destructive denylist */
export function isDestructiveTool(toolName: string): boolean {
    return DESTRUCTIVE_DENYLIST.some(p => matchesPattern(toolName, p));
}
