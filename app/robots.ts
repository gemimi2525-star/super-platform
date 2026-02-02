import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: ['/en/trust', '/th/trust'],
                disallow: ['/api/', '/desktop/', '/_next/', '/static/'],
            },
        ],
        sitemap: 'https://synapsegovernance.com/sitemap.xml',
    };
}
