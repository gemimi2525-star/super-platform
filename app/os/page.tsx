'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Core OS Page — Phase 9.8: Next.js Dynamic Import (Fixed)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Using proper Next.js dynamic() instead of manual import in useEffect.
 * This ensures proper SSR handling and client-only loading.
 * 
 * @module app/os/page
 * @version 1.6.0 (Phase 9.8)
 */

import dynamic from 'next/dynamic';

// Loading fallback component (must be a plain function, not use client)
const LoadingScreen = () => (
    <div style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
        color: 'rgba(255, 255, 255, 0.9)',
    }}>
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
        }}>
            <div style={{ fontSize: 48, opacity: 0.8 }}>◈</div>
            <div style={{ fontSize: 14, opacity: 0.6, letterSpacing: 2 }}>
                LOADING OS...
            </div>
        </div>
    </div>
);

// Dynamic import with ssr: false to ensure client-only
const OSShell = dynamic(
    () => import('@/components/os-shell/OSShell').then((mod) => {
        console.log('[OS Page] OSShell module loaded. Exports:', Object.keys(mod));
        return mod;
    }),
    {
        ssr: false,
        loading: () => <LoadingScreen />,
    }
);

export default function CoreOSDemoPage() {
    return <OSShell />;
}
