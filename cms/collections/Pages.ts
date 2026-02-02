import type { CollectionConfig } from 'payload/types'

/**
 * Pages Collection - CMS-managed pages with blocks
 * 
 * Access:
 * - Public can read published pages
 * - Editors can create/edit drafts
 * - Reviewers can publish
 */
export const Pages: CollectionConfig = {
    slug: 'pages',
    admin: {
        useAsTitle: 'title',
        defaultColumns: ['title', 'slug', 'locale', 'status', 'updatedAt'],
    },
    access: {
        read: ({ req: { user } }) => {
            // Public can read published, authenticated can read all
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
                description: 'URL-friendly identifier (e.g., "about-us")',
            },
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
            name: 'description',
            type: 'textarea',
            admin: {
                description: 'Meta description for SEO',
            },
        },
        {
            name: 'ogImage',
            type: 'upload',
            relationTo: 'media',
            admin: {
                description: 'Open Graph image for social sharing',
            },
        },
        {
            name: 'canonical',
            type: 'text',
            admin: {
                description: 'Canonical URL (leave empty to use default)',
            },
        },
        {
            name: 'noindex',
            type: 'checkbox',
            defaultValue: false,
            admin: {
                description: 'Prevent search engines from indexing this page',
            },
        },
        {
            name: 'body',
            type: 'richText',
            admin: {
                description: 'Page content (will use blocks in future enhancement)',
            },
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
                update: ({ req: { user } }) => {
                    // Only reviewer/admin can publish
                    if (['admin', 'reviewer'].includes(user?.role)) return true
                    return false
                },
            },
        },
        {
            name: 'publishedAt',
            type: 'date',
            admin: {
                readOnly: true,
            },
        },
    ],
    hooks: {
        beforeChange: [
            ({ data, req, operation }) => {
                // Auto-set publishedAt when status changes to published
                if (data.status === 'published' && !data.publishedAt) {
                    data.publishedAt = new Date()
                }
                return data
            },
        ],
    },
    timestamps: true,
}
