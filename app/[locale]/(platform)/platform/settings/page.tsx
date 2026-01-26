'use client';

/**
 * Settings Index Page
 * 
 * Main entry point for /platform/settings
 * Shows navigation to all settings sections
 */

import React from 'react';
import Link from 'next/link';
import { useLocale } from '@/lib/i18n';
import {
    Palette,
    User,
    Building2,
    Bell,
    Shield,
    Globe
} from 'lucide-react';

interface SettingsCard {
    id: string;
    title: string;
    description: string;
    href: string;
    icon: React.ElementType;
}

const SETTINGS_SECTIONS: SettingsCard[] = [
    {
        id: 'appearance',
        title: 'Appearance',
        description: 'Customize wallpaper, theme, and visual preferences',
        href: '/platform/settings/appearance',
        icon: Palette,
    },
    {
        id: 'profile',
        title: 'Profile',
        description: 'Manage your personal information and avatar',
        href: '/platform/settings/profile',
        icon: User,
    },
    {
        id: 'brand',
        title: 'Brand',
        description: 'Configure branding for header, sidebar, and login',
        href: '/platform/settings/brand',
        icon: Building2,
    },
    {
        id: 'notifications',
        title: 'Notifications',
        description: 'Control email and push notification settings',
        href: '/platform/settings/notifications',
        icon: Bell,
    },
    {
        id: 'security',
        title: 'Security',
        description: 'Password, two-factor authentication, sessions',
        href: '/platform/settings/security',
        icon: Shield,
    },
    {
        id: 'language',
        title: 'Language & Region',
        description: 'Set your preferred language and timezone',
        href: '/platform/settings/language',
        icon: Globe,
    },
];

export default function SettingsIndexPage() {
    const locale = useLocale();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Manage your account and application preferences
                </p>
            </div>

            {/* Settings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {SETTINGS_SECTIONS.map((section) => {
                    const Icon = section.icon;
                    return (
                        <Link
                            key={section.id}
                            href={`/${locale}${section.href}`}
                            className="
                                bg-white rounded-xl border border-gray-200 p-5
                                hover:border-blue-300 hover:shadow-md
                                transition-all duration-200
                                group
                            "
                        >
                            <div className="flex items-start gap-4">
                                <div className="
                                    w-10 h-10 rounded-lg
                                    bg-gray-100 group-hover:bg-blue-50
                                    flex items-center justify-center
                                    transition-colors
                                ">
                                    <Icon className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                        {section.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                                        {section.description}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
