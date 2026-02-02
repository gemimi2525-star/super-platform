import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getPage } from '@/lib/content'
import { buildMetadata } from '@synapse/web/seo'
import { Header } from '@synapse/web'
import type { ContentLocale } from '@/lib/content/types'

interface Props {
    params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params
    const page = getPage(locale as ContentLocale, 'trust-home')

    if (!page) {
        return {}
    }

    return buildMetadata({
        title: page.frontmatter.title,
        description: page.frontmatter.description,
        image: page.frontmatter.ogImage,
        locale: locale as ContentLocale,
    })
}

export default async function TrustHomePage({ params }: Props) {
    const { locale } = await params
    const page = getPage(locale as ContentLocale, 'trust-home')

    if (!page) {
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
