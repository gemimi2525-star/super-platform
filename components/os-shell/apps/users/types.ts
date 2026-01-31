/**
 * ═══════════════════════════════════════════════════════════════════════════
 * USERS APP — Types
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * @module components/os-shell/apps/users/types
 * @version 1.0.0
 */

// ═══════════════════════════════════════════════════════════════════════════
// USER TYPE
// ═══════════════════════════════════════════════════════════════════════════

export type UserRole = 'owner' | 'admin' | 'user' | 'viewer';
export type UserStatus = 'active' | 'inactive' | 'pending';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    createdAt: number;
    updatedAt: number;
}

export interface UserFormData {
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
}

// ═══════════════════════════════════════════════════════════════════════════
// DATA SOURCE INTERFACE (Phase IX Ready)
// ═══════════════════════════════════════════════════════════════════════════

export interface UsersDataSource {
    listUsers(): Promise<User[]>;
    getUser(id: string): Promise<User | null>;
    createUser(data: UserFormData): Promise<User>;
    updateUser(id: string, data: Partial<UserFormData>): Promise<User>;
    disableUser(id: string): Promise<void>;
}
