'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const WALLPAPERS = [
    { id: 'default', name: 'Default Gradient', value: 'bg-gradient-to-br from-gray-50 to-gray-100' },
    { id: 'ocean', name: 'Ocean Mist', value: 'bg-[url("https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=2874&auto=format&fit=crop")] bg-cover bg-center' },
    { id: 'mountain', name: 'Mountain Peak', value: 'bg-[url("https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=3540&auto=format&fit=crop")] bg-cover bg-center' },
    { id: 'abstract', name: 'Abstract Shapes', value: 'bg-[url("https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2940&auto=format&fit=crop")] bg-cover bg-center' },
    { id: 'night', name: 'Night Sky', value: 'bg-[url("https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?q=80&w=2913&auto=format&fit=crop")] bg-cover bg-center' },
];

interface AppearanceContextType {
    wallpaperId: string;
    setWallpaperId: (id: string) => void;
    currentWallpaperClass: string;
    themeMode: 'light' | 'dark';
}

const AppearanceContext = createContext<AppearanceContextType | undefined>(undefined);

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
    const [wallpaperId, setWallpaperId] = useState('ocean'); // Set a nicer default

    const currentWallpaperClass = WALLPAPERS.find(w => w.id === wallpaperId)?.value || WALLPAPERS[0].value;

    // Auto-theme logic: 'default' is light wallpaper -> dark text. Others are dark -> light text.
    const themeMode: 'light' | 'dark' = wallpaperId === 'default' ? 'light' : 'dark';

    return (
        <AppearanceContext.Provider value={{
            wallpaperId,
            setWallpaperId,
            currentWallpaperClass,
            themeMode
        }}>
            {children}
        </AppearanceContext.Provider>
    );
}

export function useAppearance() {
    const context = useContext(AppearanceContext);
    if (context === undefined) {
        throw new Error('useAppearance must be used within an AppearanceProvider');
    }
    return context;
}

export { WALLPAPERS };
