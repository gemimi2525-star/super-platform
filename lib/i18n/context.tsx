'use client';

import { createContext, useContext } from 'react';

type Locale = 'en' | 'th' | 'zh';

interface I18nContextType {
    locale: Locale;
    messages: Record<string, any>;
    t: (key: string, params?: Record<string, string | number>) => string;
}

export const I18nContext = createContext<I18nContextType | null>(null);

export function useTranslations(namespace?: string) {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useTranslations must be used within I18nProvider');
    }

    return (key: string, params?: Record<string, string | number>) => {
        const fullKey = namespace ? `${namespace}.${key}` : key;
        let value = context.t(fullKey, params);

        // If namespace provided and key not found, try without namespace
        if (value === fullKey && namespace) {
            value = context.t(key, params);
        }

        return value;
    };
}

export function useLocale() {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useLocale must be used within I18nProvider');
    }
    return context.locale;
}
