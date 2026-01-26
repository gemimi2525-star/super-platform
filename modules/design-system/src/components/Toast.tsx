/**
 * Toast Component
 * Notification toast with auto-dismiss
 * Zero inline styles - Phase 15/16 compliant
 */

import React, { useEffect, useState } from 'react';

export type ToastVariant = 'success' | 'warning' | 'danger' | 'info';
export type ToastPosition = 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center';

export interface ToastProps {
    message: string;
    variant?: ToastVariant;
    position?: ToastPosition;
    duration?: number;
    onClose?: () => void;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export const Toast: React.FC<ToastProps> = ({
    message,
    variant = 'info',
    position = 'top-right',
    duration = 5000,
    onClose,
    action,
}) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                setIsVisible(false);
                onClose?.();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    if (!isVisible) return null;

    // Base classes
    const baseClasses = 'fixed flex items-center gap-4 min-w-[300px] max-w-[500px] p-5 border rounded-lg shadow-xl z-[9999] animate-slideIn';

    // Position classes
    const positionClasses = {
        'top-right': 'top-6 right-6',
        'top-center': 'top-6 left-1/2 -translate-x-1/2',
        'bottom-right': 'bottom-6 right-6',
        'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2',
    };

    // Variant classes
    const variantClasses = {
        success: 'bg-success-50 text-success-800 border-success-200',
        warning: 'bg-warning-50 text-warning-800 border-warning-200',
        danger: 'bg-danger-50 text-danger-800 border-danger-200',
        info: 'bg-info-50 text-info-800 border-info-200',
    };

    // Action button variant classes  
    const actionVariantClasses = {
        success: 'text-success-800 border-success-200 hover:bg-success-200',
        warning: 'text-warning-800 border-warning-200 hover:bg-warning-200',
        danger: 'text-danger-800 border-danger-200 hover:bg-danger-200',
        info: 'text-info-800 border-info-200 hover:bg-info-200',
    };

    // Close button variant classes
    const closeVariantClasses = {
        success: 'text-success-800 hover:bg-success-200',
        warning: 'text-warning-800 hover:bg-warning-200',
        danger: 'text-danger-800 hover:bg-danger-200',
        info: 'text-info-800 hover:bg-info-200',
    };

    const toastClasses = `${baseClasses} ${positionClasses[position]} ${variantClasses[variant]}`;
    const messageClasses = 'flex-1 text-base font-medium';
    const actionClasses = `px-3 py-1 text-sm font-semibold bg-transparent border rounded-md cursor-pointer transition-all ${actionVariantClasses[variant]}`;
    const closeClasses = `w-6 h-6 flex items-center justify-center bg-transparent border-none cursor-pointer rounded-sm transition-colors ${closeVariantClasses[variant]}`;

    return (
        <div className={toastClasses}>
            <div className={messageClasses}>{message}</div>
            {action && (
                <button
                    className={actionClasses}
                    onClick={action.onClick}
                >
                    {action.label}
                </button>
            )}
            <button
                className={closeClasses}
                onClick={() => {
                    setIsVisible(false);
                    onClose?.();
                }}
                aria-label="Close"
            >
                ✕
            </button>
        </div>
    );
};
