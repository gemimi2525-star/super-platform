/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SYNAPSE Governance — React Hooks
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * React hooks for OS Shell to interact with SYNAPSE kernel.
 * All hooks import from the governance adapter layer only.
 * 
 * @module governance/synapse/hooks
 * @version 1.0.0
 */

'use client';

import { useCallback, useSyncExternalStore } from 'react';
import {
    getKernel,
    getStateStore,
    getCapabilityGraph,
    IntentFactory,
    type Intent,
    type CapabilityId,
} from './synapse-adapter';

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
        .sort((a, b) => b.zIndex - a.zIndex);
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
 */
export function useDockCapabilities(): CapabilityManifest[] {
    const graph = getCapabilityGraph();
    return [...graph.getDockCapabilities()];
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
