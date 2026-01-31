/**
 * OS Shell Components
 * 
 * macOS-like desktop environment using governance adapter.
 */

export { OSShell } from './OSShell';
export { TopBar } from './TopBar';
export { DockBar } from './DockBar';
export { WindowChrome } from './WindowChrome';
export { CalmDesktop } from './CalmDesktop';
export { StepUpModal } from './StepUpModal';
export { SystemLogPanel } from './SystemLogPanel';
export { tokens } from './tokens';

// Persistence
export {
    loadSnapshot,
    saveSnapshot,
    debouncedSave,
    clearSnapshot,
    sanitizeSnapshot,
    serializeSnapshot,
    deserializeSnapshot,
    clampBounds,
    type ShellSnapshot,
    type WindowSnapshot,
} from './shell-persistence';

// Restore
export { restoreFromSnapshot, restoreFromSnapshotSync } from './restore-flow';

// System Log
export {
    addDecisionLog,
    getDecisionLog,
    clearDecisionLog,
    subscribeToLog,
    type DecisionLogEntry,
} from './system-log';

