/**
 * ═══════════════════════════════════════════════════════════════════════════
 * APICOREDATA OS — RESPONSIVE BREAKPOINTS
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * PHASE 7.1: Responsive Rules for OS-grade Experience
 * 
 * DEVICE CATEGORIES:
 * - Desktop: lg, md, sm
 * - Tablet: landscape, portrait
 * - Mobile: regular, compact
 * 
 * @version 1.0.0
 * @date 2026-01-29
 */

// ═══════════════════════════════════════════════════════════════════════════
// BREAKPOINT VALUES (min-width in pixels)
// ═══════════════════════════════════════════════════════════════════════════

export const osBreakpoints = {
    // Mobile
    'mobile-compact': 0,      // 0-359px (small phones)
    'mobile': 360,            // 360-639px (standard phones)

    // Tablet
    'tablet-portrait': 640,   // 640-767px
    'tablet-landscape': 768,  // 768-1023px

    // Desktop
    'desktop-sm': 1024,       // 1024-1279px (small laptops)
    'desktop-md': 1280,       // 1280-1535px (standard laptops)
    'desktop-lg': 1536,       // 1536px+ (large monitors)
} as const;

// Tailwind-compatible breakpoint map
export const breakpointMap = {
    'sm': 640,
    'md': 768,
    'lg': 1024,
    'xl': 1280,
    '2xl': 1536,
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// DEVICE DETECTION HELPERS
// ═══════════════════════════════════════════════════════════════════════════

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export function getDeviceType(width: number): DeviceType {
    if (width < osBreakpoints['tablet-portrait']) return 'mobile';
    if (width < osBreakpoints['desktop-sm']) return 'tablet';
    return 'desktop';
}

export function isMobile(width: number): boolean {
    return width < osBreakpoints['tablet-portrait'];
}

export function isTablet(width: number): boolean {
    return width >= osBreakpoints['tablet-portrait'] && width < osBreakpoints['desktop-sm'];
}

export function isDesktop(width: number): boolean {
    return width >= osBreakpoints['desktop-sm'];
}

// ═══════════════════════════════════════════════════════════════════════════
// LAYOUT RULES PER DEVICE
// ═══════════════════════════════════════════════════════════════════════════

export const osLayoutRules = {
    // ─────────────────────────────────────────────────────────────────────
    // SIDEBAR BEHAVIOR
    // ─────────────────────────────────────────────────────────────────────
    sidebar: {
        desktop: {
            mode: 'full' as const,        // Always visible
            width: 240,                    // px
            collapsedWidth: 64,            // px
            collapsible: true,
        },
        tablet: {
            mode: 'collapsed' as const,    // Collapsed by default
            width: 240,
            collapsedWidth: 64,
            collapsible: true,
        },
        mobile: {
            mode: 'hidden' as const,       // No persistent sidebar
            width: 280,                    // Full overlay when open
            collapsedWidth: 0,
            collapsible: false,
        },
    },

    // ─────────────────────────────────────────────────────────────────────
    // TOP BAR BEHAVIOR
    // ─────────────────────────────────────────────────────────────────────
    topbar: {
        desktop: {
            height: 56,
            showBreadcrumbs: true,
            showSearch: true,
        },
        tablet: {
            height: 56,
            showBreadcrumbs: true,
            showSearch: false,
        },
        mobile: {
            height: 48,
            showBreadcrumbs: false,
            showSearch: false,
        },
    },

    // ─────────────────────────────────────────────────────────────────────
    // APP SURFACE CONSTRAINTS
    // ─────────────────────────────────────────────────────────────────────
    appSurface: {
        desktop: {
            maxWidth: 1280,               // px
            minWidth: 640,
            padding: 24,                  // px
        },
        tablet: {
            maxWidth: '100%',
            minWidth: 320,
            padding: 16,
        },
        mobile: {
            maxWidth: '100%',
            minWidth: 280,
            padding: 12,
        },
    },

    // ─────────────────────────────────────────────────────────────────────
    // DESKTOP GRID (OS Home)
    // ─────────────────────────────────────────────────────────────────────
    desktopGrid: {
        desktop: {
            columns: 4,                   // 4-column grid
            gap: 24,
            maxWidth: 1100,
        },
        tablet: {
            columns: 2,                   // 2-column grid
            gap: 16,
            maxWidth: '100%',
        },
        mobile: {
            columns: 1,                   // Stack
            gap: 12,
            maxWidth: '100%',
        },
    },

    // ─────────────────────────────────────────────────────────────────────
    // TOUCH TARGETS (Accessibility)
    // ─────────────────────────────────────────────────────────────────────
    touchTarget: {
        desktop: {
            minHeight: 36,                // px
            minWidth: 36,
        },
        tablet: {
            minHeight: 44,                // Apple HIG recommended
            minWidth: 44,
        },
        mobile: {
            minHeight: 48,                // Material Design recommended
            minWidth: 48,
        },
    },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// CSS MEDIA QUERY HELPERS
// ═══════════════════════════════════════════════════════════════════════════

export const mediaQueries = {
    mobile: `(max-width: ${osBreakpoints['tablet-portrait'] - 1}px)`,
    mobileCompact: `(max-width: ${osBreakpoints['mobile'] - 1}px)`,
    tablet: `(min-width: ${osBreakpoints['tablet-portrait']}px) and (max-width: ${osBreakpoints['desktop-sm'] - 1}px)`,
    tabletPortrait: `(min-width: ${osBreakpoints['tablet-portrait']}px) and (max-width: ${osBreakpoints['tablet-landscape'] - 1}px)`,
    tabletLandscape: `(min-width: ${osBreakpoints['tablet-landscape']}px) and (max-width: ${osBreakpoints['desktop-sm'] - 1}px)`,
    desktop: `(min-width: ${osBreakpoints['desktop-sm']}px)`,
    desktopSm: `(min-width: ${osBreakpoints['desktop-sm']}px) and (max-width: ${osBreakpoints['desktop-md'] - 1}px)`,
    desktopMd: `(min-width: ${osBreakpoints['desktop-md']}px) and (max-width: ${osBreakpoints['desktop-lg'] - 1}px)`,
    desktopLg: `(min-width: ${osBreakpoints['desktop-lg']}px)`,
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// TYPE EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export type OSBreakpoint = keyof typeof osBreakpoints;
export type MediaQuery = keyof typeof mediaQueries;
