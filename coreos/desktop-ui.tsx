/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NEXUS Shell — Desktop UI (OS-GRADE)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * NEXUS is the Shell Layer of the APICOREDATA Client OS.
 * Provides: Desktop Surface, Dock, Menu Bar, and System Chrome.
 * 
 * Stack: NEXUS Shell → ORBIT Window System → SYNAPSE Kernel
 * 
 * TRUE OS VISUAL LANGUAGE:
 * - B1: True Calm Desktop (NO text, NO CTA - just ambient wallpaper)
 * - B2: Dock-only launcher (NO sidebar)
 * - B3: OS-grade Menu Bar (System + App Context + Actions)
 * - B4: Modern window chrome (rounded, soft shadow, macOS-like)
 * 
 * @module coreos/desktop-ui
 * @version 2.0.0
 * @see /coreos/naming.ts for canonical naming constants
 */

'use client';

import React, { useRef } from 'react';
import {
    useSystemState,
    useOpenCapability,
    useCalmState,
    useWindows,
    useMinimizedWindows,
    useWindowControls,
    useMinimizeAll,
    useStepUp,
    useKernelBootstrap,
    useCognitiveMode,
    useFocusedWindow,
    useDockCapabilities,
    useConnectivity,
} from './react';
import { getCapabilityGraph } from './capability-graph';
import { getWindowManager } from './window-manager';
import type { Window, CapabilityId } from './types';
import { createCorrelationId, IntentFactory } from './types';

// Naming Constants
import {
    SYSTEM_STACK_SHORT,
    SYSTEM_KERNEL_NAME,
    SYSTEM_SHELL_NAME,
    SYSTEM_WINDOW_SYSTEM_NAME,
    SYSTEM_STACK_LABEL,
} from './naming';

// Phase 5: Ops Center UI
import { OpsCenterMVP } from './ui/OpsCenterMVP';
// Phase 18: Utility Tools Window
import { UtilityToolsWindow } from '@/components/UtilityToolsWindow';
// Phase 19: Permission Window
import { PermissionWindow } from '@/components/PermissionWindow';
// Phase 20: Settings Permission Panel
import { SettingsPermissionPanel } from '@/components/SettingsPermissionPanel';
// Phase 23A: System Status Tray
import { SystemStatusTray } from '@/components/SystemStatusTray';
// Phase 23B: Conflict Resolution Window
import { ConflictResolutionWindow } from '@/components/ConflictResolutionWindow';
import { AppStoreWindow } from '@/components/AppStoreWindow'; // Phase 24B

// ═══════════════════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════════════════

const tokens = {
    menubarHeight: 28,
    dockHeight: 72,
    dockPadding: 8,
    windowRadius: 12,
    windowShadow: '0 24px 80px rgba(0,0,0,0.35), 0 4px 16px rgba(0,0,0,0.15)',
    windowShadowUnfocused: '0 12px 40px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.1)',
    titlebarHeight: 32,
    dockItemSize: 52,
    dockRadius: 16,
    dockBackground: 'rgba(255,255,255,0.2)',
    dockBorder: 'rgba(255,255,255,0.3)',
    menubarBackground: 'rgba(30,30,30,0.85)',
    menubarText: 'rgba(255,255,255,0.95)',
    windowBackground: '#ffffff',
    titlebarBackground: 'linear-gradient(180deg, #f6f6f6 0%, #e8e8e8 100%)',
    titlebarBackgroundUnfocused: '#f0f0f0',
};

// ═══════════════════════════════════════════════════════════════════════════
// SETTINGS → ABOUT CONTENT (System Stack Display)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Settings → About content with System Stack display
 * Uses naming constants from coreos/naming.ts (imported at top)
 */
function SettingsAboutContent({ window }: { window: Window }) {
    const stackRows = [
        { layer: 'Shell Layer', name: SYSTEM_SHELL_NAME, desc: 'Desktop, Dock, Menu Bar' },
        { layer: 'Window System', name: SYSTEM_WINDOW_SYSTEM_NAME, desc: 'Window Manager, Chrome' },
        { layer: 'Kernel', name: SYSTEM_KERNEL_NAME, desc: 'Governance, Policy, Security' },
    ];

    return (
        <>
            <h3 style={{ margin: '0 0 16px', fontWeight: 500, fontSize: 18 }}>
                About This System
            </h3>

            {/* Version Info */}
            <p style={{ margin: '0 0 20px', color: '#666', fontSize: 14 }}>
                APICOREDATA Client OS — Phase 7.1
            </p>

            {/* System Stack Section */}
            <div style={{ marginBottom: 24 }}>
                <div style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#888',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: 12,
                }}>
                    Architecture Stack
                </div>

                {/* Stack Table */}
                <div style={{
                    background: '#f8f8f8',
                    borderRadius: 8,
                    overflow: 'hidden',
                    border: '1px solid #e8e8e8',
                }}>
                    {stackRows.map((row, i) => (
                        <div
                            key={row.name}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '12px 16px',
                                borderBottom: i < stackRows.length - 1 ? '1px solid #e8e8e8' : 'none',
                            }}
                        >
                            <div style={{ width: 120, fontSize: 12, color: '#888' }}>
                                {row.layer}
                            </div>
                            <div style={{
                                width: 90,
                                fontWeight: 600,
                                fontSize: 13,
                                fontFamily: 'SF Mono, Monaco, monospace',
                                color: '#333',
                            }}>
                                {row.name}
                            </div>
                            <div style={{ flex: 1, fontSize: 12, color: '#666' }}>
                                {row.desc}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Full Stack Label */}
                <div style={{
                    marginTop: 12,
                    padding: '8px 12px',
                    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                    borderRadius: 6,
                    color: 'rgba(255,255,255,0.9)',
                    fontSize: 11,
                    fontFamily: 'SF Mono, Monaco, monospace',
                    textAlign: 'center',
                    letterSpacing: '0.3px',
                }}>
                    {SYSTEM_STACK_LABEL}
                </div>
            </div>

            {/* Window Debug Info */}
            <div style={{
                padding: 12,
                background: '#f5f5f5',
                borderRadius: 8,
                fontSize: 12,
                fontFamily: 'SF Mono, Monaco, monospace',
            }}>
                <div>Capability: {window.capabilityId}</div>
                <div>State: {window.state}</div>
                <div>Z-Index: {window.zIndex}</div>
                <div>Position: ({window.x}, {window.y})</div>
                <div>Size: {window.width} × {window.height}</div>
            </div>
        </>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// B3: MENU BAR (OS-GRADE)
// ═══════════════════════════════════════════════════════════════════════════

function MenuBar() {
    const cognitiveMode = useCognitiveMode();
    const focusedWindow = useFocusedWindow();
    const calmState = useCalmState();
    const minimizeAll = useMinimizeAll();
    const state = useSystemState();

    // Get current time
    const [time, setTime] = React.useState(new Date());
    React.useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                height: tokens.menubarHeight,
                background: tokens.menubarBackground,
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                color: tokens.menubarText,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 12px',
                fontSize: 13,
                fontWeight: 500,
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif',
                zIndex: 10000,
                userSelect: 'none',
            }}
        >
            {/* Left: System Layer + App Context */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {/* Apple-like Logo/System Menu */}
                <button
                    onClick={minimizeAll}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'inherit',
                        fontSize: 16,
                        cursor: 'pointer',
                        padding: '0 4px',
                        opacity: 0.9,
                    }}
                    title="Show Desktop"
                >
                    ◈
                </button>

                {/* App Context Layer */}
                <span style={{ fontWeight: 600 }}>
                    {focusedWindow ? focusedWindow.title : 'Finder'}
                </span>

                {/* Fake Menu Items */}
                {focusedWindow && (
                    <div style={{ display: 'flex', gap: 16, opacity: 0.85 }}>
                        <span style={{ cursor: 'default' }}>File</span>
                        <span style={{ cursor: 'default' }}>Edit</span>
                        <span style={{ cursor: 'default' }}>View</span>
                        <span style={{ cursor: 'default' }}>Window</span>
                        <span style={{ cursor: 'default' }}>Help</span>
                    </div>
                )}
            </div>

            {/* Right: System Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {/* Phase 23A: User Status Tray (Offline/Sync) */}
                <SystemStatusTray />

                {/* System Stack Label (NEXUS/ORBIT/SYNAPSE) */}
                <span style={{
                    opacity: 0.5,
                    fontSize: 9,
                    fontFamily: 'SF Mono, Monaco, monospace',
                    letterSpacing: '0.5px',
                }}>
                    {SYSTEM_STACK_SHORT}
                </span>

                {/* Window count indicator */}
                {Object.keys(state.windows).length > 0 && (
                    <span style={{ opacity: 0.7, fontSize: 11 }}>
                        {Object.values(state.windows).filter(w => w.state === 'active').length} window{Object.values(state.windows).filter(w => w.state === 'active').length !== 1 ? 's' : ''}
                    </span>
                )}

                <span style={{ opacity: 0.85 }}>{formatDate(time)}</span>
                <span>{formatTime(time)}</span>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// B4: WINDOW CHROME (MODERN CALM)
// ═══════════════════════════════════════════════════════════════════════════

interface WindowChromeProps {
    window: Window;
    isFocused: boolean;
}

function WindowChrome({ window, isFocused }: WindowChromeProps) {
    const { focus, minimize, close } = useWindowControls(window.id);
    const graph = getCapabilityGraph();
    const icon = graph.getIcon(window.capabilityId);
    const windowManager = getWindowManager();
    const dragRef = useRef<{
        isDragging: boolean;
        startX: number;
        startY: number;
        startWindowX: number;
        startWindowY: number;
    } | null>(null);
    const resizeRef = useRef<{
        isResizing: boolean;
        direction: string;
        startX: number;
        startY: number;
        startWidth: number;
        startHeight: number;
        startWindowX: number;
        startWindowY: number;
    } | null>(null);

    if (window.state === 'minimized') {
        return null;
    }

    // Phase 7.1: Use window state for position/size
    const windowStyle: React.CSSProperties = window.isMaximized
        ? {
            position: 'absolute',
            top: 28,  // Below menu bar
            left: 0,
            right: 0,
            bottom: 60,  // Above dock
            width: 'auto',
            height: 'auto',
            background: tokens.windowBackground,
            borderRadius: 0,
            boxShadow: isFocused ? tokens.windowShadow : tokens.windowShadowUnfocused,
            zIndex: window.zIndex,
            overflow: 'hidden',
            transition: 'box-shadow 0.15s ease',
        }
        : {
            position: 'absolute',
            top: window.y,
            left: window.x,
            width: window.width,
            height: window.height,
            background: tokens.windowBackground,
            borderRadius: tokens.windowRadius,
            boxShadow: isFocused ? tokens.windowShadow : tokens.windowShadowUnfocused,
            zIndex: window.zIndex,
            overflow: 'hidden',
            transition: 'box-shadow 0.15s ease',
        };

    // Drag handlers for title bar
    const handleMouseDown = (e: React.MouseEvent) => {
        if (window.isMaximized) return;  // Can't drag maximized window
        if (!isFocused) focus();
        e.preventDefault();

        dragRef.current = {
            isDragging: true,
            startX: e.clientX,
            startY: e.clientY,
            startWindowX: window.x,
            startWindowY: window.y,
        };

        const correlationId = createCorrelationId();

        const handleMouseMove = (moveEvent: MouseEvent) => {
            if (!dragRef.current?.isDragging) return;

            const deltaX = moveEvent.clientX - dragRef.current.startX;
            const deltaY = moveEvent.clientY - dragRef.current.startY;

            windowManager.moveWindow(
                window.id,
                dragRef.current.startWindowX + deltaX,
                dragRef.current.startWindowY + deltaY,
                correlationId
            );
        };

        const handleMouseUp = () => {
            dragRef.current = null;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    // Resize handlers
    const startResize = (direction: string) => (e: React.MouseEvent) => {
        if (window.isMaximized) return;
        e.preventDefault();
        e.stopPropagation();

        resizeRef.current = {
            isResizing: true,
            direction,
            startX: e.clientX,
            startY: e.clientY,
            startWidth: window.width,
            startHeight: window.height,
            startWindowX: window.x,
            startWindowY: window.y,
        };

        const correlationId = createCorrelationId();

        const handleMouseMove = (moveEvent: MouseEvent) => {
            if (!resizeRef.current?.isResizing) return;

            const deltaX = moveEvent.clientX - resizeRef.current.startX;
            const deltaY = moveEvent.clientY - resizeRef.current.startY;
            const dir = resizeRef.current.direction;

            let newWidth = resizeRef.current.startWidth;
            let newHeight = resizeRef.current.startHeight;
            let newX = resizeRef.current.startWindowX;
            let newY = resizeRef.current.startWindowY;

            // Right edge
            if (dir.includes('e')) {
                newWidth = Math.max(window.minWidth, resizeRef.current.startWidth + deltaX);
            }
            // Left edge
            if (dir.includes('w')) {
                const proposedWidth = resizeRef.current.startWidth - deltaX;
                if (proposedWidth >= window.minWidth) {
                    newWidth = proposedWidth;
                    newX = resizeRef.current.startWindowX + deltaX;
                }
            }
            // Bottom edge
            if (dir.includes('s')) {
                newHeight = Math.max(window.minHeight, resizeRef.current.startHeight + deltaY);
            }
            // Top edge
            if (dir.includes('n')) {
                const proposedHeight = resizeRef.current.startHeight - deltaY;
                if (proposedHeight >= window.minHeight) {
                    newHeight = proposedHeight;
                    newY = resizeRef.current.startWindowY + deltaY;
                }
            }

            // Apply changes
            if (newX !== window.x || newY !== window.y) {
                windowManager.moveWindow(window.id, newX, newY, correlationId);
            }
            if (newWidth !== window.width || newHeight !== window.height) {
                windowManager.resizeWindow(window.id, newWidth, newHeight, correlationId);
            }
        };

        const handleMouseUp = () => {
            resizeRef.current = null;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    // Handle maximize toggle
    const handleMaximize = (e: React.MouseEvent) => {
        e.stopPropagation();
        const correlationId = createCorrelationId();
        windowManager.toggleMaximize(window.id, correlationId);
    };

    // Resize handle styles
    const resizeHandleBase: React.CSSProperties = {
        position: 'absolute',
        zIndex: 1,
    };

    return (
        <div
            style={windowStyle}
            onMouseDown={!isFocused ? focus : undefined}
        >
            {/* Resize Handles (only when not maximized) */}
            {!window.isMaximized && (
                <>
                    {/* Edges */}
                    <div style={{ ...resizeHandleBase, top: 0, left: 8, right: 8, height: 4, cursor: 'n-resize' }} onMouseDown={startResize('n')} />
                    <div style={{ ...resizeHandleBase, bottom: 0, left: 8, right: 8, height: 4, cursor: 's-resize' }} onMouseDown={startResize('s')} />
                    <div style={{ ...resizeHandleBase, left: 0, top: 8, bottom: 8, width: 4, cursor: 'w-resize' }} onMouseDown={startResize('w')} />
                    <div style={{ ...resizeHandleBase, right: 0, top: 8, bottom: 8, width: 4, cursor: 'e-resize' }} onMouseDown={startResize('e')} />
                    {/* Corners */}
                    <div style={{ ...resizeHandleBase, top: 0, left: 0, width: 8, height: 8, cursor: 'nw-resize' }} onMouseDown={startResize('nw')} />
                    <div style={{ ...resizeHandleBase, top: 0, right: 0, width: 8, height: 8, cursor: 'ne-resize' }} onMouseDown={startResize('ne')} />
                    <div style={{ ...resizeHandleBase, bottom: 0, left: 0, width: 8, height: 8, cursor: 'sw-resize' }} onMouseDown={startResize('sw')} />
                    <div style={{ ...resizeHandleBase, bottom: 0, right: 0, width: 8, height: 8, cursor: 'se-resize' }} onMouseDown={startResize('se')} />
                </>
            )}

            {/* Title Bar (draggable) */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: tokens.titlebarHeight,
                    background: isFocused
                        ? tokens.titlebarBackground
                        : tokens.titlebarBackgroundUnfocused,
                    borderBottom: '1px solid rgba(0,0,0,0.08)',
                    padding: '0 12px',
                    gap: 8,
                    cursor: window.isMaximized ? 'default' : 'grab',
                    userSelect: 'none',
                }}
                onMouseDown={handleMouseDown}
            >
                {/* Traffic Light Buttons */}
                <div style={{ display: 'flex', gap: 8 }} onMouseDown={e => e.stopPropagation()}>
                    <button
                        onClick={(e) => { e.stopPropagation(); close(); }}
                        style={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            background: isFocused ? '#FF5F57' : '#ccc',
                            border: isFocused ? '1px solid #E64940' : '1px solid #bbb',
                            cursor: 'pointer',
                            padding: 0,
                        }}
                        title="Close"
                    />
                    <button
                        onClick={(e) => { e.stopPropagation(); minimize(); }}
                        style={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            background: isFocused ? '#FFBD2E' : '#ccc',
                            border: isFocused ? '1px solid #E6A21E' : '1px solid #bbb',
                            cursor: 'pointer',
                            padding: 0,
                        }}
                        title="Minimize"
                    />
                    <button
                        onClick={handleMaximize}
                        style={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            background: isFocused ? '#28C840' : '#ccc',
                            border: isFocused ? '1px solid #1AAB29' : '1px solid #bbb',
                            cursor: 'pointer',
                            padding: 0,
                        }}
                        title={window.isMaximized ? 'Restore' : 'Maximize'}
                    />
                </div>

                {/* Title */}
                <div
                    style={{
                        flex: 1,
                        textAlign: 'center',
                        fontSize: 13,
                        fontWeight: 500,
                        color: isFocused ? '#333' : '#888',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        pointerEvents: 'none',
                    }}
                >
                    <span style={{ marginRight: 6 }}>{icon}</span>
                    {window.title}
                </div>

                {/* Spacer for symmetry */}
                <div style={{ width: 52 }} />
            </div>

            {/* Content */}
            <div style={{
                padding: window.capabilityId === 'ops.center' ? 0 : 24,
                color: '#333',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                height: 'calc(100% - 32px)',
                overflow: 'auto',
            }}>
                {/* Phase 5: Render Ops Center for ops.center capability */}
                {window.capabilityId === 'ops.center' ? (
                    <OpsCenterMVP />
                ) : window.capabilityId === 'core.settings' ? (
                    /* Settings → About + Permissions */
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <SettingsAboutContent window={window} />
                        <div style={{ padding: '0 24px 24px' }}>
                            {/* Phase 20: Permission Panel appended for MVP */}
                            <SettingsPermissionPanel />
                        </div>
                    </div>
                ) : window.capabilityId === 'core.tools' ? (
                    /* Utility Tools: Render Program Switcher */
                    <UtilityToolsWindow window={window} />
                ) : window.capabilityId === 'core.permissions' ? (
                    <>
                        {/* Phase 20: Permission Request Window */}
                        <PermissionWindow window={window} />
                    </>
                ) : window.capabilityId === 'core.store' ? ( // Phase 24B
                    <AppStoreWindow window={window} />
                ) : (
                    <>
                        <h3 style={{ margin: '0 0 16px', fontWeight: 500, fontSize: 18 }}>
                            {window.title}
                        </h3>
                        <p style={{ margin: '0 0 12px', color: '#666', fontSize: 14, lineHeight: 1.5 }}>
                            This window is managed by the Core OS Kernel.
                        </p>
                        <div style={{
                            padding: 12,
                            background: '#f5f5f5',
                            borderRadius: 8,
                            fontSize: 12,
                            fontFamily: 'SF Mono, Monaco, monospace',
                        }}>
                            <div>Capability: {window.capabilityId}</div>
                            <div>State: {window.state}</div>
                            <div>Z-Index: {window.zIndex}</div>
                            <div>Position: ({window.x}, {window.y})</div>
                            <div>Size: {window.width} × {window.height}</div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// B2: DOCK (OS-GRADE LAUNCHER)
// ═══════════════════════════════════════════════════════════════════════════

function Dock() {
    const dockCapabilities = useDockCapabilities();
    const minimizedWindows = useMinimizedWindows();
    const openCapability = useOpenCapability();
    const state = useSystemState();

    // Check if capability has open window
    const hasOpenWindow = (capabilityId: CapabilityId): boolean => {
        return Object.values(state.windows).some(
            w => w.capabilityId === capabilityId
        );
    };

    return (
        <div
            style={{
                position: 'fixed',
                bottom: 8,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                alignItems: 'flex-end',
                gap: 4,
                padding: `${tokens.dockPadding}px ${tokens.dockPadding + 4}px`,
                background: tokens.dockBackground,
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                borderRadius: tokens.dockRadius,
                border: `1px solid ${tokens.dockBorder}`,
                zIndex: 9999,
            }}
        >
            {/* Capability Launchers */}
            {dockCapabilities.map(cap => (
                <DockItem
                    key={cap.id}
                    icon={cap.icon}
                    title={cap.title}
                    onClick={() => openCapability(cap.id)}
                    isRunning={hasOpenWindow(cap.id)}
                />
            ))}

            {/* Separator if there are minimized windows */}
            {minimizedWindows.length > 0 && (
                <div
                    style={{
                        width: 1,
                        height: 40,
                        background: 'rgba(255,255,255,0.3)',
                        margin: '0 4px',
                    }}
                />
            )}

            {/* Minimized Windows */}
            {minimizedWindows.map(window => (
                <MinimizedWindowItem key={window.id} window={window} />
            ))}
        </div>
    );
}

interface DockItemProps {
    icon: string;
    title: string;
    onClick: () => void;
    isRunning?: boolean;
}

function DockItem({ icon, title, onClick, isRunning }: DockItemProps) {
    const [hover, setHover] = React.useState(false);

    return (
        <div style={{ position: 'relative' }}>
            <button
                onClick={onClick}
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
                style={{
                    width: tokens.dockItemSize,
                    height: tokens.dockItemSize,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: hover ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)',
                    border: 'none',
                    borderRadius: 12,
                    cursor: 'pointer',
                    fontSize: 28,
                    transition: 'all 0.15s ease',
                    transform: hover ? 'translateY(-8px) scale(1.1)' : 'none',
                }}
                title={title}
            >
                {icon}
            </button>

            {/* Running indicator */}
            {isRunning && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: -4,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.9)',
                    }}
                />
            )}
        </div>
    );
}

function MinimizedWindowItem({ window }: { window: Window }) {
    const { restore } = useWindowControls(window.id);
    const graph = getCapabilityGraph();
    const icon = graph.getIcon(window.capabilityId);
    const [hover, setHover] = React.useState(false);

    return (
        <button
            onClick={restore}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
                width: tokens.dockItemSize,
                height: tokens.dockItemSize,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: hover ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.25)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: 12,
                cursor: 'pointer',
                fontSize: 20,
                transition: 'all 0.15s ease',
                transform: hover ? 'translateY(-8px) scale(1.1)' : 'none',
            }}
            title={`Restore: ${window.title}`}
        >
            {icon}
        </button>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP-UP MODAL (OS-STYLE)
// ═══════════════════════════════════════════════════════════════════════════

function StepUpModal() {
    const { pending, complete, cancel } = useStepUp();
    const graph = getCapabilityGraph();

    if (!pending) return null;

    const icon = graph.getIcon(pending.capabilityId);
    const title = graph.getTitle(pending.capabilityId);

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 20000,
            }}
        >
            <div
                style={{
                    background: '#fff',
                    padding: 28,
                    borderRadius: 16,
                    maxWidth: 400,
                    boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <span style={{ fontSize: 48 }}>{icon}</span>
                </div>

                <h2 style={{
                    margin: '0 0 8px',
                    fontSize: 18,
                    fontWeight: 600,
                    textAlign: 'center',
                }}>
                    "{title}" wants to make changes
                </h2>

                <p style={{
                    margin: '0 0 24px',
                    color: '#666',
                    fontSize: 14,
                    textAlign: 'center',
                    lineHeight: 1.5,
                }}>
                    {pending.challenge}
                </p>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                    <button
                        onClick={cancel}
                        style={{
                            padding: '10px 24px',
                            background: '#f0f0f0',
                            border: 'none',
                            borderRadius: 8,
                            cursor: 'pointer',
                            fontSize: 14,
                            fontWeight: 500,
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => complete(true)}
                        style={{
                            padding: '10px 24px',
                            background: '#007AFF',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 8,
                            cursor: 'pointer',
                            fontSize: 14,
                            fontWeight: 500,
                        }}
                    >
                        Use Password...
                    </button>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// B1: TRUE CALM DESKTOP (NO TEXT, NO CTA)
// ═══════════════════════════════════════════════════════════════════════════

function CalmDesktop() {
    const windowManager = getWindowManager();

    // Phase 7.1: Click on empty desktop to defocus all windows
    const handleDesktopClick = (e: React.MouseEvent) => {
        // Only trigger on direct click to desktop, not bubbled from windows
        if (e.target === e.currentTarget) {
            const correlationId = createCorrelationId();
            windowManager.defocusAll(correlationId);
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                zIndex: 0,
            }}
            onClick={handleDesktopClick}
        >
            {/* Ambient gradient overlay - no text, no CTA */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.03) 0%, transparent 50%)',
                    pointerEvents: 'none',  // Phase 7.1: Allow click through to parent
                }}
            />
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(ellipse at 70% 80%, rgba(255,255,255,0.02) 0%, transparent 40%)',
                    pointerEvents: 'none',  // Phase 7.1: Allow click through to parent
                }}
            />
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN DESKTOP COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function CoreOSDesktop() {
    const windows = useWindows();
    const bootstrap = useKernelBootstrap();
    const state = useSystemState();
    const focusedWindowId = state.focusedWindowId;

    const [activeConflict, setActiveConflict] = React.useState<any | undefined>(undefined); // Phase 23B: SyncConflict

    // Phase 22 & 23A: Initialize Background Worker & Bridge
    React.useEffect(() => {
        // Dynamic import to avoid SSR/Initial load issues
        const { workerBridge } = require('@/coreos/workers/bridge');
        workerBridge.init(); // Idempotent

        // Phase 23A & 23B: State Subscription
        const unsubscribe = workerBridge.subscribe((state: any) => {
            setActiveConflict(state.activeConflict);
        });

        return () => {
            unsubscribe();
            // workerBridge.terminate();
        };
    }, []);

    // Bootstrap on mount if not authenticated
    React.useEffect(() => {
        if (!state.security.authenticated) {
            bootstrap('admin@apicoredata.com', 'owner', [
                'users.read',
                'users.write',
                'orgs.read',
                'audit.view',
                'settings.read',
                'system.admin',
            ]);
        }
    }, [state.security.authenticated, bootstrap]);

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            overflow: 'hidden',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
        }}>
            {/* B1: Calm Desktop Background — NO TEXT */}
            <CalmDesktop />

            {/* B3: Menu Bar */}
            <MenuBar />

            {/* Windows Layer */}
            <div style={{
                position: 'absolute',
                inset: 0,
                paddingTop: tokens.menubarHeight,
                paddingBottom: tokens.dockHeight + 20,
            }}>
                {/* Phase 6.3.8 / 7.1: Window Renderer */}
                {windows.map(window => (
                    <WindowChrome
                        key={window.id}
                        window={window}
                        isFocused={window.id === focusedWindowId}
                    />
                ))}
            </div>

            {/* B2: Dock — NO SIDEBAR */}
            <Dock />

            {/* Step-up Modal */}
            <StepUpModal />

            {/* Phase 23B: Conflict Resolution Window (Global Modal) */}
            {activeConflict && (
                <ConflictResolutionWindow conflict={activeConflict} />
            )}
        </div>
    );
}

export default CoreOSDesktop;
