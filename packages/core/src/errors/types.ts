/**
 * Error Types & Interfaces
 * Common types for error handling across the application
 */

export interface AppError {
    /** Error name (e.g., TypeError, NetworkError) */
    name: string;

    /** Human-readable error message */
    message: string;

    /** Stack trace (only in development) */
    stack?: string;

    /** HTTP status code if applicable */
    statusCode?: number;

    /** Original error cause */
    cause?: unknown;

    /** When the error occurred */
    timestamp: Date;

    /** Unique error ID for tracking */
    errorId: string;

    /** Next.js error digest if available */
    digest?: string;

    /** Error severity for logging/alerting */
    severity: 'fatal' | 'error' | 'warn' | 'info';

    /** Contextual information */
    context?: {
        route?: string;
        userRole?: string;
        environment?: string;
        [key: string]: unknown;
    };
}

export interface ErrorDisplayProps {
    /** Formatted error object */
    error: AppError;

    /** Whether running in development mode */
    isDevelopment: boolean;

    /** Reset function to retry */
    onReset?: () => void;

    /** Optional custom message */
    customMessage?: string;
}

export type ErrorLevel = 'app' | 'route' | 'component';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
