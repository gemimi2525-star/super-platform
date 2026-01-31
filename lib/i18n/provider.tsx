'use client';

import { ReactNode, useMemo } from 'react';
import { I18nContext } from './context';

type Locale = 'en' | 'th';

interface I18nProviderProps {
    locale: Locale;
    messages: Record<string, any>;
    children: ReactNode;
}

function getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
}

function interpolate(message: string, params?: Record<string, string | number>): string {
    if (!params) return message;

    return Object.entries(params).reduce((result, [key, value]) => {
        return result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
    }, message);
}

export function I18nProvider({ locale, messages, children }: I18nProviderProps) {
    const value = useMemo(() => ({
        locale,
        messages,
        t: (key: string, params?: Record<string, string | number>) => {
            const message = getNestedValue(messages, key);
            if (message === undefined) {
                console.warn(`Translation missing for key: ${key}`);
                return key;
            }
            return interpolate(message, params);
        }
    }), [locale, messages]);

    return (
        <I18nContext.Provider value={value}>
            {children}
        </I18nContext.Provider>
    );
}
