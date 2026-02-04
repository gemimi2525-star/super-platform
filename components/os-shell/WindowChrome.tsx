/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OS SHELL — Window Chrome
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * macOS-style window with title bar and traffic light buttons.
 * Renders app content via AppRenderer.
 * 
 * Phase 8: Updated to use NEXUS Design Tokens (CSS variables)
 * 
 * @module components/os-shell/WindowChrome
 * @version 3.0.0 (Phase 8)
 */

'use client';

import React from 'react';
import '@/styles/nexus-tokens.css';
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
            className="nx-animate-open"
            style={{
                position: 'absolute',
                top: Math.min(baseTop, 300),
                left: Math.min(baseLeft, 500),
                width: 600,
                height: 480,
                background: 'var(--nx-surface-window)',
                borderRadius: 'var(--nx-window-radius)',
                boxShadow: isFocused
                    ? 'var(--nx-shadow-window)'
                    : 'var(--nx-shadow-window-unfocused)',
                zIndex: window.zIndex,
                overflow: 'hidden',
                transition: 'box-shadow var(--nx-duration-fast) var(--nx-ease-out)',
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
                    height: 'var(--nx-titlebar-height)',
                    background: isFocused
                        ? 'var(--nx-surface-titlebar)'
                        : 'var(--nx-surface-titlebar-unfocused)',
                    borderBottom: '1px solid var(--nx-border-divider)',
                    padding: '0 var(--nx-titlebar-padding-x)',
                    gap: 'var(--nx-traffic-gap)',
                    flexShrink: 0,
                }}
            >
                {/* Traffic Light Buttons */}
                <div style={{ display: 'flex', gap: 'var(--nx-traffic-gap)' }}>
                    <button
                        onClick={(e) => { e.stopPropagation(); close(); }}
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
                        onClick={(e) => { e.stopPropagation(); minimize(); }}
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
                        fontSize: 'var(--nx-text-body)',
                        fontWeight: 'var(--nx-weight-medium)',
                        color: isFocused
                            ? 'var(--nx-text-titlebar)'
                            : 'var(--nx-text-titlebar-unfocused)',
                        fontFamily: 'var(--nx-font-system)',
                    }}
                >
                    <span style={{ marginRight: 'var(--nx-space-2)' }}>{icon}</span>
                    {window.title}
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
                    windowId={window.id}
                    capabilityId={window.capabilityId}
                    isFocused={isFocused}
                />
            </div>
        </div>
    );
}
