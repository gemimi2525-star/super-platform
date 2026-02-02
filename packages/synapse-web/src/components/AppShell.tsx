'use client';

import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { tokens } from '../styles/tokens';

export interface AppShellProps {
    children: ReactNode;
    locale: string;
    showHeader?: boolean;
    showFooter?: boolean;
}

/**
 * AppShell - Main application layout wrapper
 * 
 * Provides consistent header/footer structure with responsive behavior.
 * Content area automatically fills space between header and footer.
 */
export function AppShell({
    children,
    locale,
    showHeader = true,
    showFooter = true,
}: AppShellProps) {
    return (
        <div
            className="min-h-screen flex flex-col"
            style={{
                backgroundColor: tokens.colors.background,
            }}
        >
            {showHeader && <Header locale={locale} />}

            <main className="flex-1">{children}</main>

            {showFooter && <Footer locale={locale} />}
        </div>
    );
}
