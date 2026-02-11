'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PHASE 19: ProposalCard — AI Proposal UI Component
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * แสดง proposal ที่ AI เสนอ พร้อมปุ่ม ✅ ยืนยัน / ❌ ปฏิเสธ
 * ผู้ใช้ต้องกดยืนยันก่อน — AI ไม่ execute อะไรเอง
 * 
 * @module components/os-shell/apps/brain/ProposalCard
 */

import React, { useState } from 'react';

export interface ProposalData {
    id: string;
    type: string;
    appId: string;
    title: string;
    description: string;
    preview?: string;
    confidence: number;
    requiresConfirm: boolean;
    metadata?: Record<string, any>;
}

interface ProposalCardProps {
    proposal: ProposalData;
    onConfirm?: (proposal: ProposalData) => void;
    onReject?: (proposal: ProposalData) => void;
}

export function ProposalCard({ proposal, onConfirm, onReject }: ProposalCardProps) {
    const [status, setStatus] = useState<'pending' | 'confirmed' | 'rejected'>('pending');

    const handleConfirm = () => {
        setStatus('confirmed');
        onConfirm?.(proposal);
    };

    const handleReject = () => {
        setStatus('rejected');
        onReject?.(proposal);
    };

    const confidenceColor = proposal.confidence >= 0.85
        ? 'var(--nx-status-success, #34d399)'
        : proposal.confidence >= 0.7
            ? 'var(--nx-status-warning, #fbbf24)'
            : 'var(--nx-status-error, #f87171)';

    const confidencePercent = Math.round(proposal.confidence * 100);

    return (
        <div style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(139, 92, 246, 0.05))',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            borderRadius: '12px',
            padding: '16px',
            marginTop: '8px',
            marginBottom: '8px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.2s ease',
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                }}>
                    <span style={{ fontSize: '16px' }}>
                        {proposal.type === 'rewrite' ? '✏️' :
                            proposal.type === 'summarize' ? '📝' :
                                proposal.type === 'structure' ? '📋' :
                                    proposal.type === 'organize' ? '📁' :
                                        proposal.type === 'recommend' ? '⚙️' : '💡'}
                    </span>
                    <span style={{
                        fontWeight: 600,
                        fontSize: '14px',
                        color: 'var(--nx-text-primary, #e2e8f0)',
                    }}>
                        {proposal.title}
                    </span>
                </div>

                {/* Confidence Badge */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: `${confidenceColor}20`,
                    border: `1px solid ${confidenceColor}40`,
                    fontSize: '11px',
                    color: confidenceColor,
                    fontWeight: 600,
                }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: confidenceColor }} />
                    {confidencePercent}%
                </div>
            </div>

            {/* Description */}
            <p style={{
                fontSize: '13px',
                color: 'var(--nx-text-secondary, #94a3b8)',
                margin: '0 0 10px 0',
                lineHeight: 1.5,
            }}>
                {proposal.description}
            </p>

            {/* Preview */}
            {proposal.preview && (
                <div style={{
                    background: 'rgba(0, 0, 0, 0.15)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    marginBottom: '12px',
                    fontSize: '12px',
                    lineHeight: 1.6,
                    color: 'var(--nx-text-secondary, #cbd5e1)',
                    fontFamily: 'var(--nx-font-mono, monospace)',
                    whiteSpace: 'pre-wrap',
                    borderLeft: '3px solid rgba(99, 102, 241, 0.4)',
                }}>
                    {proposal.preview}
                </div>
            )}

            {/* App Scope Badge */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '12px',
            }}>
                <span style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(99, 102, 241, 0.15)',
                    color: 'rgba(99, 102, 241, 0.8)',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                }}>
                    {proposal.appId}
                </span>
                <span style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(251, 191, 36, 0.15)',
                    color: 'rgba(251, 191, 36, 0.8)',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                }}>
                    DRAFTER
                </span>
                <span style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(52, 211, 153, 0.15)',
                    color: 'rgba(52, 211, 153, 0.8)',
                    fontWeight: 500,
                    letterSpacing: '0.5px',
                }}>
                    shadow=true
                </span>
            </div>

            {/* Action Buttons */}
            {status === 'pending' ? (
                <div style={{
                    display: 'flex',
                    gap: '8px',
                    justifyContent: 'flex-end',
                }}>
                    <button
                        onClick={handleReject}
                        style={{
                            padding: '6px 16px',
                            borderRadius: '8px',
                            border: '1px solid rgba(248, 113, 113, 0.3)',
                            background: 'rgba(248, 113, 113, 0.08)',
                            color: '#f87171',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        ❌ ปฏิเสธ
                    </button>
                    <button
                        onClick={handleConfirm}
                        style={{
                            padding: '6px 16px',
                            borderRadius: '8px',
                            border: '1px solid rgba(52, 211, 153, 0.3)',
                            background: 'rgba(52, 211, 153, 0.1)',
                            color: '#34d399',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        ✅ ยืนยัน
                    </button>
                </div>
            ) : (
                <div style={{
                    textAlign: 'center',
                    padding: '6px',
                    borderRadius: '8px',
                    background: status === 'confirmed'
                        ? 'rgba(52, 211, 153, 0.1)'
                        : 'rgba(248, 113, 113, 0.1)',
                    color: status === 'confirmed'
                        ? '#34d399'
                        : '#f87171',
                    fontSize: '12px',
                    fontWeight: 600,
                }}>
                    {status === 'confirmed'
                        ? '✅ ยืนยันแล้ว — จะดำเนินการเมื่อระบบพร้อม'
                        : '❌ ปฏิเสธแล้ว — ข้ามข้อเสนอนี้'}
                </div>
            )}
        </div>
    );
}
