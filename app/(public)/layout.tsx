import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { cn } from "@/lib/utils";
import "@/app/globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { QueryProvider } from "@/components/QueryProvider";
import { BrandProvider } from "@/contexts/BrandContext";
import { I18nProvider } from '@/lib/i18n';
import { ToastProvider } from "@super-platform/ui";
import { Toaster } from 'sonner';
import { BRAND } from '@/config/brand';
import { AppearanceProvider } from '@/contexts/AppearanceContext';
import LanguageDropdown from '@/components/LanguageDropdown';
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
    title: BRAND.name,
    description: BRAND.description,
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

export default async function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
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
        console.error('Failed to load messages (Public Layout):', error);
    }

    return (
        <html lang={locale} suppressHydrationWarning>
            <body
                className={cn(geistSans.variable, geistMono.variable, "antialiased")}
                suppressHydrationWarning
            >
                <I18nProvider locale={locale as any} messages={messages}>
                    <QueryProvider>
                        <AuthProvider>
                            <BrandProvider>
                                <AppearanceProvider>
                                    <ToastProvider>
                                        {/* Global Language Dropdown - Fixed top-right for all (public) pages */}
                                        <div className="fixed top-4 right-4 z-50">
                                            <Suspense fallback={
                                                <div className="w-20 h-8 bg-gray-100/50 rounded-full animate-pulse" />
                                            }>
                                                <LanguageDropdown size="md" />
                                            </Suspense>
                                        </div>
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
