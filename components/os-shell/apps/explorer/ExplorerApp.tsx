import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { MainList } from './MainList';
import { useOpenCapability } from '@/governance/synapse';

// No props needed for LaunchApp as we use the hook
export function ExplorerApp() {
    // Current Path State
    const [currentPath, setCurrentPath] = useState('/');

    // Launch App Hook
    const openCapability = useOpenCapability();

    // Wrapper to cast string to CapabilityId (as OMS returns strings)
    const handleLaunch = (appId: string) => {
        openCapability(appId as any);
    };

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: '#f5f5f7', // macOS-like background
            color: '#1d1d1f'
        }}>
            {/* Header / Path Bar */}
            <div style={{
                height: 40,
                borderBottom: '1px solid rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                padding: '0 16px',
                gap: 12,
                background: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(10px)'
            }}>
                <button
                    onClick={() => setCurrentPath('/')}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                >
                    🏠
                </button>
                <div style={{
                    fontSize: 13,
                    color: '#555',
                    background: 'rgba(0,0,0,0.05)',
                    padding: '4px 12px',
                    borderRadius: 6,
                    flex: 1
                }}>
                    {currentPath}
                </div>
            </div>

            {/* Split View */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                <Sidebar
                    currentPath={currentPath}
                    onNavigate={setCurrentPath}
                />
                <MainList
                    currentPath={currentPath}
                    onNavigate={setCurrentPath}
                    onLaunchApp={handleLaunch}
                />
            </div>
        </div>
    );
}

// OS Registry Metadata
export const EXPLORER_APP_ID = 'system.explorer';
export const EXPLORER_APP_META = {
    id: EXPLORER_APP_ID,
    title: 'Finder',
    icon: 'compass', // Lucide icon name or similar
    width: 800,
    height: 500
};
