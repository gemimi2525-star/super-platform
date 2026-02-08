/**
 * Core OS RBAC System (Phase 31)
 * Enforces Roles and Segregation of Duties (SoD).
 */

export enum Role {
    PREPARER = 'PREPARER',
    REVIEWER = 'REVIEWER',
    POSTER = 'POSTER',
    ADMIN = 'ADMIN'
}

class RBAC {
    private userRoles: Map<string, Role[]> = new Map();

    constructor() {
        // Mock User Roles
        this.setUserRole('ai', [Role.PREPARER]);
        this.setUserRole('junior_acc', [Role.PREPARER]);
        this.setUserRole('senior_acc', [Role.REVIEWER]);
        this.setUserRole('manager_acc', [Role.POSTER, Role.REVIEWER]);
        this.setUserRole('admin', [Role.ADMIN]);
    }

    setUserRole(userId: string, roles: Role[]) {
        this.userRoles.set(userId, roles);
    }

    hasRole(userId: string, requiredRole: Role): boolean {
        const roles = this.userRoles.get(userId) || [];
        return roles.includes(requiredRole);
    }

    /**
     * Enforce Segregation of Duties (SoD)
     * e.g. Preparer cannot act as Poster
     */
    enforceSoD(userId: string, action: 'POST_LEDGER') {
        const roles = this.userRoles.get(userId) || [];

        if (action === 'POST_LEDGER') {
            if (roles.includes(Role.POSTER)) return; // Pass
            throw new Error(`RBAC DENIED: User ${userId} missing POSTER role.`);
        }
    }
}

export const rbac = new RBAC();
