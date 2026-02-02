/**
 * SYNAPSE Web Template - Content Security Policy
 * 
 * Baseline CSP configuration
 * Start permissive but safe; refine as needed
 */

export interface CSPDirectives {
    'default-src'?: string[];
    'script-src'?: string[];
    'style-src'?: string[];
    'img-src'?: string[];
    'font-src'?: string[];
    'connect-src'?: string[];
    'frame-ancestors'?: string[];
    'base-uri'?: string[];
    'form-action'?: string[];
}

/**
 * Build CSP header value from directives
 */
export function buildCSP(directives: CSPDirectives): string {
    return Object.entries(directives)
        .map(([key, values]) => `${key} ${values.join(' ')}`)
        .join('; ');
}

/**
 * Get baseline CSP directives (permissive but safe)
 */
export function getBaselineCSP(): CSPDirectives {
    return {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Next.js dev needs unsafe-eval
        'style-src': ["'self'", "'unsafe-inline'"], // Emotion/styled-components need unsafe-inline
        'img-src': ["'self'", 'data:', 'https:'],
        'font-src': ["'self'", 'data:'],
        'connect-src': ["'self'"],
        'frame-ancestors': ["'none'"], // Clickjacking protection
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
    };
}

/**
 * Get CSP header value (baseline)
 */
export function getCSPHeader(): string {
    return buildCSP(getBaselineCSP());
}
