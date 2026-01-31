'use client';

/**
 * Edit User Panel Component
 * 
 * STEP 4: OS Overlay Panel Usage
 * 
 * Replaces the old Dialog-based edit modal with an OSOverlayPanel.
 * Features:
 * - OS-grade slide-up animation
 * - Dirty form guard (confirm before discarding changes)
 * - Focus trap + ESC to close
 * - Scroll lock on body
 * - i18n EN/TH
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useTranslations } from '@/lib/i18n';
import toast from 'react-hot-toast';
import {
    OSOverlayPanel,
    OSOverlayPanelHeader,
    OSOverlayPanelBody,
    OSOverlayPanelFooter,
} from '@/modules/design-system/src/patterns/OSOverlayPanel';
import { DiscardChangesDialog } from '@/modules/design-system/src/components/DiscardChangesDialog';
import { Button } from '@/modules/design-system/src/components/Button';
import { Input } from '@/modules/design-system/src/components/Input';
import { Select } from '@/modules/design-system/src/components/Select';
import type { PlatformUser } from '@/lib/platform/types';

export interface EditUserPanelProps {
    isOpen: boolean;
    user: PlatformUser | null;
    onClose: () => void;
    onSuccess: () => void;
    currentUserRole: 'owner' | 'admin' | 'user';
}

export function EditUserPanel({
    isOpen,
    user,
    onClose,
    onSuccess,
    currentUserRole,
}: EditUserPanelProps) {
    const t = useTranslations('v2.users.modal.edit');
    const tPanel = useTranslations('v2.users.panel');
    const tValidation = useTranslations('v2.users.validation');
    const tToast = useTranslations('v2.users.toast');
    const tCommon = useTranslations('v2.panel');

    // Form state (initialized from user prop)
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [role, setRole] = useState<'admin' | 'user'>((user?.role as 'admin' | 'user') || 'user');
    const [enabled, setEnabled] = useState(user?.enabled ?? true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Dirty guard state
    const [showDiscardDialog, setShowDiscardDialog] = useState(false);

    // Reset form when user changes
    React.useEffect(() => {
        if (user) {
            setDisplayName(user.displayName || '');
            setRole((user.role as 'admin' | 'user') || 'user');
            setEnabled(user.enabled ?? true);
            setError(null);
        }
    }, [user]);

    // Check if form has any changes (is dirty)
    const isDirty = useMemo(() => {
        if (!user) return false;
        return (
            displayName !== user.displayName ||
            role !== user.role ||
            enabled !== user.enabled
        );
    }, [user, displayName, role, enabled]);

    // Role options based on current user
    const roleOptions = currentUserRole === 'owner'
        ? [
            { value: 'admin', label: 'Admin' },
            { value: 'user', label: 'User' },
        ]
        : [
            { value: 'user', label: 'User' },
        ];

    // Status options
    const statusOptions = [
        { value: 'true', label: t('status.active') },
        { value: 'false', label: t('status.disabled') },
    ];

    // Permission: only Owner can edit status
    const canEditStatus = currentUserRole === 'owner';

    // Handle close with dirty guard
    const handleCloseRequest = useCallback(() => {
        if (isDirty) {
            setShowDiscardDialog(true);
        } else {
            handleRealClose();
        }
    }, [isDirty]);

    // Actually close and reset form
    const handleRealClose = useCallback(() => {
        setShowDiscardDialog(false);
        setError(null);
        setLoading(false);
        onClose();
    }, [onClose]);

    // Keep editing (dismiss discard dialog)
    const handleKeepEditing = useCallback(() => {
        setShowDiscardDialog(false);
    }, []);

    // Validation
    const validateForm = (): boolean => {
        if (!displayName) {
            setError(tValidation('required'));
            return false;
        }
        return true;
    };

    // Submit
    const handleSubmit = async () => {
        if (!user || !validateForm()) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/platform/users/${user.uid}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    displayName,
                    role,
                    ...(canEditStatus ? { enabled } : {}),
                }),
            });

            const data = await response.json();

            if (response.status === 403) {
                setError(tToast('editForbidden'));
                setLoading(false);
                return;
            }

            if (response.status === 404) {
                setError(tToast('notFound'));
                setLoading(false);
                return;
            }

            if (!response.ok) {
                setError(data.error?.message || tToast('editError'));
                setLoading(false);
                return;
            }

            // Success
            toast.success(tToast('editSuccess'));
            onSuccess();
            handleRealClose();
        } catch (err) {
            setError(tToast('editError'));
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <>
            <OSOverlayPanel
                isOpen={isOpen}
                onClose={handleCloseRequest}
                title={tPanel('editTitle')}
                size="md"
                closeOnBackdropClick={true}
                closeOnEscape={true}
            >
                <OSOverlayPanelHeader
                    title={tPanel('editTitle')}
                    subtitle={tPanel('editSubtitle')}
                    onClose={handleCloseRequest}
                />
                <OSOverlayPanelBody className="overflow-y-auto max-h-[60vh]">
                    <div className="space-y-4">
                        {/* Error message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {/* Email (readonly) */}
                        <div>
                            <label className="text-sm font-medium text-neutral-700">
                                {t('email.label')}
                            </label>
                            <div className="mt-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded text-sm text-neutral-600">
                                {user.email}
                            </div>
                        </div>

                        {/* Display Name */}
                        <Input
                            label={t('displayName.label')}
                            placeholder={t('displayName.placeholder')}
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            required
                            fullWidth
                        />

                        {/* Role */}
                        <Select
                            label={t('role.label')}
                            value={role}
                            onChange={(value) => setRole(value as 'admin' | 'user')}
                            options={roleOptions}
                            fullWidth
                        />

                        {/* Status - Owner only */}
                        {canEditStatus && (
                            <Select
                                label={t('status.label')}
                                value={enabled.toString()}
                                onChange={(value) => setEnabled(value === 'true')}
                                options={statusOptions}
                                fullWidth
                            />
                        )}
                    </div>
                </OSOverlayPanelBody>
                <OSOverlayPanelFooter>
                    <Button variant="ghost" onClick={handleCloseRequest}>
                        {tCommon('cancel')}
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? t('saving') : tCommon('save')}
                    </Button>
                </OSOverlayPanelFooter>
            </OSOverlayPanel>

            {/* Discard Changes Dialog */}
            <DiscardChangesDialog
                isOpen={showDiscardDialog}
                onDiscard={handleRealClose}
                onKeepEditing={handleKeepEditing}
            />
        </>
    );
}
