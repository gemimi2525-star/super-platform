import React from 'react';
import { workerBridge } from '@/coreos/workers/bridge';
import { updateService } from '@/coreos/system/update/service';
import { trustObservatory, TrustMetrics } from '@/coreos/brain/observability';
import type { GlobalSyncState } from '@/coreos/workers/types';
import type { UpdateState } from '@/coreos/system/update/types';

export function SystemStatusTray() {
    // Worker State
    const [syncState, setSyncState] = React.useState<GlobalSyncState>({
        connectivity: 'ONLINE',
        syncStatus: 'IDLE',
        pendingCount: 0
    });

    // OTA State
    const [otaState, setOtaState] = React.useState<UpdateState>({
        status: 'upt',
        currentVersion: '1.0.0',
        channel: 'stable'
    });

    // Trust State (Phase 36.1 Wiring)
    const [trustState, setTrustState] = React.useState<TrustMetrics>(trustObservatory.getMetrics());

    React.useEffect(() => {
        // Subscribe to worker
        const unsubWorker = workerBridge.subscribe(setSyncState);
        // Subscribe to OTA
        const unsubOTA = updateService.subscribe(setOtaState);

        // Poll Trust Metrics (In real implementation, use subscription)
        const trustInterval = setInterval(() => {
            setTrustState(trustObservatory.getMetrics());
        }, 1000);

        // Initial Check
        updateService.checkForUpdates().catch(console.error);

        return () => {
            unsubWorker();
            unsubOTA();
            clearInterval(trustInterval);
        };
    }, []);

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER LOGIC (Priority: OTA > Error > Trust Risk > Sync > Offline)
    // ─────────────────────────────────────────────────────────────────────────

    // Case 1: OTA Update Available / Progress
    if (otaState.status !== 'upt' && otaState.status !== 'chk') {
        let label = '';
        let icon = '🎁';

        switch (otaState.status) {
            case 'avl': label = 'Update Available'; break;
            case 'dwn': label = `Downloading ${otaState.progress}%`; icon = '⬇️'; break;
            case 'rdy': label = 'Restart to Update'; icon = '🚀'; break;
            case 'ins': label = 'Installing...'; icon = '⚙️'; break;
            case 'err': label = 'Update Failed'; icon = '⚠️'; break;
        }

        return (
            <div style={styles.container} title={`Channel: ${otaState.channel}`}>
                <span style={styles.iconUpdate}>{icon}</span>
                <span style={styles.labelUpdate}>{label}</span>
            </div>
        );
    }

    // Case 2: Trust Risk High (Phase 36.1)
    if (trustState.riskLevel === 'HIGH') {
        return (
            <div style={{ ...styles.container, background: '#FEF2F2', border: '1px solid #F87171' }}
                title={`Trust Score: ${trustState.trustScore}% (Critical Risk). AI Actions Paused.`}>
                <span style={{ fontSize: 12 }}>🔴</span>
                <span style={{ color: '#DC2626', fontWeight: 700 }}>RISK HIGH</span>
            </div>
        );
    }

    // Case 2.1: Trust Caution (Phase 36.1)
    if (trustState.riskLevel === 'MEDIUM') {
        return (
            <div style={{ ...styles.container, background: '#FFFBEB', border: '1px solid #FCD34D' }}
                title={`Trust Score: ${trustState.trustScore}% (Caution). Review required.`}>
                <span style={{ fontSize: 12 }}>🟡</span>
                <span style={{ color: '#D97706', fontWeight: 600 }}>Trust: {trustState.trustScore}%</span>
            </div>
        );
    }

    // Case 3: Offline
    if (syncState.connectivity === 'OFFLINE') {
        return (
            <div style={styles.container}>
                <span style={styles.iconOffline}>🔴</span>
                <span style={styles.labelOffline}>
                    Offline {syncState.pendingCount > 0 ? `(${syncState.pendingCount} pending)` : ''}
                </span>
            </div>
        );
    }

    // Case 4: Syncing
    if (syncState.syncStatus === 'SYNCING') {
        return (
            <div style={styles.container}>
                <span style={styles.spinner}>↻</span>
                <span style={styles.labelSyncing}>
                    Syncing {syncState.pendingCount > 0 ? `${syncState.pendingCount} items` : '...'}
                </span>
            </div>
        );
    }

    // Case 5: Error
    if (syncState.syncStatus === 'ERROR') {
        return (
            <div style={styles.container} title={syncState.lastError}>
                <span style={styles.iconError}>⚠️</span>
                <span style={styles.labelError}>Sync Failed</span>
            </div>
        );
    }

    // Case 6: Idle / Trust Normal (Phase 36.1)
    return (
        <div style={{ ...styles.container, opacity: 0.8 }} title={`System Healthy. Trust: ${trustState.trustScore}%`}>
            <span style={{ fontSize: 10 }}>🟢</span>
            <span style={{ fontSize: 10, color: '#059669', fontWeight: 500 }}>AI Secure</span>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    container: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 11,
        fontFamily: 'SF Mono, Monaco, monospace',
        transition: 'all 0.2s ease',
        cursor: 'default',
        userSelect: 'none',
    },
    spinner: {
        display: 'inline-block',
        animation: 'spin 1s linear infinite',
        color: '#3b82f6',
        fontSize: 12,
        fontWeight: 'bold',
    },
    labelSyncing: { color: '#3b82f6', fontWeight: 500 },
    iconOffline: { fontSize: 10, filter: 'sepia(1) saturate(5) hue-rotate(-50deg)' },
    labelOffline: { color: '#ef4444', fontWeight: 500 },
    iconError: { fontSize: 12 },
    labelError: { color: '#f59e0b', fontWeight: 500 },

    // OTA Styles
    iconUpdate: { fontSize: 12 },
    labelUpdate: { color: '#10b981', fontWeight: 600 }, // Green
};

// Add keyframes for spinner if not present globally
if (typeof document !== 'undefined' && !document.getElementById('spin-style')) {
    const style = document.createElement('style');
    style.id = 'spin-style';
    style.innerHTML = `
        @keyframes spin { 100% { transform: rotate(360deg); } }
    `;
    document.head.appendChild(style);
}
