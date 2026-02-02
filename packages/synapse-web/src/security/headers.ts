/**
 * SYNAPSE Web Template - Security Headers Baseline
 * 
 * Critical: Client code is ALWAYS visible via F12.
 * Never ship secrets to the browser.
 */

export interface SecurityHeaders {
    'X-Content-Type-Options': string;
    'X-Frame-Options': string;
    'X-XSS-Protection': string;
    'Referrer-Policy': string;
    'Permissions-Policy': string;
    'Strict-Transport-Security': string;
}

/**
 * Get baseline security headers
 */
export function getSecurityHeaders(): SecurityHeaders {
    return {
        // Prevent MIME sniffing
        'X-Content-Type-Options': 'nosniff',

        // Clickjacking protection (also in CSP)
        'X-Frame-Options': 'DENY',

        // XSS protection (legacy but still used)
        'X-XSS-Protection': '1; mode=block',

        // Control referrer information
        'Referrer-Policy': 'strict-origin-when-cross-origin',

        // Feature policy (restrictive baseline)
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',

        // Enforce HTTPS (1 year)
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    };
}

/**
 * Next.js config helper
 */
export function getNextSecurityHeaders() {
    const headers = getSecurityHeaders();
    return Object.entries(headers).map(([key, value]) => ({
        key,
        value,
    }));
}
