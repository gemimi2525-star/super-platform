/**
 * Border Radius Tokens
 * Subtle, modern corner radius values
 */

export const radius = {
    none: '0px',
    xs: '2px',
    sm: '4px',
    md: '6px',
    base: '8px',
    lg: '10px',
    xl: '12px',
    '2xl': '16px',
    '3xl': '24px',
    full: '9999px',
} as const;

export type RadiusKey = keyof typeof radius;
