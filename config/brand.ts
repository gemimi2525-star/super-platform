/**
 * Brand Configuration (Single Source of Truth)
 * 
 * All brand-related values should be imported from this file.
 * DO NOT hardcode brand name or logo path anywhere else.
 */

export const BRAND = {
    /** Brand name - ALWAYS UPPERCASE */
    name: 'APICOREDATA',

    /** Logo path - Change this file to update logo everywhere */
    logo: '/brand/apicoredata-logo-v2.png',

    /** Brand description for metadata */
    description: 'API-first Business Operating System',

    /** Copyright information */
    copyright: {
        year: 2026,
        text: '© 2026 APICOREDATA. All rights reserved.',
    },
} as const;

export type BrandConfig = typeof BRAND;
