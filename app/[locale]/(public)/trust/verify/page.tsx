/**
 * Trust Center - Verify Proof Page (Server Component)
 *
 * This page uses server-side rendering to ensure translations
 * are available before hydration, avoiding key placeholders.
 *
 * FIX: Uses static import for messages.json instead of fs.readFileSync
 * which doesn't work reliably in Vercel Serverless Functions.
 */

import messages from '@/locales/messages.json';
import ClientVerifyPanel from './ClientVerifyPanel';

// Type for messages structure
type TranslationValue = { [locale: string]: string };
type MessagesType = { [key: string]: TranslationValue };

// Server function to get translations from imported JSON
function getTranslations(locale: string, namespace: string) {
    const typedMessages = messages as MessagesType;

    const t = (key: string): string => {
        const fullKey = `${namespace}.${key}`;
        const translations = typedMessages[fullKey];
        if (translations) {
            return translations[locale] || translations['en'] || fullKey;
        }
        return fullKey;
    };

    return t;
}

interface PageProps {
    params: Promise<{ locale: string }>;
}

export default async function VerifyProofPage({ params }: PageProps) {
    const { locale } = await params;
    const t = getTranslations(locale, 'trust.verify');

    // Get all translations for the client component
    const translations = {
        inputLabel: t('input.label'),
        inputPlaceholder: t('input.placeholder'),
        button: t('button'),
        resultValid: t('result.valid'),
        resultInvalid: t('result.invalid'),
        resultValidDesc: t('result.validDesc'),
        resultInvalidDesc: t('result.invalidDesc'),
        fieldDecisionId: t('field.decisionId'),
        fieldPolicy: t('field.policy'),
        fieldDecision: t('field.decision'),
        fieldIntentHash: t('field.intentHash'),
        fieldLedgerHash: t('field.ledgerHash'),
        fieldSignature: t('field.signature'),
        fieldIssuedAt: t('field.issuedAt'),
        fieldAuthority: t('field.authority'),
        copy: t('copy'),
        copied: t('copied'),
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            {/* Header - Server Rendered with translations */}
            <div className="bg-white rounded-lg shadow-md p-8 mb-8">
                <h1 className="text-4xl font-bold mb-4 flex items-center gap-2">
                    <span>🔍</span>
                    {t('title')}
                </h1>
                <p className="text-lg text-neutral-700 mb-4">{t('subtitle')}</p>
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
                    <p className="text-sm">⚠️ {t('note')}</p>
                </div>
            </div>

            {/* Interactive Section - Client Component */}
            <ClientVerifyPanel translations={translations} />
        </div>
    );
}
