'use client';

/**
 * Discard Changes Dialog Component
 * 
 * STEP 4: OS Overlay Panel Usage
 * 
 * A confirmation dialog for unsaved form changes (dirty guard).
 * Used when user tries to close a panel with unsaved changes.
 * 
 * PRINCIPLES:
 * - Clear, non-destructive language
 * - Two clear options: Discard or Keep Editing
 * - Localized (EN/TH)
 * - Animation matches OS motion spec
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OS_DURATION, OS_EASING } from '@/lib/motion/os-motion';
import { useTranslations } from '@/lib/i18n';
import { AlertTriangle } from 'lucide-react';

// Backdrop animation
const backdropVariants = {
    initial: { opacity: 0 },
    enter: {
        opacity: 1,
        transition: { duration: OS_DURATION.fast }
    },
    exit: {
        opacity: 0,
        transition: { duration: OS_DURATION.fast }
    },
};

// Dialog animation
const dialogVariants = {
    initial: {
        opacity: 0,
        scale: 0.95,
        y: -10,
    },
    enter: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            duration: OS_DURATION.normal,
            ease: OS_EASING.smooth,
        },
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        transition: {
            duration: OS_DURATION.fast,
            ease: OS_EASING.accelerate,
        },
    },
};

export interface DiscardChangesDialogProps {
    /** Whether the dialog is open */
    isOpen: boolean;
    /** Called when user confirms discard */
    onDiscard: () => void;
    /** Called when user wants to keep editing */
    onKeepEditing: () => void;
}

export function DiscardChangesDialog({
    isOpen,
    onDiscard,
    onKeepEditing,
}: DiscardChangesDialogProps) {
    const t = useTranslations('v2.panel');

    return (
        <AnimatePresence>
            {isOpen && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center"
                    role="alertdialog"
                    aria-modal="true"
                    aria-labelledby="discard-dialog-title"
                    aria-describedby="discard-dialog-desc"
                >
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/30"
                        variants={backdropVariants}
                        initial="initial"
                        animate="enter"
                        exit="exit"
                    />

                    {/* Dialog */}
                    <motion.div
                        className="
                            relative
                            w-full max-w-sm mx-4
                            bg-white
                            rounded-xl
                            shadow-2xl
                            overflow-hidden
                        "
                        variants={dialogVariants}
                        initial="initial"
                        animate="enter"
                        exit="exit"
                    >
                        {/* Content */}
                        <div className="p-6 text-center">
                            {/* Warning Icon */}
                            <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-full bg-amber-100">
                                <AlertTriangle className="w-6 h-6 text-amber-600" />
                            </div>

                            {/* Title */}
                            <h3
                                id="discard-dialog-title"
                                className="text-lg font-semibold text-neutral-900"
                            >
                                {t('discardTitle')}
                            </h3>

                            {/* Description */}
                            <p
                                id="discard-dialog-desc"
                                className="text-sm text-neutral-600 mt-2"
                            >
                                {t('discardDesc')}
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex border-t border-neutral-100">
                            {/* Keep Editing (secondary) */}
                            <button
                                type="button"
                                onClick={onKeepEditing}
                                className="
                                    flex-1 py-3 px-4
                                    text-sm font-medium text-neutral-600
                                    hover:bg-neutral-50
                                    transition-colors
                                    border-r border-neutral-100
                                "
                            >
                                {t('discardKeepEditing')}
                            </button>

                            {/* Discard (primary/destructive) */}
                            <button
                                type="button"
                                onClick={onDiscard}
                                className="
                                    flex-1 py-3 px-4
                                    text-sm font-medium text-red-600
                                    hover:bg-red-50
                                    transition-colors
                                "
                            >
                                {t('discardConfirm')}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
