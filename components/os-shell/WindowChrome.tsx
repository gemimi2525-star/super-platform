/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OS SHELL — Window Chrome (Phase 13: Interactive)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * macOS-style window with:
 * - Title bar drag to move
 * - Edge/corner resize handles (8 directions)
 * - Double-click title bar to toggle maximize
 * - Traffic light buttons (close, minimize, maximize)
 * - Open/Close/Minimize/Restore animations
 * - NEXUS Design Token consistency
 * 
 * Phase 8: NEXUS Tokens
 * Phase 13: Drag, Resize, Maximize, Animations
 * 
 * @module components/os-shell/WindowChrome
 * @version 4.0.0 (Phase 13)
 */

'use client';

import React, { useCallback, useRef, useState, useEffect } from 'react';
import '@/styles/nexus-tokens.css';
import {
    useWindowControls,
    useWindowInteraction,
    useCapabilityInfo,
    type Window,
} from '@/governance/synapse';
import { AppRenderer } from './apps';
import { useWindowDrag } from './hooks/useWindowDrag';
import { useWindowResize, type ResizeDirection } from './hooks/useWindowResize';

interface WindowChromeProps {
    window: Window;
    isFocused: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// RESIZE HANDLE CONFIG
// ═══════════════════════════════════════════════════════════════════════════

const HANDLE_SIZE = 6; // px — invisible hit area at edges

const RESIZE_HANDLES: {
    direction: ResizeDirection;
    style: React.CSSProperties;
}[] = [
        // Edges
        { direction: 'n', style: { top: -HANDLE_SIZE / 2, left: HANDLE_SIZE, right: HANDLE_SIZE, height: HANDLE_SIZE, cursor: 'ns-resize' } },
        { direction: 'e', style: { top: HANDLE_SIZE, right: -HANDLE_SIZE / 2, bottom: HANDLE_SIZE, width: HANDLE_SIZE, cursor: 'ew-resize' } },
        { direction: 's', style: { bottom: -HANDLE_SIZE / 2, left: HANDLE_SIZE, right: HANDLE_SIZE, height: HANDLE_SIZE, cursor: 'ns-resize' } },
        { direction: 'w', style: { top: HANDLE_SIZE, left: -HANDLE_SIZE / 2, bottom: HANDLE_SIZE, width: HANDLE_SIZE, cursor: 'ew-resize' } },
        // Corners
        { direction: 'nw', style: { top: -HANDLE_SIZE / 2, left: -HANDLE_SIZE / 2, width: HANDLE_SIZE * 2, height: HANDLE_SIZE * 2, cursor: 'nwse-resize' } },
        { direction: 'ne', style: { top: -HANDLE_SIZE / 2, right: -HANDLE_SIZE / 2, width: HANDLE_SIZE * 2, height: HANDLE_SIZE * 2, cursor: 'nesw-resize' } },
        { direction: 'se', style: { bottom: -HANDLE_SIZE / 2, right: -HANDLE_SIZE / 2, width: HANDLE_SIZE * 2, height: HANDLE_SIZE * 2, cursor: 'nwse-resize' } },
        { direction: 'sw', style: { bottom: -HANDLE_SIZE / 2, left: -HANDLE_SIZE / 2, width: HANDLE_SIZE * 2, height: HANDLE_SIZE * 2, cursor: 'nesw-resize' } },
    ];

export function WindowChrome({ window: win, isFocused }: WindowChromeProps) {
    const { focus, minimize, close } = useWindowControls(win.id);
    const { toggleMaximize } = useWindowInteraction(win.id);
    const { icon } = useCapabilityInfo(win.capabilityId);

    // Animation states
    const [animClass, setAnimClass] = useState('nx-animate-open');
    const [isClosing, setIsClosing] = useState(false);
    const [isMinimizing, setIsMinimizing] = useState(false);

    // Drag hook
    const { onTitleBarMouseDown } = useWindowDrag(
        win.id, win.x, win.y, win.isMaximized,
    );

    // Resize hook
    const { onResizeStart } = useWindowResize(
        win.id, win.x, win.y, win.width, win.height,
        win.minWidth, win.minHeight, win.isMaximized,
    );

    // Clear open animation after it plays
    useEffect(() => {
        const t = setTimeout(() => setAnimClass(''), 200);
        return () => clearTimeout(t);
    }, []);

    // Don't render minimized windows
    if (win.state === 'minimized' && !isMinimizing) {
        return null;
    }

    // ─────────────────────────────────────────────────────────────────────
    // Close with animation
    // ─────────────────────────────────────────────────────────────────────
    const handleClose = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setIsClosing(true);
        setAnimClass('nx-animate-close');
        setTimeout(() => {
            close();
        }, 120); // matches --nx-duration-fast
    }, [close]);

    // ─────────────────────────────────────────────────────────────────────
    // Minimize with animation
    // ─────────────────────────────────────────────────────────────────────
    const handleMinimize = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMinimizing(true);
        setAnimClass('nx-animate-minimize');
        setTimeout(() => {
            minimize();
            setIsMinimizing(false);
        }, 180); // matches --nx-duration-normal
    }, [minimize]);

    // ─────────────────────────────────────────────────────────────────────
    // Double-click title bar → toggle maximize
    // ─────────────────────────────────────────────────────────────────────
    const handleTitleBarDoubleClick = useCallback((e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button')) return;
        toggleMaximize();
    }, [toggleMaximize]);

    // ─────────────────────────────────────────────────────────────────────
    // Position & Size from state (not hardcoded!)
    // ─────────────────────────────────────────────────────────────────────
    const windowStyle: React.CSSProperties = win.isMaximized
        ? {
            position: 'absolute',
            top: 'var(--nx-menubar-height)',
            left: 0,
            right: 0,
            bottom: 'calc(var(--nx-dock-height) + 20px)',
            background: 'var(--nx-surface-window)',
            borderRadius: 0,
            boxShadow: 'none',
            zIndex: win.zIndex,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
        }
        : {
            position: 'absolute',
            top: win.y,
            left: win.x,
            width: win.width,
            height: win.height,
            background: 'var(--nx-surface-window)',
            borderRadius: 'var(--nx-window-radius)',
            boxShadow: isFocused
                ? 'var(--nx-shadow-window)'
                : 'var(--nx-shadow-window-unfocused)',
            zIndex: win.zIndex,
            overflow: 'hidden',
            transition: isClosing || isMinimizing
                ? 'none'
                : 'box-shadow var(--nx-duration-fast) var(--nx-ease-out)',
            display: 'flex',
            flexDirection: 'column',
        };

    return (
        <div
            className={animClass}
            style={windowStyle}
            onMouseDown={!isFocused ? focus : undefined}
        >
            {/* Resize Handles (not shown when maximized) */}
            {!win.isMaximized && RESIZE_HANDLES.map(({ direction, style }) => (
                <div
                    key={direction}
                    style={{
                        position: 'absolute',
                        zIndex: 1,
                        ...style,
                    }}
                    onMouseDown={(e) => onResizeStart(direction, e)}
                />
            ))}

            {/* Title Bar (Drag Zone) */}
            <div
                onMouseDown={onTitleBarMouseDown}
                onDoubleClick={handleTitleBarDoubleClick}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: 'var(--nx-titlebar-height)',
                    background: isFocused
                        ? 'var(--nx-surface-titlebar)'
                        : 'var(--nx-surface-titlebar-unfocused)',
                    borderBottom: '1px solid var(--nx-border-divider)',
                    padding: '0 var(--nx-titlebar-padding-x)',
                    gap: 'var(--nx-traffic-gap)',
                    flexShrink: 0,
                    cursor: win.isMaximized ? 'default' : 'grab',
                    userSelect: 'none',
                }}
            >
                {/* Traffic Light Buttons */}
                <div style={{ display: 'flex', gap: 'var(--nx-traffic-gap)' }}>
                    <button
                        onClick={handleClose}
                        style={{
                            width: 'var(--nx-traffic-size)',
                            height: 'var(--nx-traffic-size)',
                            borderRadius: '50%',
                            background: isFocused
                                ? 'var(--nx-traffic-close)'
                                : 'var(--nx-traffic-inactive)',
                            border: `1px solid ${isFocused
                                ? 'var(--nx-traffic-close-border)'
                                : 'var(--nx-traffic-inactive-border)'}`,
                            cursor: 'pointer',
                            padding: 0,
                        }}
                        title="Close"
                    />
                    <button
                        onClick={handleMinimize}
                        style={{
                            width: 'var(--nx-traffic-size)',
                            height: 'var(--nx-traffic-size)',
                            borderRadius: '50%',
                            background: isFocused
                                ? 'var(--nx-traffic-minimize)'
                                : 'var(--nx-traffic-inactive)',
                            border: `1px solid ${isFocused
                                ? 'var(--nx-traffic-minimize-border)'
                                : 'var(--nx-traffic-inactive-border)'}`,
                            cursor: 'pointer',
                            padding: 0,
                        }}
                        title="Minimize"
                    />
                    <button
                        onClick={(e) => { e.stopPropagation(); toggleMaximize(); }}
                        style={{
                            width: 'var(--nx-traffic-size)',
                            height: 'var(--nx-traffic-size)',
                            borderRadius: '50%',
                            background: isFocused
                                ? 'var(--nx-traffic-maximize)'
                                : 'var(--nx-traffic-inactive)',
                            border: `1px solid ${isFocused
                                ? 'var(--nx-traffic-maximize-border)'
                                : 'var(--nx-traffic-inactive-border)'}`,
                            cursor: 'pointer',
                            padding: 0,
                        }}
                        title={win.isMaximized ? "Restore" : "Maximize"}
                    />
                </div>

                {/* Title */}
                <div
                    style={{
                        flex: 1,
                        textAlign: 'center',
                        fontSize: 'var(--nx-text-body)',
                        fontWeight: 'var(--nx-weight-medium)',
                        color: isFocused
                            ? 'var(--nx-text-titlebar)'
                            : 'var(--nx-text-titlebar-unfocused)',
                        fontFamily: 'var(--nx-font-system)',
                        pointerEvents: 'none', // Let drag pass through
                    }}
                >
                    <span style={{ marginRight: 'var(--nx-space-2)' }}>{icon}</span>
                    {win.title}
                </div>

                {/* Spacer for symmetry */}
                <div style={{ width: 52 }} />
            </div>

            {/* App Content */}
            <div style={{
                flex: 1,
                overflow: 'auto',
                background: 'var(--nx-surface-window)',
            }}>
                <AppRenderer
                    windowId={win.id}
                    capabilityId={win.capabilityId}
                    isFocused={isFocused}
                />
            </div>
        </div>
    );
}
