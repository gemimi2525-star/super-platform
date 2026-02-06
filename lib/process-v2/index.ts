/**
 * Phase 15B.2: Process v2 Module Exports
 */

// Types
export type {
    ProcessStateV2,
    ProcessDescriptorV2,
    ProcessPriority,
    ProcessActionV2,
    ProcessIntentV2,
    ProcessIntentResultV2,
    SuspendOptions,
    ResumeOptions,
    PriorityOptions,
    SpawnOptionsV2,
    ProcessAuditPayloadV2,
} from './types';

export { ProcessErrorV2, PRIORITY_LEVELS, canTransition, VALID_TRANSITIONS } from './types';

// Manager
export { ProcessManagerV2, getProcessManagerV2 } from './ProcessManagerV2';

// Dispatcher
export {
    dispatchProcessIntentV2,
    suspendProcess,
    resumeProcess,
    setPriority,
} from './dispatchProcessIntentV2';
