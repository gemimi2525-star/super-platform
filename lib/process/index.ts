/**
 * lib/process/index.ts
 * 
 * Public exports for Process module
 */

// Types
export type {
    ProcessState,
    ProcessDescriptor,
    SpawnOptions,
    ProcessAction,
    ProcessIntent,
    ProcessIntentResult,
    IPCMessage,
    IPCMessageType,
    ProcessAuditPayload,
} from './types';

export { ProcessError, ProcessException } from './types';

// Dispatcher (Public API)
export {
    dispatchProcessIntent,
    spawnProcess,
    terminateProcess,
    forceQuitProcess,
    suspendProcess,
    resumeProcess,
    listProcesses,
} from './dispatchProcessIntent';

// Manager (Internal - for Verifier only)
export { ProcessManager, getProcessManager } from './ProcessManager';

// Worker Template (For App developers)
export { ProcessWorkerBase, TestProcessWorker } from './ProcessWorkerTemplate';

// React Hook (For UI components)
export { useProcessManager } from './useProcessManager';
