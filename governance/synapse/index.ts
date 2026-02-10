/**
 * SYNAPSE Governance Adapter
 * 
 * Single entry point for all SYNAPSE interactions from APICOREDATA.
 * Import from this module, NOT directly from coreos.
 */

export {
    SynapseAdapter,
    synapseAdapter,
    getKernel,
    getStateStore,
    getEventBus,
    getCapabilityGraph,
    validateManifestRegistry,
    getPolicyEngine,
    resetPolicyEngine,
    getWindowManager,
    deriveCognitiveMode,
    explainCognitiveMode,
    resetAll,
    isCalmState,
    IntentFactory,
    createCorrelationId,
    type Intent,
    type CapabilityId,
    type SpaceId,
    type CognitiveMode,
    type SecurityContext,
} from './synapse-adapter';


export {
    mapActionToIntent,
    mapDecisionToBehavior,
    type UIAction,
    type OSBehavior,
} from './intent-mapper';

// React Hooks for OS Shell
export {
    useSystemState,
    useOpenCapability,
    useWindows,
    useMinimizedWindows,
    useFocusedWindow,
    useWindowControls,
    useWindowInteraction,
    useMinimizeAll,
    useStepUp,
    useKernelBootstrap,
    useDockCapabilities,
    useCognitiveMode,
    useSecurityContext,
    useIsAuthenticated,
    useCalmState,
    useCapabilityInfo,
    // Phase 9: Single-instance & Persona
    useExistingWindow,
    useSingleInstanceOpen,
    useCanLaunchApp,
    type Window,
    type SystemState,
    type CapabilityManifest,
} from './hooks';
