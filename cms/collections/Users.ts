import type { CollectionConfig } from 'payload/types'

/**
 * Users Collection - Authentication & RBAC
 * 
 * Roles:
 * - admin: Full access (users, settings, publish)
 * - editor: Create/edit drafts (no publish)
 * - reviewer: Review + approve publish
 * - ai_writer: Create drafts only
 */
export const Users: CollectionConfig = {
    slug: 'users',
    auth: {
        tokenExpiration: 7200, // 2 hours
        maxLoginAttempts: 5,
        lockTime: 600 * 1000, // 10 minutes
    },
    admin: {
        useAsTitle: 'email',
        defaultColumns: ['email', 'role', 'createdAt'],
    },
    access: {
        // Only admins can create/delete users
        create: ({ req: { user } }) => user?.role === 'admin',
        read: () => true, // Logged in users can read
        update: ({ req: { user }, id }) => {
            // Users can update themselves, admins can update anyone
            if (user?.role === 'admin') return true
            return user?.id === id
        },
        delete: ({ req: { user } }) => user?.role === 'admin',
    },
    fields: [
        {
            name: 'role',
            type: 'select',
            required: true,
            defaultValue: 'editor',
            options: [
                { label: 'Admin', value: 'admin' },
                { label: 'Editor / Content', value: 'editor' },
                { label: 'Reviewer', value: 'reviewer' },
                { label: 'AI Writer', value: 'ai_writer' },
            ],
            access: {
                // Only admins can change roles
                update: ({ req: { user } }) => user?.role === 'admin',
            },
        },
        {
            name: 'firstName',
            type: 'text',
        },
        {
            name: 'lastName',
            type: 'text',
        },
    ],
    timestamps: true,
}
