import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getPage } from '@/lib/content'
import { buildMetadata } from '@synapse/web/seo'
import type { ContentLocale } from '@/lib/content/types'

interface Props {
    params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params
    const page = getPage(locale as ContentLocale, 'trust-governance')

    if (!page) {
        return {
            title: 'Governance Model - SYNAPSE Trust Center',
            description: 'Learn about SYNAPSE governance architecture',
        }
    }

    return buildMetadata({
        title: page.frontmatter.title,
        description: page.frontmatter.description,
        image: page.frontmatter.ogImage,
        locale: locale as ContentLocale,
    })
}

export default async function GovernancePage({ params }: Props) {
    const { locale } = await params
    const page = getPage(locale as ContentLocale, 'trust-governance')

    if (!page) {
        // In development, show helpful message
        if (process.env.NODE_ENV === 'development') {
            return (
                <div className="container mx-auto px-4 py-12 max-w-4xl">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                        <h1 className="text-2xl font-bold mb-2">⚠️ Content Not Found</h1>
                        <p className="mb-4">
                            The governance page content is missing. Expected file:
                        </p>
                        <code className="block bg-gray-100 p-2 rounded">
                            content/pages/{locale}/trust-governance.mdx
                        </code>
                        <p className="mt-4 text-sm text-gray-600">
                            This message only appears in development mode.
                            In production, this would show a 404 page.
                        </p>
                    </div>
                </div>
            )
        }

        // In production, return 404
        notFound()
    }

    return (
        <div className="min-h-screen">
            <div className="container mx-auto px-4 py-12 max-w-4xl">
                <article className="prose prose-slate lg:prose-lg dark:prose-invert mx-auto">
                    <MDXRemote source={page.content} />
                </article>
            </div>
        </div>
    )
}
