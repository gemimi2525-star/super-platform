#!/usr/bin/env node
/**
 * Content Validation Script for MDX Git-CMS
 * 
 * Validates all MDX files in content/ directory to ensure:
 * - Required frontmatter fields
 * - Valid status values
 * - Slug matches filename
 * - Published content has publishedAt
 * - No duplicate slugs
 */

import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

type ContentStatus = 'draft' | 'review' | 'published'
type ContentLocale = 'en' | 'th'

interface ValidationError {
    file: string
    errors: string[]
}

const CONTENT_DIR = path.join(process.cwd(), 'content')
const REQUIRED_FIELDS = ['title', 'description', 'slug', 'locale', 'status', 'updatedAt']
const VALID_STATUSES: ContentStatus[] = ['draft', 'review', 'published']
const VALID_LOCALES: ContentLocale[] = ['en', 'th']

let hasErrors = false
const validationErrors: ValidationError[] = []

/**
 * Check if a string is a valid ISO date
 */
function isValidISODate(dateString: string): boolean {
    const date = new Date(dateString)
    return date.toISOString() === dateString || !isNaN(date.getTime())
}

/**
 * Validate a single MDX file
 */
function validateFile(filePath: string, contentType: 'pages' | 'articles'): void {
    const relativePath = path.relative(process.cwd(), filePath)
    const errors: string[] = []

    try {
        const fileContent = fs.readFileSync(filePath, 'utf-8')
        const { data: frontmatter } = matter(fileContent)
        const filename = path.basename(filePath, '.mdx')

        // Check required fields
        for (const field of REQUIRED_FIELDS) {
            if (!frontmatter[field]) {
                errors.push(`Missing required field: ${field}`)
            }
        }

        // Validate locale
        if (frontmatter.locale && !VALID_LOCALES.includes(frontmatter.locale)) {
            errors.push(`Invalid locale: ${frontmatter.locale}. Must be "en" or "th"`)
        }

        // Validate status
        if (frontmatter.status && !VALID_STATUSES.includes(frontmatter.status)) {
            errors.push(`Invalid status: ${frontmatter.status}. Must be "draft", "review", or "published"`)
        }

        // Validate slug matches filename
        if (frontmatter.slug) {
            if (contentType === 'pages') {
                // Pages: filename should be exactly slug.mdx
                if (filename !== frontmatter.slug) {
                    errors.push(`Slug "${frontmatter.slug}" does not match filename "${filename}"`)
                }
            } else if (contentType === 'articles') {
                // Articles: filename should be YYYY-MM-DD-slug.mdx
                const slugPattern = new RegExp(`^\\d{4}-\\d{2}-\\d{2}-${frontmatter.slug}$`)
                if (!slugPattern.test(filename)) {
                    errors.push(`Slug "${frontmatter.slug}" does not match article filename pattern (expected: YYYY-MM-DD-${frontmatter.slug}.mdx)`)
                }
            }
        }

        // Validate publishedAt if status is published
        if (frontmatter.status === 'published') {
            if (!frontmatter.publishedAt) {
                errors.push('Published content must have publishedAt field')
            } else if (!isValidISODate(frontmatter.publishedAt)) {
                errors.push(`publishedAt is not a valid ISO date: ${frontmatter.publishedAt}`)
            }
        }

        // Validate updatedAt is ISO date
        if (frontmatter.updatedAt && !isValidISODate(frontmatter.updatedAt)) {
            errors.push(`updatedAt is not a valid ISO date: ${frontmatter.updatedAt}`)
        }

        if (errors.length > 0) {
            validationErrors.push({ file: relativePath, errors })
            hasErrors = true
        }
    } catch (error: any) {
        validationErrors.push({
            file: relativePath,
            errors: [`Failed to parse file: ${error.message}`],
        })
        hasErrors = true
    }
}

/**
 * Check for duplicate slugs within a locale and content type
 */
function checkDuplicateSlugs(files: string[], contentType: 'pages' | 'articles'): void {
    const slugsByLocale = new Map<string, Map<string, string[]>>() // locale -> slug -> files

    for (const file of files) {
        try {
            const fileContent = fs.readFileSync(file, 'utf-8')
            const { data: frontmatter } = matter(fileContent)

            if (frontmatter.slug && frontmatter.locale) {
                if (!slugsByLocale.has(frontmatter.locale)) {
                    slugsByLocale.set(frontmatter.locale, new Map())
                }

                const localeMap = slugsByLocale.get(frontmatter.locale)!
                if (!localeMap.has(frontmatter.slug)) {
                    localeMap.set(frontmatter.slug, [])
                }

                localeMap.get(frontmatter.slug)!.push(path.relative(process.cwd(), file))
            }
        } catch (error) {
            // Already reported in validateFile
        }
    }

    // Check for duplicates
    for (const [locale, localeMap] of slugsByLocale) {
        for (const [slug, files] of localeMap) {
            if (files.length > 1) {
                validationErrors.push({
                    file: `${contentType}/${locale}`,
                    errors: [`Duplicate slug "${slug}" found in files: ${files.join(', ')}`],
                })
                hasErrors = true
            }
        }
    }
}

/**
 * Get all MDX files in a directory recursively
 */
function getMDXFiles(dir: string): string[] {
    if (!fs.existsSync(dir)) {
        return []
    }

    const files: string[] = []
    const entries = fs.readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            files.push(...getMDXFiles(fullPath))
        } else if (entry.isFile() && entry.name.endsWith('.mdx')) {
            files.push(fullPath)
        }
    }

    return files
}

/**
 * Main validation
 */
function main(): void {
    console.log('🔍 Validating MDX content...\n')

    // Validate pages
    const pagesDir = path.join(CONTENT_DIR, 'pages')
    const pageFiles = getMDXFiles(pagesDir)
    console.log(`📄 Found ${pageFiles.length} page(s)`)
    pageFiles.forEach((file) => validateFile(file, 'pages'))
    checkDuplicateSlugs(pageFiles, 'pages')

    // Validate articles
    const articlesDir = path.join(CONTENT_DIR, 'articles')
    const articleFiles = getMDXFiles(articlesDir)
    console.log(`📰 Found ${articleFiles.length} article(s)`)
    articleFiles.forEach((file) => validateFile(file, 'articles'))
    checkDuplicateSlugs(articleFiles, 'articles')

    console.log()

    // Report errors
    if (hasErrors) {
        console.error('❌ Validation failed:\n')
        for (const { file, errors } of validationErrors) {
            console.error(`  ${file}:`)
            for (const error of errors) {
                console.error(`    - ${error}`)
            }
            console.error()
        }
        process.exit(1)
    } else {
        console.log('✅ All content validated successfully!')
        process.exit(0)
    }
}

main()
