'use client';

import { useState, useEffect } from 'react';
import { NextIntlClientProvider } from 'next-intl';

const locales = {
    th: () => import('../locales/th.json').then(m => m.default),
    en: () => import('../locales/en.json').then(m => m.default),
    zh: () => import('../locales/zh.json').then(m => m.default),
};

export function IntlProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocale] = useState('th');
    const [messages, setMessages] = useState<any>(null);

    // Load messages when locale changes
    useEffect(() => {
        const loadMessages = async () => {
            try {
                const loader = locales[locale as keyof typeof locales];
                if (loader) {
                    const msgs = await loader();
                    console.log(`[IntlProvider] Loaded messages for ${locale}:`, msgs);
                    setMessages(msgs);
                } else {
                    console.error(`[IntlProvider] No loader found for locale: ${locale}`);
                }
            } catch (error) {
                console.error(`[IntlProvider] Failed to load messages for ${locale}:`, error);
            }
        };

        loadMessages();
    }, [locale]);

    // Watch for language changes from localStorage and custom events
    useEffect(() => {
        const handleLanguageChange = (e?: CustomEvent) => {
            const newLocale = e?.detail?.locale || localStorage.getItem('locale') || 'th';
            setLocale(newLocale);
        };

        // Initial load from localStorage
        handleLanguageChange();

        // Listen for custom event from LanguageSwitcher
        window.addEventListener('languagechange', handleLanguageChange as EventListener);

        return () => {
            window.removeEventListener('languagechange', handleLanguageChange as EventListener);
        };
    }, []);

    if (!messages) {
        return <div>Loading translations...</div>;
    }

    return (
        <NextIntlClientProvider
            locale={locale}
            messages={messages}
            timeZone="Asia/Bangkok"
        >
            {children}
        </NextIntlClientProvider>
    );
}
