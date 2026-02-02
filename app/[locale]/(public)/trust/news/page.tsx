import { Metadata } from 'next'
import Link from 'next/link'
import { listArticles } from '@/lib/content'
import { buildMetadata } from '@synapse/web/seo'
import { Card, Container } from '@synapse/web'
import type { ContentLocale } from '@/lib/content/types'

interface Props {
    params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params

    const title = locale === 'th' ? 'ข่าวสาร' : 'News'
    const description = locale === 'th'
        ? 'ข่าวสารและประกาศล่าสุดจาก SYNAPSE'
        : 'Latest news and announcements from SYNAPSE'

    return buildMetadata({
        title,
        description,
        locale: locale as ContentLocale,
    })
}

export default async function NewsListPage({ params }: Props) {
    const { locale } = await params
    const articles = listArticles(locale as ContentLocale)

    const title = locale === 'th' ? 'ข่าวสารและประกาศ' : 'News & Announcements'

    return (
        <div className="min-h-screen py-12">
            <Container>
                <h1 className="text-4xl font-bold mb-8">{title}</h1>

                {articles.length === 0 ? (
                    <Card className="p-8 text-center text-neutral-600">
                        {locale === 'th' ? 'ยังไม่มีบทความ' : 'No articles yet'}
                    </Card>
                ) : (
                    <div className="grid gap-6">
                        {articles.map((article) => (
                            <Link
                                key={article.frontmatter.slug}
                                href={`/${locale}/trust/news/${article.frontmatter.slug}`}
                            >
                                <Card hover className="p-6">
                                    <h2 className="text-2xl font-bold mb-2">{article.frontmatter.title}</h2>
                                    <p className="text-neutral-600 mb-4">{article.frontmatter.description}</p>
                                    <div className="flex gap-4 text-sm text-neutral-500">
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
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </Container>
        </div>
    )
}
