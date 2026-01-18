'use client';

/**
 * IntlProvider - Fixed Version
 * 
 * ป้องกัน infinite loop โดย:
 * 1. ใช้ useRef ป้องกัน re-initialization ซ้ำ
 * 2. ใช้ useMemo สำหรับ messages เพื่อหลีกเลี่ยง re-render
 * 3. Load messages synchronously จาก import (ไม่ใช้ async)
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { NextIntlClientProvider } from 'next-intl';

// Import messages statically for immediate availability
import thMessages from '../locales/th.json';
import enMessages from '../locales/en.json';
import zhMessages from '../locales/zh.json';

const allMessages = {
    th: thMessages,
    en: enMessages,
    zh: zhMessages,
};

type LocaleKey = keyof typeof allMessages;

export function IntlProvider({ children }: { children: React.ReactNode }) {
    const initialized = useRef(false);
    const [locale, setLocale] = useState<LocaleKey>('en');
    const [isReady, setIsReady] = useState(false);

    // One-time initialization only
    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        // Get saved locale from localStorage
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('locale') as LocaleKey;
            if (saved && allMessages[saved]) {
                setLocale(saved);
            }
        }
        setIsReady(true);
    }, []);

    // Messages are pre-loaded, no async needed
    const messages = useMemo(() => allMessages[locale], [locale]);

    // Show loading only on first render
    if (!isReady) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-600">Loading...</div>
            </div>
        );
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
