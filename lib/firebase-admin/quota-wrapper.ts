
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
