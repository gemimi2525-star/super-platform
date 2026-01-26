'use client';

/**
 * App Library Modal
 * 
 * Grid view of all available apps in APICOREDATA
 * - Opens from App Strip [+] button
 * - Allows quick access to any app
 * 
 * Naming Convention (STEP 1 Locked):
 * - App Library = หน้ารวมแอปทั้งหมด
 */

import React from 'react';
import Link from 'next/link';
import { useLocale } from '@/lib/i18n';
import { X } from 'lucide-react';
import { ALL_APPS } from './AppStrip';
import { Portal } from '@/components/ui-base/Portal';
import { useDismissableOverlay } from '@/hooks/useDismissableOverlay';

interface AppLibraryProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AppLibrary({ isOpen, onClose }: AppLibraryProps) {
    const locale = useLocale();
    const { shouldRender, animationState, handleBackdropClick } = useDismissableOverlay({
        isOpen,
        onClose,
        exitDuration: 120 // matches --exit-delay
    });

    if (!shouldRender) return null;

    return (
        <Portal>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-50 transition-opacity duration-200"
                style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.40)',
                    backdropFilter: 'blur(4px)',
                    opacity: animationState === 'open' ? 1 : 0,
                    pointerEvents: animationState === 'open' ? 'auto' : 'none',
                }}
                onClick={handleBackdropClick}
            />

            {/* Modal - MAC STYLE */}
            <div
                className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{
                    width: '90vw',
                    maxWidth: '600px',
                    backgroundColor: 'rgba(255, 255, 255, 0.85)',
                    backdropFilter: 'blur(40px) saturate(1.5)',
                    WebkitBackdropFilter: 'blur(40px) saturate(1.5)',
                    borderRadius: '18px',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.30)',
                    border: '1px solid rgba(255, 255, 255, 0.40)',
                    overflow: 'hidden',
                    // Animation styles
                    transition: 'opacity 140ms ease-out, transform 140ms ease-out',
                    opacity: animationState === 'open' ? 1 : 0,
                    transform: animationState === 'open'
                        ? 'translate(-50%, -50%) scale(1)'
                        : 'translate(-calc(50% - 12px), -50%)', // Slide effect attempt to match request "slide to side" ??
                    // Request said: open: opacity 0 -> 1, translateX(8px) -> 0. close: opacity 1 -> 0, translateX(0) -> 12px
                    // Since it's centered, translate(-50%) is base.
                    // Open: start at translate(-50% + 8px), end at translate(-50%)
                    // Close: start at translate(-50%), end at translate(-50% + 12px)
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Manual override for slide animations if dynamic styles are tricky with CSS modules. 
                    Using inline styles based on state for simplicity and strict adherence to request numbers.
                */}
                <style jsx>{`
                    .app-library-modal {
                        transition: opacity 140ms ease-out, transform 140ms cubic-bezier(0.2, 0, 0, 1);
                    }
                    .state-open {
                        opacity: 1;
                        transform: translate(-50%, -50%);
                    }
                    .state-closed-enter {
                        opacity: 0;
                        transform: translate(calc(-50% + 8px), -50%);
                    }
                    .state-closed-exit {
                        opacity: 0;
                        transition-duration: 110ms;
                        transform: translate(calc(-50% + 12px), -50%);
                    }
                `}</style>

                <div
                    className={`app-library-modal ${animationState === 'open' ? 'state-open' : (isOpen ? 'state-closed-enter' : 'state-closed-exit')}`}
                    style={{
                        position: 'fixed',
                        left: '50%',
                        top: '50%',
                        width: '90vw',
                        maxWidth: '600px',
                    }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-black/5">
                        <h2 className="text-[15px] font-semibold text-gray-800 tracking-tight">App Library</h2>
                        <button
                            onClick={onClose}
                            className="w-7 h-7 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-800 hover:bg-black/5 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* App Grid */}
                    <div className="p-6 max-h-[60vh] overflow-y-auto">
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                            {ALL_APPS.map((app) => {
                                const Icon = app.icon;
                                return (
                                    <Link
                                        key={app.id}
                                        href={`/${locale}${app.href}`}
                                        onClick={onClose}
                                        className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-black/5 transition-colors group"
                                    >
                                        <div className="w-14 h-14 flex items-center justify-center rounded-xl shadow-sm bg-gradient-to-br from-white to-gray-50 border border-black/5 group-hover:scale-105 transition-transform duration-200">
                                            <Icon className="w-7 h-7 text-gray-700" />
                                        </div>
                                        <span className="text-[12px] font-medium text-gray-600 text-center line-clamp-2 group-hover:text-gray-900">
                                            {app.label}
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </Portal>
    );
}
