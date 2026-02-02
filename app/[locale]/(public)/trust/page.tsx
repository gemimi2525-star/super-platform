import type { Metadata } from 'next';
import { useTranslations } from '@/lib/i18n';

export const metadata: Metadata = {
    title: 'SYNAPSE Trust Center - Verifiable Governance',
    description: 'Cryptographically verifiable governance decisions. Trust, but verify.',
    openGraph: {
        title: 'SYNAPSE Trust Center',
        description: 'Cryptographically verifiable governance decisions',
        type: 'website',
    },
};

export default function TrustHomePage() {
    const t = useTranslations('trust.home');

    return (
        <div>
            {/* Hero */}
            <section className="bg-gradient-to-br from-primary via-primary-600 to-primary-800 text-white py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-5xl font-extrabold mb-4">{t('hero.title')}</h1>
                    <p className="text-xl opacity-90">{t('hero.subtitle')}</p>
                </div>
            </section>

            {/* What is SYNAPSE */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="bg-white rounded-lg shadow-md p-8">
                    <h2 className="text-3xl font-bold mb-4 flex items-center gap-2">
                        <span>🛡️</span>
                        {t('what.title')}
                    </h2>
                    <p className="text-lg mb-6">{t('what.desc')}</p>
                    <ul className="space-y-3 ml-6">
                        <li className="flex items-start gap-2">
                            <span className="text-success mt-1">✓</span>
                            <div>
                                <strong>{t('what.verifiable').split(' - ')[0]}</strong> -{' '}
                                {t('what.verifiable').split(' - ')[1]}
                            </div>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-success mt-1">✓</span>
                            <div>
                                <strong>{t('what.immutable').split(' - ')[0]}</strong> -{' '}
                                {t('what.immutable').split(' - ')[1]}
                            </div>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-success mt-1">✓</span>
                            <div>
                                <strong>{t('what.transparent').split(' - ')[0]}</strong> -{' '}
                                {t('what.transparent').split(' - ')[1]}
                            </div>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-success mt-1">✓</span>
                            <div>
                                <strong>{t('what.humancontrolled').split(' - ')[0]}</strong> -{' '}
                                {t('what.humancontrolled').split(' - ')[1]}
                            </div>
                        </li>
                    </ul>
                    <div className="mt-6 bg-primary-50 border-l-4 border-primary p-4 rounded">
                        <p className="text-sm italic">{t('what.note')}</p>
                    </div>
                </div>
            </section>

            {/* Decision Flow */}
            <section className="bg-neutral-100 py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-center mb-12 flex items-center justify-center gap-2">
                        <span>📊</span>
                        {t('flow.title')}
                    </h2>
                    <div className="flex flex-wrap justify-center items-center gap-4">
                        <div className="bg-white rounded-lg p-6 text-center min-w-[180px] shadow">
                            <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                                1
                            </div>
                            <h3 className="font-bold mb-2">{t('flow.intent.title')}</h3>
                            <p className="text-sm text-neutral-600">{t('flow.intent.desc')}</p>
                        </div>

                        <div className="text-4xl text-neutral-300">→</div>

                        <div className="bg-white rounded-lg p-6 text-center min-w-[180px] shadow">
                            <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                                2
                            </div>
                            <h3 className="font-bold mb-2">{t('flow.policy.title')}</h3>
                            <p className="text-sm text-neutral-600">{t('flow.policy.desc')}</p>
                        </div>

                        <div className="text-4xl text-neutral-300">→</div>

                        <div className="bg-white rounded-lg p-6 text-center min-w-[180px] shadow">
                            <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                                3
                            </div>
                            <h3 className="font-bold mb-2">{t('flow.decision.title')}</h3>
                            <p className="text-sm text-neutral-600">{t('flow.decision.desc')}</p>
                        </div>

                        <div className="text-4xl text-neutral-300">→</div>

                        <div className="bg-white rounded-lg p-6 text-center min-w-[180px] shadow">
                            <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                                4
                            </div>
                            <h3 className="font-bold mb-2">{t('flow.audit.title')}</h3>
                            <p className="text-sm text-neutral-600">{t('flow.audit.desc')}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Governance Principles */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <h2 className="text-3xl font-bold text-center mb-12">{t('principles.title')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-neutral-100 rounded-lg p-6 border-2 border-transparent hover:border-primary transition-all">
                        <h3 className="text-xl font-bold mb-3">{t('principles.zerotrust.title')}</h3>
                        <p className="text-neutral-700">{t('principles.zerotrust.desc')}</p>
                    </div>
                    <div className="bg-neutral-100 rounded-lg p-6 border-2 border-transparent hover:border-primary transition-all">
                        <h3 className="text-xl font-bold mb-3">{t('principles.immutable.title')}</h3>
                        <p className="text-neutral-700">{t('principles.immutable.desc')}</p>
                    </div>
                    <div className="bg-neutral-100 rounded-lg p-6 border-2 border-transparent hover:border-primary transition-all">
                        <h3 className="text-xl font-bold mb-3">{t('principles.human.title')}</h3>
                        <p className="text-neutral-700">{t('principles.human.desc')}</p>
                    </div>
                    <div className="bg-neutral-100 rounded-lg p-6 border-2 border-transparent hover:border-primary transition-all">
                        <h3 className="text-xl font-bold mb-3">{t('principles.verifiable.title')}</h3>
                        <p className="text-neutral-700">{t('principles.verifiable.desc')}</p>
                    </div>
                </div>
            </section>
        </div>
    );
}
