import React, { useState, useEffect } from 'react';
import { oms, CoreObject } from '@/coreos/oms';

interface SidebarProps {
    currentPath: string;
    onNavigate: (path: string) => void;
}

export function Sidebar({ currentPath, onNavigate }: SidebarProps) {
    const [tree, setTree] = useState<CoreObject | null>(null);

    useEffect(() => {
        // Load Root
        oms.resolve('/').then(setTree);
    }, []);

    const renderNode = (node: CoreObject, level = 0) => {
        const isSelected = currentPath === node.path;
        const paddingLeft = level * 16 + 12;

        return (
            <div key={node.id}>
                <div
                    onClick={() => onNavigate(node.path)}
                    style={{
                        padding: `6px 12px 6px ${paddingLeft}px`,
                        cursor: 'pointer',
                        backgroundColor: isSelected ? 'rgba(0,0,0,0.1)' : 'transparent',
                        fontSize: 13,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        borderRadius: 6,
                        margin: '1px 8px',
                        color: '#333'
                    }}
                >
                    <span style={{ opacity: 0.5 }}>{level === 0 ? '💻' : '📁'}</span>
                    {node.name}
                </div>
                {node.children?.map(child => renderNode(child, level + 1))}
            </div>
        );
    };

    if (!tree) return <div style={{ padding: 20 }}>Loading...</div>;

    return (
        <div style={{
            width: 200,
            background: 'rgba(255,255,255,0.5)',
            borderRight: '1px solid rgba(0,0,0,0.1)',
            overflowY: 'auto',
            paddingTop: 12
        }}>
            {renderNode(tree)}
        </div>
    );
}
