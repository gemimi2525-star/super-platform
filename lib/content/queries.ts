import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import type { Page, Article, PageFrontmatter, ArticleFrontmatter, ContentLocale } from './types'

const CONTENT_DIR = path.join(process.cwd(), 'content')
const PAGES_DIR = path.join(CONTENT_DIR, 'pages')
const ARTICLES_DIR = path.join(CONTENT_DIR, 'articles')

/**
 * Check if content should be visible in production
 */
function isPublished(status: string): boolean {
    // In development, allow all statuses for preview
    // In production, only show published
    if (process.env.NODE_ENV === 'development') {
        return true // Show all in dev
    }
    return status === 'published'
}

/**
 * Read and parse an MDX file
 */
function readMDXFile<T>(filepath: string): { frontmatter: T; content: string; filepath: string } | null {
    try {
        const fileContent = fs.readFileSync(filepath, 'utf-8')
        const { data, content } = matter(fileContent)

        return {
            frontmatter: data as T,
            content,
            filepath,
        }
    } catch (error) {
        console.error(`Error reading file ${filepath}:`, error)
        return null
    }
}

/**
 * List all MDX files in a directory
 */
function listMDXFiles(dir: string, locale: ContentLocale): string[] {
    const localeDir = path.join(dir, locale)

    if (!fs.existsSync(localeDir)) {
        return []
    }

    return fs
        .readdirSync(localeDir)
        .filter((file) => file.endsWith('.mdx'))
        .map((file) => path.join(localeDir, file))
}

/**
 * Get a single page by slug and locale
 */
export function getPage(locale: ContentLocale, slug: string): Page | null {
    const filepath = path.join(PAGES_DIR, locale, `${slug}.mdx`)

    if (!fs.existsSync(filepath)) {
        return null
    }

    const page = readMDXFile<PageFrontmatter>(filepath)

    if (!page) {
        return null
    }

    // Filter by status
    if (!isPublished(page.frontmatter.status)) {
        return null
    }

    return page as Page
}

/**
 * List all pages for a locale
 */
export function listPages(locale: ContentLocale, includeUnpublished = false): Page[] {
    const files = listMDXFiles(PAGES_DIR, locale)

    const pages = files
        .map((file) => readMDXFile<PageFrontmatter>(file))
        .filter((page): page is Page => {
            if (!page) return false
            if (!includeUnpublished && !isPublished(page.frontmatter.status)) return false
            return true
        })

    // Sort by updatedAt desc
    pages.sort((a, b) =>
        new Date(b.frontmatter.updatedAt).getTime() - new Date(a.frontmatter.updatedAt).getTime()
    )

    return pages
}

/**
 * Get a single article by slug and locale
 */
export function getArticle(locale: ContentLocale, slug: string): Article | null {
    const files = listMDXFiles(ARTICLES_DIR, locale)

    // Articles filename includes date: YYYY-MM-DD-slug.mdx
    // But slug in frontmatter is just the slug part
    const filepath = files.find((file) => {
        const article = readMDXFile<ArticleFrontmatter>(file)
        return article && article.frontmatter.slug === slug
    })

    if (!filepath) {
        return null
    }

    const article = readMDXFile<ArticleFrontmatter>(filepath)

    if (!article) {
        return null
    }

    // Filter by status
    if (!isPublished(article.frontmatter.status)) {
        return null
    }

    return article as Article
}

/**
 * List all articles for a locale
 */
export function listArticles(locale: ContentLocale, includeUnpublished = false): Article[] {
    const files = listMDXFiles(ARTICLES_DIR, locale)

    const articles = files
        .map((file) => readMDXFile<ArticleFrontmatter>(file))
        .filter((article): article is Article => {
            if (!article) return false
            if (!includeUnpublished && !isPublished(article.frontmatter.status)) return false
            return true
        })

    // Sort by publishedAt desc (or updatedAt if no publishedAt)
    articles.sort((a, b) => {
        const dateA = new Date(a.frontmatter.publishedAt || a.frontmatter.updatedAt).getTime()
        const dateB = new Date(b.frontmatter.publishedAt || b.frontmatter.updatedAt).getTime()
        return dateB - dateA
    })

    return articles
}

/**
 * Get all slugs for a content type (for static paths generation)
 */
export function getAllPageSlugs(): Array<{ locale: ContentLocale; slug: string }> {
    const slugs: Array<{ locale: ContentLocale; slug: string }> = []

    for (const locale of ['en', 'th'] as ContentLocale[]) {
        const files = listMDXFiles(PAGES_DIR, locale)
        files.forEach((file) => {
            const page = readMDXFile<PageFrontmatter>(file)
            if (page && isPublished(page.frontmatter.status)) {
                slugs.push({ locale, slug: page.frontmatter.slug })
            }
        })
    }

    return slugs
}

export function getAllArticleSlugs(): Array<{ locale: ContentLocale; slug: string }> {
    const slugs: Array<{ locale: ContentLocale; slug: string }> = []

    for (const locale of ['en', 'th'] as ContentLocale[]) {
        const files = listMDXFiles(ARTICLES_DIR, locale)
        files.forEach((file) => {
            const article = readMDXFile<ArticleFrontmatter>(file)
            if (article && isPublished(article.frontmatter.status)) {
                slugs.push({ locale, slug: article.frontmatter.slug })
            }
        })
    }

    return slugs
}
