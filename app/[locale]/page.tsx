import Link from 'next/link';
import { getDictionary, tFromDict } from '@/lib/i18n/server';

export default async function Home({
    params
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const dict = await getDictionary(locale as 'en' | 'th');

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white">
            <main className="flex flex-col items-center gap-8 text-center p-8">
                <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
                    APICOREDATA
                </h1>
                <p className="text-lg text-slate-400 max-w-2xl">
                    {tFromDict(dict, 'landing.tagline')}
                </p>
                <div className="flex gap-4">
                    <Link
                        href={`/${locale}/login`}
                        className="rounded-full bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-500 transition-colors"
                    >
                        {tFromDict(dict, 'landing.signIn')}
                    </Link>
                </div>
            </main>
        </div>
    );
}
