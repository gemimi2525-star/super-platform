/**
 * Authorization Guards
 * 
 * Helpers to enforce visibility scope and access control policies.
 * Used by API routes to ensure non-owner users cannot view/edit/delete owner users.
 */

import type { PlatformRole } from './types';

/**
 * Custom error for access control violations
 * Maps to HTTP 403 Forbidden or 404 Not Found
 */
export class AccessDeniedError extends Error {
    code: 'FORBIDDEN' | 'NOT_FOUND';
    httpStatus: 403 | 404;

    constructor(message: string, code: 'FORBIDDEN' | 'NOT_FOUND' = 'FORBIDDEN') {
        super(message);
        this.name = 'AccessDeniedError';
        this.code = code;
        this.httpStatus = code === 'NOT_FOUND' ? 404 : 403;
    }
}

/**
 * Check if a role is 'owner'
 * 
 * @param role - The role to check
 * @returns true if role is exactly 'owner'
 */
export function isOwnerRole(role: PlatformRole): boolean {
    return role === 'owner';
}

/**
 * Assert that current user can access target user
 * 
 * Policy:
 * - owner can access all users
 * - non-owner CANNOT access owner users
 * 
 * @param currentUserRole - Role of the user making the request
 * @param targetUserRole - Role of the user being accessed
 * @throws {AccessDeniedError} If non-owner tries to access owner (NOT_FOUND for stealth)
 * 
 * @example
 * // In API route:
 * try {
 *   assertCanAccessTargetUser(currentUser.role, targetUser.role);
 *   // Proceed with operation
 * } catch (error) {
 *   if (error instanceof AccessDeniedError) {
 *     return ApiErrorResponse.notFound('User'); // Stealth 404
 *   }
 *   throw error;
 * }
 */
export function assertCanAccessTargetUser(
    currentUserRole: PlatformRole,
    targetUserRole: PlatformRole
): void {
    // Owner can access all users
    if (isOwnerRole(currentUserRole)) {
        return;
    }

    // Non-owner trying to access owner → Block with 404 (stealth)
    if (isOwnerRole(targetUserRole)) {
        throw new AccessDeniedError(
            'User not found',
            'NOT_FOUND'
        );
    }

    // All other combinations are allowed (admin/user can see each other)
}

/**
 * Filter users list based on current user role
 * 
 * Policy:
 * - owner sees all users
 * - non-owner users are filtered out from the list
 * 
 * @param users - Array of users to filter
 * @param currentUserRole - Role of the user making the request
 * @returns Filtered array of users
 * 
 * @example
 * const allUsers = await getUsersFromDb();
 * const visibleUsers = filterVisibleUsers(allUsers, currentUser.role);
 */
export function filterVisibleUsers<T extends { role: PlatformRole }>(
    users: T[],
    currentUserRole: PlatformRole
): T[] {
    // Owner sees all users
    if (isOwnerRole(currentUserRole)) {
        return users;
    }

    // Non-owner: filter out owner users
    return users.filter(user => !isOwnerRole(user.role));
}
