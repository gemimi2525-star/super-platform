'use client';

/**
 * QA Demo Page: Manual Rank Tracking
 * 
 * Purpose: Verify rank tracking logic and tenant isolation
 * URL: /qa/manual-rank
 * Access: Dev/QA only
 */

import { useState } from 'react';
import { useAuthStore } from '@/lib/stores/authStore';
import {
    useSEOGuard,
    useKeywords,
    useCreateKeyword,
    useRankHistory,
    useAddRankEntry
} from '@modules/seo';
import { Button, Input, Card, CardBody } from '@platform/ui-kit';

export default function ManualRankQA() {
    const authStore = useAuthStore();
    const { organizationId, isReady } = useSEOGuard(authStore);

    // 1. Keyword Management
    const { data: keywords, isLoading: keywordsLoading, refetch: refetchKeywords } = useKeywords(organizationId);
    const createKeyword = useCreateKeyword();

    // State for creating test keyword
    const [testKeywordTerm, setTestKeywordTerm] = useState('QA Test Keyword');

    // 2. Rank History Management
    // Select the first keyword for testing if available
    const [selectedKeywordId, setSelectedKeywordId] = useState<string>('');
    const { data: history, refetch: refetchHistory } = useRankHistory(organizationId, selectedKeywordId);
    const addRankEntry = useAddRankEntry();

    // State for adding rank
    const [rankInput, setRankInput] = useState<number>(10);
    const [dateInput, setDateInput] = useState<string>(new Date().toISOString().split('T')[0]);

    // Helpers
    const handleCreateKeyword = async () => {
        if (!testKeywordTerm) return;
        try {
            await createKeyword.mutateAsync({
                organizationId,
                userId: authStore.firebaseUser?.uid || '',
                keywordData: {
                    term: testKeywordTerm + ' ' + Math.floor(Math.random() * 1000),
                    status: 'tracking',
                    priority: 'medium',
                    pageId: '' // No page linked
                }
            });
            refetchKeywords();
        } catch (e) {
            console.error(e);
            alert('Failed to create keyword');
        }
    };

    const handleAddRank = async () => {
        if (!selectedKeywordId) {
            alert('Please select a keyword first');
            return;
        }
        try {
            await addRankEntry.mutateAsync({
                organizationId,
                keywordId: selectedKeywordId,
                rank: Number(rankInput),
                date: dateInput,
                note: 'QA Test Entry'
            });
            refetchHistory();
        } catch (e) {
            console.error(e);
            alert('Failed to add rank');
        }
    };

    if (!isReady) return <div className="p-8">Loading Auth...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">QA Demo: Manual Rank Tracking</h1>
                    <p className="text-gray-600">Organization ID: {organizationId}</p>
                </div>

                {/* Section 1: Manage Keywords */}
                <Card>
                    <CardBody className="space-y-4">
                        <h2 className="text-lg font-semibold">1. Test Keywords</h2>
                        <div className="flex gap-4 items-center">
                            <Input
                                value={testKeywordTerm}
                                onChange={(e) => setTestKeywordTerm(e.target.value)}
                                placeholder="Test Keyword Base"
                            />
                            <Button onClick={handleCreateKeyword} loading={createKeyword.isPending}>
                                Create Test Keyword
                            </Button>
                        </div>

                        <div className="mt-4 border rounded p-4 bg-gray-100 max-h-60 overflow-y-auto">
                            {keywordsLoading ? (
                                <div>Loading keywords...</div>
                            ) : keywords?.length === 0 ? (
                                <div className="text-gray-500">No keywords found. Create one above.</div>
                            ) : (
                                <ul className="space-y-2">
                                    {keywords?.map(k => (
                                        <li
                                            key={k.id}
                                            className={`p-2 rounded cursor-pointer flex justify-between items-center ${selectedKeywordId === k.id ? 'bg-blue-100 border-blue-300 border' : 'bg-white'
                                                }`}
                                            onClick={() => setSelectedKeywordId(k.id)}
                                        >
                                            <span>
                                                <strong>{k.term}</strong>
                                                <span className="ml-2 text-xs text-gray-500">
                                                    (Current: {k.ranking?.currentPosition ?? '-'}, Best: {k.ranking?.bestPosition ?? '-'})
                                                </span>
                                            </span>
                                            {selectedKeywordId === k.id && <span className="text-blue-600 text-sm">Selected</span>}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </CardBody>
                </Card>

                {/* Section 2: Manage History */}
                <Card>
                    <CardBody className="space-y-4">
                        <h2 className="text-lg font-semibold">2. Add Rank Entry</h2>

                        {!selectedKeywordId ? (
                            <div className="text-yellow-600">Please select a keyword above first.</div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium">Rank (1-100)</label>
                                        <Input
                                            type="number"
                                            value={rankInput}
                                            onChange={(e) => setRankInput(Number(e.target.value))}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Date (YYYY-MM-DD)</label>
                                        <Input
                                            type="date"
                                            value={dateInput}
                                            onChange={(e) => setDateInput(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <Button onClick={handleAddRank} loading={addRankEntry.isPending}>
                                    Add Rank Entry
                                </Button>

                                <div className="mt-4">
                                    <h3 className="text-sm font-semibold mb-2">History Log (Last 30)</h3>
                                    <div className="border rounded p-4 bg-gray-100 max-h-60 overflow-y-auto">
                                        {history?.length === 0 ? (
                                            <div className="text-gray-500">No history yet.</div>
                                        ) : (
                                            <table className="min-w-full text-sm">
                                                <thead>
                                                    <tr className="text-left text-gray-500 border-b">
                                                        <th className="pb-2">Date</th>
                                                        <th className="pb-2">Rank</th>
                                                        <th className="pb-2">Note</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {history?.map(h => (
                                                        <tr key={h.id} className="border-b last:border-0 hover:bg-white">
                                                            <td className="py-2">{h.date}</td>
                                                            <td className="py-2 font-bold">#{h.rank}</td>
                                                            <td className="py-2 text-gray-500">{h.note || '-'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}
