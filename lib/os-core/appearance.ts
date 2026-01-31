/**
 * ═══════════════════════════════════════════════════════════════════════════
 * APICOREDATA OS — APPEARANCE SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * PHASE 7.1: Background Types + Auto Contrast Algorithm
 * 
 * FEATURES:
 * - Solid / Gradient / Image backgrounds (v1)
 * - Auto contrast detection for text readability
 * - Theme-ready architecture
 * 
 * @version 1.0.0
 * @date 2026-01-29
 */

// ═══════════════════════════════════════════════════════════════════════════
// BACKGROUND TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type BackgroundType = 'solid' | 'gradient' | 'image';

export interface OSBackgroundConfig {
    type: BackgroundType;
    value: string;          // CSS value (color, gradient, or url)
    isDark: boolean;        // Manual override for contrast
}

// ─────────────────────────────────────────────────────────────────────────
// PRESET BACKGROUNDS (v1)
// ─────────────────────────────────────────────────────────────────────────

export const osBackgrounds = {
    // Solid colors
    'default': {
        type: 'solid' as const,
        value: 'rgb(250, 250, 250)',      // neutral-50
        isDark: false,
    },
    'white': {
        type: 'solid' as const,
        value: 'rgb(255, 255, 255)',
        isDark: false,
    },
    'light-gray': {
        type: 'solid' as const,
        value: 'rgb(245, 245, 245)',      // neutral-100
        isDark: false,
    },
    'dark': {
        type: 'solid' as const,
        value: 'rgb(23, 23, 23)',         // neutral-900
        isDark: true,
    },
    'midnight': {
        type: 'solid' as const,
        value: 'rgb(10, 10, 10)',         // neutral-950
        isDark: true,
    },

    // Gradients
    'gradient-light': {
        type: 'gradient' as const,
        value: 'linear-gradient(135deg, rgb(250, 250, 250) 0%, rgb(229, 229, 229) 100%)',
        isDark: false,
    },
    'gradient-blue': {
        type: 'gradient' as const,
        value: 'linear-gradient(135deg, rgb(239, 246, 255) 0%, rgb(191, 219, 254) 100%)',
        isDark: false,
    },
    'gradient-purple': {
        type: 'gradient' as const,
        value: 'linear-gradient(135deg, rgb(245, 243, 255) 0%, rgb(221, 214, 254) 100%)',
        isDark: false,
    },
    'gradient-dark': {
        type: 'gradient' as const,
        value: 'linear-gradient(135deg, rgb(23, 23, 23) 0%, rgb(64, 64, 64) 100%)',
        isDark: true,
    },
    'gradient-ocean': {
        type: 'gradient' as const,
        value: 'linear-gradient(135deg, rgb(15, 23, 42) 0%, rgb(30, 64, 175) 100%)',
        isDark: true,
    },
    'gradient-sunset': {
        type: 'gradient' as const,
        value: 'linear-gradient(135deg, rgb(254, 215, 170) 0%, rgb(251, 164, 159) 100%)',
        isDark: false,
    },
} as const;

export type OSBackgroundPreset = keyof typeof osBackgrounds;

// ═══════════════════════════════════════════════════════════════════════════
// AUTO CONTRAST SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate relative luminance of an RGB color
 * Based on WCAG 2.1 formula
 */
export function getLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map((c) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Check if a color is "dark" (needs light foreground)
 * Returns true if luminance is below threshold
 */
export function isColorDark(r: number, g: number, b: number): boolean {
    const luminance = getLuminance(r, g, b);
    return luminance < 0.5; // Threshold for dark/light determination
}

/**
 * Parse CSS color string to RGB values
 * Supports: rgb(r,g,b), rgba(r,g,b,a), #hex, #hexhex
 */
export function parseColor(color: string): { r: number; g: number; b: number } | null {
    // rgb(r, g, b) or rgba(r, g, b, a)
    const rgbMatch = color.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (rgbMatch) {
        return {
            r: parseInt(rgbMatch[1], 10),
            g: parseInt(rgbMatch[2], 10),
            b: parseInt(rgbMatch[3], 10),
        };
    }

    // #hex or #hexhex
    const hexMatch = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (hexMatch) {
        return {
            r: parseInt(hexMatch[1], 16),
            g: parseInt(hexMatch[2], 16),
            b: parseInt(hexMatch[3], 16),
        };
    }

    // #rgb shorthand
    const hexShortMatch = color.match(/^#?([a-f\d])([a-f\d])([a-f\d])$/i);
    if (hexShortMatch) {
        return {
            r: parseInt(hexShortMatch[1] + hexShortMatch[1], 16),
            g: parseInt(hexShortMatch[2] + hexShortMatch[2], 16),
            b: parseInt(hexShortMatch[3] + hexShortMatch[3], 16),
        };
    }

    return null;
}

/**
 * Get the appropriate foreground color based on background
 */
export function getContrastForeground(
    backgroundColor: string,
    isDarkOverride?: boolean
): 'light' | 'dark' {
    // Manual override takes precedence
    if (isDarkOverride !== undefined) {
        return isDarkOverride ? 'light' : 'dark';
    }

    // Parse and calculate
    const parsed = parseColor(backgroundColor);
    if (parsed) {
        return isColorDark(parsed.r, parsed.g, parsed.b) ? 'light' : 'dark';
    }

    // Default to dark foreground (light background)
    return 'dark';
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTRAST COLOR TOKENS
// ═══════════════════════════════════════════════════════════════════════════

export const contrastColors = {
    light: {
        fg: {
            default: 'rgb(255, 255, 255)',
            muted: 'rgba(255, 255, 255, 0.8)',
            subtle: 'rgba(255, 255, 255, 0.6)',
        },
        border: {
            default: 'rgba(255, 255, 255, 0.2)',
            subtle: 'rgba(255, 255, 255, 0.1)',
        },
    },
    dark: {
        fg: {
            default: 'rgb(23, 23, 23)',
            muted: 'rgb(82, 82, 82)',
            subtle: 'rgb(115, 115, 115)',
        },
        border: {
            default: 'rgb(229, 229, 229)',
            subtle: 'rgb(245, 245, 245)',
        },
    },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// APPEARANCE CONTEXT (for React)
// ═══════════════════════════════════════════════════════════════════════════

export interface OSAppearanceContext {
    background: OSBackgroundConfig;
    contrast: 'light' | 'dark';
    theme: 'light' | 'dark'; // Future: system preference
}

export function createAppearanceContext(
    backgroundKey: OSBackgroundPreset | OSBackgroundConfig
): OSAppearanceContext {
    // Get background config - either from preset or use directly
    const bg: OSBackgroundConfig = typeof backgroundKey === 'string'
        ? { ...osBackgrounds[backgroundKey] }  // Clone preset
        : backgroundKey;

    // Determine contrast based on background
    let contrast: 'light' | 'dark';

    if (bg.isDark !== undefined) {
        contrast = bg.isDark ? 'light' : 'dark';
    } else if (bg.type === 'solid') {
        contrast = getContrastForeground(bg.value);
    } else {
        // For gradients, we need manual isDark flag
        contrast = 'dark'; // Default
    }

    return {
        background: bg,
        contrast,
        theme: contrast === 'light' ? 'dark' : 'light',
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// CSS CUSTOM PROPERTIES GENERATOR
// ═══════════════════════════════════════════════════════════════════════════

export function generateAppearanceCSS(context: OSAppearanceContext): Record<string, string> {
    const { background, contrast } = context;
    const colors = contrastColors[contrast];

    return {
        '--os-bg': background.value,
        '--os-bg-type': background.type,
        '--os-contrast': contrast,
        '--os-fg': colors.fg.default,
        '--os-fg-muted': colors.fg.muted,
        '--os-fg-subtle': colors.fg.subtle,
        '--os-border': colors.border.default,
        '--os-border-subtle': colors.border.subtle,
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPE EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export type ContrastMode = 'light' | 'dark';
