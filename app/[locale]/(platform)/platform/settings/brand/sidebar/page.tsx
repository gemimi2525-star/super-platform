'use client';

/**
 * Sidebar Brand Settings Page - With Device Preview Selector
 * Each device shows different context to illustrate how sidebar appears
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Upload, RotateCcw, Save, Loader2, Check, AlertCircle, PanelLeft, Type, Move, ChevronDown, LayoutDashboard, Building2, Users, Settings, Monitor, Tablet, Smartphone } from 'lucide-react';
import { uploadBrandLogo, saveBrandSettings, DEFAULT_SIDEBAR } from '@/lib/firebase/brand';
import { useBrand } from '@/contexts/BrandContext';
import { BRAND } from '@/config/brand';
import { auth } from '@/lib/firebase/client';

type DeviceType = 'desktop' | 'tablet' | 'mobile';

const DEVICES: { id: DeviceType; label: string; icon: React.ReactNode }[] = [
    { id: 'desktop', label: 'Desktop (1280px+)', icon: <Monitor className="w-4 h-4" /> },
    { id: 'tablet', label: 'Tablet (768px)', icon: <Tablet className="w-4 h-4" /> },
    { id: 'mobile', label: 'Mobile (375px)', icon: <Smartphone className="w-4 h-4" /> },
];

export default function SidebarBrandPage() {
    const { logoUrl, sidebar, refreshBrand, isLoading: contextLoading } = useBrand();

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
            setBrandName(sidebar.brandName === BRAND.name ? '' : sidebar.brandName);
            setLogoScale(sidebar.logoScale);
            setNameScale(sidebar.brandNameScale);
            setGap(sidebar.gap);
        }
    }, [contextLoading, sidebar]);

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
                sidebar: {
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
                sidebar: DEFAULT_SIDEBAR,
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
    const sidebarLogoSize = Math.round(32 * (logoScale / 100));
    const sidebarFontSize = Math.round(14 * (nameScale / 100));

    const currentDevice = DEVICES.find(d => d.id === selectedDevice)!;

    return (
        <div className="max-w-5xl mx-auto px-4 py-4">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0">
                    <PanelLeft className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Sidebar Settings</h1>
                    <p className="text-sm text-gray-500">Customize your sidebar brand</p>
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
                                                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${selectedDevice === device.id ? 'text-teal-600 bg-teal-50' : 'text-gray-700'
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

                    {/* Preview Content - Different layouts per device */}
                    <div className="bg-[#E8E8E8] p-4 min-h-[380px] flex items-start justify-center overflow-hidden">

                        {/* DESKTOP: Sidebar + Content Layout */}
                        {selectedDevice === 'desktop' && (
                            <div className="flex w-full max-w-[580px] h-[340px] rounded-lg overflow-hidden shadow-lg border border-gray-300">
                                {/* Sidebar */}
                                <div className="w-[200px] bg-[#FAFAFA] border-r border-gray-200 flex flex-col flex-shrink-0">
                                    <div className="px-3 py-3 border-b border-gray-100">
                                        <div className="flex items-center">
                                            <Image src={displayUrl} alt="Logo" width={sidebarLogoSize} height={sidebarLogoSize} className="object-contain rounded-full flex-shrink-0" style={{ width: Math.min(sidebarLogoSize, 28), height: Math.min(sidebarLogoSize, 28) }} unoptimized />
                                            <span className="font-bold text-gray-900 tracking-tight whitespace-nowrap truncate" style={{ fontSize: `${Math.min(sidebarFontSize, 13)}px`, marginLeft: `${Math.min(gap, 8)}px` }}>{displayName}</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 py-2 px-2 space-y-2 overflow-hidden">
                                        <div className="text-[9px] font-bold text-[#8E8E8E] uppercase px-2">Platform</div>
                                        <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-white text-[#0F6FDE] text-[11px] font-medium shadow-sm ring-1 ring-gray-200">
                                            <LayoutDashboard className="w-3 h-3" /><span>Dashboard</span>
                                        </div>
                                        <div className="flex items-center gap-2 px-2 py-1.5 rounded text-[#5A5A5A] text-[11px]">
                                            <Building2 className="w-3 h-3" /><span>Organizations</span>
                                        </div>
                                        <div className="text-[9px] font-bold text-[#8E8E8E] uppercase px-2 pt-2">System</div>
                                        <div className="flex items-center gap-2 px-2 py-1.5 rounded text-[#5A5A5A] text-[11px]">
                                            <Settings className="w-3 h-3" /><span>Settings</span>
                                        </div>
                                    </div>
                                </div>
                                {/* Content Area */}
                                <div className="flex-1 bg-white p-4">
                                    <div className="text-[10px] text-gray-400 mb-2">CONTENT AREA</div>
                                    <div className="space-y-2">
                                        <div className="h-3 bg-gray-100 rounded w-3/4" />
                                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                                        <div className="grid grid-cols-2 gap-2 mt-3">
                                            <div className="h-16 bg-gray-50 rounded border border-gray-100" />
                                            <div className="h-16 bg-gray-50 rounded border border-gray-100" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TABLET: Overlay Sidebar on Content */}
                        {selectedDevice === 'tablet' && (
                            <div className="relative w-full max-w-[480px] h-[340px] rounded-lg overflow-hidden shadow-lg border border-gray-300">
                                {/* Background Content (dimmed) */}
                                <div className="absolute inset-0 bg-white p-4">
                                    <div className="h-10 bg-gray-100 rounded mb-3" />
                                    <div className="space-y-2">
                                        <div className="h-3 bg-gray-100 rounded w-3/4" />
                                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                                        <div className="grid grid-cols-2 gap-2 mt-3">
                                            <div className="h-20 bg-gray-50 rounded" />
                                            <div className="h-20 bg-gray-50 rounded" />
                                        </div>
                                    </div>
                                </div>
                                {/* Backdrop */}
                                <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />
                                {/* Sidebar Overlay */}
                                <div className="absolute left-0 top-0 bottom-0 w-[200px] bg-[#FAFAFA] border-r border-gray-200 shadow-xl flex flex-col">
                                    <div className="px-3 py-3 border-b border-gray-100">
                                        <div className="flex items-center">
                                            <Image src={displayUrl} alt="Logo" width={sidebarLogoSize} height={sidebarLogoSize} className="object-contain rounded-full flex-shrink-0" style={{ width: Math.min(sidebarLogoSize, 28), height: Math.min(sidebarLogoSize, 28) }} unoptimized />
                                            <span className="font-bold text-gray-900 tracking-tight whitespace-nowrap truncate" style={{ fontSize: `${Math.min(sidebarFontSize, 13)}px`, marginLeft: `${Math.min(gap, 8)}px` }}>{displayName}</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 py-2 px-2 space-y-2">
                                        <div className="text-[9px] font-bold text-[#8E8E8E] uppercase px-2">Platform</div>
                                        <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-white text-[#0F6FDE] text-[11px] font-medium shadow-sm ring-1 ring-gray-200">
                                            <LayoutDashboard className="w-3 h-3" /><span>Dashboard</span>
                                        </div>
                                        <div className="flex items-center gap-2 px-2 py-1.5 rounded text-[#5A5A5A] text-[11px]">
                                            <Building2 className="w-3 h-3" /><span>Organizations</span>
                                        </div>
                                        <div className="flex items-center gap-2 px-2 py-1.5 rounded text-[#5A5A5A] text-[11px]">
                                            <Users className="w-3 h-3" /><span>Users</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* MOBILE: Full Drawer Overlay */}
                        {selectedDevice === 'mobile' && (
                            <div className="relative w-[300px] h-[380px] rounded-xl overflow-hidden shadow-lg border border-gray-300 bg-gray-800">
                                {/* Phone Notch */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-gray-800 rounded-b-xl z-10" />
                                {/* Background Content (heavily dimmed) */}
                                <div className="absolute inset-0 pt-6 bg-white">
                                    <div className="h-12 bg-gray-100 mx-3 rounded mb-2" />
                                    <div className="px-3 space-y-2">
                                        <div className="h-2 bg-gray-100 rounded w-3/4" />
                                        <div className="h-2 bg-gray-100 rounded w-1/2" />
                                    </div>
                                </div>
                                {/* Backdrop */}
                                <div className="absolute inset-0 bg-black/40" />
                                {/* Sidebar Drawer */}
                                <div className="absolute left-0 top-0 bottom-0 w-[220px] bg-[#FAFAFA] shadow-2xl flex flex-col">
                                    <div className="px-4 py-4 border-b border-gray-100 mt-2">
                                        <div className="flex items-center">
                                            <Image src={displayUrl} alt="Logo" width={sidebarLogoSize} height={sidebarLogoSize} className="object-contain rounded-full flex-shrink-0" style={{ width: sidebarLogoSize, height: sidebarLogoSize }} unoptimized />
                                            <span className="font-bold text-gray-900 tracking-tight whitespace-nowrap" style={{ fontSize: `${sidebarFontSize}px`, marginLeft: `${gap}px` }}>{displayName}</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 py-3 px-3 space-y-3">
                                        <div className="text-[10px] font-bold text-[#8E8E8E] uppercase px-2">Platform</div>
                                        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white text-[#0F6FDE] text-sm font-medium shadow-sm ring-1 ring-gray-200">
                                            <LayoutDashboard className="w-4 h-4" /><span>Dashboard</span>
                                        </div>
                                        <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#5A5A5A] text-sm">
                                            <Building2 className="w-4 h-4" /><span>Organizations</span>
                                        </div>
                                        <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#5A5A5A] text-sm">
                                            <Users className="w-4 h-4" /><span>Users</span>
                                        </div>
                                        <div className="text-[10px] font-bold text-[#8E8E8E] uppercase px-2 pt-2">System</div>
                                        <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#5A5A5A] text-sm">
                                            <Settings className="w-4 h-4" /><span>Brand Settings</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                        />
                    </div>

                    {/* Sliders */}
                    <SliderControl icon={<PanelLeft className="w-4 h-4" />} label="Logo Scale" value={logoScale} onChange={setLogoScale} min={50} max={200} unit="%" color="teal" />
                    <SliderControl icon={<Type className="w-4 h-4" />} label="Name Scale" value={nameScale} onChange={setNameScale} min={50} max={200} unit="%" color="cyan" />
                    <SliderControl icon={<Move className="w-4 h-4" />} label="Gap" value={gap} onChange={setGap} min={-10} max={64} unit="px" color="emerald" />

                    {/* File Upload */}
                    <div className="pt-3 border-t">
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Upload Logo</label>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-teal-400 hover:bg-teal-50/50 transition-colors text-gray-600 hover:text-teal-600 text-sm"
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
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 text-sm"
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
        teal: 'accent-teal-500',
        cyan: 'accent-cyan-500',
        emerald: 'accent-emerald-500',
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
                    className={`flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer ${colorClasses[color] || 'accent-teal-500'}`}
                />
                <span className="text-xs text-gray-400 w-10 text-right">{max}{unit}</span>
            </div>
        </div>
    );
}
