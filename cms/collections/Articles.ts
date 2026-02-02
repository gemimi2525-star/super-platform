import type { CollectionConfig } from 'payload/types'

/**
 * Articles Collection - Blog/News content
 */
export const Articles: CollectionConfig = {
    slug: 'articles',
    admin: {
        useAsTitle: 'title',
        defaultColumns: ['title', 'author', 'status', 'publishedAt'],
    },
    access: {
        read: ({ req: { user } }) => {
            if (user) return true
            return { status: { equals: 'published' } }
        },
        create: ({ req: { user } }) => ['admin', 'editor', 'ai_writer'].includes(user?.role),
        update: ({ req: { user } }) => ['admin', 'editor', 'reviewer'].includes(user?.role),
        delete: ({ req: { user } }) => user?.role === 'admin',
    },
    fields: [
        {
            name: 'title',
            type: 'text',
            required: true,
        },
        {
            name: 'slug',
            type: 'text',
            required: true,
            unique: true,
            admin: {
                readOnly: true,
                description: 'Auto-generated from title',
            },
        },
        {
            name: 'excerpt',
            type: 'textarea',
            maxLength: 300,
        },
        {
            name: 'content',
            type: 'richText',
            required: true,
        },
        {
            name: 'coverImage',
            type: 'upload',
            relationTo: 'media',
        },
        {
            name: 'tags',
            type: 'array',
            fields: [
                {
                    name: 'tag',
                    type: 'text',
                },
            ],
        },
        {
            name: 'author',
            type: 'relationship',
            relationTo: 'users',
            required: true,
        },
        {
            name: 'locale',
            type: 'radio',
            required: true,
            defaultValue: 'en',
            options: [
                { label: 'English', value: 'en' },
                { label: 'ไทย', value: 'th' },
            ],
        },
        {
            name: 'status',
            type: 'radio',
            required: true,
            defaultValue: 'draft',
            options: [
                { label: 'Draft', value: 'draft' },
                { label: 'In Review', value: 'in_review' },
                { label: 'Published', value: 'published' },
                { label: 'Archived', value: 'archived' },
            ],
            access: {
                update: ({ req: { user } }) => ['admin', 'reviewer'].includes(user?.role),
            },
        },
        {
            name: 'publishedAt',
            type: 'date',
            admin: {
                readOnly: true,
            },
        },
        {
            name: 'seoTitle',
            type: 'text',
            admin: {
                description: 'Override title for SEO',
            },
        },
        {
            name: 'seoDescription',
            type: 'textarea',
            maxLength: 160,
        },
    ],
    hooks: {
        beforeChange: [
            ({ data, req, operation }) => {
                // Auto-generate slug from title
                if (operation === 'create' || (operation === 'update' && data.title)) {
                    const slug = data.title
                        .toLowerCase()
                        .replace(/[^a-z0-9\u0E00-\u0E7F]/g, '-')
                        .replace(/-+/g, '-')
                        .replace(/^-|-$/g, '')
                    data.slug = slug
                }

                // Auto-set author to current user if not set
                if (operation === 'create' && !data.author && req.user) {
                    data.author = req.user.id
                }

                // Auto-set publishedAt
                if (data.status === 'published' && !data.publishedAt) {
                    data.publishedAt = new Date()
                }

                return data
            },
        ],
    },
    timestamps: true,
}
