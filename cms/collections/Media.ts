import type { CollectionConfig } from 'payload/types'

/**
 * Media Collection - File uploads with access control
 */
export const Media: CollectionConfig = {
    slug: 'media',
    upload: {
        staticDir: 'public/uploads',
        imageSizes: [
            {
                name: 'thumbnail',
                width: 400,
                height: 300,
                position: 'centre',
            },
            {
                name: 'card',
                width: 768,
                height: 512,
                position: 'centre',
            },
            {
                name: 'og',
                width: 1200,
                height: 630,
                position: 'centre',
            },
        ],
        mimeTypes: ['image/*', 'application/pdf'],
    },
    access: {
        read: () => true, // All media readable (will add public/private logic later)
        create: ({ req: { user } }) => !!user, // Authenticated users can upload
        update: ({ req: { user } }) => !!user,
        delete: ({ req: { user } }) => {
            // Only admins can delete
            return user?.role === 'admin';
        },
    },
    fields: [
        {
            name: 'alt',
            type: 'text',
            required: true,
            admin: {
                description: 'Alt text for accessibility',
            },
        },
        {
            name: 'caption',
            type: 'text',
        },
        {
            name: 'isPublic',
            type: 'checkbox',
            defaultValue: true,
            admin: {
                description: 'Allow public access without authentication',
            },
        },
    ],
    timestamps: true,
}
