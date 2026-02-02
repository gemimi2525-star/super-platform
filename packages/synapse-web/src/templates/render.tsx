import { Card } from '../components/Card';
import { Callout } from '../components/Callout';
import { Button } from '../components/Button';
import { tokens } from '../styles/tokens';
import type { Block } from './blocks';

export interface BlockRendererProps {
    blocks: Block[];
}

/**
 * BlockRenderer - Render CMS blocks with FIXED responsive layout
 * 
 * Layout rules are controlled HERE, not by CMS
 */
export function BlockRenderer({ blocks }: BlockRendererProps) {
    return (
        <>
            {blocks.map((block, index) => (
                <div key={index}>{renderBlock(block)}</div>
            ))}
        </>
    );
}

function renderBlock(block: Block) {
    switch (block.type) {
        case 'hero':
            return <HeroBlockView {...block} />;
        case 'richText':
            return <RichTextBlockView {...block} />;
        case 'cardGrid':
            return <CardGridBlockView {...block} />;
        case 'faq':
            return <FAQBlockView {...block} />;
        case 'callout':
            return <CalloutBlockView {...block} />;
        case 'media':
            return <MediaBlockView {...block} />;
        case 'section':
            return <SectionBlockView {...block} />;
        default:
            return null;
    }
}

// ═══════════════════════════════════════════════════════════════════════
// BLOCK VIEWS
// ═══════════════════════════════════════════════════════════════════════

function HeroBlockView({ title, subtitle, cta }: Extract<Block, { type: 'hero' }>) {
    return (
        <section
            className="py-20 text-center"
            style={{
                background: `linear-gradient(to bottom right, ${tokens.colors.accent[600]}, ${tokens.colors.accent[800]})`,
                color: '#ffffff',
            }}
        >
            <div className="max-w-4xl mx-auto px-4">
                <h1 className="text-5xl font-extrabold mb-4">{title}</h1>
                {subtitle && <p className="text-xl opacity-90 mb-8">{subtitle}</p>}
                {cta && (
                    <a href={cta.href}>
                        <Button variant="secondary" size="lg">
                            {cta.label}
                        </Button>
                    </a>
                )}
            </div>
        </section>
    );
}

function RichTextBlockView({ content }: Extract<Block, { type: 'richText' }>) {
    return (
        <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: content }}
        />
    );
}

function CardGridBlockView({ cards }: Extract<Block, { type: 'cardGrid' }>) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((card, index) => (
                <Card key={index}>
                    {card.icon && <div className="text-3xl mb-4">{card.icon}</div>}
                    <h3 className="text-xl font-bold mb-2">{card.title}</h3>
                    <p className="text-neutral-600">{card.description}</p>
                </Card>
            ))}
        </div>
    );
}

function FAQBlockView({ items }: Extract<Block, { type: 'faq' }>) {
    return (
        <div className="space-y-4">
            {items.map((item, index) => (
                <Card key={index}>
                    <h3 className="font-bold text-lg mb-2">{item.question}</h3>
                    <p className="text-neutral-700">{item.answer}</p>
                </Card>
            ))}
        </div>
    );
}

function CalloutBlockView({ variant, content, icon }: Extract<Block, { type: 'callout' }>) {
    return (
        <Callout variant={variant} icon={icon}>
            <p dangerouslySetInnerHTML={{ __html: content }} />
        </Callout>
    );
}

function MediaBlockView({ src, alt, caption }: Extract<Block, { type: 'media' }>) {
    return (
        <figure>
            <img src={src} alt={alt} className="w-full rounded-lg" style={{ borderRadius: tokens.radius.lg }} />
            {caption && (
                <figcaption className="mt-2 text-sm text-center" style={{ color: tokens.colors.neutral[600] }}>
                    {caption}
                </figcaption>
            )}
        </figure>
    );
}

function SectionBlockView({ title, blocks }: Extract<Block, { type: 'section' }>) {
    return (
        <section className="py-16">
            {title && <h2 className="text-3xl font-bold mb-8">{title}</h2>}
            <BlockRenderer blocks={blocks} />
        </section>
    );
}
