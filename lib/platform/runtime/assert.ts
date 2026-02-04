/**
 * Runtime Assertions
 * 
 * Utility functions for runtime invariant checking.
 * Part of Phase 11: Production Hardening
 * 
 * SYNAPSE Kernel: FROZEN ❄️ - This module does NOT touch synapse-core
 */

/**
 * Assert an invariant condition.
 * Throws InvariantError if condition is false.
 */
export function invariant(
    condition: unknown,
    message: string,
    code: string = 'BUG_INVARIANT_BROKEN'
): asserts condition {
    if (!condition) {
        const error = new Error(`[INVARIANT] ${message}`) as Error & { code: string };
        error.code = code;
        error.name = 'InvariantError';
        throw error;
    }
}

/**
 * Assert that a value is never reached (exhaustive check).
 * Useful for switch statements.
 */
export function assertNever(x: never, message?: string): never {
    throw new Error(message || `Unexpected value: ${JSON.stringify(x)}`);
}

/**
 * Assert that a value is defined (not null/undefined).
 */
export function assertDefined<T>(
    value: T | null | undefined,
    name: string
): asserts value is T {
    invariant(value !== null && value !== undefined, `${name} is required`, 'BUG_MISSING_VALUE');
}

/**
 * Assert that a string is non-empty.
 */
export function assertNonEmpty(
    value: string | null | undefined,
    name: string
): asserts value is string {
    invariant(
        typeof value === 'string' && value.trim().length > 0,
        `${name} must be a non-empty string`,
        'BUG_EMPTY_VALUE'
    );
}
