/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OS SHELL — Top Bar (Menu Bar) + Log Toggle
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * macOS-style menu bar with system menu, app context, and log toggle.
 * 
 * @module components/os-shell/TopBar
 * @version 1.1.0
 */

'use client';

import React from 'react';
import { tokens } from './tokens';
import {
    useFocusedWindow,
    useMinimizeAll,
    useSystemState,
} from '@/governance/synapse';

interface TopBarProps {
    onToggleLogs?: () => void;
    isLogPanelOpen?: boolean;
}

export function TopBar({ onToggleLogs, isLogPanelOpen }: TopBarProps) {
    const focusedWindow = useFocusedWindow();
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

    const activeWindowCount = Object.values(state.windows).filter(w => w.state === 'active').length;

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
                fontFamily: tokens.fontFamily,
                zIndex: 10000,
                userSelect: 'none',
            }}
        >
            {/* Left: System Layer + App Context */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {/* System Menu */}
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

                {/* Menu Items (when window is focused) */}
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
                {/* Logs Toggle (Dev) */}
                {onToggleLogs && (
                    <button
                        onClick={onToggleLogs}
                        style={{
                            background: isLogPanelOpen ? 'rgba(255,255,255,0.2)' : 'none',
                            border: 'none',
                            borderRadius: 4,
                            color: 'inherit',
                            fontSize: 11,
                            cursor: 'pointer',
                            padding: '2px 6px',
                            opacity: isLogPanelOpen ? 1 : 0.7,
                        }}
                        title="Toggle System Log"
                    >
                        🔍 Logs
                    </button>
                )}

                {/* Window count indicator */}
                {activeWindowCount > 0 && (
                    <span style={{ opacity: 0.7, fontSize: 11 }}>
                        {activeWindowCount} window{activeWindowCount !== 1 ? 's' : ''}
                    </span>
                )}

                <span style={{ opacity: 0.85 }}>{formatDate(time)}</span>
                <span>{formatTime(time)}</span>
            </div>
        </div>
    );
}
