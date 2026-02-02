import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://synapsegovernance.com';
    const locales = ['en', 'th'];
    const routes = [
        'trust',
        'trust/verify',
        'trust/governance',
        'trust/support',
    ];

    const sitemapEntries: MetadataRoute.Sitemap = [];

    for (const locale of locales) {
        for (const route of routes) {
            sitemapEntries.push({
                url: `${baseUrl}/${locale}/${route}`,
                lastModified: new Date(),
                changeFrequency: 'monthly',
                priority: route === 'trust' ? 1.0 : 0.8,
                alternates: {
                    languages: {
                        en: `${baseUrl}/en/${route}`,
                        th: `${baseUrl}/th/${route}`,
                    },
                },
            });
        }
    }

    return sitemapEntries;
}
