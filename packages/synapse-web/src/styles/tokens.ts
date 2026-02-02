/**
 * SYNAPSE Web Template - Design Tokens v1
 * Minimal / Calm / Trust-focused Design System
 * 
 * RULES:
 * - All UI components MUST consume these tokens
 * - NO random hardcoded values
 * - Single accent color philosophy
 */

// ═══════════════════════════════════════════════════════════════════════
// COLORS - Neutral Scale + Single Accent
// ═══════════════════════════════════════════════════════════════════════

export const colors = {
    // Neutral scale (for backgrounds, text, borders)
    neutral: {
        50: '#fafafa',
        100: '#f5f5f5',
        200: '#e5e5e5',
        300: '#d4d4d4',
        400: '#a3a3a3',
        500: '#737373',
        600: '#525252',
        700: '#404040',
        800: '#262626',
        900: '#171717',
        950: '#0a0a0a',
    },

    // Accent - Trust Blue-Gray (single accent philosophy)
    accent: {
        50: '#f0f9ff',
        100: '#e0f2fe',
        200: '#bae6fd',
        300: '#7dd3fc',
        400: '#38bdf8',
        500: '#0ea5e9',
        600: '#0284c7',
        700: '#0369a1',
        800: '#075985',
        900: '#0c4a6e',
    },

    // Semantic colors
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',

    // Surface colors
    background: '#fafafa',
    surface: '#ffffff',
    border: '#e5e5e5',
} as const;

// ═══════════════════════════════════════════════════════════════════════
// SPACING - Consistent rhythm
// ═══════════════════════════════════════════════════════════════════════

export const spacing = {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '0.75rem',    // 12px
    lg: '1rem',       // 16px
    xl: '1.5rem',     // 24px
    '2xl': '2rem',    // 32px
    '3xl': '3rem',    // 48px
    '4xl': '4rem',    // 64px
    '5xl': '6rem',    // 96px
} as const;

// ═══════════════════════════════════════════════════════════════════════
// RADIUS - Soft, rounded corners
// ═══════════════════════════════════════════════════════════════════════

export const radius = {
    sm: '0.5rem',      // 8px
    md: '0.875rem',    // 14px
    lg: '1rem',        // 16px
    xl: '1.125rem',    // 18px
    full: '9999px',
} as const;

// ═══════════════════════════════════════════════════════════════════════
// SHADOWS - Very soft, subtle elevation
// ═══════════════════════════════════════════════════════════════════════

export const shadows = {
    // Level 1: Subtle elevation (cards, inputs)
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',

    // Level 2: Medium elevation (dropdowns, modals)
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',

    // Level 3: High elevation (rare, for focus states)
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
} as const;

// ═══════════════════════════════════════════════════════════════════════
// TYPOGRAPHY - Readable, calm hierarchy
// ═══════════════════════════════════════════════════════════════════════

export const typography = {
    // Font sizes
    fontSize: {
        xs: '0.75rem',      // 12px
        sm: '0.875rem',     // 14px
        base: '1rem',       // 16px
        lg: '1.125rem',     // 18px
        xl: '1.25rem',      // 20px
        '2xl': '1.5rem',    // 24px
        '3xl': '1.875rem',  // 30px
        '4xl': '2.25rem',   // 36px
        '5xl': '3rem',      // 48px
        '6xl': '3.75rem',   // 60px
    },

    // Line heights - generous for readability
    lineHeight: {
        tight: '1.25',
        normal: '1.5',
        relaxed: '1.75',
        loose: '2',
    },

    // Font weights
    fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
    },
} as const;

// ═══════════════════════════════════════════════════════════════════════
// LAYOUT - Container & Section rules
// ═══════════════════════════════════════════════════════════════════════

export const layout = {
    // Container max-widths per breakpoint
    container: {
        mobile: '100%',
        tablet: '48rem',    // 768px
        desktop: '64rem',   // 1024px
        wide: '80rem',      // 1280px
        ultrawide: '90rem', // 1440px
    },

    // Section padding (vertical rhythm)
    section: {
        mobile: '2rem',     // 32px
        tablet: '3rem',     // 48px
        desktop: '4rem',    // 64px
    },

    // Container padding (horizontal)
    containerPadding: {
        mobile: '1rem',     // 16px
        tablet: '1.5rem',   // 24px
        desktop: '2rem',    // 32px
    },
} as const;

// ═══════════════════════════════════════════════════════════════════════
// MOTION - Subtle, respectful of reduced-motion
// ═══════════════════════════════════════════════════════════════════════

export const motion = {
    // Durations
    duration: {
        fast: '150ms',
        normal: '250ms',
        slow: '350ms',
    },

    // Easing
    easing: {
        inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
        out: 'cubic-bezier(0, 0, 0.2, 1)',
        in: 'cubic-bezier(0.4, 0, 1, 1)',
    },
} as const;

// ═══════════════════════════════════════════════════════════════════════
// Z-INDEX - Layering hierarchy
// ═══════════════════════════════════════════════════════════════════════

export const zIndex = {
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    modal: 1200,
    drawer: 1300,
    toast: 1400,
} as const;

// ═══════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════

export const tokens = {
    colors,
    spacing,
    radius,
    shadows,
    typography,
    layout,
    motion,
    zIndex,
} as const;

export type Tokens = typeof tokens;
