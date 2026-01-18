'use client';

/**
 * KeywordModal Component
 * Modal for creating and editing SEO keywords
 * Fully internationalized
 */

import { useState, useEffect } from 'react';
import { Modal, ModalFooter, Button, FormGroup, Input, Select } from '@platform/ui-kit';
import { useTranslations } from 'next-intl';
import { usePages } from '@modules/seo';
import type { Keyword } from '@modules/seo';

export interface KeywordModalProps {
    open: boolean;
    mode: 'create' | 'edit';
    initialData?: Keyword;
    organizationId: string;
    userId: string;
    onClose: () => void;
    onSubmit: (data: KeywordFormData) => Promise<void>;
}

export interface KeywordFormData {
    term: string;
    pageId: string;
    priority: 'high' | 'medium' | 'low';
    status: 'tracking' | 'paused';
}

export function KeywordModal({
    open,
    mode,
    initialData,
    organizationId,
    onClose,
    onSubmit
}: KeywordModalProps) {
    const t = useTranslations();
    const { data: pages } = usePages(organizationId);

    const [formData, setFormData] = useState<KeywordFormData>({
        term: '',
        pageId: '',
        priority: 'medium',
        status: 'tracking',
    });

    const [errors, setErrors] = useState<Partial<Record<keyof KeywordFormData, string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset form when modal opens/closes or mode changes
    useEffect(() => {
        if (open) {
            if (mode === 'edit' && initialData) {
                setFormData({
                    term: initialData.term,
                    pageId: initialData.pageId,
                    priority: initialData.priority,
                    status: initialData.status,
                });
            } else {
                setFormData({
                    term: '',
                    pageId: '',
                    priority: 'medium',
                    status: 'tracking',
                });
            }
            setErrors({});
        }
    }, [open, mode, initialData]);

    // Validation
    const validate = (): boolean => {
        const newErrors: Partial<Record<keyof KeywordFormData, string>> = {};

        if (!formData.term.trim()) {
            newErrors.term = t('seo.keywords.validation.termRequired');
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
            await onSubmit({
                ...formData,
                term: formData.term.trim(),
            });
            onClose();
        } catch (error) {
            console.error('Failed to save keyword:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Page options for dropdown
    const pageOptions = [
        { value: '', label: t('seo.keywords.modal.selectPage') },
        ...(pages || []).map(page => ({
            value: page.id,
            label: `${page.title || t('seo.pages.untitled')} (${page.path})`,
        }))
    ];

    return (
        <Modal
            isOpen={open}
            onClose={onClose}
            title={mode === 'create' ? t('seo.keywords.modal.addNew') : t('seo.keywords.modal.edit')}
            size="md"
        >
            <div className="space-y-4">
                {/* Keyword Term */}
                <FormGroup
                    label={t('seo.keywords.modal.termLabel')}
                    required
                    error={errors.term}
                    helperText={t('seo.keywords.modal.termHelper')}
                >
                    <Input
                        value={formData.term}
                        onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                        placeholder={t('seo.keywords.modal.termPlaceholder')}
                        disabled={isSubmitting}
                    />
                </FormGroup>

                {/* Target Page */}
                <FormGroup
                    label={t('seo.keywords.modal.pageLabel')}
                    helperText={t('seo.keywords.modal.pageHelper')}
                >
                    <Select
                        value={formData.pageId}
                        onChange={(value) => setFormData({ ...formData, pageId: typeof value === 'string' ? value : value[0] || '' })}
                        options={pageOptions}
                        disabled={isSubmitting}
                    />
                </FormGroup>

                <div className="grid grid-cols-2 gap-4">
                    {/* Priority */}
                    <FormGroup
                        label={t('seo.keywords.modal.priorityLabel')}
                    >
                        <Select
                            value={formData.priority}
                            onChange={(value) => setFormData({ ...formData, priority: (typeof value === 'string' ? value : value[0]) as any })}
                            options={[
                                { value: 'high', label: t('seo.keywords.modal.priorityHigh') },
                                { value: 'medium', label: t('seo.keywords.modal.priorityMedium') },
                                { value: 'low', label: t('seo.keywords.modal.priorityLow') },
                            ]}
                            disabled={isSubmitting}
                        />
                    </FormGroup>

                    {/* Status */}
                    <FormGroup
                        label={t('seo.keywords.modal.statusLabel')}
                    >
                        <Select
                            value={formData.status}
                            onChange={(value) => setFormData({ ...formData, status: (typeof value === 'string' ? value : value[0]) as any })}
                            options={[
                                { value: 'tracking', label: t('seo.keywords.modal.statusTracking') },
                                { value: 'paused', label: t('seo.keywords.modal.statusPaused') },
                            ]}
                            disabled={isSubmitting}
                        />
                    </FormGroup>
                </div>
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
                    {mode === 'create' ? t('seo.keywords.modal.createButton') : t('seo.keywords.modal.saveButton')}
                </Button>
            </ModalFooter>
        </Modal>
    );
}
