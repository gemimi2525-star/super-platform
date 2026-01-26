/**
 * Z-Index Tokens
 * Layering system for proper stacking
 */

export const zIndex = {
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    fixed: 1200,
    overlay: 1300,
    modal: 2000,
    popover: 2100,
    toast: 3000,
    tooltip: 4000,
} as const;

export type ZIndexKey = keyof typeof zIndex;
