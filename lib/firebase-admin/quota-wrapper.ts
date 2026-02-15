
import { Firestore, Settings } from '@google-cloud/firestore';
import { ApiErrorResponse } from '@/lib/api';

/**
 * Custom error for Quota Exhaustion to be caught by API handlers
 */
export class QuotaExceededError extends Error {
    constructor(message: string = 'Firestore Quota Exceeded') {
        super(message);
        this.name = 'QuotaExceededError';
    }
}

// ─── Error Classification (Phase 27C.8b) ──────────────────────────────────────

export type QuotaErrorKind = 'DAILY_QUOTA' | 'RATE_LIMIT' | 'PERMISSION' | 'UNAVAILABLE' | 'UNAUTHENTICATED' | 'UNKNOWN';

/**
 * Checks if an error is a Firestore Quota Exhaustion error
 * GRPC Error Code 8 = RESOURCE_EXHAUSTED
 */
export function isQuotaError(error: any): boolean {
    return error?.code === 8 ||
        error?.message?.includes('Quota exceeded') ||
        error?.message?.includes('RESOURCE_EXHAUSTED');
}

/**
 * Classify the kind of Firestore error for diagnostics.
 * Distinguishes daily quota vs per-minute rate-limit vs permission vs unavailable.
 */
export function classifyFirestoreError(error: any): QuotaErrorKind {
    const code = error?.code;
    const msg = error?.message ?? '';

    if (code === 8 || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('Quota exceeded')) {
        // Per-minute / rate limit errors often mention "rate" or "per minute"
        if (msg.includes('per minute') || msg.includes('rate') || msg.includes('Rate')) {
            return 'RATE_LIMIT';
        }
        return 'DAILY_QUOTA';
    }
    if (code === 7 || msg.includes('PERMISSION_DENIED')) return 'PERMISSION';
    if (code === 14 || msg.includes('UNAVAILABLE')) return 'UNAVAILABLE';
    if (code === 16 || msg.includes('UNAUTHENTICATED')) return 'UNAUTHENTICATED';
    return 'UNKNOWN';
}

/**
 * Structured log for Firestore errors — Phase 27C.8b
 * Emits a JSON-like log line that Vercel can index for debugging.
 */
export function logFirestoreError(context: string, error: any, correlationId: string): void {
    const kind = classifyFirestoreError(error);
    const grpcCode = error?.code ?? null;
    const msg = error?.message ?? String(error);
    console.error(
        `[Firestore:${context}] ${kind} | grpc=${grpcCode} | cid=${correlationId} | ${msg}`
    );
}

/**
 * Helper to safely execute Firestore operations with Quota handling
 * 
 * @param operation - The async firestore operation to run
 * @param fallbackMock - Optional mock data to return if quota is exceeded AND mock mode is on
 */
export async function withQuotaGuard<T>(
    operation: () => Promise<T>,
    fallbackMock?: T
): Promise<T> {
    try {
        return await operation();
    } catch (error: any) {
        if (isQuotaError(error)) {
            console.error('[Firestore] Quota Exceeded:', error.message);

            // EMERGENCY UNBLOCK: If we have mock data and we want to allow testing
            // logic flows despite quota limits, return the mock.
            // In a real prod scenario, we might just throw or return cached data.
            if (process.env.MOCK_API_MODE === 'true' && fallbackMock !== undefined) {
                console.warn('[Firestore] Quota Guard: Returning MOCK data due to quota limit');
                return fallbackMock;
            }

            throw new QuotaExceededError('Firestore storage quota exceeded. Please try again later.');
        }
        throw error;
    }
}

