import type { Metadata } from 'next';
import { useTranslations } from '@/lib/i18n';
import { Container, Card } from '@synapse/web';
import { buildMetadata } from '@synapse/web/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    return buildMetadata({
        title: 'SYNAPSE Trust Center - Verifiable Governance',
        description: 'Cryptographically verifiable governance decisions. Trust, but verify.',
        locale,
        url: `https://synapsegovernance.com/${locale}/trust`,
    });
}

export default async function TrustHomePage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = useTranslations('trust.home');

    return (
        <div>
            {/* Hero */}
            <section className="bg-gradient-to-br from-[#0284c7] via-[#0369a1] to-[#075985] text-white py-20">
                <Container size="wide">
                    <div className="text-center">
                        <h1 className="text-5xl font-extrabold mb-4">{t('hero.title')}</h1>
                        <p className="text-xl opacity-90">{t('hero.subtitle')}</p>
                    </div>
                </Container>
            </section>

            {/* What is SYNAPSE */}
            <section className="py-16">
                <Container>
                    <Card className="p-8">
                        <h2 className="text-3xl font-bold mb-4 flex items-center gap-2">
                            <span>🛡️</span>
                            {t('what.title')}
                        </h2>
                        <p className="text-lg mb-6">{t('what.desc')}</p>
                        <ul className="space-y-3 ml-6">
                            <li className="flex items-start gap-2">
                                <span className="text-green-600 mt-1">✓</span>
                                <div>
                                    <strong>{t('what.verifiable').split(' - ')[0]}</strong> -{' '}
                                    {t('what.verifiable').split(' - ')[1]}
                                </div>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-600 mt-1">✓</span>
                                <div>
                                    <strong>{t('what.immutable').split(' - ')[0]}</strong> -{' '}
                                    {t('what.immutable').split(' - ')[1]}
                                </div>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-600 mt-1">✓</span>
                                <div>
                                    <strong>{t('what.transparent').split(' - ')[0]}</strong> -{' '}
                                    {t('what.transparent').split(' - ')[1]}
                                </div>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-600 mt-1">✓</span>
                                <div>
                                    <strong>{t('what.humancontrolled').split(' - ')[0]}</strong> -{' '}
                                    {t('what.humancontrolled').split(' - ')[1]}
                                </div>
                            </li>
                        </ul>
                        <div className="mt-6 bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
                            <p className="text-sm italic">{t('what.note')}</p>
                        </div>
                    </Card>
                </Container>
            </section>

            {/* Decision Flow */}
            <section className="bg-neutral-100 py-16">
                <Container>
                    <h2 className="text-3xl font-bold text-center mb-12 flex items-center justify-center gap-2">
                        <span>📊</span>
                        {t('flow.title')}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="text-center">
                            <div className="w-12 h-12 bg-[#0284c7] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                                1
                            </div>
                            <h3 className="font-bold mb-2">{t('flow.intent.title')}</h3>
                            <p className="text-sm text-neutral-600">{t('flow.intent.desc')}</p>
                        </Card>
                        <Card className="text-center">
                            <div className="w-12 h-12 bg-[#0284c7] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                                2
                            </div>
                            <h3 className="font-bold mb-2">{t('flow.policy.title')}</h3>
                            <p className="text-sm text-neutral-600">{t('flow.policy.desc')}</p>
                        </Card>
                        <Card className="text-center">
                            <div className="w-12 h-12 bg-[#0284c7] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                                3
                            </div>
                            <h3 className="font-bold mb-2">{t('flow.decision.title')}</h3>
                            <p className="text-sm text-neutral-600">{t('flow.decision.desc')}</p>
                        </Card>
                        <Card className="text-center">
                            <div className="w-12 h-12 bg-[#0284c7] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                                4
                            </div>
                            <h3 className="font-bold mb-2">{t('flow.audit.title')}</h3>
                            <p className="text-sm text-neutral-600">{t('flow.audit.desc')}</p>
                        </Card>
                    </div>
                </Container>
            </section>

            {/* Governance Principles */}
            <section className="py-16">
                <Container>
                    <h2 className="text-3xl font-bold text-center mb-12">{t('principles.title')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card hover className="border-2 border-transparent hover:border-blue-600">
                            <h3 className="text-xl font-bold mb-3">{t('principles.zerotrust.title')}</h3>
                            <p className="text-neutral-700">{t('principles.zerotrust.desc')}</p>
                        </Card>
                        <Card hover className="border-2 border-transparent hover:border-blue-600">
                            <h3 className="text-xl font-bold mb-3">{t('principles.immutable.title')}</h3>
                            <p className="text-neutral-700">{t('principles.immutable.desc')}</p>
                        </Card>
                        <Card hover className="border-2 border-transparent hover:border-blue-600">
                            <h3 className="text-xl font-bold mb-3">{t('principles.human.title')}</h3>
                            <p className="text-neutral-700">{t('principles.human.desc')}</p>
                        </Card>
                        <Card hover className="border-2 border-transparent hover:border-blue-600">
                            <h3 className="text-xl font-bold mb-3">{t('principles.verifiable.title')}</h3>
                            <p className="text-neutral-700">{t('principles.verifiable.desc')}</p>
                        </Card>
                    </div>
                </Container>
            </section>
        </div>
    );
}
