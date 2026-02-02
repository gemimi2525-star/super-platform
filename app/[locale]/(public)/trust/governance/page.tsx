import type { Metadata } from 'next';
import { useTranslations } from '@/lib/i18n';

export const metadata: Metadata = {
    title: 'Governance Model - SYNAPSE Trust Center',
    description: 'Learn about SYNAPSE governance architecture: Authority, Policy Versioning, Escalation, and Audit Ledger',
};

export default function GovernancePage() {
    const t = useTranslations('trust.governance');

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            {/* Header */}
            <div className="mb-12 text-center">
                <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
                <p className="text-xl text-neutral-600">{t('subtitle')}</p>
            </div>

            {/* Content Sections */}
            <div className="space-y-8">
                {/* Authority */}
                <div className="bg-white rounded-lg shadow-md p-8">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                        <span>⚖️</span>
                        {t('authority.title')}
                    </h2>
                    <p className="text-neutral-700 leading-relaxed">{t('authority.desc')}</p>
                </div>

                {/* Policy Versioning */}
                <div className="bg-white rounded-lg shadow-md p-8">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                        <span>🏷️</span>
                        {t('policy.title')}
                    </h2>
                    <p className="text-neutral-700 leading-relaxed">{t('policy.desc')}</p>
                </div>

                {/* Escalation Flow */}
                <div className="bg-white rounded-lg shadow-md p-8">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                        <span>🔐</span>
                        {t('escalation.title')}
                    </h2>
                    <p className="text-neutral-700 leading-relaxed">{t('escalation.desc')}</p>
                </div>

                {/* Audit Ledger */}
                <div className="bg-white rounded-lg shadow-md p-8">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                        <span>📝</span>
                        {t('audit.title')}
                    </h2>
                    <p className="text-neutral-700 leading-relaxed">{t('audit.desc')}</p>
                </div>
            </div>
        </div>
    );
}
