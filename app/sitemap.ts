import { MetadataRoute } from 'next'
import { getAllPageSlugs, getAllArticleSlugs } from '@/lib/content'

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://www.apicoredata.com'
    const sitemapEntries: MetadataRoute.Sitemap = []

    // Static Trust Center routes (always available)
    const staticRoutes = [
        { path: 'trust', priority: 1.0, changeFrequency: 'weekly' as const },
        { path: 'trust/verify', priority: 0.8, changeFrequency: 'monthly' as const },
        { path: 'trust/support', priority: 0.8, changeFrequency: 'monthly' as const },
    ]

    const locales = ['en', 'th']

    for (const locale of locales) {
        for (const { path, priority, changeFrequency } of staticRoutes) {
            sitemapEntries.push({
                url: `${baseUrl}/${locale}/${path}`,
                lastModified: new Date(),
                changeFrequency,
                priority,
                alternates: {
                    languages: {
                        en: `${baseUrl}/en/${path}`,
                        th: `${baseUrl}/th/${path}`,
                    },
                },
            })
        }
    }

    // Dynamic pages from MDX (published only)
    const pageSlugs = getAllPageSlugs()
    const pagesBySlug = new Map<string, Array<{ locale: string }>>()

    // Group by slug for alternates
    for (const { locale, slug } of pageSlugs) {
        if (!pagesBySlug.has(slug)) {
            pagesBySlug.set(slug, [])
        }
        pagesBySlug.get(slug)!.push({ locale })
    }

    for (const [slug, localeData] of pagesBySlug) {
        // Map slug to path (trust-governance → trust/governance)
        let path = slug
        if (slug.startsWith('trust-')) {
            path = `trust/${slug.replace('trust-', '')}`
        }

        // Priority based on slug
        let priority = 0.8
        let changeFrequency: 'weekly' | 'monthly' = 'monthly'

        if (slug === 'trust-home') {
            path = 'trust'
            priority = 1.0
            changeFrequency = 'weekly'
        } else if (slug === 'trust-governance') {
            priority = 0.9
        }

        for (const { locale } of localeData) {
            const alternates: Record<string, string> = {}
            for (const { locale: altLocale } of localeData) {
                alternates[altLocale] = `${baseUrl}/${altLocale}/${path}`
            }

            sitemapEntries.push({
                url: `${baseUrl}/${locale}/${path}`,
                lastModified: new Date(),
                changeFrequency,
                priority,
                alternates: {
                    languages: alternates,
                },
            })
        }
    }

    // News list pages
    for (const locale of locales) {
        sitemapEntries.push({
            url: `${baseUrl}/${locale}/trust/news`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
            alternates: {
                languages: {
                    en: `${baseUrl}/en/trust/news`,
                    th: `${baseUrl}/th/trust/news`,
                },
            },
        })
    }

    // Dynamic articles from MDX (published only)
    const articleSlugs = getAllArticleSlugs()
    const articlesBySlug = new Map<string, Array<{ locale: string }>>()

    // Group by slug for alternates
    for (const { locale, slug } of articleSlugs) {
        if (!articlesBySlug.has(slug)) {
            articlesBySlug.set(slug, [])
        }
        articlesBySlug.get(slug)!.push({ locale })
    }

    for (const [slug, localeData] of articlesBySlug) {
        for (const { locale } of localeData) {
            const alternates: Record<string, string> = {}
            for (const { locale: altLocale } of localeData) {
                alternates[altLocale] = `${baseUrl}/${altLocale}/trust/news/${slug}`
            }

            sitemapEntries.push({
                url: `${baseUrl}/${locale}/trust/news/${slug}`,
                lastModified: new Date(),
                changeFrequency: 'monthly',
                priority: 0.7,
                alternates: {
                    languages: alternates,
                },
            })
        }
    }

    return sitemapEntries
}
