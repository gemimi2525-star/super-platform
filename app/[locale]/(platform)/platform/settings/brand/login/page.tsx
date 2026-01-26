'use client';

/**
 * Login Page Brand Settings - With Device Preview Selector
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Upload, RotateCcw, Save, Loader2, Check, AlertCircle, LogIn, Type, Move, Monitor, Tablet, Smartphone, ChevronDown } from 'lucide-react';
import { uploadBrandLogo, saveBrandSettings, DEFAULT_LOGIN } from '@/lib/firebase/brand';
import { useBrand } from '@/contexts/BrandContext';
import { BRAND } from '@/config/brand';
import { auth } from '@/lib/firebase/client';

type DeviceType = 'desktop' | 'tablet' | 'mobile';

const DEVICES: { id: DeviceType; label: string; icon: React.ReactNode; width: string }[] = [
    { id: 'desktop', label: 'Desktop (1280px+)', icon: <Monitor className="w-4 h-4" />, width: '400px' },
    { id: 'tablet', label: 'Tablet (768px)', icon: <Tablet className="w-4 h-4" />, width: '340px' },
    { id: 'mobile', label: 'Mobile (375px)', icon: <Smartphone className="w-4 h-4" />, width: '300px' },
];

export default function LoginBrandPage() {
    const { logoUrl, login: loginSettings, refreshBrand, isLoading: contextLoading } = useBrand();

    const fileInputRef = useRef<HTMLInputElement>(null);

    // State
    const [brandName, setBrandName] = useState('');
    const [logoScale, setLogoScale] = useState(100);
    const [nameScale, setNameScale] = useState(100);
    const [gap, setGap] = useState(12);
    const [selectedDevice, setSelectedDevice] = useState<DeviceType>('desktop');
    const [showDeviceMenu, setShowDeviceMenu] = useState(false);

    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Sync with context
    useEffect(() => {
        if (!contextLoading) {
            setBrandName(loginSettings.brandName === BRAND.name ? '' : loginSettings.brandName);
            setLogoScale(loginSettings.logoScale);
            setNameScale(loginSettings.brandNameScale);
            setGap(loginSettings.gap);
        }
    }, [contextLoading, loginSettings]);

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

        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setError(null);
    }, []);

    // Handle save
    const handleSave = async () => {
        setIsUploading(true);
        setError(null);

        try {
            let newLogoUrl = logoUrl;

            if (selectedFile) {
                const { downloadUrl } = await uploadBrandLogo(selectedFile);
                newLogoUrl = downloadUrl;
            }

            await saveBrandSettings({
                logoUrl: newLogoUrl || undefined,
                login: {
                    logoScale,
                    brandNameScale: nameScale,
                    gap,
                    brandName: brandName || BRAND.name,
                }
            });

            await refreshBrand();
            setSuccess(true);
            setSelectedFile(null);
            setPreviewUrl(null);

            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error('Failed to save:', err);
            setError('Failed to save settings. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    // Handle reset
    const handleReset = async () => {
        setIsUploading(true);
        setError(null);

        try {
            await saveBrandSettings({
                login: DEFAULT_LOGIN
            });

            await refreshBrand();
            setSuccess(true);
            setSelectedFile(null);
            setPreviewUrl(null);
            setBrandName('');

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
    const displayName = brandName || BRAND.name;

    // Calculate sizes for preview - scale based on device
    const getLogoSize = () => {
        const base = selectedDevice === 'mobile' ? 60 : selectedDevice === 'tablet' ? 70 : 80;
        return Math.round(base * (logoScale / 100));
    };
    const getFontSize = () => {
        const base = selectedDevice === 'mobile' ? 20 : selectedDevice === 'tablet' ? 22 : 24;
        return Math.round(base * (nameScale / 100));
    };

    const loginLogoSize = getLogoSize();
    const loginFontSize = getFontSize();

    const currentDevice = DEVICES.find(d => d.id === selectedDevice)!;

    return (
        <div className="max-w-5xl mx-auto px-4 py-4">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
                    <LogIn className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Login Page Settings</h1>
                    <p className="text-sm text-gray-500">Customize your login page brand</p>
                </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* LEFT: Preview */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    {/* Preview Header with Device Selector */}
                    <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b">
                        <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">Live Preview</span>

                        {/* Device Selector Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowDeviceMenu(!showDeviceMenu)}
                                className="flex items-center gap-2 px-2.5 py-1.5 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 transition-colors"
                            >
                                {currentDevice.icon}
                                <span className="hidden sm:inline">{currentDevice.label}</span>
                                <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${showDeviceMenu ? 'rotate-180' : ''}`} />
                            </button>

                            {showDeviceMenu && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowDeviceMenu(false)} />
                                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                                        {DEVICES.map((device) => (
                                            <button
                                                key={device.id}
                                                onClick={() => {
                                                    setSelectedDevice(device.id);
                                                    setShowDeviceMenu(false);
                                                }}
                                                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${selectedDevice === device.id ? 'text-rose-600 bg-rose-50' : 'text-gray-700'
                                                    }`}
                                            >
                                                {device.icon}
                                                <span>{device.label}</span>
                                                {selectedDevice === device.id && <Check className="w-3 h-3 ml-auto" />}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Preview Content */}
                    <div className="bg-gradient-to-b from-gray-50 to-white p-4 min-h-[450px] flex items-center justify-center overflow-x-auto">
                        <div
                            className="bg-white transition-all duration-300"
                            style={{ width: currentDevice.width, maxWidth: '100%' }}
                        >
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
                                <span
                                    className="font-semibold text-gray-900 text-center"
                                    style={{ fontSize: `${loginFontSize}px`, marginTop: `${gap}px` }}
                                >
                                    {displayName}
                                </span>
                            </div>

                            {/* Login Form Card */}
                            <div className={`bg-white rounded-xl shadow-sm border border-gray-200 space-y-4 ${selectedDevice === 'mobile' ? 'p-4' : 'p-5'}`}>
                                {/* Email */}
                                <div>
                                    <label className={`block font-medium text-gray-700 mb-1 ${selectedDevice === 'mobile' ? 'text-sm' : 'text-sm'}`}>Email</label>
                                    <div className={`border border-gray-200 rounded-lg text-gray-400 bg-gray-50 ${selectedDevice === 'mobile' ? 'px-3 py-2 text-sm' : 'px-3 py-2.5 text-sm'}`}>
                                        email@example.com
                                    </div>
                                </div>

                                {/* Password */}
                                <div>
                                    <label className={`block font-medium text-gray-700 mb-1 ${selectedDevice === 'mobile' ? 'text-sm' : 'text-sm'}`}>Password</label>
                                    <div className={`border border-gray-200 rounded-lg text-gray-400 bg-gray-50 ${selectedDevice === 'mobile' ? 'px-3 py-2 text-sm' : 'px-3 py-2.5 text-sm'}`}>
                                        ••••••••
                                    </div>
                                </div>

                                {/* Sign In Button */}
                                <button className={`w-full bg-gray-900 text-white rounded-lg font-medium ${selectedDevice === 'mobile' ? 'py-2 text-sm' : 'py-2.5 text-sm'}`}>
                                    Sign in
                                </button>

                                {/* Divider */}
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 border-t border-gray-200" />
                                    <span className="text-xs text-gray-400">Or continue with</span>
                                    <div className="flex-1 border-t border-gray-200" />
                                </div>

                                {/* Google Button */}
                                <button className={`w-full flex items-center justify-center gap-2 border border-gray-200 rounded-lg font-medium text-gray-700 hover:bg-gray-50 ${selectedDevice === 'mobile' ? 'py-2 text-sm' : 'py-2.5 text-sm'}`}>
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
                            <div className={`text-center mt-4 text-gray-400 ${selectedDevice === 'mobile' ? 'text-[10px]' : 'text-xs'}`}>
                                © 2026 {displayName}. All rights reserved.
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Settings */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-4">
                    {/* Brand Name */}
                    <div className="space-y-1">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Type className="w-4 h-4" />
                            Brand Name
                        </label>
                        <input
                            type="text"
                            value={brandName}
                            onChange={(e) => setBrandName(e.target.value)}
                            placeholder={BRAND.name}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                        />
                    </div>

                    {/* Sliders */}
                    <SliderControl icon={<LogIn className="w-4 h-4" />} label="Logo Scale" value={logoScale} onChange={setLogoScale} min={50} max={200} unit="%" color="rose" />
                    <SliderControl icon={<Type className="w-4 h-4" />} label="Name Scale" value={nameScale} onChange={setNameScale} min={50} max={200} unit="%" color="pink" />
                    <SliderControl icon={<Move className="w-4 h-4" />} label="Gap" value={gap} onChange={setGap} min={-10} max={64} unit="px" color="purple" />

                    {/* File Upload */}
                    <div className="pt-3 border-t">
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Upload Logo</label>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-rose-400 hover:bg-rose-50/50 transition-colors text-gray-600 hover:text-rose-600 text-sm"
                        >
                            <Upload className="w-4 h-4" />
                            <span>{selectedFile ? selectedFile.name : 'Choose image'}</span>
                        </button>
                    </div>

                    {/* Messages */}
                    {error && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
                            <Check className="w-4 h-4" />
                            Saved!
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                        <button
                            onClick={handleReset}
                            disabled={isUploading}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Reset
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isUploading}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50 text-sm"
                        >
                            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save
                        </button>
                    </div>
                </div>
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
        rose: 'accent-rose-500',
        pink: 'accent-pink-500',
        purple: 'accent-purple-500',
    };

    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    {icon}
                    {label}
                </label>
                <span className="text-sm font-medium text-gray-900 bg-gray-100 px-2 py-0.5 rounded border">
                    {value}{unit}
                </span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-8">{min}{unit}</span>
                <input
                    type="range"
                    min={min}
                    max={max}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className={`flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer ${colorClasses[color] || 'accent-rose-500'}`}
                />
                <span className="text-xs text-gray-400 w-10 text-right">{max}{unit}</span>
            </div>
        </div>
    );
}
