/**
 * ConfirmDialog Component
 * 
 * Confirmation dialog for destructive actions
 */

'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '../primitives/Modal';
import { Button } from '../primitives/Button';

export interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    variant?: 'warning' | 'danger';
    confirmText?: string;
    cancelText?: string;
    loading?: boolean;
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    variant = 'warning',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    loading = false,
}: ConfirmDialogProps) {
    const iconColor = variant === 'danger' ? 'text-red-600' : 'text-yellow-600';
    const buttonVariant = variant === 'danger' ? 'danger' : 'primary';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
            <div className="space-y-4">
                <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 ${iconColor}`}>
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <p className="text-gray-600">{message}</p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        variant={buttonVariant}
                        onClick={onConfirm}
                        loading={loading}
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
