/**
 * Content Types for MDX-based CMS
 */

export type ContentStatus = 'draft' | 'review' | 'published'
export type ContentLocale = 'en' | 'th'

/**
 * Base frontmatter fields for all content
 */
export interface BaseFrontmatter {
    title: string
    description: string
    slug: string
    locale: ContentLocale
    status: ContentStatus
    updatedAt: string
    publishedAt?: string
    ogImage?: string
}

/**
 * Page frontmatter
 */
export interface PageFrontmatter extends BaseFrontmatter {
    // Pages don't need extra fields for now
}

/**
 * Article frontmatter
 */
export interface ArticleFrontmatter extends BaseFrontmatter {
    tags?: string[]
}

/**
 * Content with MDX source
 */
export interface Content<T extends BaseFrontmatter = BaseFrontmatter> {
    frontmatter: T
    content: string
    filepath: string
}

export type Page = Content<PageFrontmatter>
export type Article = Content<ArticleFrontmatter>
