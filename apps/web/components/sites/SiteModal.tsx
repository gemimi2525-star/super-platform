'use client';

/**
 * SiteModal Component
 * Modal for creating and editing SEO sites
 * Fully internationalized
 */

import { useState, useEffect } from 'react';
import { Modal, ModalFooter, Button, FormGroup, Input, Select, Textarea } from '@platform/ui-kit';
import { useTranslations } from 'next-intl';
import type { Site } from '@modules/seo';

export interface SiteModalProps {
    open: boolean;
    mode: 'create' | 'edit';
    initialData?: Site;
    organizationId: string;
    userId: string;
    onClose: () => void;
    onSubmit: (data: SiteFormData) => Promise<void>;
}

export interface SiteFormData {
    name: string;
    domain: string;
    url: string;
    status: 'active' | 'inactive' | 'pending';
    settings?: {
        gscConnected?: boolean;
        gscPropertyUrl?: string;
        gaConnected?: boolean;
        gaPropertyId?: string;
    };
}

export function SiteModal({
    open,
    mode,
    initialData,
    onClose,
    onSubmit
}: SiteModalProps) {
    const t = useTranslations();
    const [formData, setFormData] = useState<SiteFormData>({
        name: '',
        domain: '',
        url: '',
        status: 'active',
    });

    const [errors, setErrors] = useState<Partial<Record<keyof SiteFormData, string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset form when modal opens/closes or mode changes
    useEffect(() => {
        if (open) {
            if (mode === 'edit' && initialData) {
                setFormData({
                    name: initialData.name,
                    domain: initialData.domain,
                    url: initialData.url,
                    status: initialData.status,
                    settings: initialData.settings,
                });
            } else {
                setFormData({
                    name: '',
                    domain: '',
                    url: '',
                    status: 'active',
                });
            }
            setErrors({});
        }
    }, [open, mode, initialData]);

    // Validation
    const validate = (): boolean => {
        const newErrors: Partial<Record<keyof SiteFormData, string>> = {};

        if (!formData.name.trim()) {
            newErrors.name = t('seo.sites.validation.nameRequired');
        }

        if (!formData.domain.trim()) {
            newErrors.domain = t('seo.sites.validation.domainRequired');
        } else {
            // Basic domain validation
            const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i;
            if (!domainRegex.test(formData.domain)) {
                newErrors.domain = t('seo.sites.validation.domainInvalid');
            }
        }

        if (!formData.url.trim()) {
            newErrors.url = t('seo.sites.validation.urlRequired');
        } else {
            // Basic URL validation
            try {
                new URL(formData.url);
            } catch {
                newErrors.url = t('seo.sites.validation.urlInvalid');
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
            // Normalize domain (lowercase, trim)
            const normalizedData = {
                ...formData,
                domain: formData.domain.toLowerCase().trim(),
                url: formData.url.trim(),
            };

            await onSubmit(normalizedData);
            onClose();
        } catch (error) {
            console.error('Failed to save site:', error);
            // You could set a general error here
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={open}
            onClose={onClose}
            title={mode === 'create' ? t('seo.sites.modal.addNew') : t('seo.sites.modal.edit')}
            size="md"
        >
            <div className="space-y-4">
                <FormGroup
                    label={t('seo.sites.modal.nameLabel')}
                    required
                    error={errors.name}
                    helperText={t('seo.sites.modal.nameHelper')}
                >
                    <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder={t('seo.sites.modal.namePlaceholder')}
                        disabled={isSubmitting}
                    />
                </FormGroup>

                <FormGroup
                    label={t('seo.sites.modal.domainLabel')}
                    required
                    error={errors.domain}
                    helperText={t('seo.sites.modal.domainHelper')}
                >
                    <Input
                        value={formData.domain}
                        onChange={(e) => setFormData({ ...formData, domain: e.target.value.toLowerCase() })}
                        placeholder={t('seo.sites.modal.domainPlaceholder')}
                        disabled={isSubmitting}
                    />
                </FormGroup>

                <FormGroup
                    label={t('seo.sites.modal.urlLabel')}
                    required
                    error={errors.url}
                    helperText={t('seo.sites.modal.urlHelper')}
                >
                    <Input
                        value={formData.url}
                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        placeholder={t('seo.sites.modal.urlPlaceholder')}
                        disabled={isSubmitting}
                    />
                </FormGroup>

                <FormGroup
                    label={t('seo.sites.modal.statusLabel')}
                    helperText={t('seo.sites.modal.statusHelper')}
                >
                    <Select
                        value={formData.status}
                        onChange={(value) => setFormData({ ...formData, status: value as typeof formData.status })}
                        options={[
                            { value: 'active', label: t('seo.sites.modal.activeOption') },
                            { value: 'inactive', label: t('seo.sites.modal.inactiveOption') },
                            { value: 'pending', label: t('seo.sites.modal.pendingOption') },
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
                    {mode === 'create' ? t('seo.sites.modal.createButton') : t('seo.sites.modal.saveButton')}
                </Button>
            </ModalFooter>
        </Modal>
    );
}
