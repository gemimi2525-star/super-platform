/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SYNAPSE Governance — React Hooks
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * React hooks for OS Shell to interact with SYNAPSE kernel.
 * All hooks import from the governance adapter layer only.
 * 
 * Phase 9: Added single-instance enforcement and enhanced persona gating.
 * Phase 9.1: Hardened single-instance semantics (restore+focus for hidden/minimized).
 * 
 * @module governance/synapse/hooks
 * @version 2.1.0 (Phase 9.1)
 */

'use client';

import { useCallback, useSyncExternalStore, useMemo } from 'react';
import {
    getKernel,
    getStateStore,
    getCapabilityGraph,
    getWindowManager,
    IntentFactory,
    createCorrelationId,
    type Intent,
    type CapabilityId,
} from './synapse-adapter';
import {
    APP_MANIFESTS,
    roleHasAccess,
    isSingleInstance,
    type UserRole,
} from '@/components/os-shell/apps/manifest';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface Window {
    id: string;
    capabilityId: CapabilityId;
    title: string;
    state: 'active' | 'minimized' | 'hidden';
    zIndex: number;
    spaceId?: string;

    // Phase 13: Position & Size (for drag/resize)
    x: number;
    y: number;
    width: number;
    height: number;
    minWidth: number;
    minHeight: number;
    isMaximized: boolean;
}

export interface SystemState {
    windows: Record<string, Window>;
    focusedWindowId: string | null;
    cognitiveMode: string;
    security: {
        authenticated: boolean;
        userId: string | null;
        role: string | null;
    };
    pendingStepUp: {
        capabilityId: CapabilityId;
        challenge: string;
    } | null;
}

export interface CapabilityManifest {
    id: CapabilityId;
    title: string;
    icon: string;
    showInDock: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// CORE HOOKS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Hook to access the full system state
 */
export function useSystemState(): SystemState {
    const store = getStateStore();

    return useSyncExternalStore(
        store.subscribe.bind(store),
        store.getState.bind(store),
        store.getState.bind(store)
    );
}

/**
 * Hook to open a capability (launch app)
 */
export function useOpenCapability() {
    const kernel = getKernel();

    return useCallback((capabilityId: CapabilityId) => {
        kernel.emit(IntentFactory.openCapability(capabilityId));
    }, []);
}

/**
 * Hook to get windows in z-order (highest first)
 */
export function useWindows(): Window[] {
    const state = useSystemState();
    return Object.values(state.windows)
        .filter(w => w.state === 'active')
        .sort((a, b) => b.zIndex - a.zIndex)
        .map(w => ({
            id: w.id,
            capabilityId: w.capabilityId,
            title: w.title,
            state: w.state,
            zIndex: w.zIndex,
            spaceId: w.spaceId,
            // Phase 13: Position & Size
            x: (w as any).x ?? 120,
            y: (w as any).y ?? 80,
            width: (w as any).width ?? 600,
            height: (w as any).height ?? 480,
            minWidth: (w as any).minWidth ?? 400,
            minHeight: (w as any).minHeight ?? 300,
            isMaximized: (w as any).isMaximized ?? false,
        }));
}

/**
 * Hook to get minimized windows (for dock)
 */
export function useMinimizedWindows(): Window[] {
    const state = useSystemState();
    return Object.values(state.windows)
        .filter(w => w.state === 'minimized');
}

/**
 * Hook to get the focused window
 */
export function useFocusedWindow(): Window | null {
    const state = useSystemState();
    if (!state.focusedWindowId) return null;
    return state.windows[state.focusedWindowId] || null;
}

/**
 * Hook for window controls (focus, minimize, close, restore)
 */
export function useWindowControls(windowId: string) {
    const kernel = getKernel();

    const focus = useCallback(() => {
        kernel.emit(IntentFactory.focusWindow(windowId));
    }, [windowId]);

    const minimize = useCallback(() => {
        kernel.emit(IntentFactory.minimizeWindow(windowId));
    }, [windowId]);

    const close = useCallback(() => {
        kernel.emit(IntentFactory.closeWindow(windowId));
    }, [windowId]);

    const restore = useCallback(() => {
        kernel.emit(IntentFactory.restoreWindow(windowId));
    }, [windowId]);

    return { focus, minimize, close, restore };
}

/**
 * Hook for window drag/resize/maximize interactions (Phase 13)
 */
export function useWindowInteraction(windowId: string) {
    const wm = getWindowManager();

    const move = useCallback((x: number, y: number) => {
        wm.moveWindow(windowId, x, y, createCorrelationId());
    }, [windowId]);

    const resize = useCallback((w: number, h: number) => {
        wm.resizeWindow(windowId, w, h, createCorrelationId());
    }, [windowId]);

    const toggleMaximize = useCallback(() => {
        wm.toggleMaximize(windowId, createCorrelationId());
    }, [windowId]);

    return { move, resize, toggleMaximize };
}

/**
 * Hook for minimize all (return to desktop)
 */
export function useMinimizeAll() {
    const kernel = getKernel();

    return useCallback(() => {
        kernel.emit(IntentFactory.minimizeAll());
    }, []);
}

/**
 * Hook for step-up handling (authentication prompts)
 */
export function useStepUp() {
    const state = useSystemState();
    const kernel = getKernel();

    const complete = useCallback((success: boolean) => {
        kernel.emit(IntentFactory.stepUpComplete(success));
    }, []);

    const cancel = useCallback(() => {
        kernel.emit(IntentFactory.stepUpCancel());
    }, []);

    return {
        pending: state.pendingStepUp,
        complete,
        cancel,
    };
}

/**
 * Hook for kernel bootstrap (initial authentication)
 */
export function useKernelBootstrap() {
    const kernel = getKernel();

    return useCallback((
        userId: string,
        role: 'user' | 'admin' | 'owner',
        policies: string[]
    ) => {
        kernel.bootstrap(userId, role, policies);
    }, []);
}

/**
 * Hook to get dock capabilities (for launcher)
 * Phase 9: Enhanced with persona gating via shell manifests
 */
export function useDockCapabilities(): CapabilityManifest[] {
    const graph = getCapabilityGraph();
    const security = useSecurityContext();
    const userRole = (security.role || 'guest') as UserRole;

    // Get manifests from SYNAPSE capability graph
    const synapseManifests = [...graph.getDockCapabilities()];

    // Filter by shell manifest persona requirements
    return synapseManifests.filter(m => {
        const shellManifest = APP_MANIFESTS[m.id];
        // If no shell manifest exists, use SYNAPSE manifest's showInDock
        if (!shellManifest) return true;
        // Check persona gate
        return roleHasAccess(userRole, shellManifest.requiredRole);
    });
}

/**
 * Hook to get cognitive mode
 */
export function useCognitiveMode() {
    const state = useSystemState();
    return state.cognitiveMode;
}

/**
 * Hook to get security context
 */
export function useSecurityContext() {
    const state = useSystemState();
    return state.security;
}

/**
 * Hook to check if authenticated
 */
export function useIsAuthenticated() {
    const state = useSystemState();
    return state.security.authenticated;
}

/**
 * Hook to check calm state (no windows active)
 */
export function useCalmState() {
    const windows = useWindows();
    return windows.length === 0;
}

/**
 * Hook to get capability icon and title
 */
export function useCapabilityInfo(capabilityId: CapabilityId) {
    const graph = getCapabilityGraph();
    return {
        icon: graph.getIcon(capabilityId),
        title: graph.getTitle(capabilityId),
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 9: SINGLE-INSTANCE HOOKS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Hook to find existing window for a capability
 * Returns the window ID if found, null otherwise
 */
export function useExistingWindow(capabilityId: CapabilityId): string | null {
    const state = useSystemState();

    const existingWindow = useMemo(() => {
        return Object.values(state.windows).find(
            w => w.capabilityId === capabilityId && w.state !== 'hidden'
        );
    }, [state.windows, capabilityId]);

    return existingWindow?.id ?? null;
}

/**
 * Hook to open capability with single-instance support.
 * If app is single-instance and already open, focuses existing window instead.
 * 
 * Phase 9.1: Deterministic state handling:
 * - minimized/hidden → restoreWindow then focusWindow
 * - active → focusWindow only
 * 
 * @returns Function to open capability with single-instance awareness
 */
export function useSingleInstanceOpen() {
    const kernel = getKernel();
    const state = useSystemState();

    return useCallback((capabilityId: CapabilityId) => {
        // Check if this app enforces single instance
        const singleInstance = isSingleInstance(capabilityId);

        if (singleInstance) {
            // Look for existing window (any state except truly destroyed)
            const existing = Object.values(state.windows).find(
                w => w.capabilityId === capabilityId
            );

            if (existing) {
                // Deterministic handling based on state
                if (existing.state === 'minimized' || existing.state === 'hidden') {
                    // Restore first, then focus
                    kernel.emit(IntentFactory.restoreWindow(existing.id));
                    // Focus after restore (kernel handles sequencing)
                    kernel.emit(IntentFactory.focusWindow(existing.id));
                } else {
                    // Active window - just focus
                    kernel.emit(IntentFactory.focusWindow(existing.id));
                }
                return;
            }
        }

        // No existing window or not single-instance - open new
        kernel.emit(IntentFactory.openCapability(capabilityId));
    }, [state.windows]);
}

/**
 * Hook to check if app can be launched (persona check)
 */
export function useCanLaunchApp(capabilityId: CapabilityId): boolean {
    const security = useSecurityContext();
    const userRole = (security.role || 'guest') as UserRole;

    const shellManifest = APP_MANIFESTS[capabilityId];
    if (!shellManifest) return true; // Default: allow if no manifest

    return roleHasAccess(userRole, shellManifest.requiredRole);
}
