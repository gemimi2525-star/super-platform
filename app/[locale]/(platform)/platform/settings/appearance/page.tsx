'use client';

/**
 * Appearance Settings Page
 * 
 * Settings > Appearance > Wallpaper
 * Allows user to change desktop wallpaper
 */

import React from 'react';
import { useAppearance, WALLPAPERS } from '@/contexts/AppearanceContext';
import { Check } from 'lucide-react';

export default function AppearanceSettingsPage() {
    const { wallpaperId, setWallpaperId } = useAppearance();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">Appearance</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Customize the look and feel of your workspace
                </p>
            </div>

            {/* Wallpaper Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Wallpaper</h2>
                <p className="text-sm text-gray-500 mb-6">
                    Choose a wallpaper for your desktop. This will also be shown on the login screen.
                </p>

                {/* Wallpaper Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {WALLPAPERS.map((wallpaper) => (
                        <button
                            key={wallpaper.id}
                            onClick={() => setWallpaperId(wallpaper.id)}
                            className={`
                                relative aspect-video rounded-xl overflow-hidden
                                border-2 transition-all
                                ${wallpaperId === wallpaper.id
                                    ? 'border-blue-500 ring-2 ring-blue-500/20'
                                    : 'border-gray-200 hover:border-gray-300'}
                            `}
                        >
                            {/* Wallpaper Preview */}
                            <div className={`absolute inset-0 ${wallpaper.value}`} />

                            {/* Selected Indicator */}
                            {wallpaperId === wallpaper.id && (
                                <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                    <Check className="w-3 h-3 text-white" />
                                </div>
                            )}

                            {/* Label */}
                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                                <span className="text-xs text-white font-medium">
                                    {wallpaper.name}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Additional Settings Placeholder */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Theme</h2>
                <p className="text-sm text-gray-500">
                    Theme customization coming soon.
                </p>
            </div>
        </div>
    );
}
