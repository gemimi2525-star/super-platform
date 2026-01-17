import { getRequestConfig } from 'next-intl/server';

export const locales = ['th', 'en', 'zh'] as const;
export const defaultLocale = 'th' as const;

export type Locale = typeof locales[number];

export default getRequestConfig(async ({ locale }) => {
    // Fallback to 'th' if locale is not provided (for static builds)
    const finalLocale = (locale || 'th') as Locale;

    return {
        messages: (await import(`../locales/${finalLocale}.json`)).default,
        timeZone: 'Asia/Bangkok'
    };
});
