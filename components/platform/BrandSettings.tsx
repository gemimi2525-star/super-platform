'use client';

/**
 * Brand Settings Component
 * 
 * 3 separate sections for Header, Sidebar, and Login page
 * Each with realistic preview, Logo Scale, Brand Name Scale, and Gap controls
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Upload, RotateCcw, Save, Loader2, Check, AlertCircle, Monitor, LogIn, Type, Move, Menu, Search, User, Globe, ChevronDown, ChevronRight, LayoutDashboard, Building2, Users, Briefcase, PanelLeft, Eye, EyeOff } from 'lucide-react';
import {
    uploadBrandLogo,
    saveBrandSettings,
    resetBrandSettings,
    DEFAULT_HEADER,
    DEFAULT_SIDEBAR,
    DEFAULT_LOGIN,
    type LocationBrandSettings
} from '@/lib/firebase/brand';
import { useBrand } from '@/contexts/BrandContext';
import { BRAND } from '@/config/brand';
import { auth } from '@/lib/firebase/client';

interface BrandSettingsProps {
    onSaveSuccess?: () => void;
}

export function BrandSettings({ onSaveSuccess }: BrandSettingsProps) {
    const { logoUrl, brandName: contextBrandName, header, sidebar, login, refreshBrand, isLoading: contextLoading } = useBrand();

    const fileInputRef = useRef<HTMLInputElement>(null);

    // State - Brand Name (shared)
    const [nameValue, setNameValue] = useState('');

    // State - Header
    const [headerLogoScale, setHeaderLogoScale] = useState(100);
    const [headerNameScale, setHeaderNameScale] = useState(100);
    const [headerGap, setHeaderGap] = useState(8);

    // State - Sidebar
    const [sidebarLogoScale, setSidebarLogoScale] = useState(100);
    const [sidebarNameScale, setSidebarNameScale] = useState(100);
    const [sidebarGap, setSidebarGap] = useState(8);

    // State - Login
    const [loginLogoScale, setLoginLogoScale] = useState(100);
    const [loginNameScale, setLoginNameScale] = useState(100);
    const [loginGap, setLoginGap] = useState(12);

    // State - File upload
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Sync with context
    useEffect(() => {
        if (!contextLoading) {
            setNameValue(contextBrandName === BRAND.name ? '' : contextBrandName);
            setHeaderLogoScale(header.logoScale);
            setHeaderNameScale(header.brandNameScale);
            setHeaderGap(header.gap);
            setSidebarLogoScale(sidebar.logoScale);
            setSidebarNameScale(sidebar.brandNameScale);
            setSidebarGap(sidebar.gap);
            setLoginLogoScale(login.logoScale);
            setLoginNameScale(login.brandNameScale);
            setLoginGap(login.gap);
        }
    }, [contextLoading, contextBrandName, header, sidebar, login]);

    // Handle file selection
    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError('File size must be less than 5MB');
            return;
        }

        setError(null);
        setSuccess(false);
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    }, []);

    // Handle save
    const handleSave = async () => {
        setIsUploading(true);
        setError(null);

        try {
            let newLogoUrl = logoUrl;
            let newFileName: string | undefined;

            if (selectedFile) {
                const { downloadUrl, fileName } = await uploadBrandLogo(selectedFile);
                newLogoUrl = downloadUrl;
                newFileName = fileName;
            }

            const settingsToSave: any = {
                brandName: nameValue || '',
                header: {
                    logoScale: headerLogoScale,
                    brandNameScale: headerNameScale,
                    gap: headerGap,
                },
                sidebar: {
                    logoScale: sidebarLogoScale,
                    brandNameScale: sidebarNameScale,
                    gap: sidebarGap,
                },
                login: {
                    logoScale: loginLogoScale,
                    brandNameScale: loginNameScale,
                    gap: loginGap,
                },
            };

            if (selectedFile && newLogoUrl) {
                settingsToSave.logoUrl = newLogoUrl;
                settingsToSave.logoFileName = newFileName;
            }

            await saveBrandSettings(settingsToSave, auth.currentUser?.uid);
            await refreshBrand();

            setSuccess(true);
            setPreviewUrl(null);
            setSelectedFile(null);

            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

            onSaveSuccess?.();
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error('Failed to save brand settings:', err);
            setError('Failed to save. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    // Handle reset
    const handleReset = async () => {
        setIsUploading(true);
        setError(null);

        try {
            await resetBrandSettings(auth.currentUser?.uid);
            await refreshBrand();

            setPreviewUrl(null);
            setSelectedFile(null);
            setNameValue('');
            setHeaderLogoScale(100);
            setHeaderNameScale(100);
            setHeaderGap(8);
            setSidebarLogoScale(100);
            setSidebarNameScale(100);
            setSidebarGap(8);
            setLoginLogoScale(100);
            setLoginNameScale(100);
            setLoginGap(12);
            setSuccess(true);

            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error('Failed to reset:', err);
            setError('Failed to reset. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const displayUrl = previewUrl || logoUrl || BRAND.logo;
    const displayName = nameValue || BRAND.name;

    // Calculate sizes for previews
    const headerLogoSize = Math.round(32 * (headerLogoScale / 100));
    const headerFontSize = Math.round(14 * (headerNameScale / 100));
    const sidebarLogoSize = Math.round(32 * (sidebarLogoScale / 100));
    const sidebarFontSize = Math.round(14 * (sidebarNameScale / 100));
    const loginLogoSize = Math.round(80 * (loginLogoScale / 100));
    const loginFontSize = Math.round(24 * (loginNameScale / 100));

    return (
        <div className="space-y-8">
            {/* =============== HEADER SECTION =============== */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                <div className="flex items-center gap-2 mb-4">
                    <Monitor className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Header</h3>
                </div>

                {/* Header Preview - Full Width Realistic */}
                <div className="bg-white rounded-xl mb-4 border border-blue-100 shadow-sm overflow-hidden">
                    <div className="text-xs text-gray-400 uppercase tracking-wide px-4 pt-3 pb-2">Preview</div>

                    {/* Realistic Header Bar */}
                    <div className="border-t border-b border-gray-100 bg-white">
                        <div className="h-[56px] px-4 flex items-center justify-between">
                            {/* Left: Hamburger + Brand */}
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400">
                                    <Menu className="w-5 h-5" />
                                </div>
                                <div className="flex items-center" style={{ gap: `${headerGap}px` }}>
                                    <Image
                                        src={displayUrl}
                                        alt="Logo"
                                        width={headerLogoSize}
                                        height={headerLogoSize}
                                        className="object-contain rounded-full"
                                        style={{ width: headerLogoSize, height: headerLogoSize }}
                                        unoptimized
                                    />
                                    <span
                                        className="font-bold text-gray-900"
                                        style={{ fontSize: `${headerFontSize}px` }}
                                    >
                                        {displayName}
                                    </span>
                                </div>
                            </div>

                            {/* Center: Search */}
                            <div className="hidden md:flex flex-1 max-w-md mx-8">
                                <div className="w-full flex items-center px-3 py-1.5 bg-gray-100 rounded-md text-sm text-gray-400">
                                    <Search className="w-4 h-4 mr-2" />
                                    <span>Search...</span>
                                </div>
                            </div>

                            {/* Right: Icons */}
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
                                    <Globe className="w-4 h-4" />
                                </div>
                                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-500">
                                    <User className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sliders */}
                <div className="space-y-4">
                    <SliderControl
                        icon={<Monitor className="w-4 h-4" />}
                        label="Logo Scale"
                        value={headerLogoScale}
                        onChange={setHeaderLogoScale}
                        min={50}
                        max={200}
                        unit="%"
                        color="blue"
                    />
                    <SliderControl
                        icon={<Type className="w-4 h-4" />}
                        label="Brand Name Scale"
                        value={headerNameScale}
                        onChange={setHeaderNameScale}
                        min={50}
                        max={200}
                        unit="%"
                        color="indigo"
                    />
                    <SliderControl
                        icon={<Move className="w-4 h-4" />}
                        label="Gap"
                        value={headerGap}
                        onChange={setHeaderGap}
                        min={0}
                        max={32}
                        unit="px"
                        color="purple"
                    />
                </div>
            </div>

            {/* =============== SIDEBAR SECTION =============== */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                <div className="flex items-center gap-2 mb-4">
                    <PanelLeft className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Sidebar</h3>
                </div>

                {/* Sidebar Preview - Vertical Panel Realistic */}
                <div className="bg-white rounded-xl mb-4 border border-green-100 shadow-sm overflow-hidden">
                    <div className="text-xs text-gray-400 uppercase tracking-wide px-4 pt-3 pb-2">Preview</div>

                    {/* Realistic Sidebar Panel */}
                    <div className="border-t border-gray-100">
                        <div className="w-full max-w-[280px] mx-auto bg-[#FAFAFA] border-x border-b border-gray-200 rounded-b-lg">
                            {/* Header */}
                            <div className="px-4 py-4 border-b border-gray-100">
                                <div className="flex items-center" style={{ gap: `${sidebarGap}px` }}>
                                    <Image
                                        src={displayUrl}
                                        alt="Logo"
                                        width={sidebarLogoSize}
                                        height={sidebarLogoSize}
                                        className="object-contain rounded-full"
                                        style={{ width: sidebarLogoSize, height: sidebarLogoSize }}
                                        unoptimized
                                    />
                                    <span
                                        className="font-bold text-gray-900"
                                        style={{ fontSize: `${sidebarFontSize}px` }}
                                    >
                                        {displayName}
                                    </span>
                                </div>
                            </div>

                            {/* Menu Groups */}
                            <div className="py-4 px-3 space-y-4">
                                {/* Platform Group */}
                                <div>
                                    <div className="flex items-center justify-between px-3 py-1.5 mb-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                        <span>PLATFORM</span>
                                        <ChevronDown className="w-3 h-3" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium bg-white text-blue-600 shadow-sm ring-1 ring-gray-200">
                                            <LayoutDashboard className="w-4 h-4" />
                                            <span>Dashboard</span>
                                        </div>
                                        <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
                                            <Building2 className="w-4 h-4" />
                                            <span>Organizations</span>
                                        </div>
                                        <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
                                            <Users className="w-4 h-4" />
                                            <span>Users</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Business Group */}
                                <div>
                                    <div className="flex items-center justify-between px-3 py-1.5 mb-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                        <span>BUSINESS</span>
                                        <ChevronRight className="w-3 h-3" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sliders */}
                <div className="space-y-4">
                    <SliderControl
                        icon={<PanelLeft className="w-4 h-4" />}
                        label="Logo Scale"
                        value={sidebarLogoScale}
                        onChange={setSidebarLogoScale}
                        min={50}
                        max={200}
                        unit="%"
                        color="green"
                    />
                    <SliderControl
                        icon={<Type className="w-4 h-4" />}
                        label="Brand Name Scale"
                        value={sidebarNameScale}
                        onChange={setSidebarNameScale}
                        min={50}
                        max={200}
                        unit="%"
                        color="emerald"
                    />
                    <SliderControl
                        icon={<Move className="w-4 h-4" />}
                        label="Gap"
                        value={sidebarGap}
                        onChange={setSidebarGap}
                        min={0}
                        max={32}
                        unit="px"
                        color="teal"
                    />
                </div>
            </div>

            {/* =============== LOGIN SECTION =============== */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                <div className="flex items-center gap-2 mb-4">
                    <LogIn className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Login Page</h3>
                </div>

                {/* Login Preview - Full Card Realistic */}
                <div className="bg-white rounded-xl mb-4 border border-purple-100 shadow-sm overflow-hidden">
                    <div className="text-xs text-gray-400 uppercase tracking-wide px-4 pt-3 pb-2">Preview</div>

                    {/* Realistic Login Card */}
                    <div className="border-t border-gray-100 bg-gradient-to-b from-gray-50 to-white p-6">
                        <div className="max-w-sm mx-auto">
                            {/* Logo and Brand */}
                            <div className="flex flex-col items-center mb-6">
                                <Image
                                    src={displayUrl}
                                    alt="Logo"
                                    width={loginLogoSize}
                                    height={loginLogoSize}
                                    className="object-contain"
                                    style={{ width: loginLogoSize, height: loginLogoSize }}
                                    unoptimized
                                />
                                <div style={{ height: `${loginGap}px` }} />
                                <span
                                    className="font-semibold text-gray-900"
                                    style={{ fontSize: `${loginFontSize}px` }}
                                >
                                    {displayName}
                                </span>
                            </div>

                            {/* Login Form */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <div className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-400 bg-gray-50">
                                        email@example.com
                                    </div>
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                    <div className="flex items-center px-3 py-2 border border-gray-200 rounded-lg bg-gray-50">
                                        <span className="flex-1 text-sm text-gray-400">••••••••••</span>
                                        <Eye className="w-4 h-4 text-gray-400" />
                                    </div>
                                </div>

                                {/* Sign In Button */}
                                <button className="w-full py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium">
                                    Sign in
                                </button>

                                {/* Divider */}
                                <div className="flex items-center gap-3 text-gray-400">
                                    <div className="flex-1 border-t border-gray-200" />
                                    <span className="text-xs">Or continue with</span>
                                    <div className="flex-1 border-t border-gray-200" />
                                </div>

                                {/* Google Button */}
                                <button className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Google
                                </button>
                            </div>

                            {/* Footer */}
                            <div className="text-center mt-4 text-xs text-gray-400">
                                © 2026 {displayName}. All rights reserved.
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sliders */}
                <div className="space-y-4">
                    <SliderControl
                        icon={<LogIn className="w-4 h-4" />}
                        label="Logo Scale"
                        value={loginLogoScale}
                        onChange={setLoginLogoScale}
                        min={50}
                        max={200}
                        unit="%"
                        color="purple"
                    />
                    <SliderControl
                        icon={<Type className="w-4 h-4" />}
                        label="Brand Name Scale"
                        value={loginNameScale}
                        onChange={setLoginNameScale}
                        min={50}
                        max={200}
                        unit="%"
                        color="pink"
                    />
                    <SliderControl
                        icon={<Move className="w-4 h-4" />}
                        label="Gap"
                        value={loginGap}
                        onChange={setLoginGap}
                        min={0}
                        max={48}
                        unit="px"
                        color="rose"
                    />
                </div>
            </div>

            {/* =============== SHARED SETTINGS =============== */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Shared Settings</h3>

                {/* Brand Name Input */}
                <div className="space-y-2 mb-6">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Type className="w-4 h-4" />
                        Brand Name
                    </label>
                    <input
                        type="text"
                        value={nameValue}
                        onChange={(e) => setNameValue(e.target.value)}
                        placeholder={BRAND.name}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-400">
                        Leave empty to use default ({BRAND.name})
                    </p>
                </div>

                {/* File Upload */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Upload New Logo</label>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50/50 transition-colors text-gray-600 hover:text-blue-600"
                    >
                        <Upload className="w-5 h-5" />
                        <span>{selectedFile ? selectedFile.name : 'Choose image file'}</span>
                    </button>
                    <p className="text-xs text-gray-400">
                        Supported: PNG, JPG, WebP, GIF (Square, max 5MB)
                    </p>
                </div>
            </div>

            {/* Messages */}
            {error && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                </div>
            )}

            {success && (
                <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
                    <Check className="w-4 h-4 flex-shrink-0" />
                    Settings saved successfully!
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
                <button
                    onClick={handleReset}
                    disabled={isUploading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <RotateCcw className="w-4 h-4" />
                    Reset to Default
                </button>
                <button
                    onClick={handleSave}
                    disabled={isUploading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    Save Changes
                </button>
            </div>
        </div>
    );
}

// Slider Control Component
interface SliderControlProps {
    icon: React.ReactNode;
    label: string;
    value: number;
    onChange: (value: number) => void;
    min: number;
    max: number;
    unit: string;
    color: string;
}

function SliderControl({ icon, label, value, onChange, min, max, unit, color }: SliderControlProps) {
    const colorClasses: Record<string, string> = {
        blue: 'accent-blue-500',
        indigo: 'accent-indigo-500',
        purple: 'accent-purple-500',
        pink: 'accent-pink-500',
        rose: 'accent-rose-500',
        green: 'accent-green-500',
        emerald: 'accent-emerald-500',
        teal: 'accent-teal-500',
    };

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    {icon}
                    {label}
                </label>
                <span className="text-sm font-medium text-gray-900 bg-white px-2 py-0.5 rounded border">
                    {value}{unit}
                </span>
            </div>
            <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-8">{min}{unit}</span>
                <input
                    type="range"
                    min={min}
                    max={max}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className={`flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer ${colorClasses[color] || 'accent-blue-500'}`}
                />
                <span className="text-xs text-gray-400 w-10 text-right">{max}{unit}</span>
            </div>
        </div>
    );
}
