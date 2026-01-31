'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * APICOREDATA — Brand Settings MVP V2 (Split Header vs Login)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * PHASE 7.8: Separate brand settings for Header and Login
 * 
 * Features:
 * - Upload separate logos for Header and Login (2MB max)
 * - Adjust logo size (pixels) separately
 * - Adjust gap between logo and brand name separately
 * - Toggle show/hide brand name separately
 * - Preview on light/dark backgrounds
 * 
 * @version 2.0.0
 * @date 2026-01-29
 */

import React, { useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { Upload, Trash2, Sun, Moon, Monitor, LogIn } from 'lucide-react';
import {
    useBrandStore,
    fileToDataUrl,
    MAX_FILE_SIZE_BYTES,
    type LocationBrandSettings
} from '@/lib/stores/brandStore';
import { BRAND } from '@/config/brand';
import { useTranslations } from '@/lib/i18n';

// ═══════════════════════════════════════════════════════════════════════════
// LOCATION SECTION COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface LocationSectionProps {
    location: 'header' | 'login';
    title: string;
    description: string;
    settings: LocationBrandSettings;
    onUpdateSettings: (settings: Partial<LocationBrandSettings>) => void;
    onSetLogo: (dataUrl: string | null, mime?: string | null) => void;
    onClearLogo: () => void;
    sizeRange: { min: number; max: number };
    gapRange: { min: number; max: number };
    t: (key: string) => string;
}

function LocationSection({
    location,
    title,
    description,
    settings,
    onUpdateSettings,
    onSetLogo,
    onClearLogo,
    sizeRange,
    gapRange,
    t,
}: LocationSectionProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewBg, setPreviewBg] = useState<'light' | 'dark'>('light');
    const [error, setError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Handle file upload
    const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError(null);
        setIsUploading(true);

        try {
            const { dataUrl, mime } = await fileToDataUrl(file);
            onSetLogo(dataUrl, mime);
        } catch (err) {
            const errorKey = err instanceof Error ? err.message : 'UPLOAD_FAILED';
            if (errorKey === 'FILE_TOO_LARGE') {
                setError(t('fileTooLarge'));
            } else if (errorKey === 'INVALID_TYPE') {
                setError(t('invalidFileType'));
            } else {
                setError(t('uploadFailed'));
            }
        } finally {
            setIsUploading(false);
        }

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [onSetLogo, t]);

    // Current logo URL
    const logoUrl = settings.logoDataUrl || BRAND.logo;
    const hasCustomLogo = !!settings.logoDataUrl;

    const Icon = location === 'header' ? Monitor : LogIn;

    return (
        <div className="border border-gray-200 rounded-xl p-5 space-y-5">
            {/* Section Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h4 className="font-semibold text-gray-900">{title}</h4>
                    <p className="text-sm text-gray-500">{description}</p>
                </div>
            </div>

            {/* Logo Upload */}
            <div className="flex items-start gap-4">
                {/* Current Logo Preview */}
                <div className={`
                    w-20 h-20 rounded-xl overflow-hidden flex items-center justify-center
                    ${previewBg === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}
                    transition-colors border border-gray-200
                `}>
                    <Image
                        src={logoUrl}
                        alt="Logo"
                        width={settings.logoSizePx}
                        height={settings.logoSizePx}
                        className="object-contain"
                        unoptimized
                    />
                </div>

                {/* Actions */}
                <div className="flex-1 space-y-2">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                        >
                            <Upload className="w-4 h-4" />
                            {isUploading ? t('uploading') : t('uploadLogo')}
                        </button>
                        {hasCustomLogo && (
                            <button
                                onClick={onClearLogo}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                {t('removeLogo')}
                            </button>
                        )}
                    </div>
                    {error && (
                        <p className="text-sm text-red-500">{error}</p>
                    )}
                    <p className="text-xs text-gray-400">
                        PNG, SVG, JPEG, WebP • {t('max2MB')}
                    </p>
                </div>

                {/* Preview Toggle */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                    <button
                        onClick={() => setPreviewBg('light')}
                        className={`p-2 rounded-md transition-colors ${previewBg === 'light' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                            }`}
                        title={t('lightBg')}
                    >
                        <Sun className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setPreviewBg('dark')}
                        className={`p-2 rounded-md transition-colors ${previewBg === 'dark' ? 'bg-gray-800 text-white shadow-sm' : 'hover:bg-gray-200'
                            }`}
                        title={t('darkBg')}
                    >
                        <Moon className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Size Slider */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">
                        {t('logoSize')}
                    </label>
                    <span className="text-sm text-gray-500">{settings.logoSizePx}px</span>
                </div>
                <input
                    type="range"
                    min={sizeRange.min}
                    max={sizeRange.max}
                    value={settings.logoSizePx}
                    onChange={(e) => onUpdateSettings({ logoSizePx: Number(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-xs text-gray-400">
                    <span>{sizeRange.min}px</span>
                    <span>{sizeRange.max}px</span>
                </div>
            </div>

            {/* Gap Slider */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">
                        {t('spacingFromName')}
                    </label>
                    <span className="text-sm text-gray-500">{settings.brandGapPx}px</span>
                </div>
                <input
                    type="range"
                    min={gapRange.min}
                    max={gapRange.max}
                    value={settings.brandGapPx}
                    onChange={(e) => onUpdateSettings({ brandGapPx: Number(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-xs text-gray-400">
                    <span>{gapRange.min}px</span>
                    <span>{gapRange.max}px</span>
                </div>
            </div>

            {/* Show Brand Name Toggle */}
            <div className="flex items-center justify-between py-3 border-t border-gray-100">
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        {t('showBrandName')}
                    </label>
                    <p className="text-xs text-gray-400 mt-0.5">
                        {t('showBrandNameDesc').replace('{name}', BRAND.name)}
                    </p>
                </div>
                <button
                    onClick={() => onUpdateSettings({ showBrandName: !settings.showBrandName })}
                    className={`
                        relative w-12 h-7 rounded-full transition-colors
                        ${settings.showBrandName ? 'bg-indigo-600' : 'bg-gray-300'}
                    `}
                >
                    <span
                        className={`
                            absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform
                            ${settings.showBrandName ? 'translate-x-5' : 'translate-x-0'}
                        `}
                    />
                </button>
            </div>

            {/* Live Preview */}
            <div className="border-t border-gray-100 pt-4 space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                    {t('preview')}
                </label>
                <div className={`
                    p-4 rounded-xl border
                    ${previewBg === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
                `}>
                    <div className="flex items-center" style={{ gap: `${settings.brandGapPx}px` }}>
                        <div
                            className="rounded-full overflow-hidden flex-shrink-0"
                            style={{ width: settings.logoSizePx, height: settings.logoSizePx }}
                        >
                            <Image
                                src={logoUrl}
                                alt="Logo"
                                width={settings.logoSizePx}
                                height={settings.logoSizePx}
                                className="object-cover w-full h-full"
                                unoptimized
                            />
                        </div>
                        {settings.showBrandName && (
                            <span className={`font-bold tracking-tight ${previewBg === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>
                                {BRAND.name}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function BrandSettingsMVP() {
    const t = useTranslations('v2.coreSystem.settings.brandV2');

    // Get state from store
    const settings = useBrandStore((state) => state.settings);
    const updateHeader = useBrandStore((state) => state.updateHeader);
    const updateLogin = useBrandStore((state) => state.updateLogin);
    const setHeaderLogo = useBrandStore((state) => state.setHeaderLogo);
    const setLoginLogo = useBrandStore((state) => state.setLoginLogo);
    const clearHeaderLogo = useBrandStore((state) => state.clearHeaderLogo);
    const clearLoginLogo = useBrandStore((state) => state.clearLoginLogo);

    return (
        <div className="space-y-6">
            {/* Main Title */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900">{t('title')}</h3>
                <p className="text-sm text-gray-500 mt-1">{t('description')}</p>
            </div>

            {/* Header Section */}
            <LocationSection
                location="header"
                title={t('headerLogo')}
                description={t('headerLogoDesc')}
                settings={settings.header}
                onUpdateSettings={updateHeader}
                onSetLogo={setHeaderLogo}
                onClearLogo={clearHeaderLogo}
                sizeRange={{ min: 16, max: 64 }}
                gapRange={{ min: 0, max: 24 }}
                t={t}
            />

            {/* Login Section */}
            <LocationSection
                location="login"
                title={t('loginLogo')}
                description={t('loginLogoDesc')}
                settings={settings.login}
                onUpdateSettings={updateLogin}
                onSetLogo={setLoginLogo}
                onClearLogo={clearLoginLogo}
                sizeRange={{ min: 32, max: 160 }}
                gapRange={{ min: 0, max: 32 }}
                t={t}
            />
        </div>
    );
}

export default BrandSettingsMVP;
