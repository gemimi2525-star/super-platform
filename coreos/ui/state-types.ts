/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PHASE 12.5 — UI State Taxonomy
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Clear state type system to distinguish between:
 * - EMPTY: No data yet
 * - CALM: System operating normally, no data is expected
 * - ERROR: Actual system failure
 * - LOCKED: Access restricted
 * - LOADING: Data being fetched
 * 
 * @module coreos/ui/state-types
 * @version 1.0.0
 */

// ═══════════════════════════════════════════════════════════════════════════
// STATE TYPE ENUM
// ═══════════════════════════════════════════════════════════════════════════

export type UIStateType = 'EMPTY' | 'CALM' | 'ERROR' | 'LOCKED' | 'LOADING';

// ═══════════════════════════════════════════════════════════════════════════
// STATE INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * CALM State — System is operating normally
 * Used when: No incidents, no alerts, system healthy
 * Visual: Green checkmark, positive messaging
 */
export interface CalmState {
    type: 'CALM';
    message: string;  // e.g., "System operating normally"
    icon?: string;    // Default: ✅
    subtitle?: string;
}

/**
 * EMPTY State — No data available yet
 * Used when: New system, no activity yet, fresh start
 * Visual: Neutral icon, explanatory messaging
 */
export interface EmptyState {
    type: 'EMPTY';
    message: string;  // e.g., "No activity recorded yet"
    icon?: string;    // Default: 📭
    subtitle?: string;
}

/**
 * ERROR State — Actual system failure
 * Used when: API errors, network failures, unexpected exceptions
 * Visual: Red X, error details
 */
export interface ErrorState {
    type: 'ERROR';
    message: string;
    error?: Error;
    retryable?: boolean;
}

/**
 * LOCKED State — Access restricted
 * Used when: Insufficient permissions, authentication required
 * Visual: Lock icon, permission explanation
 */
export interface LockedState {
    type: 'LOCKED';
    message: string;  // e.g., "Admin access required"
    icon?: string;    // Default: 🔒
    requiredRole?: string;
}

/**
 * LOADING State — Data being fetched
 * Used when: API calls in progress
 * Visual: Spinner, progress indicator
 */
export interface LoadingState {
    type: 'LOADING';
    message?: string;  // Default: "Loading..."
}

// ═══════════════════════════════════════════════════════════════════════════
// UNION TYPE
// ═══════════════════════════════════════════════════════════════════════════

export type UIState = CalmState | EmptyState | ErrorState | LockedState | LoadingState;

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a CALM state
 */
export function createCalmState(message: string, subtitle?: string): CalmState {
    return {
        type: 'CALM',
        message,
        icon: '✅',
        subtitle,
    };
}

/**
 * Create an EMPTY state
 */
export function createEmptyState(message: string, subtitle?: string): EmptyState {
    return {
        type: 'EMPTY',
        message,
        icon: '📭',
        subtitle,
    };
}

/**
 * Create an ERROR state
 */
export function createErrorState(message: string, error?: Error, retryable = false): ErrorState {
    return {
        type: 'ERROR',
        message,
        error,
        retryable,
    };
}

/**
 * Create a LOCKED state
 */
export function createLockedState(message: string, requiredRole?: string): LockedState {
    return {
        type: 'LOCKED',
        message,
        icon: '🔒',
        requiredRole,
    };
}

/**
 * Create a LOADING state
 */
export function createLoadingState(message = 'Loading...'): LoadingState {
    return {
        type: 'LOADING',
        message,
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// COMMON STATE MESSAGES (Reusable)
// ═══════════════════════════════════════════════════════════════════════════

export const CALM_MESSAGES = {
    NO_INCIDENTS: createCalmState(
        'System Calm',
        'No security incidents or warnings detected'
    ),
    NO_ALERTS: createCalmState(
        'No Active Alerts',
        'All systems operating normally'
    ),
    NO_ERRORS: createCalmState(
        'System Healthy',
        'All endpoints responding correctly'
    ),
    NO_ACTIVITY: createCalmState(
        'System Quiet',
        'No recent activity to report'
    ),
} as const;

export const EMPTY_MESSAGES = {
    NO_DATA_YET: createEmptyState(
        'No Data Yet',
        'Activity will appear here once it occurs'
    ),
    FRESH_START: createEmptyState(
        'Clean State',
        'This is a new environment with no history'
    ),
} as const;
