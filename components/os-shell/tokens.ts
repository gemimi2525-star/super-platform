/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OS SHELL — Design Tokens
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * macOS-like design tokens for the OS Shell.
 * 
 * @module components/os-shell/tokens
 * @version 1.0.0
 */

export const tokens = {
    // Layout
    menubarHeight: 28,
    dockHeight: 72,
    dockPadding: 8,
    dockItemSize: 52,
    dockRadius: 16,
    titlebarHeight: 32,
    windowRadius: 12,

    // Colors - Dock
    dockBackground: 'rgba(255,255,255,0.2)',
    dockBorder: 'rgba(255,255,255,0.3)',

    // Colors - Menu Bar
    menubarBackground: 'rgba(30,30,30,0.85)',
    menubarText: 'rgba(255,255,255,0.95)',

    // Colors - Window
    windowBackground: '#ffffff',
    windowShadow: '0 24px 80px rgba(0,0,0,0.35), 0 4px 16px rgba(0,0,0,0.15)',
    windowShadowUnfocused: '0 12px 40px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.1)',
    titlebarBackground: 'linear-gradient(180deg, #f6f6f6 0%, #e8e8e8 100%)',
    titlebarBackgroundUnfocused: '#f0f0f0',

    // Traffic Lights
    trafficClose: '#FF5F57',
    trafficCloseBorder: '#E64940',
    trafficMinimize: '#FFBD2E',
    trafficMinimizeBorder: '#E6A21E',
    trafficMaximize: '#28C840',
    trafficMaximizeBorder: '#1AAB29',
    trafficInactive: '#ccc',
    trafficInactiveBorder: '#bbb',

    // Typography
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif',
    fontMono: 'SF Mono, Monaco, monospace',
};
