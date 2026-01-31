/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OS SHELL — Window Chrome
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * macOS-style window with title bar and traffic light buttons.
 * Renders app content via AppRenderer.
 * 
 * @module components/os-shell/WindowChrome
 * @version 2.0.0
 */

'use client';

import React from 'react';
import { tokens } from './tokens';
import {
    useWindowControls,
    useCapabilityInfo,
    type Window,
} from '@/governance/synapse';
import { AppRenderer } from './apps';

interface WindowChromeProps {
    window: Window;
    isFocused: boolean;
}

export function WindowChrome({ window, isFocused }: WindowChromeProps) {
    const { focus, minimize, close } = useWindowControls(window.id);
    const { icon } = useCapabilityInfo(window.capabilityId);

    if (window.state === 'minimized') {
        return null;
    }

    // Position windows nicely
    const baseTop = 80 + (window.zIndex * 30);
    const baseLeft = 120 + (window.zIndex * 30);

    return (
        <div
            style={{
                position: 'absolute',
                top: Math.min(baseTop, 300),
                left: Math.min(baseLeft, 500),
                width: 600,
                height: 480,
                background: tokens.windowBackground,
                borderRadius: tokens.windowRadius,
                boxShadow: isFocused ? tokens.windowShadow : tokens.windowShadowUnfocused,
                zIndex: window.zIndex,
                overflow: 'hidden',
                transition: 'box-shadow 0.15s ease',
                display: 'flex',
                flexDirection: 'column',
            }}
            onMouseDown={!isFocused ? focus : undefined}
        >
            {/* Title Bar */}
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
                    flexShrink: 0,
                }}
            >
                {/* Traffic Light Buttons */}
                <div style={{ display: 'flex', gap: 8 }}>
                    <button
                        onClick={(e) => { e.stopPropagation(); close(); }}
                        style={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            background: isFocused ? tokens.trafficClose : tokens.trafficInactive,
                            border: `1px solid ${isFocused ? tokens.trafficCloseBorder : tokens.trafficInactiveBorder}`,
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
                            background: isFocused ? tokens.trafficMinimize : tokens.trafficInactive,
                            border: `1px solid ${isFocused ? tokens.trafficMinimizeBorder : tokens.trafficInactiveBorder}`,
                            cursor: 'pointer',
                            padding: 0,
                        }}
                        title="Minimize"
                    />
                    <button
                        style={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            background: isFocused ? tokens.trafficMaximize : tokens.trafficInactive,
                            border: `1px solid ${isFocused ? tokens.trafficMaximizeBorder : tokens.trafficInactiveBorder}`,
                            cursor: 'default',
                            padding: 0,
                        }}
                        title="Maximize"
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
                        fontFamily: tokens.fontFamily,
                    }}
                >
                    <span style={{ marginRight: 6 }}>{icon}</span>
                    {window.title}
                </div>

                {/* Spacer for symmetry */}
                <div style={{ width: 52 }} />
            </div>

            {/* App Content */}
            <div style={{
                flex: 1,
                overflow: 'auto',
                background: '#fff',
            }}>
                <AppRenderer
                    windowId={window.id}
                    capabilityId={window.capabilityId}
                    isFocused={isFocused}
                />
            </div>
        </div>
    );
}

