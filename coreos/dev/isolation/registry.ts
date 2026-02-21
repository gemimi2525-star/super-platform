/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Isolation Registry — Zustand Store (Phase 26)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Tracks per-capability isolation state: lifecycle, permissions,
 * rate counters, throttle count, last activity.
 * Separate from core manifest — never mutates kernel.
 */

import { create } from 'zustand';
import type { CapabilityState, LifecycleAction } from './lifecycle';
import { transition, validActions } from './lifecycle';

export interface IsolatedCapability {
    capabilityId: string;
    state: CapabilityState;
    permissions: string[];
    trustLevel: string;
    throttleCount: number;
    denyCount: number;
    lastActivity: string | null; // ISO
}

interface IsolationRegistryState {
    capabilities: IsolatedCapability[];
    register: (id: string, permissions: string[], trustLevel: string) => boolean;
    unregister: (id: string) => boolean;
    transitionState: (id: string, action: LifecycleAction) => { allowed: boolean; reason?: string };
    incrementThrottle: (id: string) => void;
    incrementDeny: (id: string) => void;
    touchActivity: (id: string) => void;
    getCapability: (id: string) => IsolatedCapability | undefined;
    getValidActions: (id: string) => LifecycleAction[];
    clear: () => void;
}

export const useIsolationRegistry = create<IsolationRegistryState>((set, get) => ({
    capabilities: [],

    register: (id, permissions, trustLevel) => {
        if (get().capabilities.some(c => c.capabilityId === id)) return false;
        set(s => ({
            capabilities: [...s.capabilities, {
                capabilityId: id,
                state: 'INSTALLED' as CapabilityState,
                permissions,
                trustLevel,
                throttleCount: 0,
                denyCount: 0,
                lastActivity: new Date().toISOString(),
            }],
        }));
        return true;
    },

    unregister: (id) => {
        const before = get().capabilities.length;
        set(s => ({
            capabilities: s.capabilities.filter(c => c.capabilityId !== id),
        }));
        return get().capabilities.length < before;
    },

    transitionState: (id, action) => {
        const cap = get().capabilities.find(c => c.capabilityId === id);
        if (!cap) return { allowed: false, reason: `Capability not found: ${id}` };

        const result = transition(cap.state, action);
        if (!result.allowed) return { allowed: false, reason: result.reason };

        set(s => ({
            capabilities: s.capabilities.map(c =>
                c.capabilityId === id
                    ? { ...c, state: result.to!, lastActivity: new Date().toISOString() }
                    : c
            ),
        }));
        return { allowed: true };
    },

    incrementThrottle: (id) => {
        set(s => ({
            capabilities: s.capabilities.map(c =>
                c.capabilityId === id
                    ? { ...c, throttleCount: c.throttleCount + 1, lastActivity: new Date().toISOString() }
                    : c
            ),
        }));
    },

    incrementDeny: (id) => {
        set(s => ({
            capabilities: s.capabilities.map(c =>
                c.capabilityId === id
                    ? { ...c, denyCount: c.denyCount + 1, lastActivity: new Date().toISOString() }
                    : c
            ),
        }));
    },

    touchActivity: (id) => {
        set(s => ({
            capabilities: s.capabilities.map(c =>
                c.capabilityId === id
                    ? { ...c, lastActivity: new Date().toISOString() }
                    : c
            ),
        }));
    },

    getCapability: (id) => get().capabilities.find(c => c.capabilityId === id),

    getValidActions: (id) => {
        const cap = get().capabilities.find(c => c.capabilityId === id);
        if (!cap) return [];
        return validActions(cap.state);
    },

    clear: () => set({ capabilities: [] }),
}));
