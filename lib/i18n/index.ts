// Client-side exports only
export { I18nProvider } from './provider';
export { useTranslations, useLocale } from './context';

export type Locale = 'en' | 'th';

// Note: For server-side helpers, import from '@/lib/i18n/server' directly
