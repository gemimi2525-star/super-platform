import Link from 'next/link';
import { Suspense } from 'react';
import LanguageDropdown from '@/components/LanguageDropdown';

export default async function Home() {
    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white">
            {/* Language Dropdown - Fixed top-right */}
            <div className="fixed top-4 right-4 z-50">
                <Suspense fallback={
                    <div className="w-20 h-8 bg-slate-800 rounded-full animate-pulse" />
                }>
                    <LanguageDropdown size="md" />
                </Suspense>
            </div>

            <main className="flex flex-col items-center gap-8 text-center p-8">
                <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
                    APICOREDATA
                </h1>
                <p className="text-lg text-slate-400 max-w-2xl">
                    Enterprise Operating System for Data & Intelligence
                </p>
                <div className="flex gap-4">
                    <Link
                        href="/login"
                        className="rounded-full bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-500 transition-colors"
                    >
                        Sign In to OS
                    </Link>
                </div>
            </main>
        </div>
    );
}
