import Link from 'next/link';

export default async function Home() {
    // Dropdown is now rendered in [locale]/layout.tsx
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white">
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
