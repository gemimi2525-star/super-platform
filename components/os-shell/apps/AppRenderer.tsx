/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OS SHELL — App Renderer
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Renders app content inside WindowChrome based on capabilityId.
 * 
 * @module components/os-shell/apps/AppRenderer
 * @version 1.0.0
 */

'use client';

import React from 'react';
import { getAppComponent, type AppProps } from './registry';
import { tokens } from '../tokens';

interface AppRendererProps extends AppProps { }

/**
 * Placeholder for apps not yet implemented
 */
function ComingSoon({ capabilityId }: { capabilityId: string }) {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                minHeight: 200,
                padding: 32,
                color: '#888',
                textAlign: 'center',
                fontFamily: tokens.fontFamily,
            }}
        >
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>
                🚧
            </div>
            <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>
                Coming Soon
            </div>
            <div style={{ fontSize: 12, color: '#aaa' }}>
                {capabilityId}
            </div>
        </div>
    );
}

/**
 * Renders the appropriate app component based on capabilityId
 */
export function AppRenderer({ windowId, capabilityId, isFocused }: AppRendererProps) {
    const AppComponent = getAppComponent(capabilityId);

    if (!AppComponent) {
        return <ComingSoon capabilityId={capabilityId} />;
    }

    return (
        <AppComponent
            windowId={windowId}
            capabilityId={capabilityId}
            isFocused={isFocused}
        />
    );
}
