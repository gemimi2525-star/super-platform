'use client';

/**
 * Header Brand Settings Page - With Device Preview Selector
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Upload, RotateCcw, Save, Loader2, Check, AlertCircle, Monitor, Type, Move, Globe, Menu, Search, ChevronDown, Smartphone, Tablet } from 'lucide-react';
import { uploadBrandLogo, saveBrandSettings, DEFAULT_HEADER } from '@/lib/firebase/brand';
import { useBrand } from '@/contexts/BrandContext';
import { BRAND } from '@/config/brand';
import { auth } from '@/lib/firebase/client';

type DeviceType = 'desktop' | 'tablet' | 'mobile';

const DEVICES: { id: DeviceType; label: string; icon: React.ReactNode; width: string }[] = [
    { id: 'desktop', label: 'Desktop (1280px+)', icon: <Monitor className="w-4 h-4" />, width: '100%' },
    { id: 'tablet', label: 'Tablet (768px)', icon: <Tablet className="w-4 h-4" />, width: '768px' },
    { id: 'mobile', label: 'Mobile (375px)', icon: <Smartphone className="w-4 h-4" />, width: '375px' },
];

export default function HeaderBrandPage() {
    const { logoUrl, header, refreshBrand, isLoading: contextLoading } = useBrand();

    const fileInputRef = useRef<HTMLInputElement>(null);

    // State
    const [brandName, setBrandName] = useState('');
    const [logoScale, setLogoScale] = useState(100);
    const [nameScale, setNameScale] = useState(100);
    const [gap, setGap] = useState(8);
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
            setBrandName(header.brandName === BRAND.name ? '' : header.brandName);
            setLogoScale(header.logoScale);
            setNameScale(header.brandNameScale);
            setGap(header.gap);
        }
    }, [contextLoading, header]);

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
                header: {
                    logoScale,
                    brandNameScale: nameScale,
                    gap,
                    brandName: brandName || '',
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

            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error('Failed to save:', err);
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
            await saveBrandSettings({
                header: DEFAULT_HEADER,
            }, auth.currentUser?.uid);
            await refreshBrand();

            setPreviewUrl(null);
            setSelectedFile(null);
            setBrandName('');
            setLogoScale(100);
            setNameScale(100);
            setGap(8);
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
    const displayName = brandName || BRAND.name;

    // Calculate sizes for preview
    const headerLogoSize = Math.round(36 * (logoScale / 100));
    const headerFontSize = Math.round(16 * (nameScale / 100));

    const currentDevice = DEVICES.find(d => d.id === selectedDevice)!;

    return (
        <div className="max-w-5xl mx-auto px-4 py-4">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Monitor className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Header Settings</h1>
                    <p className="text-sm text-gray-500">Customize your header brand</p>
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
                                                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${selectedDevice === device.id ? 'text-purple-600 bg-purple-50' : 'text-gray-700'
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
                    <div className="bg-[#FAFAFA] p-4 min-h-[200px] flex items-start justify-center overflow-x-auto">
                        <div
                            className="bg-white shadow-lg border border-gray-200 rounded-lg overflow-hidden transition-all duration-300"
                            style={{
                                width: selectedDevice === 'desktop' ? '100%' : currentDevice.width,
                                maxWidth: '100%',
                                minWidth: selectedDevice === 'mobile' ? '320px' : selectedDevice === 'tablet' ? '500px' : '600px'
                            }}
                        >
                            {/* Header Bar */}
                            <header className="bg-white border-b border-gray-100">
                                <div className={`flex items-center px-4 ${selectedDevice === 'mobile' ? 'h-[56px]' : 'h-[64px]'}`}>

                                    {/* LEFT ZONE - Fixed width on desktop */}
                                    <div className={`flex items-center ${selectedDevice === 'desktop' ? 'w-[180px] flex-shrink-0' : 'flex-shrink-0'}`}>
                                        {/* Mobile/Tablet: Hamburger */}
                                        {selectedDevice !== 'desktop' && (
                                            <div className="h-9 w-9 flex items-center justify-center rounded-lg border bg-white border-gray-200 text-gray-500">
                                                <Menu className="w-5 h-5" />
                                            </div>
                                        )}

                                        {/* Desktop: Switchers - Compact */}
                                        {selectedDevice === 'desktop' && (
                                            <div className="flex items-center gap-1.5">
                                                <div className="flex items-center gap-1 px-1.5 py-1 bg-gray-50 rounded-md border border-gray-100 text-[10px]">
                                                    <div className="w-4 h-4 rounded bg-blue-100 flex items-center justify-center text-blue-600 text-[8px] font-bold">U</div>
                                                    <span className="font-medium text-gray-600">UT</span>
                                                    <ChevronDown className="w-2.5 h-2.5 text-gray-400" />
                                                </div>
                                                <div className="flex items-center gap-1 px-1.5 py-1 bg-gray-50 rounded-md border border-gray-100 text-[10px]">
                                                    <div className="w-4 h-4 rounded bg-purple-100 flex items-center justify-center text-purple-600 text-[8px] font-bold">O</div>
                                                    <span className="font-medium text-gray-600">ORG</span>
                                                    <ChevronDown className="w-2.5 h-2.5 text-gray-400" />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* CENTER: Logo + Brand Name */}
                                    <div className="flex-1 flex items-center justify-center min-w-0">
                                        <div className="flex items-center">
                                            <Image
                                                src={displayUrl}
                                                alt="Logo"
                                                width={headerLogoSize}
                                                height={headerLogoSize}
                                                className="object-contain rounded-full flex-shrink-0"
                                                style={{ width: headerLogoSize, height: headerLogoSize }}
                                                unoptimized
                                            />
                                            <span
                                                className="font-bold text-gray-900 tracking-tight whitespace-nowrap"
                                                style={{ fontSize: `${headerFontSize}px`, marginLeft: `${gap}px` }}
                                            >
                                                {displayName}
                                            </span>
                                        </div>
                                    </div>

                                    {/* RIGHT ZONE - Fixed width on desktop */}
                                    <div className={`flex items-center gap-1.5 justify-end ${selectedDevice === 'desktop' ? 'w-[180px] flex-shrink-0' : 'flex-shrink-0'}`}>
                                        {/* Mobile/Tablet: Compact Switchers */}
                                        {selectedDevice !== 'desktop' && (
                                            <>
                                                <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center text-blue-600 text-[9px] font-bold">UT</div>
                                                <div className="w-7 h-7 rounded-md bg-purple-50 flex items-center justify-center text-purple-600 text-[9px] font-bold">OR</div>
                                            </>
                                        )}

                                        {/* Language */}
                                        <div className={`flex items-center gap-0.5 px-1.5 py-1 bg-gray-50 rounded-md border border-gray-100 ${selectedDevice === 'mobile' ? 'hidden' : ''}`}>
                                            <Globe className="w-3.5 h-3.5 text-gray-500" />
                                            <span className="text-[10px] font-medium text-gray-600">EN</span>
                                        </div>

                                        {/* User Avatar */}
                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                                            A
                                        </div>
                                    </div>
                                </div>

                                {/* Search Bar (Mobile/Tablet only) */}
                                {selectedDevice !== 'desktop' && (
                                    <div className="px-3 pb-2">
                                        <div className="flex items-center h-8 px-3 bg-gray-50 rounded-lg text-xs text-gray-400 border border-gray-100">
                                            <Search className="w-3.5 h-3.5 mr-2" />
                                            <span>Search...</span>
                                        </div>
                                    </div>
                                )}
                            </header>
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                        />
                    </div>

                    {/* Sliders */}
                    <SliderControl icon={<Monitor className="w-4 h-4" />} label="Logo Scale" value={logoScale} onChange={setLogoScale} min={50} max={200} unit="%" color="purple" />
                    <SliderControl icon={<Type className="w-4 h-4" />} label="Name Scale" value={nameScale} onChange={setNameScale} min={50} max={200} unit="%" color="indigo" />
                    <SliderControl icon={<Move className="w-4 h-4" />} label="Gap" value={gap} onChange={setGap} min={-10} max={64} unit="px" color="violet" />

                    {/* File Upload */}
                    <div className="pt-3 border-t">
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Upload Logo</label>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50/50 transition-colors text-gray-600 hover:text-purple-600 text-sm"
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
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 text-sm"
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
        purple: 'accent-purple-500',
        indigo: 'accent-indigo-500',
        violet: 'accent-violet-500',
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
                    className={`flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer ${colorClasses[color] || 'accent-purple-500'}`}
                />
                <span className="text-xs text-gray-400 w-10 text-right">{max}{unit}</span>
            </div>
        </div>
    );
}
