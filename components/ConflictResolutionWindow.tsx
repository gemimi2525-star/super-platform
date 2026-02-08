import React from 'react';
import { workerBridge } from '@/coreos/workers/bridge';
import type { SyncConflict, ResolutionStrategy } from '@/coreos/workers/types';

export function ConflictResolutionWindow({ conflict }: { conflict: SyncConflict }) {

    const handleResolve = (strategy: ResolutionStrategy) => {
        workerBridge.resolveConflict(conflict.id, strategy);
    };

    const formatDate = (ts: number) => new Date(ts).toLocaleString();

    return (
        <div style={styles.overlay}>
            <div style={styles.window}>
                {/* Header */}
                <div style={styles.header}>
                    <div style={styles.title}>⚠️ Sync Conflict Detected</div>
                    <div style={styles.subtitle}>
                        The file <b>{conflict.fileUri}</b> has been modified in both locations.
                    </div>
                </div>

                {/* Comparison Table */}
                <div style={styles.content}>
                    <div style={styles.card}>
                        <div style={styles.cardHeader}>On This Device (Local)</div>
                        <div style={styles.row}>Modified: {formatDate(conflict.localPayload.updatedAt)}</div>
                        <div style={styles.row}>Size: {conflict.localPayload.size} bytes</div>
                        <button
                            style={{ ...styles.button, ...styles.buttonPrimary }}
                            onClick={() => handleResolve('KEEP_LOCAL')}
                        >
                            Keep My Version
                        </button>
                    </div>

                    <div style={styles.divider}>vs</div>

                    <div style={styles.card}>
                        <div style={styles.cardHeader}>On Server (Remote)</div>
                        <div style={styles.row}>Modified: {formatDate(conflict.remotePayload.updatedAt)}</div>
                        <div style={styles.row}>Size: {conflict.remotePayload.size} bytes</div>
                        <button
                            style={{ ...styles.button, ...styles.buttonDanger }}
                            onClick={() => handleResolve('KEEP_REMOTE')}
                        >
                            Keep Server Version
                        </button>
                    </div>
                </div>

                {/* Footer Actions */}
                <div style={styles.footer}>
                    <button
                        style={styles.buttonSecondary}
                        onClick={() => handleResolve('DUPLICATE')}
                    >
                        Keep Both (Rename Local)
                    </button>
                </div>
            </div>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    overlay: {
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999, // Highest priority
    },
    window: {
        width: 500,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
        overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        animation: 'popIn 0.2s ease-out',
    },
    header: {
        padding: 20,
        borderBottom: '1px solid #eee',
        textAlign: 'center',
        backgroundColor: '#fffaf0', // Light warning bg
    },
    title: {
        fontSize: 16,
        fontWeight: 600,
        color: '#d97706',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 13,
        color: '#666',
        lineHeight: 1.4,
    },
    content: {
        padding: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
    },
    card: {
        flex: 1,
        border: '1px solid #e5e5e5',
        borderRadius: 8,
        padding: 16,
        textAlign: 'center',
        backgroundColor: '#fafafa',
    },
    cardHeader: {
        fontSize: 12,
        fontWeight: 600,
        color: '#444',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
    },
    row: {
        fontSize: 12,
        color: '#666',
        marginBottom: 8,
    },
    divider: {
        fontSize: 12,
        fontWeight: 600,
        color: '#999',
    },
    footer: {
        padding: '16px 20px',
        borderTop: '1px solid #eee',
        display: 'flex',
        justifyContent: 'center',
        backgroundColor: '#f9fafb',
    },
    button: {
        padding: '8px 16px',
        borderRadius: 6,
        fontSize: 13,
        fontWeight: 500,
        cursor: 'pointer',
        border: 'none',
        marginTop: 12,
        transition: 'all 0.1s',
        width: '100%',
    },
    buttonPrimary: {
        backgroundColor: '#3b82f6',
        color: 'white',
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
    },
    buttonDanger: {
        backgroundColor: '#ef4444',
        color: 'white',
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
    },
    buttonSecondary: {
        padding: '8px 16px',
        borderRadius: 6,
        fontSize: 13,
        fontWeight: 500,
        cursor: 'pointer',
        border: '1px solid #d1d5db',
        backgroundColor: 'white',
        color: '#374151',
    },
};

if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes popIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }
    `;
    document.head.appendChild(style);
}
