'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BackButton() {
    const pathname = usePathname();
    const locale = pathname?.match(/^\/(en|th)\//)?.[1] || 'en';

    return (
        <Link
            href={`/${locale}/platform`}
            className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-flex items-center gap-1 transition-colors"
        >
            ← กลับ
        </Link>
    );
}
