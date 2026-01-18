'use client';

/**
 * PageModal Component
 * Modal for creating and editing SEO pages
 * Fully internationalized
 */

import { useState, useEffect } from 'react';
import { Modal, ModalFooter, Button, FormGroup, Input, Select } from '@platform/ui-kit';
import { useTranslations } from 'next-intl';
import { useSites } from '@modules/seo';
import type { Page } from '@modules/seo';

export interface PageModalProps {
    open: boolean;
    mode: 'create' | 'edit';
    initialData?: Page;
    organizationId: string;
    userId: string;
    onClose: () => void;
    onSubmit: (data: PageFormData) => Promise<void>;
}

export interface PageFormData {
    siteId: string;
    url: string;
    path: string;
    title?: string;
    status: 'published' | 'draft' | 'archived';
}

export function PageModal({
    open,
    mode,
    initialData,
    organizationId,
    onClose,
    onSubmit
}: PageModalProps) {
    const t = useTranslations();
    const { data: sites } = useSites(organizationId);

    const [formData, setFormData] = useState<PageFormData>({
        siteId: '',
        url: '',
        path: '',
        title: '',
        status: 'published',
    });

    const [errors, setErrors] = useState<Partial<Record<keyof PageFormData, string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset form when modal opens/closes or mode changes
    useEffect(() => {
        if (open) {
            if (mode === 'edit' && initialData) {
                setFormData({
                    siteId: initialData.siteId,
                    url: initialData.url,
                    path: initialData.path,
                    title: initialData.title || '',
                    status: initialData.status,
                });
            } else {
                setFormData({
                    siteId: '',
                    url: '',
                    path: '',
                    title: '',
                    status: 'published',
                });
            }
            setErrors({});
        }
    }, [open, mode, initialData]);

    // Validation
    const validate = (): boolean => {
        const newErrors: Partial<Record<keyof PageFormData, string>> = {};

        if (!formData.siteId.trim()) {
            newErrors.siteId = t('seo.pages.validation.siteRequired');
        }

        if (!formData.path.trim()) {
            newErrors.path = t('seo.pages.validation.pathRequired');
        } else {
            // Basic path validation (should start with /)
            if (!formData.path.startsWith('/')) {
                newErrors.path = t('seo.pages.validation.pathInvalid');
            }
        }

        if (!formData.url.trim()) {
            newErrors.url = t('seo.pages.validation.urlRequired');
        } else {
            // Basic URL validation
            try {
                new URL(formData.url);
            } catch {
                newErrors.url = t('seo.pages.validation.urlInvalid');
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async () => {
        if (!validate()) {
            return;
        }

        setIsSubmitting(true);
        try {
            // Normalize data
            const normalizedData = {
                ...formData,
                url: formData.url.trim(),
                path: formData.path.trim(),
                title: formData.title?.trim() || undefined,
            };

            await onSubmit(normalizedData);
            onClose();
        } catch (error) {
            console.error('Failed to save page:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Site options for dropdown
    const siteOptions = (sites || []).map(site => ({
        value: site.id,
        label: `${site.name} (${site.domain})`,
    }));

    return (
        <Modal
            isOpen={open}
            onClose={onClose}
            title={mode === 'create' ? t('seo.pages.modal.addNew') : t('seo.pages.modal.edit')}
            size="md"
        >
            <div className="space-y-4">
                {/* Site Select */}
                <FormGroup
                    label={t('seo.pages.modal.siteLabel')}
                    required
                    error={errors.siteId}
                    helperText={t('seo.pages.modal.siteHelper')}
                >
                    <Select
                        value={formData.siteId}
                        onChange={(value) => setFormData({ ...formData, siteId: typeof value === 'string' ? value : value[0] || '' })}
                        options={siteOptions}
                        disabled={isSubmitting || mode === 'edit'} // Can't change site after creation
                    />
                </FormGroup>

                {/* Title */}
                <FormGroup
                    label={t('seo.pages.modal.titleLabel')}
                    helperText={t('seo.pages.modal.titleHelper')}
                >
                    <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder={t('seo.pages.modal.titlePlaceholder')}
                        disabled={isSubmitting}
                    />
                </FormGroup>

                {/* Path/Slug */}
                <FormGroup
                    label={t('seo.pages.modal.pathLabel')}
                    required
                    error={errors.path}
                    helperText={t('seo.pages.modal.pathHelper')}
                >
                    <Input
                        value={formData.path}
                        onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                        placeholder={t('seo.pages.modal.pathPlaceholder')}
                        disabled={isSubmitting}
                    />
                </FormGroup>

                {/* URL */}
                <FormGroup
                    label={t('seo.pages.modal.urlLabel')}
                    required
                    error={errors.url}
                    helperText={t('seo.pages.modal.urlHelper')}
                >
                    <Input
                        value={formData.url}
                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        placeholder={t('seo.pages.modal.urlPlaceholder')}
                        disabled={isSubmitting}
                    />
                </FormGroup>

                {/* Status */}
                <FormGroup
                    label={t('seo.pages.modal.statusLabel')}
                    helperText={t('seo.pages.modal.statusHelper')}
                >
                    <Select
                        value={formData.status}
                        onChange={(value) => setFormData({ ...formData, status: value as typeof formData.status })}
                        options={[
                            { value: 'published', label: t('seo.pages.modal.publishedOption') },
                            { value: 'draft', label: t('seo.pages.modal.draftOption') },
                            { value: 'archived', label: t('seo.pages.modal.archivedOption') },
                        ]}
                        disabled={isSubmitting}
                    />
                </FormGroup>
            </div>

            <ModalFooter>
                <Button
                    variant="outline"
                    onClick={onClose}
                    disabled={isSubmitting}
                >
                    {t('common.cancel')}
                </Button>
                <Button
                    variant="primary"
                    onClick={handleSubmit}
                    loading={isSubmitting}
                    disabled={isSubmitting}
                >
                    {mode === 'create' ? t('seo.pages.modal.createButton') : t('seo.pages.modal.saveButton')}
                </Button>
            </ModalFooter>
        </Modal>
    );
}
