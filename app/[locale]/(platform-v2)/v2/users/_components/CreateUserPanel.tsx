'use client';

/**
 * Create User Panel Component
 * 
 * STEP 4: OS Overlay Panel Usage
 * 
 * Replaces the old Dialog-based modal with an OSOverlayPanel.
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

interface CreatedUserResult {
    email: string;
    temporaryPassword: string;
}

export interface CreateUserPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    currentUserRole: 'owner' | 'admin' | 'user';
}

export function CreateUserPanel({
    isOpen,
    onClose,
    onSuccess,
    currentUserRole,
}: CreateUserPanelProps) {
    const t = useTranslations('v2.users.modal.create');
    const tPanel = useTranslations('v2.users.panel');
    const tValidation = useTranslations('v2.users.validation');
    const tToast = useTranslations('v2.users.toast');
    const tCommon = useTranslations('v2.panel');

    // Form state
    const [email, setEmail] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [role, setRole] = useState<'admin' | 'user'>('user');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [createdUser, setCreatedUser] = useState<CreatedUserResult | null>(null);

    // Dirty guard state
    const [showDiscardDialog, setShowDiscardDialog] = useState(false);

    // Check if form has any changes (is dirty)
    const isDirty = useMemo(() => {
        return email.length > 0 || displayName.length > 0 || role !== 'user';
    }, [email, displayName, role]);

    // Role options based on current user
    const roleOptions = currentUserRole === 'owner'
        ? [
            { value: 'admin', label: 'Admin' },
            { value: 'user', label: 'User' },
        ]
        : [
            { value: 'user', label: 'User' },
        ];

    // Handle close with dirty guard
    const handleCloseRequest = useCallback(() => {
        if (isDirty && !createdUser) {
            setShowDiscardDialog(true);
        } else {
            handleRealClose();
        }
    }, [isDirty, createdUser]);

    // Actually close and reset form
    const handleRealClose = useCallback(() => {
        setShowDiscardDialog(false);
        setEmail('');
        setDisplayName('');
        setRole('user');
        setError(null);
        setCreatedUser(null);
        setLoading(false);
        onClose();
    }, [onClose]);

    // Keep editing (dismiss discard dialog)
    const handleKeepEditing = useCallback(() => {
        setShowDiscardDialog(false);
    }, []);

    // Validation
    const validateForm = (): boolean => {
        if (!email) {
            setError(tValidation('required'));
            return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError(tValidation('invalidEmail'));
            return false;
        }
        if (!displayName) {
            setError(tValidation('required'));
            return false;
        }
        return true;
    };

    // Submit
    const handleSubmit = async () => {
        if (!validateForm()) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/platform/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, displayName, role }),
            });

            const data = await response.json();

            if (response.status === 403) {
                setError(tToast('forbidden'));
                setLoading(false);
                return;
            }

            if (response.status === 409) {
                setError(tValidation('emailInUse'));
                setLoading(false);
                return;
            }

            if (!response.ok) {
                setError(data.error?.message || tToast('createError'));
                setLoading(false);
                return;
            }

            // Success - show credentials
            setCreatedUser({
                email: data.user.email,
                temporaryPassword: data.temporaryPassword,
            });
            toast.success(tToast('createSuccess'));
        } catch (err) {
            setError(tToast('createError'));
            setLoading(false);
        }
    };

    // Success view - show credentials
    if (createdUser) {
        return (
            <>
                <OSOverlayPanel
                    isOpen={isOpen}
                    onClose={handleRealClose}
                    title={t('success.title')}
                    size="md"
                    closeOnBackdropClick={false}
                    closeOnEscape={false}
                >
                    <OSOverlayPanelHeader
                        title={t('success.title')}
                        onClose={handleRealClose}
                    />
                    <OSOverlayPanelBody>
                        <div className="space-y-4">
                            {/* Warning */}
                            <div className="bg-yellow-50 border border-yellow-200 px-4 py-3 rounded-lg">
                                <p className="text-sm text-yellow-800 font-semibold">
                                    {t('success.warning')}
                                </p>
                            </div>

                            {/* Credentials */}
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm font-medium text-neutral-700">
                                        {t('success.email')}
                                    </label>
                                    <code className="block mt-1 bg-neutral-100 px-3 py-2 rounded text-sm font-mono">
                                        {createdUser.email}
                                    </code>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-neutral-700">
                                        {t('success.password')}
                                    </label>
                                    <code className="block mt-1 bg-neutral-100 px-3 py-2 rounded text-sm font-mono">
                                        {createdUser.temporaryPassword}
                                    </code>
                                </div>
                            </div>
                        </div>
                    </OSOverlayPanelBody>
                    <OSOverlayPanelFooter>
                        <Button
                            variant="primary"
                            onClick={() => {
                                onSuccess();
                                handleRealClose();
                            }}
                        >
                            {t('success.done')}
                        </Button>
                    </OSOverlayPanelFooter>
                </OSOverlayPanel>
            </>
        );
    }

    // Form view
    return (
        <>
            <OSOverlayPanel
                isOpen={isOpen}
                onClose={handleCloseRequest}
                title={tPanel('createTitle')}
                size="md"
                closeOnBackdropClick={true}
                closeOnEscape={true}
            >
                <OSOverlayPanelHeader
                    title={tPanel('createTitle')}
                    subtitle={tPanel('createSubtitle')}
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

                        {/* Email */}
                        <Input
                            label={t('email.label')}
                            placeholder={t('email.placeholder')}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            type="email"
                            required
                            fullWidth
                        />

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

                        {/* Note */}
                        <p className="text-xs text-neutral-500">
                            {t('role.note')}
                        </p>
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
                        {loading ? t('creating') : tCommon('create')}
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
