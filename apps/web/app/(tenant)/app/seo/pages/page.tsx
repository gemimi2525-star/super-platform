'use client';

/**
 * SEO Pages List Page
 * Full CRUD interface with i18n support
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePages, useSEOGuard, useCreatePage, useUpdatePage, useDeletePage } from '@modules/seo';
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
import { PageModal, type PageFormData } from '@/components/pages/PageModal';
import type { Page } from '@modules/seo';

export default function PagesPage() {
    const router = useRouter();
    const t = useTranslations();
    const authStore = useAuthStore();

    // SEO Guard
    const { organizationId, organization, isReady } = useSEOGuard(authStore);

    // Fetch pages
    const { data: pages, isLoading, error } = usePages(organizationId);

    // Mutations
    const createPage = useCreatePage();
    const updatePage = useUpdatePage();
    const deletePage = useDeletePage();

    // Toast
    const { showToast } = useToast();

    // Local state
    const [currentPage, setCurrentPage] = useState(1);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showPageModal, setShowPageModal] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [selectedPage, setSelectedPage] = useState<Page | null>(null);
    const itemsPerPage = 10;

    // Pagination logic
    const totalPages = Math.ceil((pages?.length || 0) / itemsPerPage);
    const paginatedPages = pages?.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    ) || [];

    // Table columns
    const columns: ColumnDef<Page>[] = [
        {
            key: 'title',
            header: t('seo.pages.pageTitle'),
            render: (page) => (
                <div>
                    <div className="font-medium text-gray-900">{page.title || t('seo.pages.untitled')}</div>
                    <div className="text-sm text-gray-500">{page.path}</div>
                </div>
            )
        },
        {
            key: 'url',
            header: t('seo.pages.url'),
            render: (page) => (
                <a
                    href={page.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline truncate block max-w-xs"
                    onClick={(e) => e.stopPropagation()}
                >
                    {page.url}
                </a>
            )
        },
        {
            key: 'status',
            header: t('seo.pages.status'),
            render: (page) => (
                <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${page.status === 'published'
                        ? 'bg-green-100 text-green-800'
                        : page.status === 'draft'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                >
                    {page.status === 'published'
                        ? t('seo.pages.published')
                        : page.status === 'draft'
                            ? t('seo.pages.draft')
                            : t('seo.pages.archived')}
                </span>
            )
        },
        {
            key: 'updatedAt',
            header: t('seo.pages.updatedAt'),
            render: (page) => new Date(page.updatedAt).toLocaleDateString()
        },
        {
            key: 'actions',
            header: t('common.actions'),
            render: (page) => (
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(page)}
                    >
                        {t('common.edit')}
                    </Button>
                    <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeleteClick(page)}
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
        setSelectedPage(null);
        setShowPageModal(true);
    };

    const handleEdit = (page: Page) => {
        setModalMode('edit');
        setSelectedPage(page);
        setShowPageModal(true);
    };

    const handleDeleteClick = (page: Page) => {
        setSelectedPage(page);
        setShowDeleteDialog(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedPage) return;

        try {
            await deletePage.mutateAsync({
                pageId: selectedPage.id,
                context: { organizationId, userId: authStore.firebaseUser!.uid, title: selectedPage.title || '' }
            });
            showToast(t('toast.pages.deleteSuccess'), 'success');
            setShowDeleteDialog(false);
            setSelectedPage(null);
        } catch (error: any) {
            showToast(error.message || t('toast.pages.deleteError'), 'error');
        }
    };

    const handlePageSubmit = async (data: PageFormData) => {
        try {
            if (modalMode === 'create') {
                await createPage.mutateAsync({
                    organizationId,
                    userId: authStore.firebaseUser?.uid || '',
                    pageData: data,
                });
                showToast(t('toast.pages.createSuccess'), 'success');
            } else if (selectedPage) {
                await updatePage.mutateAsync({
                    pageId: selectedPage.id,
                    updates: data,
                    context: { organizationId, userId: authStore.firebaseUser!.uid, title: data.title || '' }
                });
                showToast(t('toast.pages.updateSuccess'), 'success');
            }

            setShowPageModal(false);
        } catch (error: any) {
            showToast(error.message || t('toast.pages.operationFailed'), 'error');
        }
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
                                {t('seo.pages.title')}
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                {organization?.name}
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            <LanguageSwitcher />
                            <Button
                                variant="outline"
                                onClick={() => router.push('/dashboard')}
                            >
                                ← {t('common.back')}
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleCreate}
                            >
                                + {t('seo.pages.addNew')}
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {pages && pages.length > 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <Table
                            columns={columns}
                            data={paginatedPages}
                            keyExtractor={(page) => page.id}
                        />

                        {totalPages > 1 && (
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                                itemsPerPage={itemsPerPage}
                                totalItems={pages.length}
                            />
                        )}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-6xl">📄</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {t('seo.pages.noData')}
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {t('seo.pages.noDataDesc')}
                        </p>
                        <Button onClick={handleCreate} variant="primary">
                            + {t('seo.pages.addNew')}
                        </Button>
                    </div>
                )}
            </main>

            {/* Page Modal */}
            <PageModal
                open={showPageModal}
                mode={modalMode}
                initialData={selectedPage || undefined}
                organizationId={organizationId}
                userId={authStore.firebaseUser?.uid || ''}
                onClose={() => setShowPageModal(false)}
                onSubmit={handlePageSubmit}
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showDeleteDialog}
                title={t('seo.pages.deleteTitle')}
                message={t('seo.pages.deleteMessage')}
                confirmText={t('common.delete')}
                cancelText={t('common.cancel')}
                variant="danger"
                onConfirm={handleDeleteConfirm}
                onClose={() => setShowDeleteDialog(false)}
            />
        </div>
    );
}
