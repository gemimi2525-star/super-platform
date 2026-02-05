/**
 * User Intent Event Types
 * 
 * Phase 14.1: User Intent Event Pipeline
 * 
 * Defines event shapes for OS shell user actions.
 * These events are emitted from client and persisted as audit entries.
 * 
 * Naming Convention:
 * - os.app.open - User opens an application
 * - os.app.close - User closes an application
 * - os.window.focus - User focuses a window
 * - os.window.move - User moves/resizes a window
 * - os.view.switch - User switches tabs/views
 */

/**
 * Intent action types for OS shell user interactions
 */
export type IntentAction =
    | 'os.app.open'
    | 'os.app.close'
    | 'os.window.focus'
    | 'os.window.move'
    | 'os.view.switch';

/**
 * Target information for intent events
 */
export interface IntentTarget {
    appId?: string;        // App identifier (e.g., 'ops-center', 'explorer')
    windowId?: string;     // Window identifier
    viewName?: string;     // View/tab name (e.g., 'Audit Trail', 'Alerts')
}

/**
 * Complete intent event payload
 * 
 * Sent from client to /api/platform/audit-intents
 */
export interface IntentEventPayload {
    action: IntentAction;
    target?: IntentTarget;
    meta?: Record<string, unknown>;  // Additional context (position, size, etc.)
    timestamp?: string;              // ISO timestamp (client-side)
    traceId?: string;                // Optional traceId (generated if missing)
}

/**
 * Intent event response from API
 */
export interface IntentEventResponse {
    id: string;       // Firestore document ID
    traceId: string;  // Generated or provided traceId
}
