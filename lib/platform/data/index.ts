/**
 * Platform Data Layer Exports
 * 
 * Central exports for all data repositories.
 * Part of Phase 12: Real Data Wiring
 * 
 * SYNAPSE Kernel: FROZEN ❄️ - This module does NOT touch synapse-core
 */

// Core Firestore utilities
export {
    getDb,
    withProtection,
    withProtectionAndRetry,
    mapFirestoreError,
    getDocument,
    listDocuments,
    createDocument,
    updateDocument,
} from './firestore';

export type {
    QueryOptions,
    DocumentResult,
    DocumentError,
    DocumentResponse,
} from './firestore';

// Users Repository
export {
    getUserById,
    getUserByEmail,
    listUsers,
    createUser,
    updateUser,
    updateLastLogin,
} from './users.repo';

export type {
    User,
    UserRole,
    UserStatus,
    CreateUserInput,
    UpdateUserInput,
} from './users.repo';

// Organizations Repository
export {
    getOrgById,
    getOrgBySlug,
    listOrgs,
    listOrgsForUser,
    createOrg,
    updateOrg,
    addOrgMember,
    removeOrgMember,
} from './orgs.repo';

export type {
    Organization,
    OrgStatus,
    OrgPlan,
    CreateOrgInput,
    UpdateOrgInput,
} from './orgs.repo';

// Audit Logs Repository (Append-Only)
export {
    appendAuditLog,
    listAuditLogs,
    getAuditLogById,
    countByDecision,
} from './audit.repo';

export type {
    AuditLog,
    AuditDecision,
    AppendAuditInput,
    AuditListOptions,
} from './audit.repo';

// Alerts Repository
export {
    getAlertById,
    listAlerts,
    listUnresolvedAlerts,
    createAlert,
    resolveAlert,
    countByLevel,
} from './alerts.repo';

export type {
    Alert,
    AlertLevel,
    CreateAlertInput,
    AlertListOptions,
} from './alerts.repo';
