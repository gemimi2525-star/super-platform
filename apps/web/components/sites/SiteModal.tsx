'use client';

/**
 * SiteModal Component
 * Modal for creating and editing SEO sites
 */

import { useState, useEffect } from 'react';
import { Modal, ModalFooter, Button, FormGroup, Input, Select, Textarea } from '@platform/ui-kit';
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
            newErrors.name = 'Site name is required';
        }

        if (!formData.domain.trim()) {
            newErrors.domain = 'Domain is required';
        } else {
            // Basic domain validation
            const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i;
            if (!domainRegex.test(formData.domain)) {
                newErrors.domain = 'Invalid domain format';
            }
        }

        if (!formData.url.trim()) {
            newErrors.url = 'URL is required';
        } else {
            // Basic URL validation
            try {
                new URL(formData.url);
            } catch {
                newErrors.url = 'Invalid URL format';
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
            title={mode === 'create' ? 'Add New Site' : 'Edit Site'}
            size="md"
        >
            <div className="space-y-4">
                <FormGroup
                    label="Site Name"
                    required
                    error={errors.name}
                    helperText="A friendly name for this website"
                >
                    <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="My Website"
                        disabled={isSubmitting}
                    />
                </FormGroup>

                <FormGroup
                    label="Domain"
                    required
                    error={errors.domain}
                    helperText="Domain without protocol (e.g., example.com)"
                >
                    <Input
                        value={formData.domain}
                        onChange={(e) => setFormData({ ...formData, domain: e.target.value.toLowerCase() })}
                        placeholder="example.com"
                        disabled={isSubmitting}
                    />
                </FormGroup>

                <FormGroup
                    label="Full URL"
                    required
                    error={errors.url}
                    helperText="Complete URL with protocol"
                >
                    <Input
                        value={formData.url}
                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        placeholder="https://example.com"
                        disabled={isSubmitting}
                    />
                </FormGroup>

                <FormGroup
                    label="Status"
                    helperText="Set site monitoring status"
                >
                    <Select
                        value={formData.status}
                        onChange={(value) => setFormData({ ...formData, status: value as typeof formData.status })}
                        options={[
                            { value: 'active', label: 'Active' },
                            { value: 'inactive', label: 'Inactive' },
                            { value: 'pending', label: 'Pending' },
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
                    Cancel
                </Button>
                <Button
                    variant="primary"
                    onClick={handleSubmit}
                    loading={isSubmitting}
                    disabled={isSubmitting}
                >
                    {mode === 'create' ? 'Create Site' : 'Save Changes'}
                </Button>
            </ModalFooter>
        </Modal>
    );
}
