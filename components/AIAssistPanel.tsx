import React, { useState, useEffect } from 'react';
import { BrainRequest } from '@/coreos/brain/types';
import { brainGateway } from '@/coreos/brain/gateway';
import { complianceEngine } from '@/coreos/brain/compliance'; // Phase 36.2

interface ProposalAction {
    id: string;
    type: string;
    description: string;
    payload: any;
}

interface AIAssistPanelProps {
    appId: string;
    title: string;
    prompt: string;
    contextParams: any;
    onClose: () => void;
    onApproveAction: (action: ProposalAction) => void;
}

// Simple I18N for Assist Panel
const I18N = {
    'en-US': { generate: '✨ Generate Suggestions', analyzing: 'Analyzing context...', proposed: 'Proposed Actions', approve: 'Approve', reject: 'Reject', executing: 'Executing approved action...', done: '✅ All actions handled.' },
    'th-TH': { generate: '✨ สร้างข้อเสนอแนะ', analyzing: 'กำลังวิเคราะห์ข้อมูล...', proposed: 'สิ่งที่ AI เสนอ', approve: 'อนุมัติ', reject: 'ปฏิเสธ', executing: 'กำลังดำเนินการ...', done: '✅ เรียบร้อยแล้ว' }
};

export function AIAssistPanel({ appId, title, prompt, contextParams, onClose, onApproveAction }: AIAssistPanelProps) {
    const [status, setStatus] = useState<'idle' | 'thinking' | 'proposed' | 'executing' | 'done'>('idle');
    const [proposals, setProposals] = useState<ProposalAction[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Locale Hook
    const [locale, setLocale] = useState<string>(complianceEngine.getLocale());
    const t = (I18N as any)[locale] || I18N['en-US'];

    useEffect(() => {
        const interval = setInterval(() => {
            const current = complianceEngine.getLocale();
            if (current !== locale) setLocale(current);
        }, 1000);
        return () => clearInterval(interval);
    }, [locale]);

    const handleSuggest = async () => {
        setStatus('thinking');
        setError(null);

        try {
            // Simulate AI Request (In real implementation, this calls brainGateway)
            // For Phase 26.2A Scaffold, we simulate the "Propose" response

            await new Promise(r => setTimeout(r, 1000)); // Latency sim

            // Mock Proposals based on App ID
            let mockProposals: ProposalAction[] = [];

            if (appId === 'core.files') {
                mockProposals = [
                    { id: 'p1', type: 'move', description: locale === 'th-TH' ? 'ย้าย "Budget_2025.xlsx" ไปโฟลเดอร์ "การเงิน"' : 'Move "Budget_2025.xlsx" to "Finance" folder', payload: { source: 'Budget_2025.xlsx', dest: 'Finance/' } },
                    { id: 'p2', type: 'rename', description: locale === 'th-TH' ? 'เปลี่ยนชื่อ "IMG_001.png" เป็น "Logo_Draft.png"' : 'Rename "IMG_001.png" to "Logo_Draft.png"', payload: { source: 'IMG_001.png', newName: 'Logo_Draft.png' } }
                ];
            } else if (appId === 'core.settings') {
                mockProposals = [
                    { id: 'p3', type: 'revoke', description: 'Revoke "Location" from "Weather App" (Unused for 30 days)', payload: { app: 'Weather App', perm: 'Location' } }
                ];
            }

            setProposals(mockProposals);
            setStatus('proposed');

            // Audit Log: Proposals Received
            console.log(`[Audit] brain.assist_proposed | ${mockProposals.length} actions`);

        } catch (e: any) {
            setError(e.message);
            setStatus('idle');
        }
    };

    const handleApprove = async (action: ProposalAction) => {
        setStatus('executing');
        try {
            await new Promise(r => setTimeout(r, 800)); // Execution sim
            onApproveAction(action);

            // Remove approved action from list
            setProposals(prev => prev.filter(p => p.id !== action.id));

            if (proposals.length <= 1) {
                setStatus('done');
            } else {
                setStatus('proposed');
            }
        } catch (e: any) {
            setError('Execution Failed');
            setStatus('proposed');
        }
    };

    return (
        <div style={{
            background: '#F5F5F7',
            borderRadius: 12,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            border: '1px solid #E5E5E5'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>🤖</span>
                    <strong style={{ fontSize: 13, color: '#333' }}>{title}</strong>
                </div>
                <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 14, color: '#999' }}>✕</button>
            </div>

            {status === 'idle' && (
                <div style={{ textAlign: 'center', padding: 10 }}>
                    <p style={{ fontSize: 13, color: '#666', marginBottom: 10 }}>{prompt}</p>
                    <button
                        onClick={handleSuggest}
                        style={{
                            background: '#007AFF', color: 'white', border: 'none', borderRadius: 6,
                            padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer'
                        }}
                    >
                        {t.generate}
                    </button>
                </div>
            )}

            {status === 'thinking' && (
                <div style={{ fontSize: 13, color: '#666', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', padding: 20 }}>
                    <div className="spinner" style={{ width: 12, height: 12, border: '2px solid #ccc', borderTopColor: '#666', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    {t.analyzing}
                </div>
            )}

            {status === 'proposed' && (
                <div>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 8, textTransform: 'uppercase', fontWeight: 600 }}>{t.proposed}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {proposals.map(action => (
                            <div key={action.id} style={{ background: 'white', padding: 10, borderRadius: 8, border: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontSize: 13, color: '#333' }}>{action.description}</div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <button
                                        onClick={() => handleApprove(action)}
                                        style={{ background: '#34C759', color: 'white', border: 'none', borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}
                                    >
                                        {t.approve}
                                    </button>
                                    <button
                                        onClick={() => setProposals(prev => prev.filter(p => p.id !== action.id))}
                                        style={{ background: '#FF3B30', color: 'white', border: 'none', borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}
                                    >
                                        {t.reject}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {status === 'executing' && (
                <div style={{ fontSize: 13, color: '#333', textAlign: 'center', padding: 20 }}>
                    {t.executing}
                </div>
            )}

            {status === 'done' && (
                <div style={{ fontSize: 13, color: '#28a745', textAlign: 'center', padding: 20 }}>
                    {t.done}
                </div>
            )}

            {error && (
                <div style={{ color: 'red', fontSize: 12, background: '#fee', padding: 8, borderRadius: 4 }}>
                    Error: {error}
                </div>
            )}
        </div>
    );
}
