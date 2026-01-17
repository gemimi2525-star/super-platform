/**
 * Core Platform Types
 *
 * TypeScript interfaces for Super Platform
 */
import { Timestamp } from 'firebase/firestore';
export type PlanType = 'free' | 'starter' | 'pro' | 'enterprise';
export interface Organization {
    id: string;
    name: string;
    slug: string;
    domain: string | null;
    logoURL: string | null;
    plan: PlanType;
    settings: {
        timezone: string;
        currency: string;
        dateFormat: string;
        language: string;
    };
    modules: string[];
    metadata?: {
        industry?: string;
        size?: string;
        country?: string;
    };
    createdAt: Timestamp;
    updatedAt: Timestamp;
    createdBy: string;
}
export interface OrganizationCreate extends Omit<Organization, 'id' | 'createdAt' | 'updatedAt'> {
}
export type UserRole = 'owner' | 'admin' | 'member' | 'viewer';
export interface UserOrganization {
    role: UserRole;
    permissions: string[];
    joinedAt: Timestamp;
    invitedBy: string | null;
}
export interface User {
    id: string;
    email: string;
    name: string;
    photoURL: string | null;
    phone: string | null;
    organizations: Record<string, UserOrganization>;
    currentOrganizationId: string | null;
    preferences: {
        theme: 'light' | 'dark' | 'system';
        language: string;
        notifications: {
            email: boolean;
            push: boolean;
            inApp: boolean;
        };
    };
    metadata: {
        lastLoginAt: Timestamp;
        loginCount: number;
        ipAddress?: string;
    };
    createdAt: Timestamp;
    updatedAt: Timestamp;
    isActive: boolean;
}
export interface Membership {
    id: string;
    userId: string;
    organizationId: string;
    role: UserRole;
    permissions: string[];
    invitedBy: string | null;
    invitedAt: Timestamp;
    joinedAt: Timestamp | null;
    status: 'pending' | 'active' | 'suspended';
}
export interface Role {
    id: string;
    organizationId: string;
    name: string;
    slug: string;
    permissions: string[];
    isSystem: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
export interface Permission {
    id: string;
    module: string;
    resource: string;
    action: string;
    description: string;
    isSystem: boolean;
}
export type AuditAction = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'invite' | 'approve' | 'reject';
export interface AuditLog {
    id: string;
    organizationId: string;
    userId: string;
    userName: string;
    action: AuditAction;
    resource: string;
    resourceId: string;
    details: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    timestamp: Timestamp;
}
export interface AuditLogCreate extends Omit<AuditLog, 'id' | 'timestamp'> {
}
export type NotificationType = 'info' | 'warning' | 'error' | 'success';
export interface Notification {
    id: string;
    organizationId: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    actionUrl: string | null;
    isRead: boolean;
    readAt: Timestamp | null;
    createdAt: Timestamp;
}
export interface NotificationCreate extends Omit<Notification, 'id' | 'isRead' | 'readAt' | 'createdAt'> {
}
export type WorkflowStepType = 'approval' | 'notification' | 'action';
export interface WorkflowStep {
    id: string;
    type: WorkflowStepType;
    config: Record<string, any>;
    approvers?: string[];
}
export interface Workflow {
    id: string;
    organizationId: string;
    name: string;
    description: string;
    type: 'approval' | 'automation';
    trigger: {
        event: string;
        conditions: Record<string, any>;
    };
    steps: WorkflowStep[];
    isActive: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    createdBy: string;
}
export interface File {
    id: string;
    organizationId: string;
    userId: string;
    name: string;
    path: string;
    url: string;
    mimeType: string;
    size: number;
    folder: string | null;
    tags: string[];
    metadata?: {
        module?: string;
        resourceType?: string;
        resourceId?: string;
    };
    createdAt: Timestamp;
}
export interface PaginationParams {
    limit: number;
    offset: number;
}
export interface PaginatedResult<T> {
    data: T[];
    total: number;
    hasMore: boolean;
}
export interface FirestoreQuery {
    collection: string;
    where?: Array<[string, string, any]>;
    orderBy?: [string, 'asc' | 'desc'];
    limit?: number;
}
//# sourceMappingURL=index.d.ts.map