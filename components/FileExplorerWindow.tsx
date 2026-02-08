import React, { useState, useEffect } from 'react';
import { AIExplanationPanel } from './AIExplanationPanel';
import { AIAssistPanel } from './AIAssistPanel'; // Phase 26.2A
import { Window } from '@/coreos/types';
import { toolRegistry } from '@/coreos/brain/registry'; // Phase 26.2B
import { complianceEngine } from '@/coreos/brain/compliance'; // Phase 36.2

// Mock File System Data (In real OS, this comes from VFS/Worker)
const MOCK_FILES = [
    { id: 'f1', name: 'Project_Alpha_Specs.pdf', type: 'pdf', size: '2.4 MB', path: 'user://documents/Project_Alpha_Specs.pdf' },
    { id: 'f2', name: 'Budget_2026.xlsx', type: 'xlsx', size: '1.2 MB', path: 'user://documents/Budget_2026.xlsx' },
    { id: 'f3', name: 'logo_v2.png', type: 'png', size: '450 KB', path: 'user://images/logo_v2.png' },
    { id: 'f4', name: 'App_Manifest.json', type: 'json', size: '2 KB', path: 'user://dev/App_Manifest.json' },
    { id: 'f5', name: 'passwords.txt', type: 'txt', size: '1 KB', path: 'user://secret/passwords.txt' },
];

interface FileExplorerWindowProps {
    window: Window;
}

// Simple i18n Dictionary (Phase 36.2)
const I18N = {
    'en-US': { search: 'Search files...', explain: '✨ Explain File', assist: '🤖 Assist', empty: 'No files found.', tryAI: '(Try asking AI to search...)' },
    'en-SG': { search: 'Search docs...', explain: '✨ Analyze', assist: '🤖 Helper', empty: 'No files here.', tryAI: '(Ask AI helper...)' },
    'th-TH': { search: 'ค้นหาไฟล์...', explain: '✨ อธิบายไฟล์', assist: '🤖 ผู้ช่วย AI', empty: 'ไม่พบไฟล์', tryAI: '(ลองถาม AI ดูสิ...)' }
};

export function FileExplorerWindow({ window }: FileExplorerWindowProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFile, setSelectedFile] = useState<any | null>(null);
    const [explaining, setExplaining] = useState(false);
    const [assisting, setAssisting] = useState(false); // Phase 26.2A

    // Locale Hook (Phase 36.2)
    const [locale, setLocale] = useState<string>(complianceEngine.getLocale());
    const t = (I18N as any)[locale] || I18N['en-US'];

    useEffect(() => {
        // In real app, subscribe to compliance engine events
        const interval = setInterval(() => {
            const current = complianceEngine.getLocale();
            if (current !== locale) setLocale(current);
        }, 1000);
        return () => clearInterval(interval);
    }, [locale]);

    // Filter Logic
    const filteredFiles = MOCK_FILES.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#fff' }}>
            {/* Toolbar */}
            <div style={{ padding: 12, borderBottom: '1px solid #eee', display: 'flex', gap: 12, alignItems: 'center' }}>
                <input
                    type="text"
                    placeholder={t.search}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        border: '1px solid #ddd',
                        fontSize: 13,
                        flex: 1
                    }}
                />
                <button
                    onClick={() => { if (selectedFile) setExplaining(!explaining); }}
                    disabled={!selectedFile}
                    style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        border: '1px solid #ddd',
                        background: selectedFile ? '#f0f0f0' : '#fff',
                        cursor: selectedFile ? 'pointer' : 'default',
                        opacity: selectedFile ? 1 : 0.5,
                        fontSize: 13,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                    }}
                >
                    {t.explain}
                </button>
                {/* Phase 26.2A: Suggest Actions */}
                <button
                    onClick={() => setAssisting(!assisting)}
                    style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        border: '1px solid #007AFF',
                        background: '#007AFF',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: 13,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                    }}
                >
                    {t.assist}
                </button>
            </div>

            {/* AI Assist Panel (Phase 26.2A) */}
            {assisting && (
                <div style={{ padding: 12, borderBottom: '1px solid #eee', background: '#fafafa' }}>
                    <AIAssistPanel
                        appId="core.files"
                        title={locale === 'th-TH' ? "ผู้ช่วยจัดการไฟล์" : "File Assistant"}
                        prompt={locale === 'th-TH' ? "ให้ฉันช่วยจัดระเบียบไฟล์ไหม?" : "I can help organize your files. Shall I suggest some moves?"}
                        contextParams={{ fileCount: filteredFiles.length }}
                        onClose={() => setAssisting(false)}
                        onApproveAction={async (action) => {
                            console.log(`[FileExplorer] User Approved: ${action.description}`);

                            // Phase 26.2B: Real Execution
                            // Map proposal id/type to tool name
                            let toolName = '';
                            let args = {};

                            if (action.type === 'move') {
                                toolName = 'execute_file_move';
                                args = { source: action.payload.source, destination: action.payload.dest };
                            } else if (action.type === 'rename') {
                                toolName = 'execute_file_rename';
                                args = { source: action.payload.source, newName: action.payload.newName };
                            }

                            if (toolName) {
                                try {
                                    // Execute via Registry (Bypassing LLM, acting as System/User)
                                    await toolRegistry.executeTool(toolName, args, {
                                        appId: 'core.files',
                                        correlationId: `exec-${Date.now()}`,
                                        userId: 'user-approved'
                                    });
                                    // In a real app, we'd trigger a VFS refresh here
                                } catch (e) {
                                    console.error('Execution Failed:', e);
                                    alert('Failed to execute action');
                                }
                            }
                        }}
                    />
                </div>
            )}

            {/* AI Explain Panel */}
            {explaining && selectedFile && (
                <div style={{ padding: 12, borderBottom: '1px solid #eee', background: '#fafafa' }}>
                    <AIExplanationPanel
                        appId="core.files"
                        title={`AI Insight: ${selectedFile.name}`}
                        prompt={`Summarize the file "${selectedFile.name}" (${selectedFile.type}). Explain its likely purpose based on its name and path.`}
                        contextParams={{ file: selectedFile }}
                        onClose={() => setExplaining(false)}
                    />
                </div>
            )}

            {/* File List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
                {filteredFiles.length === 0 ? (
                    <div style={{ padding: 20, textAlign: 'center', color: '#999', fontSize: 13 }}>
                        {t.empty} <br />
                        <span style={{ fontSize: 11, opacity: 0.7 }}>{t.tryAI}</span>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 12 }}>
                        {filteredFiles.map(file => (
                            <div
                                key={file.id}
                                onClick={() => setSelectedFile(file)}
                                style={{
                                    padding: 12,
                                    borderRadius: 8,
                                    border: selectedFile?.id === file.id ? '2px solid #007AFF' : '1px solid #eee',
                                    background: selectedFile?.id === file.id ? '#f0f9ff' : '#fff',
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 8
                                }}
                            >
                                <div style={{ fontSize: 32 }}>
                                    {file.type === 'pdf' ? '📄' : file.type === 'xlsx' ? '📊' : file.type === 'png' ? '🖼️' : '📝'}
                                </div>
                                <div style={{ fontSize: 12, fontWeight: 500, wordBreak: 'break-word' }}>
                                    {file.name}
                                </div>
                                <div style={{ fontSize: 10, color: '#888' }}>
                                    {file.size}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Status Bar */}
            <div style={{ padding: '8px 12px', background: '#f9f9f9', borderTop: '1px solid #eee', fontSize: 11, color: '#666' }}>
                {filteredFiles.length} item{filteredFiles.length !== 1 ? 's' : ''}
            </div>
        </div>
    );
}
