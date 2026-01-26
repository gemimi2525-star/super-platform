export type PermissionModule = 'users' | 'roles' | 'audit' | 'billing' | 'orgs';
export type PermissionAction = 'read' | 'write' | 'delete';

export interface Permission {
    id: string; // "users.read"
    module: PermissionModule;
    action: PermissionAction;
    name: string; // "Read Users"
    description: string;
}

export const PERMISSIONS: Permission[] = [
    // Users Module
    { id: 'users.read', module: 'users', action: 'read', name: 'View Users', description: 'View list of platform users' },
    { id: 'users.write', module: 'users', action: 'write', name: 'Manage Users', description: 'Create and edit users' },
    { id: 'users.delete', module: 'users', action: 'delete', name: 'Delete Users', description: 'Remove users from platform' },

    // Roles Module
    { id: 'roles.read', module: 'roles', action: 'read', name: 'View Roles', description: 'View available roles' },
    { id: 'roles.write', module: 'roles', action: 'write', name: 'Manage Roles', description: 'Create and edit roles' },
    { id: 'roles.delete', module: 'roles', action: 'delete', name: 'Delete Roles', description: 'Delete custom roles' },

    // Audit Module
    { id: 'audit.read', module: 'audit', action: 'read', name: 'View Audit Logs', description: 'Access platform audit logs' },

    // Billing Module
    { id: 'billing.read', module: 'billing', action: 'read', name: 'View Billing', description: 'View revenue and subscriptions' },
    { id: 'billing.write', module: 'billing', action: 'write', name: 'Manage Billing', description: 'Manage plans and invoices' },

    // Orgs Module
    { id: 'orgs.read', module: 'orgs', action: 'read', name: 'View Organizations', description: 'View tenant organizations' },
    { id: 'orgs.write', module: 'orgs', action: 'write', name: 'Manage Organizations', description: 'Edit organization details' },
    { id: 'orgs.delete', module: 'orgs', action: 'delete', name: 'Delete Organizations', description: 'Remove organizations' },
];

export const MODULES_DISPLAY: Record<PermissionModule, string> = {
    users: 'User Management',
    roles: 'Role Management',
    audit: 'System Audit',
    billing: 'Billing & Revenue',
    orgs: 'Organizations'
};
