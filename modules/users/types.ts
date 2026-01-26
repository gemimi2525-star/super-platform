/**
 * Users Module Types
 */

export type PlatformRole = 'owner' | 'admin' | 'user';

export interface PlatformUser {
    uid: string;
    email: string;
    displayName: string;
    role: PlatformRole;
    permissions: string[];
    enabled: boolean;
    createdBy: string;
    createdAt: Date | string;
    updatedAt: Date | string;
    lastLogin?: Date | string;
}

export interface CreateUserRequest {
    email: string;
    displayName: string;
    password?: string;
    role: PlatformRole;
    permissions?: string[];
}

export interface UpdateUserRequest {
    displayName?: string;
    role?: PlatformRole;
    permissions?: string[];
    enabled?: boolean;
}

export interface UsersListResponse {
    users: PlatformUser[];
    total: number;
}

export interface UserActionResult {
    success: boolean;
    message?: string;
    user?: PlatformUser;
    temporaryPassword?: string;
}
