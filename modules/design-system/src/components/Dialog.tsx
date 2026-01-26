/**
 * Dialog/Modal Component
 * Modal with backdrop and focus trap
 * Zero inline styles - Phase 15/16 compliant
 */

import React, { useEffect, useRef } from 'react';

export type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface DialogProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    size?: DialogSize;
    closeOnBackdrop?: boolean;
    closeOnEscape?: boolean;
    footer?: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    closeOnBackdrop = true,
    closeOnEscape = true,
    footer,
}) => {
    const dialogRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && closeOnEscape) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [isOpen, closeOnEscape, onClose]);

    if (!isOpen) return null;

    // Size classes
    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-[95vw] max-h-[95vh]',
    };

    const backdropClasses = 'fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-6';
    const dialogClasses = `bg-white rounded-lg shadow-2xl w-full flex flex-col max-h-[90vh] ${sizeClasses[size]}`;
    const headerClasses = 'p-6 border-b border-neutral-200 flex items-center justify-between';
    const titleClasses = 'text-xl font-semibold text-neutral-900';
    const closeButtonClasses = 'w-8 h-8 flex items-center justify-center rounded-md border-none bg-transparent text-neutral-500 cursor-pointer transition-all hover:bg-neutral-100';
    const contentClasses = 'p-6 overflow-y-auto flex-1';
    const footerClasses = 'p-6 border-t border-neutral-200 flex justify-end gap-4';

    return (
        <div
            className={backdropClasses}
            onClick={closeOnBackdrop ? onClose : undefined}
        >
            <div
                ref={dialogRef}
                className={dialogClasses}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? 'dialog-title' : undefined}
            >
                {title && (
                    <div className={headerClasses}>
                        <h2 id="dialog-title" className={titleClasses}>{title}</h2>
                        <button
                            className={closeButtonClasses}
                            onClick={onClose}
                            aria-label="Close dialog"
                        >
                            ✕
                        </button>
                    </div>
                )}
                <div className={contentClasses}>{children}</div>
                {footer && <div className={footerClasses}>{footer}</div>}
            </div>
        </div>
    );
};
