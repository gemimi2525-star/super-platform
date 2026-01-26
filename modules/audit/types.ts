/**
 * Audit Module Types
 */

export type AuditAction =
    | 'user.created'
    | 'user.updated'
    | 'user.deleted'
    | 'user.disabled'
    | 'user.enabled'
    | 'role.updated'
    | 'login.success'
    | 'login.failed'
    | 'org.created'
    | 'org.updated'
    | 'org.deleted';

export interface AuditLog {
    id: string;
    action: AuditAction;
    actorUid: string;
    actorEmail: string;
    targetUid?: string;
    targetEmail?: string;
    details: Record<string, unknown>;
    timestamp: Date | string;
    ipAddress?: string;
}

export interface AuditLogFilters {
    action?: AuditAction;
    actorEmail?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
}
