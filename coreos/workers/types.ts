/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BACKGROUND WORKERS — Type Definitions
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Defines the contract for Background Workers, Job Queues, and Message Protocol.
 * 
 * @module coreos/workers/types
 */

export type JobType =
    | 'SYNC_FILE'       // Sync a file from VFS to Server
    | 'COMPUTE_HASH'    // Calculate file hash (heavy compute)
    | 'PROCESS_IMAGE'   // Resize/optimize image (heavy compute)
    | 'CLEANUP_TEMP';   // Cleanup temporary files

export type JobStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'RETRYING';

export type JobPriority = 'HIGH' | 'NORMAL' | 'BACKGROUND';

export interface Job<T = any> {
    readonly id: string;
    readonly type: JobType;
    readonly payload: T;
    readonly priority: JobPriority;
    readonly createdAt: number;
    readonly createdBy: string; // userId
    readonly traceId: string;

    // State
    status: JobStatus;
    retryCount: number;
    lastError?: string;
    startedAt?: number;
    completedAt?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// MESSAGING PROTOCOL (Main <-> Worker)
// ═══════════════════════════════════════════════════════════════════════════

export type WorkerMessageType =
    | 'ENQUEUE_JOB'
    | 'CANCEL_JOB'
    | 'PAUSE_WORKER'
    | 'RESUME_WORKER'
    | 'JOB_UPDATE' // Worker -> Main
    | 'WORKER_READY' // Worker -> Main
    | 'WORKER_ERROR' // Worker -> Main
    | 'CONFLICT_DETECTED' // Worker -> Main (Phase 23B)
    | 'RESOLVE_CONFLICT'; // Main -> Worker (Phase 23B)

export interface WorkerMessage<T = any> {
    readonly type: WorkerMessageType;
    readonly payload: T;
    readonly correlationId?: string;
}

export interface JobUpdatePayload {
    jobId: string;
    status: JobStatus;
    result?: any;
    error?: string;
    pendingCount?: number; // Added for Phase 23A
}

// ═══════════════════════════════════════════════════════════════════════════
// UI STATE TYPES (Phase 23A)
// ═══════════════════════════════════════════════════════════════════════════

export type ConnectivityStatus = 'ONLINE' | 'OFFLINE' | 'RECONNECTING';
export type SyncStatus = 'IDLE' | 'SYNCING' | 'PENDING_RETRY' | 'ERROR';

export interface GlobalSyncState {
    connectivity: ConnectivityStatus;
    syncStatus: SyncStatus;
    pendingCount: number;
    lastSyncedAt?: number;
    lastError?: string;
    activeConflict?: SyncConflict; // Added for Phase 23B
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFLICT RESOLUTION TYPES (Phase 23B)
// ═══════════════════════════════════════════════════════════════════════════

export interface SyncConflict {
    id: string;
    fileUri: string;
    localPayload: { updatedAt: number; size: number };
    remotePayload: { updatedAt: number; size: number };
    reason: 'CONCURRENT_EDIT' | 'REMOTE_DELETE' | 'UNKNOWN';
}

export type ResolutionStrategy = 'KEEP_LOCAL' | 'KEEP_REMOTE' | 'DUPLICATE';
