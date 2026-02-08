import React, { useState, useEffect } from 'react';
import { storeCatalog } from '@/coreos/store/catalog';
import { storeBridge } from '@/coreos/store/bridge';
import type { StoreItem, DistributionChannel } from '@/coreos/store/types';
import type { Window } from '@/coreos/types';

interface AppStoreWindowProps {
    window: Window;
    // onClose/onFocus are handled by WindowChrome wrapper
}

import { AIExplanationPanel } from './AIExplanationPanel';

export function AppStoreWindow({ window }: AppStoreWindowProps) {
    const [view, setView] = useState<'home' | 'detail'>('home');
    const [selectedApp, setSelectedApp] = useState<StoreItem | null>(null);
    const [apps, setApps] = useState<StoreItem[]>([]);
    const [installing, setInstalling] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string>('');
    const [explaining, setExplaining] = useState<boolean>(false); // Phase 26.1.x

    useEffect(() => {
        loadCatalog();
    }, []);

    const loadCatalog = async () => {
        const items = await storeCatalog.getCatalog(['official', 'enterprise', 'dev']);
        setApps(items);
    };

    const handleAppClick = (app: StoreItem) => {
        setSelectedApp(app);
        setView('detail');
        setStatusMessage('');
    };

    const handleBack = () => {
        setView('home');
        setSelectedApp(null);
        setStatusMessage('');
    };

    const handleInstall = async (channel: DistributionChannel) => {
        if (!selectedApp) return;

        setInstalling(channel);
        setStatusMessage('Verifying Signature & Policy...');

        // Artificial delay for UX
        await new Promise(r => setTimeout(r, 1000));

        setStatusMessage('Installing...');
        const result = await storeBridge.requestInstall(selectedApp.appId, channel);

        if (result.success) {
            setStatusMessage('✅ Installed Successfully');
        } else {
            setStatusMessage(`❌ Failed: ${result.reason}`);
        }
        setInstalling(null);
    };

    return (
        <div style={{ padding: 20, height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', background: '#f5f5f7' }}>

            {/* HEADLINE */}
            <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: 24, color: '#1d1d1f' }}>
                    {view === 'detail' && (
                        <button
                            onClick={handleBack}
                            style={{
                                border: 'none', background: 'none', cursor: 'pointer',
                                fontSize: 24, marginRight: 10
                            }}
                        >
                            ←
                        </button>
                    )}
                    {view === 'home' ? 'Discover' : selectedApp?.info.name}
                </h2>
            </div>

            {/* HOME VIEW */}
            {view === 'home' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 }}>
                    {apps.map(app => (
                        <div
                            key={app.appId}
                            onClick={() => handleAppClick(app)}
                            style={{
                                background: 'white',
                                borderRadius: 12,
                                padding: 16,
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                transition: 'transform 0.1s',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                textAlign: 'center'
                            }}
                        >
                            <div style={{ fontSize: 48, marginBottom: 10 }}>{app.info.icon}</div>
                            <div style={{ fontWeight: 600, fontSize: 16, color: '#1d1d1f' }}>{app.info.name}</div>
                            <div style={{ fontSize: 13, color: '#86868b' }}>{app.info.category}</div>

                            {/* Trust Badge */}
                            <div style={{
                                marginTop: 8,
                                fontSize: 10,
                                padding: '2px 6px',
                                borderRadius: 4,
                                background: app.trustLevel >= 2 ? '#e8f5e9' : '#fff3e0',
                                color: app.trustLevel >= 2 ? '#2e7d32' : '#e65100'
                            }}>
                                {app.trustLevel >= 2 ? 'VERIFIED' : 'UNVERIFIED'}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* DETAIL VIEW */}
            {selectedApp && view === 'detail' && (
                <div style={{ background: 'white', borderRadius: 16, padding: 30, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', flex: 1 }}>
                    <div style={{ display: 'flex', gap: 20 }}>
                        <div style={{ fontSize: 64 }}>{selectedApp.info.icon}</div>
                        <div style={{ flex: 1 }}>
                            <h1 style={{ margin: '0 0 5px 0', fontSize: 32 }}>{selectedApp.info.name}</h1>
                            <div style={{ color: '#86868b', fontSize: 16 }}>{selectedApp.info.publisher}</div>

                            <div style={{ marginTop: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
                                {Object.keys(selectedApp.versions).map((channel: any) => (
                                    <button
                                        key={channel}
                                        onClick={() => handleInstall(channel as DistributionChannel)}
                                        disabled={!!installing}
                                        style={{
                                            background: installing === channel ? '#999' : '#0071e3',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: 20,
                                            padding: '8px 20px',
                                            fontSize: 14,
                                            fontWeight: 600,
                                            cursor: installing ? 'default' : 'pointer'
                                        }}
                                    >
                                        {installing === channel ? 'Installing...' : `Get (${channel})`}
                                    </button>
                                ))}

                                {/* Phase 26.1.x: Shadow AI Explain */}
                                <button
                                    onClick={() => setExplaining(!explaining)}
                                    style={{
                                        background: 'rgba(0,0,0,0.05)',
                                        color: '#333',
                                        border: '1px solid rgba(0,0,0,0.1)',
                                        borderRadius: 20,
                                        padding: '8px 16px',
                                        fontSize: 13,
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6
                                    }}
                                >
                                    ✨ Explain
                                </button>
                            </div>

                            {statusMessage && (
                                <div style={{ marginTop: 10, color: statusMessage.startsWith('❌') ? 'red' : 'green', fontWeight: 500 }}>
                                    {statusMessage}
                                </div>
                            )}

                            {/* AI Panel */}
                            {explaining && (
                                <div style={{ marginTop: 16 }}>
                                    <AIExplanationPanel
                                        appId={selectedApp.appId}
                                        title={`AI Summary: ${selectedApp.info.name}`}
                                        prompt={`Explain what the app "${selectedApp.info.name}" does and verify if its permissions (${selectedApp.requiredCapabilities.join(', ')}) are appropriate. Be concise.`}
                                        contextParams={{
                                            app: selectedApp.info.name,
                                            permissions: selectedApp.requiredCapabilities,
                                            trust: selectedApp.trustLevel
                                        }}
                                        onClose={() => setExplaining(false)}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '30px 0' }} />

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 40 }}>
                        {/* Left: Description */}
                        <div>
                            <h3 style={{ marginTop: 0 }}>About</h3>
                            <p style={{ lineHeight: 1.6, color: '#333' }}>{selectedApp.info.description}</p>

                            <h3>Screenshots</h3>
                            <div style={{ height: 150, background: '#f0f0f0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                                No Screenshots Available (Mock)
                            </div>
                        </div>

                        {/* Right: Info & Privacy */}
                        <div>
                            <div style={{ marginBottom: 20 }}>
                                <h4 style={{ margin: '0 0 10px 0', color: '#1d1d1f' }}>Trust & Privacy</h4>
                                <div style={{ fontSize: 13, background: '#f9f9f9', padding: 15, borderRadius: 8 }}>
                                    <div style={{ marginBottom: 5 }}>
                                        <strong>Trust Level:</strong> {selectedApp.trustLevel}
                                    </div>
                                    <div>
                                        <strong>Capabilities:</strong>
                                        <ul style={{ margin: '5px 0 0 0', paddingLeft: 20, color: '#666' }}>
                                            {selectedApp.requiredCapabilities.length > 0 ? (
                                                selectedApp.requiredCapabilities.map(cap => (
                                                    <li key={cap}>{cap}</li>
                                                ))
                                            ) : (
                                                <li>None</li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 style={{ margin: '0 0 10px 0', color: '#1d1d1f' }}>Information</h4>
                                <div style={{ fontSize: 13, color: '#666', lineHeight: 1.8 }}>
                                    <div><strong>Category:</strong> {selectedApp.info.category}</div>
                                    <div><strong>Version:</strong> {Object.values(selectedApp.versions)[0]?.manifest.version}</div>
                                    <div><strong>Size:</strong> 15 MB</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
