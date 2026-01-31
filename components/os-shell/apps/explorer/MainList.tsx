import React, { useState, useEffect } from 'react';
import { oms, CoreObject } from '@/coreos/oms';

interface MainListProps {
    currentPath: string;
    onNavigate: (path: string) => void;
    onLaunchApp: (appId: string) => void;
}

export function MainList({ currentPath, onNavigate, onLaunchApp }: MainListProps) {
    const [items, setItems] = useState<CoreObject[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setLoading(true);
        setError('');
        oms.list(currentPath)
            .then(children => {
                setItems(children);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setError('Failed to load items');
                setLoading(false);
            });
    }, [currentPath]);

    const handleDoubleClick = (item: CoreObject) => {
        if (item.type === 'collection') {
            onNavigate(item.path);
        } else if (item.type === 'app') {
            if (item.meta?.appId) {
                onLaunchApp(item.meta.appId);
            }
        }
    };

    if (loading) return <div style={{ padding: 20 }}>Loading...</div>;
    if (error) return <div style={{ padding: 20, color: 'red' }}>{error}</div>;

    return (
        <div style={{
            flex: 1,
            padding: 20,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
            gridAutoRows: 'min-content',
            gap: 16,
            alignContent: 'start'
        }}>
            {items.map(item => (
                <div
                    key={item.id}
                    onDoubleClick={() => handleDoubleClick(item)}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 8,
                        padding: 12,
                        borderRadius: 8,
                        cursor: 'default',
                        transition: 'background 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                    <div style={{
                        width: 48, height: 48,
                        background: item.type === 'app' ? '#333' : '#8ab4f8',
                        borderRadius: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: 24,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}>
                        {item.type === 'app' ? '🚀' : (item.type === 'collection' ? '📁' : '📄')}
                    </div>
                    <span style={{
                        fontSize: 13,
                        textAlign: 'center',
                        wordBreak: 'break-word',
                        color: '#333',
                        fontWeight: 500
                    }}>
                        {item.name}
                    </span>
                    {item.meta?.degraded && (
                        <span style={{ fontSize: 10, color: 'orange' }}>⚠️ Offline</span>
                    )}
                </div>
            ))}

            {items.length === 0 && (
                <div style={{
                    gridColumn: '1 / -1',
                    textAlign: 'center',
                    color: '#999',
                    marginTop: 40
                }}>
                    Folder is empty
                </div>
            )}
        </div>
    );
}
