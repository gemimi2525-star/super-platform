import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getArticle, getAllArticleSlugs } from '@/lib/content'
import { buildMetadata } from '@synapse/web/seo'
import { Container } from '@synapse/web'
import type { ContentLocale } from '@/lib/content/types'

interface Props {
    params: Promise<{ locale: string; slug: string }>
}

export async function generateStaticParams() {
    const slugs = getAllArticleSlugs()
    return slugs.map(({ locale, slug }) => ({ locale, slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale, slug } = await params
    const article = getArticle(locale as ContentLocale, slug)

    if (!article) {
        return {}
    }

    return buildMetadata({
        title: article.frontmatter.title,
        description: article.frontmatter.description,
        image: article.frontmatter.ogImage,
        locale: locale as ContentLocale,
    })
}

export default async function ArticleDetailPage({ params }: Props) {
    const { locale, slug } = await params
    const article = getArticle(locale as ContentLocale, slug)

    if (!article) {
        notFound()
    }

    return (
        <div className="min-h-screen py-12">
            <Container size="desktop">
                <article>
                    {/* Header */}
                    <header className="mb-8">
                        <h1 className="text-4xl font-bold mb-4">{article.frontmatter.title}</h1>
                        <p className="text-xl text-neutral-600 mb-4">{article.frontmatter.description}</p>

                        <div className="flex gap-4 text-sm text-neutral-500 border-t pt-4">
                            {article.frontmatter.publishedAt && (
                                <time dateTime={article.frontmatter.publishedAt}>
                                    {new Date(article.frontmatter.publishedAt).toLocaleDateString(
                                        locale === 'th' ? 'th-TH' : 'en-US',
                                        { year: 'numeric', month: 'long', day: 'numeric' }
                                    )}
                                </time>
                            )}
                            {article.frontmatter.tags && article.frontmatter.tags.length > 0 && (
                                <div className="flex gap-2">
                                    {article.frontmatter.tags.map((tag) => (
                                        <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </header>

                    {/* Content */}
                    <div className="prose prose-slate lg:prose-lg dark:prose-invert max-w-none">
                        <MDXRemote source={article.content} />
                    </div>
                </article>
            </Container>
        </div>
    )
}
