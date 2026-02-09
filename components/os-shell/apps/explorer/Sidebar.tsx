/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OS SHELL — Explorer Sidebar (Phase 15A M3)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * macOS-style sidebar with VFS scheme sections + OMS tree.
 * VFS sections: user://, system://, workspace://
 * 
 * @module components/os-shell/apps/explorer/Sidebar
 */

import React, { useState, useEffect } from 'react';
import { oms, CoreObject } from '@/coreos/oms';
import '@/styles/nexus-tokens.css';

interface SidebarProps {
    currentPath: string;
    onNavigate: (path: string) => void;
}

// VFS Scheme Sections
const VFS_SECTIONS = [
    { label: 'My Files', path: 'user://', icon: '🏠', scheme: 'user' },
    { label: 'System', path: 'system://', icon: '⚙️', scheme: 'system' },
    { label: 'Workspace', path: 'workspace://', icon: '👥', scheme: 'workspace' },
];

export function Sidebar({ currentPath, onNavigate }: SidebarProps) {
    const [tree, setTree] = useState<CoreObject | null>(null);

    useEffect(() => {
        oms.resolve('/').then(setTree);
    }, []);

    const isVFSPath = currentPath.includes('://');

    const renderOmsNode = (node: CoreObject, level = 0) => {
        const isSelected = currentPath === node.path;
        const paddingLeft = level * 16 + 12;

        return (
            <div key={node.id}>
                <div
                    onClick={() => onNavigate(node.path)}
                    style={{
                        padding: `6px 12px 6px ${paddingLeft}px`,
                        cursor: 'pointer',
                        backgroundColor: isSelected ? 'var(--nx-accent-muted, rgba(0,122,255,0.12))' : 'transparent',
                        fontSize: 13,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        borderRadius: 6,
                        margin: '1px 8px',
                        color: isSelected ? 'var(--nx-accent, #007AFF)' : 'var(--nx-text-primary)',
                        fontWeight: isSelected ? 600 : 400,
                        transition: 'background 0.15s ease',
                    }}
                >
                    <span style={{ opacity: 0.7, fontSize: 14 }}>{level === 0 ? '💻' : '📁'}</span>
                    {node.name}
                </div>
                {node.children?.map(child => renderOmsNode(child, level + 1))}
            </div>
        );
    };

    return (
        <div style={{
            width: 200,
            background: 'var(--nx-surface-panel, rgba(255,255,255,0.5))',
            borderRight: '1px solid var(--nx-border-divider, rgba(0,0,0,0.1))',
            overflowY: 'auto',
            paddingTop: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
        }}>
            {/* VFS Sections */}
            <div style={{ padding: '4px 12px 2px', fontSize: 11, fontWeight: 600, color: 'var(--nx-text-tertiary, #888)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Files
            </div>
            {VFS_SECTIONS.map(section => {
                const isSelected = currentPath.startsWith(section.path);
                return (
                    <div
                        key={section.scheme}
                        onClick={() => onNavigate(section.path)}
                        style={{
                            padding: '6px 12px 6px 12px',
                            cursor: 'pointer',
                            backgroundColor: isSelected ? 'var(--nx-accent-muted, rgba(0,122,255,0.12))' : 'transparent',
                            fontSize: 13,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            borderRadius: 6,
                            margin: '1px 8px',
                            color: isSelected ? 'var(--nx-accent, #007AFF)' : 'var(--nx-text-primary)',
                            fontWeight: isSelected ? 600 : 400,
                            transition: 'background 0.15s ease',
                        }}
                    >
                        <span style={{ fontSize: 14 }}>{section.icon}</span>
                        {section.label}
                    </div>
                );
            })}

            {/* Divider */}
            <div style={{ height: 1, background: 'var(--nx-border-divider, rgba(0,0,0,0.08))', margin: '6px 12px' }} />

            {/* OMS Tree (Legacy) */}
            <div style={{ padding: '4px 12px 2px', fontSize: 11, fontWeight: 600, color: 'var(--nx-text-tertiary, #888)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Apps & Data
            </div>
            {tree ? renderOmsNode(tree) : (
                <div style={{ padding: '8px 20px', fontSize: 12, color: 'var(--nx-text-tertiary, #999)' }}>Loading...</div>
            )}
        </div>
    );
}
