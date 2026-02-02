import type { CollectionConfig } from 'payload/types'

/**
 * Support Messages - Form submissions from public
 */
export const SupportMessages: CollectionConfig = {
    slug: 'support-messages',
    admin: {
        useAsTitle: 'subject',
        defaultColumns: ['name', 'email', 'status', 'createdAt'],
    },
    access: {
        read: ({ req: { user } }) => user?.role === 'admin',
        create: () => true, // Public can submit
        update: ({ req: { user } }) => user?.role === 'admin',
        delete: ({ req: { user } }) => user?.role === 'admin',
    },
    fields: [
        {
            name: 'name',
            type: 'text',
            required: true,
        },
        {
            name: 'email',
            type: 'email',
            required: true,
        },
        {
            name: 'subject',
            type: 'text',
        },
        {
            name: 'message',
            type: 'textarea',
            required: true,
        },
        {
            name: 'status',
            type: 'radio',
            defaultValue: 'new',
            options: [
                { label: 'New', value: 'new' },
                { label: 'In Progress', value: 'in_progress' },
                { label: 'Resolved', value: 'resolved' },
            ],
        },
        {
            name: 'respondedBy',
            type: 'relationship',
            relationTo: 'users',
        },
        {
            name: 'notes',
            type: 'textarea',
            admin: {
                description: 'Internal notes (not visible to submitter)',
            },
        },
    ],
    timestamps: true,
}
