/**
 * Circuit Breaker & Fail-Safe Utilities
 * 
 * Protects against upstream failures (Firestore, network, etc.)
 * Prevents cascade failures with controlled error responses.
 * 
 * Part of Phase 11: Production Hardening
 * SYNAPSE Kernel: FROZEN ❄️ - This module does NOT touch synapse-core
 */

import { ErrorCodes } from '../errors/normalize';

// ============================================================================
// Types
// ============================================================================

export interface TimeoutOptions {
    timeoutMs: number;
    operationName?: string;
}

export interface RetryOptions {
    maxRetries: number;
    delayMs: number;
    backoffMultiplier?: number;
    retryableErrors?: string[];
}

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerOptions {
    failureThreshold: number;
    resetTimeoutMs: number;
    halfOpenMaxAttempts?: number;
}

// ============================================================================
// Timeout Wrapper
// ============================================================================

/**
 * Execute a function with a timeout.
 * Throws INFRA_TIMEOUT if operation takes too long.
 */
export async function withTimeout<T>(
    fn: () => Promise<T>,
    options: TimeoutOptions
): Promise<T> {
    const { timeoutMs, operationName = 'Operation' } = options;

    let timeoutId: NodeJS.Timeout | undefined;

    const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
            const error = new Error(`${operationName} timed out after ${timeoutMs}ms`) as Error & { code: string };
            error.code = ErrorCodes.INFRA_TIMEOUT;
            reject(error);
        }, timeoutMs);
    });

    try {
        const result = await Promise.race([fn(), timeoutPromise]);
        return result;
    } finally {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
    }
}

// ============================================================================
// Retry Wrapper
// ============================================================================

/**
 * Execute a function with retry logic.
 * Only retries on retryable errors.
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions
): Promise<T> {
    const {
        maxRetries,
        delayMs,
        backoffMultiplier = 2,
        retryableErrors = [
            ErrorCodes.INFRA_TIMEOUT,
            ErrorCodes.INFRA_UNAVAILABLE,
        ],
    } = options;

    let lastError: Error | undefined;
    let currentDelay = delayMs;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;
            const errorCode = (error as Error & { code?: string }).code;

            // Check if error is retryable
            const isRetryable = retryableErrors.includes(errorCode || '');

            if (!isRetryable || attempt === maxRetries) {
                throw error;
            }

            // Log retry attempt
            console.warn(`[CIRCUIT] Retry ${attempt + 1}/${maxRetries} after ${currentDelay}ms:`, {
                error: lastError.message,
                code: errorCode,
            });

            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, currentDelay));
            currentDelay *= backoffMultiplier;
        }
    }

    throw lastError;
}

// ============================================================================
// Circuit Breaker
// ============================================================================

/**
 * Simple in-memory circuit breaker.
 * Prevents repeated calls to failing services.
 */
export class CircuitBreaker {
    private state: CircuitState = 'closed';
    private failureCount = 0;
    private lastFailureTime = 0;
    private halfOpenAttempts = 0;

    constructor(
        private readonly name: string,
        private readonly options: CircuitBreakerOptions
    ) { }

    /**
     * Get current circuit state.
     */
    getState(): CircuitState {
        // Check if we should transition from open to half-open
        if (this.state === 'open') {
            const timeSinceFailure = Date.now() - this.lastFailureTime;
            if (timeSinceFailure >= this.options.resetTimeoutMs) {
                this.state = 'half-open';
                this.halfOpenAttempts = 0;
                console.log(`[CIRCUIT:${this.name}] Transitioned to half-open`);
            }
        }
        return this.state;
    }

    /**
     * Execute a function through the circuit breaker.
     */
    async execute<T>(fn: () => Promise<T>): Promise<T> {
        const state = this.getState();

        // If circuit is open, fail fast
        if (state === 'open') {
            const error = new Error(`Circuit breaker ${this.name} is open`) as Error & { code: string };
            error.code = ErrorCodes.INFRA_UNAVAILABLE;
            throw error;
        }

        // If half-open, check attempt limit
        if (state === 'half-open') {
            const maxAttempts = this.options.halfOpenMaxAttempts || 1;
            if (this.halfOpenAttempts >= maxAttempts) {
                const error = new Error(`Circuit breaker ${this.name} half-open limit reached`) as Error & { code: string };
                error.code = ErrorCodes.INFRA_UNAVAILABLE;
                throw error;
            }
            this.halfOpenAttempts++;
        }

        try {
            const result = await fn();

            // Success - reset circuit
            if (this.state !== 'closed') {
                console.log(`[CIRCUIT:${this.name}] Closed after successful call`);
            }
            this.state = 'closed';
            this.failureCount = 0;
            return result;

        } catch (error) {
            this.failureCount++;
            this.lastFailureTime = Date.now();

            // Check if we should open the circuit
            if (this.failureCount >= this.options.failureThreshold) {
                this.state = 'open';
                console.error(`[CIRCUIT:${this.name}] Opened after ${this.failureCount} failures`);
            }

            throw error;
        }
    }

    /**
     * Manually reset the circuit breaker.
     */
    reset(): void {
        this.state = 'closed';
        this.failureCount = 0;
        this.lastFailureTime = 0;
        this.halfOpenAttempts = 0;
        console.log(`[CIRCUIT:${this.name}] Manually reset`);
    }
}

// ============================================================================
// Pre-configured Circuit Breakers
// ============================================================================

/**
 * Circuit breaker for Firestore operations.
 */
export const firestoreCircuit = new CircuitBreaker('firestore', {
    failureThreshold: 3,
    resetTimeoutMs: 30000, // 30 seconds
    halfOpenMaxAttempts: 1,
});

/**
 * Default timeout for Firestore operations.
 */
export const FIRESTORE_TIMEOUT_MS = 10000; // 10 seconds
