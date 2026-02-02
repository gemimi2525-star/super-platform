/**
 * SYNAPSE Web Template - Responsive Breakpoints
 * 
 * Three tiers: Mobile, Tablet, Desktop
 * Based on Tailwind defaults
 */

export const breakpoints = {
    // Values (px)
    mobile: 0,
    tablet: 640,
    desktop: 1024,
    wide: 1280,
    ultrawide: 1536,
} as const;

// Media query builders
export const media = {
    mobile: `@media (min-width: ${breakpoints.mobile}px)`,
    tablet: `@media (min-width: ${breakpoints.tablet}px)`,
    desktop: `@media (min-width: ${breakpoints.desktop}px)`,
    wide: `@media (min-width: ${breakpoints.wide}px)`,
    ultrawide: `@media (min-width: ${breakpoints.ultrawide}px)`,

    // Max-width queries
    mobileOnly: `@media (max-width: ${breakpoints.tablet - 1}px)`,
    tabletOnly: `@media (min-width: ${breakpoints.tablet}px) and (max-width: ${breakpoints.desktop - 1}px)`,

    // Motion preference
    reducedMotion: '@media (prefers-reduced-motion: reduce)',
} as const;

// Responsive column rules (for cardGrid, etc.)
export const gridColumns = {
    mobile: 1,
    tablet: 2,
    desktop: 3,
} as const;

// Helper function for responsive values
export function responsive<T>(config: {
    mobile: T;
    tablet?: T;
    desktop?: T;
}): Record<string, T> {
    return {
        base: config.mobile,
        md: config.tablet ?? config.mobile,
        lg: config.desktop ?? config.tablet ?? config.mobile,
    };
}
