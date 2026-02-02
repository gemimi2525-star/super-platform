import type { GlobalConfig } from 'payload/types'

/**
 * Settings Global - Branding and site configuration
 */
export const Settings: GlobalConfig = {
    slug: 'settings',
    access: {
        read: () => true, // Public readable
        update: ({ req: { user } }) => user?.role === 'admin',
    },
    fields: [
        {
            type: 'tabs',
            tabs: [
                {
                    label: 'Branding',
                    fields: [
                        {
                            name: 'logo',
                            type: 'upload',
                            relationTo: 'media',
                            admin: {
                                description: 'Logo displayed in header',
                            },
                        },
                        {
                            name: 'favicon',
                            type: 'upload',
                            relationTo: 'media',
                            admin: {
                                description: 'Browser favicon',
                            },
                        },
                        {
                            name: 'ogImageDefault',
                            type: 'upload',
                            relationTo: 'media',
                            admin: {
                                description: 'Default Open Graph image',
                            },
                        },
                        {
                            name: 'accentColor',
                            type: 'text',
                            defaultValue: '#0284c7',
                            admin: {
                                description: 'Primary accent color (hex)',
                            },
                        },
                    ],
                },
                {
                    label: 'SEO',
                    fields: [
                        {
                            name: 'siteName',
                            type: 'text',
                            defaultValue: 'SYNAPSE Trust Center',
                        },
                        {
                            name: 'tagline',
                            type: 'text',
                            defaultValue: 'Cryptographically verifiable governance',
                        },
                        {
                            name: 'googleVerificationTag',
                            type: 'textarea',
                            admin: {
                                description: 'Google Search Console verification meta tag content',
                            },
                        },
                    ],
                },
                {
                    label: 'Support',
                    fields: [
                        {
                            name: 'supportEmail',
                            type: 'email',
                            defaultValue: 'support@synapsegovernance.com',
                        },
                    ],
                },
            ],
        },
    ],
}
