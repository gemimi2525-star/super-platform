'use client';

/**
 * Profile Settings Page
 * 
 * Settings > Profile
 * Manage personal information and avatar
 */

import React from 'react';
import { User, Mail, Phone, MapPin, Calendar } from 'lucide-react';
import { useBrand } from '@/contexts/BrandContext';
import { useCallback } from 'react';

export default function ProfileSettingsPage() {
    const { logoUrl, updateLogo } = useBrand();

    const handleLogoChange = useCallback((url: string) => {
        updateLogo(url);
    }, [updateLogo]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Manage your personal information and account details
                </p>
            </div>

            {/* Avatar / Brand Logo Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Brand Logo</h2>
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={logoUrl || 'https://via.placeholder.com/150'}
                            alt="Brand Logo"
                            className="w-12 h-12 object-contain"
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleLogoChange('https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/1667px-Apple_logo_black.svg.png')}
                                className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                            >
                                Set Apple Logo
                            </button>
                            <button
                                onClick={() => handleLogoChange('https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg')}
                                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Set Google Logo
                            </button>
                        </div>
                        <p className="text-xs text-gray-500">
                            Select a preset to test dynamic brand updates in MenuBar.
                        </p>
                    </div>
                </div>
            </div>

            {/* Personal Information */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Full Name
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="John Doe"
                                disabled
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 text-sm cursor-not-allowed"
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="email"
                                placeholder="john@example.com"
                                disabled
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 text-sm cursor-not-allowed"
                            />
                        </div>
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone Number
                        </label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="tel"
                                placeholder="+1 (555) 000-0000"
                                disabled
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 text-sm cursor-not-allowed"
                            />
                        </div>
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Location
                        </label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="San Francisco, CA"
                                disabled
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 text-sm cursor-not-allowed"
                            />
                        </div>
                    </div>
                </div>

                {/* Coming Soon Notice */}
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800">
                        <strong>Coming Soon:</strong> Profile editing will be available in the next update.
                    </p>
                </div>
            </div>

            {/* Account Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Account</h2>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>Member since January 2026</span>
                </div>
            </div>
        </div>
    );
}
