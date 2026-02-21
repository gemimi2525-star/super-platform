/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS KERNEL — React Adapter (HARDENED)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * @module coreos/react
 * @version 2.0.0 (Hardened)
 */

'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import {
    getKernel,
    getStateStore,
    getEventBus,
    getCapabilityGraph,
    getCurrentCalmState,
    IntentFactory,
    type SystemState,
    type SystemEvent,
    type CapabilityId,
    type Window,
    type CapabilityManifest,
    roleHasAccess,
} from './index';

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
 * Hook to open a capability
 */
export function useOpenCapability() {
    const kernel = getKernel();

    return useCallback((capabilityId: CapabilityId) => {
        kernel.emit(IntentFactory.openCapability(capabilityId));
    }, []);
}

/**
 * Hook to check calm state
 */
export function useCalmState() {
    const state = useSystemState();
    return getCurrentCalmState();
}

/**
 * Hook to get windows in z-order (highest first)
 * Phase 20: Filtered by activeSpaceId — only shows windows in current space
 */
export function useWindows(): Window[] {
    const state = useSystemState();
    return Object.values(state.windows)
        .filter(w => w.state === 'active' && w.spaceId === state.activeSpaceId)
        .sort((a, b) => b.zIndex - a.zIndex);
}

/**
 * Hook to get minimized windows (for dock)
 * Phase 20: Filtered by activeSpaceId
 */
export function useMinimizedWindows(): Window[] {
    const state = useSystemState();
    return Object.values(state.windows)
        .filter(w => w.state === 'minimized' && w.spaceId === state.activeSpaceId);
}

/**
 * Hook to get active space ID (Phase 20)
 */
export function useActiveSpaceId() {
    const state = useSystemState();
    return state.activeSpaceId;
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
 * Hook for window controls
 * Phase 7.1: Extended with move, resize, maximize, and position controls
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

    // Phase 7.1: Move window to new position (via WindowManager directly)
    const move = useCallback((x: number, y: number) => {
        const { createCorrelationId } = require('./types');
        const { getWindowManager } = require('./window-manager');
        getWindowManager().moveWindow(windowId, x, y, createCorrelationId());
    }, [windowId]);

    // Phase 7.1: Resize window (via WindowManager directly)
    const resize = useCallback((width: number, height: number) => {
        const { createCorrelationId } = require('./types');
        const { getWindowManager } = require('./window-manager');
        getWindowManager().resizeWindow(windowId, width, height, createCorrelationId());
    }, [windowId]);

    // Phase 7.1: Maximize window (via WindowManager directly)
    const maximize = useCallback(() => {
        const { createCorrelationId } = require('./types');
        const { getWindowManager } = require('./window-manager');
        getWindowManager().maximizeWindow(windowId, createCorrelationId());
    }, [windowId]);

    // Phase 7.1: Unmaximize (restore from maximized, via WindowManager directly)
    const unmaximize = useCallback(() => {
        const { createCorrelationId } = require('./types');
        const { getWindowManager } = require('./window-manager');
        getWindowManager().unmaximizeWindow(windowId, createCorrelationId());
    }, [windowId]);

    // Phase 7.1: Toggle maximize state (via WindowManager directly)
    const toggleMaximize = useCallback(() => {
        const { createCorrelationId } = require('./types');
        const { getWindowManager } = require('./window-manager');
        getWindowManager().toggleMaximize(windowId, createCorrelationId());
    }, [windowId]);

    return { focus, minimize, close, restore, move, resize, maximize, unmaximize, toggleMaximize };
}

/**
 * Phase 7.1: Hook for defocusing all windows (clicking empty desktop)
 */
export function useDefocusAll() {
    return useCallback(() => {
        const { createCorrelationId } = require('./types');
        const { getWindowManager } = require('./window-manager');
        getWindowManager().defocusAll(createCorrelationId());
    }, []);
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
 * Hook for step-up handling
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
 * Hook for kernel bootstrap
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
 * Phase 7.3: Filters by user role (persona gates)
 */
export function useDockCapabilities(): CapabilityManifest[] {
    const graph = getCapabilityGraph();
    const state = useSystemState();
    const userRole = state.security.role;

    // Filter by requiredRole (undefined = visible to all)
    return [...graph.getDockCapabilities()].filter(cap => {
        if (!cap.requiredRole) return true;
        return roleHasAccess(userRole, cap.requiredRole);
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

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 7.2: CONNECTIVITY HOOKS
// ═══════════════════════════════════════════════════════════════════════════

// (React hooks already imported at top)
import {
    type ConnectivityStatus,
    type ConnectivityState,
    subscribeToConnectivity,
    forceConnectivityCheck,
} from './connectivity';

/**
 * Hook to access connectivity status (Phase 7.2)
 * 
 * @returns { status, lastChangeAt, forceCheck }
 * 
 * @example
 * const { status, forceCheck } = useConnectivity();
 * if (status === 'OFFLINE') {
 *     return <OfflineBanner onRetry={forceCheck} />;
 * }
 */
export function useConnectivity() {
    const [state, setState] = useState<ConnectivityState>({
        status: 'ONLINE',
        lastChangeAt: Date.now(),
        lastCheckAt: Date.now(),
        consecutiveFailures: 0,
    });

    useEffect(() => {
        const unsubscribe = subscribeToConnectivity(setState);
        return unsubscribe;
    }, []);

    const forceCheck = useCallback(async () => {
        return await forceConnectivityCheck();
    }, []);

    return {
        status: state.status,
        lastChangeAt: state.lastChangeAt,
        lastCheckAt: state.lastCheckAt,
        isOnline: state.status === 'ONLINE',
        isOffline: state.status === 'OFFLINE',
        isDegraded: state.status === 'DEGRADED',
        forceCheck,
    };
}

