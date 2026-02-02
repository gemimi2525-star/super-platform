'use client';

import { useState } from 'react';
import Link from 'next/link';
import { tokens } from '../styles/tokens';
import { MobileNavDrawer } from './MobileNavDrawer';

export interface HeaderProps {
    locale: string;
    nav?: Array<{ href: string; label: string }>;
}

/**
 * Header - Responsive navigation header
 * 
 * Desktop: Top bar with horizontal nav
 * Mobile: Compact bar with hamburger menu
 */
export function Header({ locale, nav }: HeaderProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const defaultNav = nav || [
        { href: `/${locale}/trust`, label: 'Home' },
        { href: `/${locale}/trust/verify`, label: 'Verify' },
        { href: `/${locale}/trust/governance`, label: 'Governance' },
        { href: `/${locale}/trust/support`, label: 'Support' },
    ];

    return (
        <>
            <nav
                className="sticky top-0 z-50 bg-white border-b"
                style={{
                    borderColor: tokens.colors.border,
                    boxShadow: tokens.shadows.sm,
                }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <div className="flex items-center gap-2">
                            <div className="text-2xl">🔐</div>
                            <span
                                className="text-xl font-bold"
                                style={{ color: tokens.colors.accent[700] }}
                            >
                                SYNAPSE Trust Center
                            </span>
                        </div>

                        {/* Desktop Nav */}
                        <div className="hidden md:flex gap-6">
                            {defaultNav.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="font-medium transition-colors"
                                    style={{
                                        color: tokens.colors.neutral[700],
                                    }}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            className="md:hidden p-2"
                            onClick={() => setMobileMenuOpen(true)}
                            aria-label="Open menu"
                        >
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Drawer */}
            <MobileNavDrawer
                isOpen={mobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
                nav={defaultNav}
            />
        </>
    );
}
