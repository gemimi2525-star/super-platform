'use client';

/**
 * SEO Sites Page with CRUD Modal
 * Using UI Kit components: Table, Pagination, Button, SiteModal
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useSites, useSEOGuard, useCreateSite, useUpdateSite, useDeleteSite } from '@modules/seo';
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
import { SiteModal, type SiteFormData } from '@/components/sites/SiteModal';
import type { Site } from '@modules/seo';

export default function SitesPage() {
    const router = useRouter();
    const t = useTranslations();
    const authStore = useAuthStore();

    // SEO Guard
    const { organizationId, organization, isReady } = useSEOGuard(authStore);

    // Fetch sites
    const { data: sites, isLoading, error } = useSites(organizationId);

    // Mutations
    const createSite = useCreateSite();
    const updateSite = useUpdateSite();
    const deleteSite = useDeleteSite();

    // Toast
    const { showToast } = useToast();

    // Local state
    const [currentPage, setCurrentPage] = useState(1);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showSiteModal, setShowSiteModal] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [selectedSite, setSelectedSite] = useState<Site | null>(null);
    const itemsPerPage = 10;

    // Pagination logic
    const totalPages = Math.ceil((sites?.length || 0) / itemsPerPage);
    const paginatedSites = sites?.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    ) || [];

    // Table columns
    const columns: ColumnDef<Site>[] = [
        {
            key: 'name',
            header: t('seo.sites.name', { defaultValue: 'ชื่อเว็บไซต์' }),
            render: (site) => (
                <div>
                    <div className="font-medium text-gray-900">{site.name}</div>
                    <div className="text-sm text-gray-500">{site.domain}</div>
                </div>
            )
        },
        {
            key: 'url',
            header: t('seo.sites.url', { defaultValue: 'URL' }),
            render: (site) => (
                <a
                    href={site.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                >
                    {site.url}
                </a>
            )
        },
        {
            key: 'status',
            header: t('seo.sites.status', { defaultValue: 'สถานะ' }),
            render: (site) => (
                <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${site.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : site.status === 'inactive'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                >
                    {site.status === 'active'
                        ? t('seo.sites.active', { defaultValue: 'ใช้งาน' })
                        : site.status === 'inactive'
                            ? t('seo.sites.inactive', { defaultValue: 'ไม่ใช้งาน' })
                            : t('seo.sites.pending', { defaultValue: 'รอดำเนินการ' })}
                </span>
            )
        },
        {
            key: 'createdAt',
            header: t('seo.sites.createdAt', { defaultValue: 'วันที่สร้าง' }),
            render: (site) => new Date(site.createdAt).toLocaleDateString('th-TH')
        },
        {
            key: 'actions',
            header: t('common.actions', { defaultValue: 'จัดการ' }),
            render: (site) => (
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(site)}
                    >
                        {t('common.edit', { defaultValue: 'แก้ไข' })}
                    </Button>
                    <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeleteClick(site)}
                    >
                        {t('common.delete', { defaultValue: 'ลบ' })}
                    </Button>
                </div>
            )
        }
    ];

    // Handlers
    const handleRowClick = (site: Site) => {
        router.push(`/seo/sites/${site.id}`);
    };

    const handleCreate = () => {
        setModalMode('create');
        setSelectedSite(null);
        setShowSiteModal(true);
    };

    const handleEdit = (site: Site) => {
        setModalMode('edit');
        setSelectedSite(site);
        setShowSiteModal(true);
    };

    const handleDeleteClick = (site: Site) => {
        setSelectedSite(site);
        setShowDeleteDialog(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedSite) return;

        try {
            await deleteSite.mutateAsync(selectedSite.id);
            showToast(t('toast.sites.deleteSuccess'), 'success');
            setShowDeleteDialog(false);
            setSelectedSite(null);
        } catch (error: any) {
            showToast(error.message || t('toast.sites.deleteError'), 'error');
        }
    };

    const handleSiteSubmit = async (data: SiteFormData) => {
        try {
            if (modalMode === 'create') {
                await createSite.mutateAsync({
                    organizationId,
                    userId: authStore.firebaseUser?.uid || '',
                    siteData: data,
                });
                showToast(t('toast.sites.createSuccess'), 'success');
            } else if (selectedSite) {
                await updateSite.mutateAsync({
                    siteId: selectedSite.id,
                    updates: data,
                });
                showToast(t('toast.sites.updateSuccess'), 'success');
            }

            // Close modal on success
            setShowSiteModal(false);
        } catch (error: any) {
            showToast(error.message || t('toast.sites.operationFailed'), 'error');
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
                    <Button onClick={() => router.push('/organizations')}>
                        {t('dashboard.organizations')}
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
                                {t('seo.sites.title', { defaultValue: 'เว็บไซต์ทั้งหมด' })}
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
                                ← {t('common.back', { defaultValue: 'กลับ' })}
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleCreate}
                            >
                                + {t('seo.sites.addNew', { defaultValue: 'เพิ่มเว็บไซต์' })}
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {sites && sites.length > 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <Table
                            columns={columns}
                            data={paginatedSites}
                            keyExtractor={(site) => site.id}
                            onRowClick={handleRowClick}
                        />

                        {totalPages > 1 && (
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                                itemsPerPage={itemsPerPage}
                                totalItems={sites.length}
                            />
                        )}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-6xl">🌐</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {t('seo.sites.noData', { defaultValue: 'ยังไม่มีเว็บไซต์' })}
                        </h3>
                        <p className="text-gray-600 mb-4">
                            {t('seo.sites.noDataDesc', { defaultValue: 'เริ่มต้นโดยการเพิ่มเว็บไซต์แรกของคุณ' })}
                        </p>
                        <Button variant="primary" onClick={handleCreate}>
                            + {t('seo.sites.addNew', { defaultValue: 'เพิ่มเว็บไซต์ใหม่' })}
                        </Button>
                    </div>
                )}
            </main>

            {/* Site Modal */}
            <SiteModal
                open={showSiteModal}
                mode={modalMode}
                initialData={selectedSite || undefined}
                organizationId={organizationId}
                userId={authStore.firebaseUser?.uid || ''}
                onClose={() => setShowSiteModal(false)}
                onSubmit={handleSiteSubmit}
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showDeleteDialog}
                onClose={() => {
                    setShowDeleteDialog(false);
                    setSelectedSite(null);
                }}
                onConfirm={handleDeleteConfirm}
                title={t('seo.sites.deleteTitle', { defaultValue: 'ลบเว็บไซต์' })}
                message={t('seo.sites.deleteMessage', {
                    defaultValue: 'คุณแน่ใจหรือไม่ว่าต้องการลบเว็บไซต์นี้? การดำเนินการนี้ไม่สามารถยกเลิกได้',
                    site: selectedSite?.name || ''
                })}
                variant="danger"
                confirmText={t('common.delete', { defaultValue: 'ลบ' })}
                cancelText={t('common.cancel', { defaultValue: 'ยกเลิก' })}
            />
        </div>
    );
}
