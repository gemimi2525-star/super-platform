'use client';

/**
 * App Library Page
 * 
 * Grid view of all available apps
 * Route: /[locale]/platform/apps
 */

import React from 'react';
import Link from 'next/link';
import { useLocale } from '@/lib/i18n';
import { ALL_APPS } from '@/components/shell/AppStrip';

export default function AppsPage() {
    const locale = useLocale();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">App Library</h1>
                <p className="text-sm text-gray-500 mt-1">
                    All available applications in your workspace
                </p>
            </div>

            {/* App Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {ALL_APPS.map((app) => {
                    const Icon = app.icon;
                    return (
                        <Link
                            key={app.id}
                            href={`/${locale}${app.href}`}
                            className="
                                flex flex-col items-center gap-3
                                p-6 rounded-2xl
                                bg-white border border-gray-200
                                hover:border-blue-300 hover:shadow-lg hover:scale-[1.02]
                                transition-all duration-200
                                group
                            "
                        >
                            <div className="
                                w-16 h-16
                                flex items-center justify-center
                                rounded-2xl
                                bg-gradient-to-br from-blue-50 to-blue-100
                                text-blue-600
                                group-hover:from-blue-100 group-hover:to-blue-200
                                transition-colors duration-200
                            ">
                                <Icon className="w-8 h-8" />
                            </div>
                            <span className="
                                text-sm font-medium text-gray-700
                                text-center
                                group-hover:text-gray-900
                            ">
                                {app.label}
                            </span>
                            {app.pinned && (
                                <span className="text-[10px] text-gray-400 uppercase tracking-wider">
                                    Pinned
                                </span>
                            )}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
