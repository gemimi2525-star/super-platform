/**
 * ═══════════════════════════════════════════════════════════════════════════
 * APICOREDATA OS — Responsive Hooks
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * React hooks for responsive behavior
 * 
 * @version 1.0.0
 * @date 2026-01-29
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    osBreakpoints,
    osLayoutRules,
    getDeviceType,
    isMobile,
    isTablet,
    isDesktop,
    type DeviceType,
} from './breakpoints';

// ═══════════════════════════════════════════════════════════════════════════
// useDeviceType Hook
// ═══════════════════════════════════════════════════════════════════════════

export function useDeviceType(): DeviceType {
    const [deviceType, setDeviceType] = useState<DeviceType>('desktop');

    useEffect(() => {
        const updateDeviceType = () => {
            setDeviceType(getDeviceType(window.innerWidth));
        };

        // Set initial value
        updateDeviceType();

        // Listen for resize
        window.addEventListener('resize', updateDeviceType);
        return () => window.removeEventListener('resize', updateDeviceType);
    }, []);

    return deviceType;
}

// ═══════════════════════════════════════════════════════════════════════════
// useBreakpoint Hook
// ═══════════════════════════════════════════════════════════════════════════

export interface BreakpointState {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    deviceType: DeviceType;
    width: number;
}

export function useBreakpoint(): BreakpointState {
    const [state, setState] = useState<BreakpointState>({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        deviceType: 'desktop',
        width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    });

    useEffect(() => {
        const updateState = () => {
            const width = window.innerWidth;
            setState({
                isMobile: isMobile(width),
                isTablet: isTablet(width),
                isDesktop: isDesktop(width),
                deviceType: getDeviceType(width),
                width,
            });
        };

        // Set initial value
        updateState();

        // Debounced resize handler
        let timeoutId: ReturnType<typeof setTimeout>;
        const handleResize = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(updateState, 100);
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(timeoutId);
        };
    }, []);

    return state;
}

// ═══════════════════════════════════════════════════════════════════════════
// useLayoutRules Hook
// ═══════════════════════════════════════════════════════════════════════════

export function useLayoutRules() {
    const { deviceType } = useBreakpoint();

    const getSidebarRules = useCallback(() => {
        return osLayoutRules.sidebar[deviceType];
    }, [deviceType]);

    const getTopbarRules = useCallback(() => {
        return osLayoutRules.topbar[deviceType];
    }, [deviceType]);

    const getAppSurfaceRules = useCallback(() => {
        return osLayoutRules.appSurface[deviceType];
    }, [deviceType]);

    const getDesktopGridRules = useCallback(() => {
        return osLayoutRules.desktopGrid[deviceType];
    }, [deviceType]);

    const getTouchTargetRules = useCallback(() => {
        return osLayoutRules.touchTarget[deviceType];
    }, [deviceType]);

    return {
        deviceType,
        sidebar: getSidebarRules(),
        topbar: getTopbarRules(),
        appSurface: getAppSurfaceRules(),
        desktopGrid: getDesktopGridRules(),
        touchTarget: getTouchTargetRules(),
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// useMediaQuery Hook
// ═══════════════════════════════════════════════════════════════════════════

export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const media = window.matchMedia(query);

        const updateMatches = () => {
            setMatches(media.matches);
        };

        // Set initial value
        updateMatches();

        // Listen for changes
        media.addEventListener('change', updateMatches);
        return () => media.removeEventListener('change', updateMatches);
    }, [query]);

    return matches;
}

// ═══════════════════════════════════════════════════════════════════════════
// Convenience Hooks
// ═══════════════════════════════════════════════════════════════════════════

export function useIsMobile(): boolean {
    return useMediaQuery(`(max-width: ${osBreakpoints['tablet-portrait'] - 1}px)`);
}

export function useIsTablet(): boolean {
    return useMediaQuery(
        `(min-width: ${osBreakpoints['tablet-portrait']}px) and (max-width: ${osBreakpoints['desktop-sm'] - 1}px)`
    );
}

export function useIsDesktop(): boolean {
    return useMediaQuery(`(min-width: ${osBreakpoints['desktop-sm']}px)`);
}
