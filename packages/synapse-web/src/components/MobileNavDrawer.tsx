'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { tokens } from '../styles/tokens';

export interface MobileNavDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    nav: Array<{ href: string; label: string }>;
}

/**
 * MobileNavDrawer - Slide-in navigation for mobile
 * 
 * Respects prefers-reduced-motion
 */
export function MobileNavDrawer({ isOpen, onClose, nav }: MobileNavDrawerProps) {
    // Lock body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-[1300] md:hidden"
                onClick={onClose}
                style={{
                    transition: `opacity ${tokens.motion.duration.normal} ${tokens.motion.easing.out}`,
                }}
            />

            {/* Drawer */}
            <div
                className="fixed top-0 right-0 h-full w-80 max-w-full bg-white z-[1300] md:hidden"
                style={{
                    boxShadow: tokens.shadows.lg,
                    transition: `transform ${tokens.motion.duration.normal} ${tokens.motion.easing.out}`,
                }}
            >
                {/* Header */}
                <div
                    className="flex justify-between items-center p-4 border-b"
                    style={{ borderColor: tokens.colors.border }}
                >
                    <span className="text-lg font-bold">Menu</span>
                    <button onClick={onClose} className="p-2" aria-label="Close menu">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {/* Nav Links */}
                <nav className="p-4 space-y-2">
                    {nav.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onClose}
                            className="block px-4 py-3 rounded-lg font-medium transition-colors"
                            style={{
                                color: tokens.colors.neutral[700],
                            }}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </div>

            {/* Reduced motion fallback */}
            <style jsx>{`
        @media (prefers-reduced-motion: reduce) {
          div {
            transition: none !important;
          }
        }
      `}</style>
        </>
    );
}
