/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OS Layout — Full Configuration with Providers
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Layout for the /os route with all providers restored.
 * 
 * @module app/os/layout
 * @version 2.0.0 (Phase 9.8)
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cn } from "@/lib/utils";
import "../../app/globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { QueryProvider } from "@/components/QueryProvider";
import { BrandProvider } from "@/contexts/BrandContext";
import { I18nProvider } from '@/lib/i18n';
import { ToastProvider } from "@super-platform/ui";
import { Toaster } from 'sonner';
import { BRAND } from '@/config/brand';
import { AppearanceProvider } from '@/contexts/AppearanceContext';
import { checkEnforcementGate } from '@/lib/ops/integrity/enforcementGate';
import { IntegrityFatalScreen } from '@/components/os-shell/IntegrityFatalScreen';
import fs from 'fs';
import path from 'path';
import { cookies } from 'next/headers';

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: `OS | ${BRAND.name}`,
    description: BRAND.description,
    robots: {
        index: false,
        follow: false,
    },
    manifest: '/manifest.json',
};

function transformMessages(unifiedMessages: Record<string, any>, locale: string): Record<string, any> {
    const result: Record<string, any> = {};

    for (const [flatKey, translations] of Object.entries(unifiedMessages)) {
        const value = (translations as Record<string, string>)[locale] ||
            (translations as Record<string, string>)['en'] ||
            flatKey;

        const keys = flatKey.split('.');
        let current = result;

        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in current)) {
                current[key] = {};
            }
            current = current[key];
        }

        current[keys[keys.length - 1]] = value;
    }

    return result;
}

export default async function OSLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // ── Phase 33A: Enforcement Gate ──────────────────────────────────
    const gate = await checkEnforcementGate();
    if (!gate.allowed) {
        return <IntegrityFatalScreen gate={gate} />;
    }

    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';

    // Manually load messages
    const filePath = path.join(process.cwd(), 'locales', 'messages.json');
    let messages = {};

    try {
        const fileContents = fs.readFileSync(filePath, 'utf8');
        const unifiedMessages = JSON.parse(fileContents);
        messages = transformMessages(unifiedMessages, locale);
    } catch (error) {
        console.error('Failed to load messages:', error);
    }

    return (
        <html lang={locale} suppressHydrationWarning>
            <body
                className={cn(geistSans.variable, geistMono.variable, "antialiased", "overflow-hidden")}
                suppressHydrationWarning
            >
                <I18nProvider locale={locale as any} messages={messages}>
                    <QueryProvider>
                        <AuthProvider>
                            <BrandProvider>
                                <AppearanceProvider>
                                    <ToastProvider>
                                        {children}
                                    </ToastProvider>
                                </AppearanceProvider>
                            </BrandProvider>
                        </AuthProvider>
                    </QueryProvider>
                </I18nProvider>
                <Toaster position="top-right" richColors />
            </body>
        </html>
    );
}
