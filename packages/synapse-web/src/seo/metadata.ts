import { Metadata } from 'next';

export interface SEOConfig {
    title: string;
    description: string;
    locale: string;
    url?: string;
    image?: string;
    type?: 'website' | 'article';
    publishedTime?: string;
    modifiedTime?: string;
}

/**
 * Build Next.js metadata with canonical and alternates
 */
export function buildMetadata(config: SEOConfig): Metadata {
    const {
        title,
        description,
        locale,
        url,
        image,
        type = 'website',
        publishedTime,
        modifiedTime,
    } = config;

    const metadata: Metadata = {
        title,
        description,
        openGraph: {
            title,
            description,
            type,
            locale,
            url,
            images: image ? [{ url: image }] : undefined,
            publishedTime,
            modifiedTime,
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: image ? [image] : undefined,
        },
    };

    // Add hreflang alternates if URL provided
    if (url) {
        const baseUrl = url.replace(`/${locale}/`, '/');
        metadata.alternates = {
            canonical: url,
            languages: {
                en: baseUrl + 'en',
                th: baseUrl + 'th',
                'x-default': baseUrl + 'en',
            },
        };
    }

    return metadata;
}

/**
 * Helper for generating sitemap URLs with locale alternates
 */
export function generateSitemapUrls(
    baseUrl: string,
    routes: string[],
    locales: string[] = ['en', 'th']
) {
    const urls = [];

    for (const route of routes) {
        for (const locale of locales) {
            urls.push({
                url: `${baseUrl}/${locale}${route}`,
                lastModified: new Date(),
                changeFrequency: route === '' ? ('daily' as const) : ('weekly' as const),
                priority: route === '' ? 1.0 : 0.8,
                alternates: {
                    languages: Object.fromEntries(
                        locales.map((loc) => [loc, `${baseUrl}/${loc}${route}`])
                    ),
                },
            });
        }
    }

    return urls;
}
