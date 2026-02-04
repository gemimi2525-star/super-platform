/**
 * Platform Runtime Module Exports
 * 
 * Central exports for Phase 11 Production Hardening modules.
 * 
 * SYNAPSE Kernel: FROZEN ❄️ - This module does NOT touch synapse-core
 */

// Runtime Invariants
export {
    assertEnvVars,
    assertProductionLock,
    isDevBypassActive,
    validateResponseShape,
    assertResponseShape,
    validateDecisionShape,
} from './runtime/invariants';

export {
    invariant,
    assertNever,
    assertDefined,
    assertNonEmpty,
} from './runtime/assert';

// Circuit Breaker
export {
    withTimeout,
    withRetry,
    CircuitBreaker,
    firestoreCircuit,
    FIRESTORE_TIMEOUT_MS,
} from './runtime/circuit';

// Security
export {
    checkCookieSecurity,
    containsSensitiveData,
    sanitizeForLogging,
    verifyProductionLock,
    generateSecurityReport,
} from './runtime/security';

// Error Normalization
export {
    ErrorCodes,
    normalizeError,
    isRetryable,
    detectErrorCode,
    getErrorHint,
} from './errors/normalize';

export type {
    ErrorCode,
    ApiErrorPayload,
    ErrorContext,
} from './errors/normalize';

// Logging
export {
    log,
    debug,
    info,
    warn,
    error,
    logRequest,
} from './logging/logger';

export type {
    LogLevel,
    LogScope,
    LogEntry,
    StructuredLog,
} from './logging/logger';

// Tracing
export {
    TRACE_ID_HEADER,
    generateTraceId,
    getTraceId,
    getTraceIdFromRequest,
    createTraceContext,
    withAuthMode,
    injectTraceIdHeader,
} from './logging/trace';

export type {
    TraceContext,
} from './logging/trace';
