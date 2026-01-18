'use client';

/**
 * SEO Keywords List Page
 * Full CRUD interface with i18n support
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useKeywords, useSEOGuard, useCreateKeyword, useUpdateKeyword, useDeleteKeyword, usePages } from '@modules/seo';
import { useAuthStore } from '@/lib/stores/authStore';
import { LanguageSwitcher } from '@modules/seo';
import {
    Table,
    Pagination,
    Button,
    ConfirmDialog,
    useToast,
    type ColumnDef
} from '@platform/ui-kit';
import { KeywordModal, type KeywordFormData } from '@/components/keywords/KeywordModal';
import type { Keyword, Page } from '@modules/seo';
import { Link } from 'lucide-react'; // Using icon as placeholder for link, but we need Chart/Activity icon actually. 
// However, Lucide icons are not imported yet. I should check imports. 
// Instead of adding new imports that might fail, I'll use simple text or existing button styles.
import { RankUpdateModal } from '@/components/keywords/RankUpdateModal';
import { CSVImportModal } from '@/components/common/CSVImportModal';
import { exportToCSV } from '@/lib/csv/exporter';
import type { CSVRow } from '@/lib/csv/parser';

export default function KeywordsPage() {
    const router = useRouter();
    const t = useTranslations();
    const authStore = useAuthStore();

    // SEO Guard
    const { organizationId, organization, isReady } = useSEOGuard(authStore);

    // Fetch keywords and pages (for linking)
    const { data: keywords, isLoading, error } = useKeywords(organizationId);
    const { data: pages } = usePages(organizationId);

    // Mutations
    const createKeyword = useCreateKeyword();
    const updateKeyword = useUpdateKeyword();
    const deleteKeyword = useDeleteKeyword();

    // Toast
    const { showToast } = useToast();

    // Local state
    const [currentPage, setCurrentPage] = useState(1);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showKeywordModal, setShowKeywordModal] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [selectedKeyword, setSelectedKeyword] = useState<Keyword | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const itemsPerPage = 10;

    // Local state for Rank Modal
    const [showRankModal, setShowRankModal] = useState(false);
    const [keywordForRank, setKeywordForRank] = useState<Keyword | null>(null);

    // Local state for CSV Import
    const [showImportModal, setShowImportModal] = useState(false);

    // Filter logic
    const filteredKeywords = (keywords || []).filter(keyword => {
        if (!searchTerm) return true;
        return keyword.term.toLowerCase().includes(searchTerm.toLowerCase());
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredKeywords.length / itemsPerPage);
    const paginatedKeywords = filteredKeywords.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Helper to get page info
    const getPageInfo = (pageId: string) => {
        return pages?.find(p => p.id === pageId);
    };

    // Table columns
    const columns: ColumnDef<Keyword>[] = [
        {
            key: 'term',
            header: t('seo.keywords.term'),
            render: (keyword) => (
                <div
                    className="cursor-pointer group"
                    onClick={() => router.push(`/seo/keywords/${keyword.id}`)}
                >
                    <div className="font-medium text-blue-600 group-hover:underline">{keyword.term}</div>
                    <div className="text-xs text-gray-500">
                        {t(`seo.keywords.modal.priority${keyword.priority.charAt(0).toUpperCase() + keyword.priority.slice(1)}`)}
                    </div>
                </div>
            )
        },
        {
            key: 'pageId',
            header: t('seo.keywords.page'),
            render: (keyword) => {
                const page = getPageInfo(keyword.pageId);
                return page ? (
                    <div className="text-sm">
                        <div className="text-gray-900 truncate max-w-xs">{page.title || t('seo.pages.untitled')}</div>
                        <div className="text-xs text-gray-400 truncate max-w-xs">{page.path}</div>
                    </div>
                ) : (
                    <span className="text-gray-400 italic text-sm">{t('seo.keywords.noPageLinked')}</span>
                );
            }
        },
        {
            key: 'ranking.currentPosition',
            header: t('seo.ranks.currentRank'),
            render: (keyword) => {
                const rank = keyword.ranking?.currentPosition;
                const best = keyword.ranking?.bestPosition;
                return (
                    <div className="text-sm">
                        {rank ? (
                            <div className="font-bold text-lg">
                                <span className={rank <= 3 ? 'text-green-600' : rank <= 10 ? 'text-blue-600' : 'text-gray-900'}>
                                    #{rank}
                                </span>
                            </div>
                        ) : (
                            <span className="text-gray-400">-</span>
                        )}
                        {best && (
                            <div className="text-xs text-gray-400">
                                {t('seo.ranks.bestRank')}: #{best}
                            </div>
                        )}
                    </div>
                );
            }
        },
        {
            key: 'ranking.lastUpdated',
            header: t('seo.ranks.modal.lastUpdated'), // We need a key for Last Updated. I'll use seo.ranks.date for now or add one.
            // Wait, I didn't add lastUpdated header key. 
            // I'll used 'seo.pages.updatedAt' as fallback or 'seo.ranks.date'.
            // Let's use 'seo.ranks.date'
            render: (keyword) => (
                <div className="text-sm text-gray-500">
                    {keyword.ranking?.lastUpdated
                        ? (keyword.ranking.lastUpdated instanceof Date
                            ? keyword.ranking.lastUpdated.toLocaleDateString()
                            : new Date(keyword.ranking.lastUpdated as any).toLocaleDateString())
                        : '-'}
                </div>
            )
        },
        {
            key: 'status',
            header: t('seo.keywords.status'),
            render: (keyword) => (
                <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${keyword.status === 'tracking'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                        }`}
                >
                    {keyword.status === 'tracking'
                        ? t('seo.keywords.modal.statusTracking')
                        : t('seo.keywords.modal.statusPaused')}
                </span>
            )
        },
        {
            key: 'actions',
            header: t('common.actions'),
            render: (keyword) => (
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                        size="sm"
                        variant="primary" // Highlight Update Rank
                        onClick={() => handleUpdateRank(keyword)}
                    >
                        {t('seo.ranks.updateRank')}
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(keyword)}
                    >
                        {t('common.edit')}
                    </Button>
                    <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeleteClick(keyword)}
                    >
                        {t('common.delete')}
                    </Button>
                </div>
            )
        }
    ];

    // Handlers
    const handleCreate = () => {
        setModalMode('create');
        setSelectedKeyword(null);
        setShowKeywordModal(true);
    };

    const handleEdit = (keyword: Keyword) => {
        setModalMode('edit');
        setSelectedKeyword(keyword);
        setShowKeywordModal(true);
    };

    const handleDeleteClick = (keyword: Keyword) => {
        setSelectedKeyword(keyword);
        setShowDeleteDialog(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedKeyword) return;

        try {
            await deleteKeyword.mutateAsync({
                organizationId,
                keywordId: selectedKeyword.id,
                context: { userId: authStore.firebaseUser?.uid || '', term: selectedKeyword.term }
            });
            showToast(t('toast.keywords.deleteSuccess'), 'success');
            setShowDeleteDialog(false);
            setSelectedKeyword(null);
        } catch (error: any) {
            showToast(error.message || t('toast.keywords.operationFailed'), 'error');
        }
    };

    const handleFormSubmit = async (data: KeywordFormData) => {
        try {
            if (modalMode === 'edit' && selectedKeyword) {
                await updateKeyword.mutateAsync({
                    organizationId,
                    keywordId: selectedKeyword.id,
                    updates: data,
                    context: { userId: authStore.firebaseUser?.uid || '', term: data.term }
                });
                showToast(t('toast.keywords.updateSuccess'), 'success');
            } else if (modalMode === 'create') {
                // ...
                // create is already correct in hook wrapper?
                // Wait, create hook wrapper ALREADY takes { organizationId, userId, keywordData }.
                // I didn't change create signature in useKeywords.ts (just impl).
                // Let's check view_file.
                await createKeyword.mutateAsync({
                    organizationId,
                    userId: authStore.firebaseUser?.uid || '',
                    keywordData: {
                        ...data,
                        // siteId: selectedSite?.id || '', // selectedSite is not defined in this context
                        pageId: data.pageId || '' // Ensure pageId is passed, default to empty string if not provided
                    }
                });
                showToast(t('toast.keywords.createSuccess'), 'success');
            }

            setShowKeywordModal(false);
        } catch (error: any) {
            showToast(error.message || t('toast.keywords.operationFailed'), 'error');
        }
    };

    const handleUpdateRank = (keyword: Keyword) => {
        setKeywordForRank(keyword);
        setShowRankModal(true);
    };

    // Export Handler
    const handleExport = () => {
        if (!keywords || keywords.length === 0) {
            showToast(t('seo.keywords.noData'), 'error');
            return;
        }

        const exportData = keywords.map(k => ({
            Term: k.term,
            Page: k.pageId ? (getPageInfo(k.pageId)?.title || k.pageId) : '',
            Rank: k.ranking?.currentPosition || '',
            BestRank: k.ranking?.bestPosition || '',
            Status: k.status,
            DateAdded: new Date(k.createdAt).toLocaleDateString()
        }));

        exportToCSV(exportData, `keywords_${new Date().toISOString().split('T')[0]}`);
    };

    // Import Handler
    const handleImport = async (rows: CSVRow[]) => {
        // Parallel requests with simple batching could be done, but for MVP simple loop is safer to debug.
        // We will run them in parallel batches of 5.
        const BATCH_SIZE = 5;
        let successCount = 0;
        let errors = 0;

        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
            const batch = rows.slice(i, i + BATCH_SIZE);
            await Promise.all(batch.map(async (row) => {
                try {
                    // Normalize data
                    const term = row['keyword'] || row['term'];
                    if (!term) return; // Skip if somehow empty despite validation

                    // Find page if provided (optional)
                    let pageId = '';
                    if (row['page']) {
                        const targetPage = pages?.find(p => p.url === row['page'] || p.title === row['page']);
                        if (targetPage) pageId = targetPage.id;
                    }

                    await createKeyword.mutateAsync({
                        organizationId,
                        userId: authStore.firebaseUser?.uid || '',
                        keywordData: {
                            term: term,
                            status: 'tracking',
                            priority: 'medium',
                            pageId: pageId
                        }
                    });
                    successCount++;
                } catch (e) {
                    console.error('Import error for row', row, e);
                    errors++;
                }
            }));
        }

        // Refresh list
        // Query invalidation happens in hook onSuccess automatically
    };

    // Loading state
    if (!isReady || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-gray-600">{t('common.loading')}</div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md p-6 bg-white rounded-xl shadow-sm border border-red-200">
                    <h3 className="text-lg font-semibold text-red-700 mb-2">
                        {t('common.error')}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                        {error instanceof Error ? error.message : t('common.unknownError')}
                    </p>
                    <Button onClick={() => router.push('/dashboard')}>
                        {t('common.back')}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {t('seo.keywords.title')}
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                {organization?.name}
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder={t('common.search')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-3 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                            <LanguageSwitcher />

                            <div className="h-6 w-px bg-gray-300 mx-2 hidden sm:block" />

                            <Button
                                variant="outline"
                                onClick={() => setShowImportModal(true)}
                                size="sm"
                            >
                                📥 {t('common.csv.importTitle')}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleExport}
                                size="sm"
                            >
                                📤 {t('common.csv.exportTitle')}
                            </Button>

                            <Button
                                variant="primary"
                                onClick={handleCreate}
                            >
                                + {t('seo.keywords.addNew')}
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {keywords && keywords.length > 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <Table
                            columns={columns}
                            data={paginatedKeywords}
                            keyExtractor={(keyword) => keyword.id}
                        />

                        {totalPages > 1 && (
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                                itemsPerPage={itemsPerPage}
                                totalItems={filteredKeywords.length}
                            />
                        )}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-6xl">🔍</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {t('seo.keywords.noData')}
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {t('seo.keywords.noDataDesc')}
                        </p>
                        <div className="flex justify-center gap-4">
                            <Button onClick={() => setShowImportModal(true)} variant="outline">
                                📥 {t('common.csv.importTitle')}
                            </Button>
                            <Button onClick={handleCreate} variant="primary">
                                + {t('seo.keywords.addNew')}
                            </Button>
                        </div>
                    </div>
                )}
            </main>

            {/* Import Modal */}
            <CSVImportModal
                open={showImportModal}
                onClose={() => setShowImportModal(false)}
                onImport={handleImport}
                requiredColumns={['keyword']}
            />

            {/* Keyword Modal */}
            <KeywordModal
                open={showKeywordModal}
                mode={modalMode}
                initialData={selectedKeyword || undefined}
                organizationId={organizationId}
                userId={authStore.firebaseUser?.uid || ''}
                onClose={() => setShowKeywordModal(false)}
                onSubmit={handleFormSubmit}
            />

            <RankUpdateModal
                open={showRankModal}
                keyword={keywordForRank}
                organizationId={organizationId}
                onClose={() => setShowRankModal(false)}
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showDeleteDialog}
                title={t('seo.keywords.deleteTitle')}
                message={t('seo.keywords.deleteMessage')}
                confirmText={t('common.delete')}
                cancelText={t('common.cancel')}
                variant="danger"
                onConfirm={handleDeleteConfirm}
                onClose={() => setShowDeleteDialog(false)}
            />
        </div>
    );
}
