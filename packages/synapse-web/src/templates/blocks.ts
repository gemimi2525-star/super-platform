/**
 * SYNAPSE Web Template - Block System
 * CMS-safe content blocks with FIXED layout rules
 * 
 * CMS can only change: content, order
 * CMS cannot change: column rules, spacing, responsive behavior
 */

export type BlockType =
    | 'hero'
    | 'richText'
    | 'cardGrid'
    | 'faq'
    | 'callout'
    | 'media'
    | 'section';

// ═══════════════════════════════════════════════════════════════════════
// BLOCK DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════

export interface HeroBlock {
    type: 'hero';
    title: string;
    subtitle?: string;
    cta?: {
        label: string;
        href: string;
    };
}

export interface RichTextBlock {
    type: 'richText';
    content: string; // HTML or Markdown
}

export interface CardGridBlock {
    type: 'cardGrid';
    cards: Array<{
        title: string;
        description: string;
        icon?: string;
    }>;
    // Columns are FIXED by responsive rules:
    // mobile: 1, tablet: 2, desktop: 3
}

export interface FAQBlock {
    type: 'faq';
    items: Array<{
        question: string;
        answer: string;
    }>;
}

export interface CalloutBlock {
    type: 'callout';
    variant: 'info' | 'success' | 'warning' | 'error';
    content: string;
    icon?: string;
}

export interface MediaBlock {
    type: 'media';
    src: string;
    alt: string;
    caption?: string;
}

export interface SectionBlock {
    type: 'section';
    title?: string;
    blocks: Block[];
}

export type Block =
    | HeroBlock
    | RichTextBlock
    | CardGridBlock
    | FAQBlock
    | CalloutBlock
    | MediaBlock
    | SectionBlock;

// ═══════════════════════════════════════════════════════════════════════
// RESPONSIVE GRID RULES (LOCKED)
// ═══════════════════════════════════════════════════════════════════════

export const GRID_COLUMNS = {
    mobile: 1,
    tablet: 2,
    desktop: 3,
} as const;
