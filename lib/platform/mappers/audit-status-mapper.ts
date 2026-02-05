/**
 * Audit Status & Reason Mapper
 * 
 * Phase 13: Governance Legibility & Actor Truth
 * 
 * Maps audit log data to human-readable status categories and reason summaries.
 * 
 * KEY DISTINCTIONS:
 * - DENIED: Access denied by policy (expected behavior, not an error)
 * - FAILED: Operation failed due to error/exception (unexpected)
 * - SUCCESS: Operation succeeded
 * - INFO: Informational event (no security impact)
 */

import type { AuditStatus, AuditReason } from '../types/audit-view-model';

/**
 * Status mapping input from audit log data.
 */
interface StatusMappingInput {
    success?: boolean;
    decision?: 'ALLOW' | 'DENY';
    action?: string;
    eventType?: string;
    metadata?: Record<string, unknown>;
}

/**
 * Map audit log data to status category.
 * 
 * Logic:
 * 1. INFO: Informational actions (login, view, read)
 * 2. DENIED: Policy/permission denial (decision=DENY)
 * 3. SUCCESS: Explicitly successful or allowed
 * 4. FAILED: Errors, exceptions, or explicit failures
 * 
 * @param data - Audit log data
 * @returns Status category
 */
export function mapToStatus(data: StatusMappingInput): AuditStatus {
    const action = data.action || data.eventType || '';
    const actionLower = action.toLowerCase();

    // Category 1: INFO - Informational events (no write operations)
    const infoActions = ['login', 'logout', 'view', 'read', 'list', 'get', 'fetch'];
    if (infoActions.some(keyword => actionLower.includes(keyword))) {
        return 'INFO';
    }

    // Category 2: DENIED - Policy rejection (not an error, just unauthorized)
    if (data.decision === 'DENY') {
        return 'DENIED';
    }

    // Category 3: SUCCESS - Explicit success or ALLOW decision
    if (data.success === true || data.decision === 'ALLOW') {
        return 'SUCCESS';
    }

    // Category 4: FAILED - Errors, exceptions, or explicit failure
    if (data.success === false) {
        return 'FAILED';
    }

    // Default: INFO (for events without clear success/failure)
    return 'INFO';
}

/**
 * Generate human-readable reason for audit event outcome.
 * 
 * Only generates reasons for DENIED or FAILED events.
 * 
 * @param data - Audit log data
 * @returns Reason with code and summary, or undefined if not applicable
 */
export function generateReason(data: StatusMappingInput): AuditReason | undefined {
    // DENIED: Policy violation
    if (data.decision === 'DENY') {
        const capability = (data.metadata?.capability as string) ||
            (data.metadata?.policyId as string);

        return {
            code: 'POLICY_VIOLATION',
            summary: capability
                ? `Access denied: insufficient permission for "${capability}"`
                : 'Access denied by security policy',
        };
    }

    // FAILED: Execution error
    if (data.success === false) {
        const errorMsg = data.metadata?.error as string;
        const errorCode = data.metadata?.code as string;

        // Check for specific error types
        if (errorCode?.includes('INDEX') || errorMsg?.includes('index')) {
            return {
                code: 'INDEX_ERROR',
                summary: 'Database query failed: missing index configuration',
            };
        }

        if (errorCode?.includes('PERMISSION') || errorMsg?.includes('permission')) {
            return {
                code: 'PERMISSION_ERROR',
                summary: errorMsg || 'Insufficient permissions to complete operation',
            };
        }

        if (errorCode?.includes('VALIDATION') || errorMsg?.includes('validation')) {
            return {
                code: 'VALIDATION_ERROR',
                summary: errorMsg || 'Input validation failed',
            };
        }

        // Generic execution error
        return {
            code: 'EXECUTION_ERROR',
            summary: errorMsg || 'Operation failed due to internal error',
        };
    }

    // No reason needed for SUCCESS or INFO
    return undefined;
}

/**
 * Extract decision information if present in audit log.
 * 
 * @param data - Audit log data
 * @returns Decision info or undefined
 */
export function extractDecisionInfo(data: StatusMappingInput): {
    decision: 'ALLOW' | 'DENY' | 'SKIP';
    policyId?: string;
    capability?: string;
} | undefined {
    if (!data.decision) {
        return undefined;
    }

    return {
        decision: data.decision,
        policyId: data.metadata?.policyId as string,
        capability: data.metadata?.capability as string,
    };
}
