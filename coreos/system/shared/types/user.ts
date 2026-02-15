/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Shared User Types — Phase 27C.2
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Source-of-truth for all user-related types used by both
 * legacy OS Shell apps and the System Hub.
 *
 * @module coreos/system/shared/types/user
 * @version 1.0.0
 */

// ═══════════════════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════════════════

export type UserRole = 'owner' | 'admin' | 'user' | 'viewer';
export type UserStatus = 'active' | 'inactive' | 'pending';

// ═══════════════════════════════════════════════════════════════════════════
// RECORD
// ═══════════════════════════════════════════════════════════════════════════

export interface UserRecord {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    createdAt: number;
    updatedAt: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// FORM DATA
// ═══════════════════════════════════════════════════════════════════════════

export interface UserFormData {
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
}
