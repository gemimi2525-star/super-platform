/**
 * ═══════════════════════════════════════════════════════════════════════════
 * APICOREDATA OS — CORE SYSTEM TOKENS
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * PHASE 7.1: Single Source of Truth for Design Tokens
 * 
 * RULES:
 * - ❌ NO hardcoded hex colors in components
 * - ❌ NO arbitrary margin/padding values
 * - ✅ USE these tokens exclusively via CSS vars or utility classes
 * 
 * @version 1.0.0
 * @date 2026-01-29
 */

// ═══════════════════════════════════════════════════════════════════════════
// 1. COLOR SYSTEM — Semantic Color Tokens
// ═══════════════════════════════════════════════════════════════════════════

export const osColors = {
    // ─────────────────────────────────────────────────────────────────────
    // FOREGROUND (Text & Icons)
    // ─────────────────────────────────────────────────────────────────────
    fg: {
        default: 'rgb(23, 23, 23)',      // Primary text
        muted: 'rgb(82, 82, 82)',         // Secondary text
        subtle: 'rgb(115, 115, 115)',     // Tertiary/placeholder
        inverse: 'rgb(255, 255, 255)',    // White text on dark bg
        disabled: 'rgb(163, 163, 163)',   // Disabled state
    },

    // ─────────────────────────────────────────────────────────────────────
    // BACKGROUND (Surfaces)
    // ─────────────────────────────────────────────────────────────────────
    bg: {
        default: 'rgb(255, 255, 255)',    // Page background
        subtle: 'rgb(250, 250, 250)',     // Subtle areas
        muted: 'rgb(245, 245, 245)',      // Section backgrounds
        surface: 'rgb(255, 255, 255)',    // Cards, panels
        elevated: 'rgb(255, 255, 255)',   // Elevated surfaces (modals)
        overlay: 'rgba(0, 0, 0, 0.5)',    // Modal backdrop
    },

    // ─────────────────────────────────────────────────────────────────────
    // BORDER & DIVIDER
    // ─────────────────────────────────────────────────────────────────────
    border: {
        default: 'rgb(229, 229, 229)',    // Standard border
        subtle: 'rgb(245, 245, 245)',     // Subtle dividers
        strong: 'rgb(212, 212, 212)',     // Emphasized borders
        focus: 'rgb(59, 130, 246)',       // Focus state
    },

    // ─────────────────────────────────────────────────────────────────────
    // ACCENT (Brand/Primary)
    // ─────────────────────────────────────────────────────────────────────
    accent: {
        default: 'rgb(37, 99, 235)',      // blue-600 (Primary CTA)
        hover: 'rgb(29, 78, 216)',        // blue-700
        muted: 'rgb(191, 219, 254)',      // blue-200 (Light tint)
        subtle: 'rgb(239, 246, 255)',     // blue-50 (Hover bg)
    },

    // ─────────────────────────────────────────────────────────────────────
    // STATUS (Semantic States)
    // ─────────────────────────────────────────────────────────────────────
    status: {
        success: {
            fg: 'rgb(22, 163, 74)',        // green-600
            bg: 'rgb(240, 253, 244)',      // green-50
            border: 'rgb(134, 239, 172)',  // green-300
        },
        warning: {
            fg: 'rgb(217, 119, 6)',        // amber-600
            bg: 'rgb(255, 251, 235)',      // amber-50
            border: 'rgb(252, 211, 77)',   // amber-300
        },
        error: {
            fg: 'rgb(220, 38, 38)',        // red-600
            bg: 'rgb(254, 242, 242)',      // red-50
            border: 'rgb(252, 165, 165)',  // red-300
        },
        info: {
            fg: 'rgb(2, 132, 199)',        // sky-600
            bg: 'rgb(240, 249, 255)',      // sky-50
            border: 'rgb(125, 211, 252)',  // sky-300
        },
    },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// 2. SPACING SYSTEM — 4px/8px Grid
// ═══════════════════════════════════════════════════════════════════════════

export const osSpacing = {
    0: 0,
    1: 4,     // xs
    2: 8,     // sm
    3: 12,   // md
    4: 16,    // base
    5: 20,
    6: 24,    // lg
    7: 28,
    8: 32,    // xl
    10: 40,
    12: 48,   // 2xl
    14: 56,
    16: 64,   // 3xl
    20: 80,
    24: 96,   // 4xl
    32: 128,  // 5xl
} as const;

// Named spacing for semantic use
export const osSpacingNamed = {
    none: '0px',
    xs: '4px',
    sm: '8px',
    md: '12px',
    base: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
    '4xl': '96px',
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// 3. RADIUS SYSTEM — OS-grade Corner Radius
// ═══════════════════════════════════════════════════════════════════════════

export const osRadius = {
    none: '0px',
    sm: '4px',      // Small chips, tags
    md: '6px',      // Buttons, inputs
    base: '8px',    // Cards, standard
    lg: '10px',     // Panels
    xl: '12px',     // App surfaces
    '2xl': '16px',  // Large containers
    '3xl': '24px',  // Hero elements
    full: '9999px', // Pills, avatars
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// 4. SHADOW/ELEVATION SYSTEM — OS Layers
// ═══════════════════════════════════════════════════════════════════════════

export const osShadow = {
    // Surface layers (0-4 = depth)
    'surface-0': 'none',
    'surface-1': '0 1px 2px rgba(0, 0, 0, 0.04)',
    'surface-2': '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
    'surface-3': '0 4px 6px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.04)',
    'surface-4': '0 8px 16px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.04)',

    // App surface elevation (floating apps)
    app: `
        0 0 0 1px rgba(0, 0, 0, 0.03),
        0 1px 2px rgba(0, 0, 0, 0.04),
        0 4px 8px rgba(0, 0, 0, 0.04),
        0 8px 16px rgba(0, 0, 0, 0.02)
    `,

    // Modal/overlay elevation
    overlay: '0 24px 48px rgba(0, 0, 0, 0.16), 0 12px 24px rgba(0, 0, 0, 0.08)',

    // Focus ring
    focus: '0 0 0 3px rgba(59, 130, 246, 0.15)',
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// 5. Z-INDEX LAYERS — OS Stacking Context
// ═══════════════════════════════════════════════════════════════════════════

export const osZIndex = {
    // Base layer
    desktop: 0,

    // App layers
    'app-surface': 10,
    'app-header': 20,

    // Navigation
    sidebar: 100,
    topbar: 100,

    // Overlays
    dropdown: 200,
    overlay: 300,
    modal: 400,
    'overlay-panel': 500,

    // System level
    'system-menu': 600,
    toast: 700,
    tooltip: 800,
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// 6. TYPOGRAPHY SYSTEM — OS-grade Text
// ═══════════════════════════════════════════════════════════════════════════

export const osTypography = {
    fontFamily: {
        sans: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        mono: '"SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    },

    fontSize: {
        xs: '12px',    // 0.75rem
        sm: '14px',    // 0.875rem
        base: '16px',  // 1rem
        lg: '18px',    // 1.125rem
        xl: '20px',    // 1.25rem
        '2xl': '24px', // 1.5rem
        '3xl': '30px', // 1.875rem
        '4xl': '36px', // 2.25rem
    },

    fontWeight: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
    },

    lineHeight: {
        tight: 1.25,
        snug: 1.375,
        normal: 1.5,
        relaxed: 1.625,
    },

    // Text style presets
    styles: {
        'display': { size: '36px', weight: 700, leading: 1.25 },
        'title': { size: '24px', weight: 600, leading: 1.25 },
        'heading': { size: '20px', weight: 600, leading: 1.375 },
        'subheading': { size: '18px', weight: 500, leading: 1.5 },
        'body': { size: '16px', weight: 400, leading: 1.5 },
        'body-sm': { size: '14px', weight: 400, leading: 1.5 },
        'caption': { size: '12px', weight: 400, leading: 1.5 },
        'label': { size: '14px', weight: 500, leading: 1.25 },
    },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// 7. MOTION SYSTEM — Consistent Animations
// ═══════════════════════════════════════════════════════════════════════════

export const osMotion = {
    // Durations (in ms)
    duration: {
        instant: 80,
        fast: 120,
        normal: 180,
        slow: 220,
        entrance: 250,
    },

    // Single OS Easing (normalized)
    ease: [0.25, 0.1, 0.25, 1.0] as const,

    // CSS easing string
    easingCSS: 'cubic-bezier(0.25, 0.1, 0.25, 1.0)',
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// TYPE EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export type OSColorFg = keyof typeof osColors.fg;
export type OSColorBg = keyof typeof osColors.bg;
export type OSSpacing = keyof typeof osSpacing;
export type OSRadius = keyof typeof osRadius;
export type OSShadow = keyof typeof osShadow;
export type OSZIndex = keyof typeof osZIndex;
