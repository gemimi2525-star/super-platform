/**
 * Spacing Tokens - 8pt Grid System
 * MacOS-grade consistent spacing scale
 */

export const spacing = {
    0: '0px',
    xs: '4px',
    sm: '8px',
    md: '12px',
    base: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
    '4xl': '96px',
    '5xl': '128px',
} as const;

// Numeric values for calculations
export const spacingPx = {
    0: 0,
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
    '4xl': 96,
    '5xl': 128,
} as const;

export type SpacingKey = keyof typeof spacing;
