import type { Metadata } from 'next';
import { useTranslations } from '@/lib/i18n';

export const metadata: Metadata = {
    title: 'Support - SYNAPSE Trust Center',
    description: 'Get help and contact information for SYNAPSE Trust Center',
};

export default function SupportPage() {
    const t = useTranslations('trust.support');

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            {/* Header */}
            <div className="mb-12 text-center">
                <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
                <p className="text-xl text-neutral-600">{t('subtitle')}</p>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-md p-8 mb-8">
                <h2 className="text-2xl font-bold mb-6">{t('contact.title')}</h2>
                <div className="space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="text-3xl">📧</div>
                        <div>
                            <h3 className="font-semibold mb-1">{t('contact.email')}</h3>
                            <a
                                href="mailto:support@synapsegovernance.com"
                                className="text-primary hover:underline"
                            >
                                support@synapsegovernance.com
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Documentation */}
            <div className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-bold mb-6">{t('docs.title')}</h2>
                <p className="text-neutral-700 mb-4">{t('docs.desc')}</p>
                <ul className="space-y-2 ml-6">
                    <li className="text-primary hover:underline cursor-pointer">
                        → SYNAPSE Governance Kernel Overview
                    </li>
                    <li className="text-primary hover:underline cursor-pointer">
                        → Policy Versioning Guide
                    </li>
                    <li className="text-primary hover:underline cursor-pointer">
                        → Proof Bundle Verification
                    </li>
                    <li className="text-primary hover:underline cursor-pointer">
                        → Escalation Flow Documentation
                    </li>
                </ul>
            </div>
        </div>
    );
}
