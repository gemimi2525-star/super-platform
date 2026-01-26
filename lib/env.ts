/**
 * Environment Variables
 * Type-safe access to environment variables with validation
 */

// Required environment variables
const requiredEnvVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
] as const;

// Server-only required variables (for production)
const serverRequiredEnvVars = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY',
] as const;

/**
 * Validate required environment variables
 * Throws error if any required variable is missing
 */
export function validateEnv() {
    const missing: string[] = [];

    // Check public variables
    requiredEnvVars.forEach((key) => {
        if (!process.env[key]) {
            missing.push(key);
        }
    });

    // Check server variables (only in production or when not using dev bypass)
    if (
        process.env.NODE_ENV === 'production' ||
        process.env.AUTH_DEV_BYPASS !== 'true'
    ) {
        serverRequiredEnvVars.forEach((key) => {
            if (!process.env[key]) {
                missing.push(key);
            }
        });
    }

    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variables:\n${missing.join('\n')}\n\nPlease check your .env.local file.`
        );
    }

    // Warn about security issues
    if (process.env.NODE_ENV === 'production') {
        if (process.env.AUTH_DEV_BYPASS === 'true') {
            throw new Error(
                '❌ CRITICAL SECURITY ERROR: AUTH_DEV_BYPASS is enabled in production!\nThis allows anyone to bypass authentication. Set AUTH_DEV_BYPASS=false or remove it.'
            );
        }

        if (process.env.CRON_SECRET && process.env.CRON_SECRET.includes('test')) {
            console.warn(
                '⚠️  WARNING: CRON_SECRET appears to be a test value. Use a secure random string in production.'
            );
        }
    }
}

/**
 * Type-safe environment variable access
 */
export const env = {
    // Public variables (exposed to browser)
    firebase: {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
    },

    // Server-only variables
    firebaseAdmin: {
        projectId: process.env.FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey: process.env.FIREBASE_PRIVATE_KEY!,
    },

    // Application config
    nodeEnv: process.env.NODE_ENV || 'development',
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',

    // Security
    cronSecret: process.env.CRON_SECRET,
    authDevBypass: process.env.AUTH_DEV_BYPASS === 'true',
    superAdminId: process.env.NEXT_PUBLIC_SUPER_ADMIN_ID,

    // Optional
    openAiApiKey: process.env.OPENAI_API_KEY,
} as const;

// Validate on import (only in production builds)
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
    validateEnv();
}
