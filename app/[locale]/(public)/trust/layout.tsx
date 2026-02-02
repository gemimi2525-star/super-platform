import { useTranslations } from '@/lib/i18n';
import Link from 'next/link';

export default async function TrustCenterLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const t = useTranslations('trust.common');

    return (
        <div className="min-h-screen bg-neutral-50">
            {/* Header */}
            <nav className="bg-white border-b border-neutral-200 sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <div className="text-2xl">🔐</div>
                            <span className="text-xl font-bold text-primary">SYNAPSE Trust Center</span>
                        </div>
                        <div className="flex gap-6">
                            <Link
                                href={`/${locale}/trust`}
                                className="text-neutral-700 hover:text-primary font-medium transition-colors"
                            >
                                {t('nav.home')}
                            </Link>
                            <Link
                                href={`/${locale}/trust/verify`}
                                className="text-neutral-700 hover:text-primary font-medium transition-colors"
                            >
                                {t('nav.verify')}
                            </Link>
                            <Link
                                href={`/${locale}/trust/governance`}
                                className="text-neutral-700 hover:text-primary font-medium transition-colors"
                            >
                                {t('nav.governance')}
                            </Link>
                            <Link
                                href={`/${locale}/trust/support`}
                                className="text-neutral-700 hover:text-primary font-medium transition-colors"
                            >
                                {t('nav.support')}
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main>{children}</main>

            {/* Footer */}
            <footer className="bg-neutral-900 text-neutral-300 py-8 mt-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <p>SYNAPSE Governance Kernel v1.5 - Verifiable Audit Ledger</p>
                    <p className="text-sm mt-2 text-neutral-400">
                        Cryptographically verifiable governance for the modern era
                    </p>
                </div>
            </footer>
        </div>
    );
}
