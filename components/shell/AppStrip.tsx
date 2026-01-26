'use client';

/**
 * App Strip Component (Bottom Dock)
 * 
 * macOS-like dock for APICOREDATA platform
 * HIG-FEEL SPEC v2 STRICT compliant
 * 
 * SPEC COMPLIANCE:
 * - Container: 68px height, 14px H padding, 10px V padding
 * - Glass: rgba(255,255,255,0.10) + blur(26px) saturate(1.3)
 * - Radius: 16px
 * - Shadow: 0 10px 30px rgba(0,0,0,0.25)
 * - Inner highlight: 1px rgba(255,255,255,0.14)
 * - Icon slots: 44x44px, 28x28px graphics
 * - Hover: scale(1.07) translateY(-2px) 150ms ease-out
 * - Active dot: 4px, margin-top 4px, rgba(255,255,255,0.70)
 */

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from '@/lib/i18n';
import {
    LayoutDashboard,
    Users,
    Building2,
    Shield,
    Settings,
    Grid3X3,
    FileText,
    BarChart3,
    Package,
    ClipboardList
} from 'lucide-react';

// Types
interface AppItem {
    id: string;
    labelKey: string;
    label: string;
    href: string;
    icon: React.ElementType;
    pinned?: boolean;
}

interface AppStripProps {
    onOpenLibrary?: () => void;
}

// Default Pinned Apps
const PINNED_APPS: AppItem[] = [
    { id: 'dashboard', labelKey: 'platform.dashboard', label: 'Dashboard', href: '/platform', icon: LayoutDashboard, pinned: true },
    { id: 'users', labelKey: 'platform.users', label: 'Users', href: '/platform/users', icon: Users, pinned: true },
    { id: 'orgs', labelKey: 'platform.orgs', label: 'Organizations', href: '/platform/orgs', icon: Building2, pinned: true },
    { id: 'roles', labelKey: 'platform.roles', label: 'Roles', href: '/platform/roles', icon: Shield, pinned: true },
    { id: 'settings', labelKey: 'platform.settings', label: 'Settings', href: '/platform/settings', icon: Settings, pinned: true },
];

// All Available Apps (for App Library)
export const ALL_APPS: AppItem[] = [
    ...PINNED_APPS,
    { id: 'customers', labelKey: 'platform.customers', label: 'Customers', href: '/platform/customers', icon: ClipboardList },
    { id: 'audit', labelKey: 'platform.audit', label: 'Audit Logs', href: '/platform/audit', icon: FileText },
    { id: 'insights', labelKey: 'platform.insights', label: 'Insights', href: '/platform/insights', icon: BarChart3 },
    { id: 'tenants', labelKey: 'platform.tenants', label: 'Tenants', href: '/platform/tenants', icon: Package },
];

export function AppStrip({ onOpenLibrary }: AppStripProps) {
    const pathname = usePathname();
    const locale = useLocale();

    // Check if app is active
    const isActive = (href: string) => {
        const fullHref = `/${locale}${href}`;
        if (href === '/platform') {
            return pathname === fullHref || pathname === `/${locale}/platform`;
        }
        return pathname.startsWith(fullHref);
    };

    return (
        <div
            className="fixed bottom-0 left-0 right-0 z-40 flex justify-center"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
            {/* SPEC 3.1: Dock Container - 68px height, glass effect */}
            <div
                style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--dock-gap)',
                    height: 'var(--dock-h)',
                    padding: 'var(--dock-py) var(--dock-px)',
                    marginBottom: '12px',
                    backgroundColor: 'var(--dock-bg)',
                    backdropFilter: 'blur(26px) saturate(1.3)',
                    WebkitBackdropFilter: 'blur(26px) saturate(1.3)',
                    border: '1px solid var(--dock-border)',
                    borderRadius: '16px',
                    boxShadow: 'var(--dock-shadow)',
                    overflow: 'hidden',
                }}
            >
                {/* SPEC 3.1: Inner highlight (top edge) - 1px rgba(255,255,255,0.14) */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '1px',
                        background: 'rgba(255, 255, 255, 0.14)',
                        pointerEvents: 'none',
                    }}
                    aria-hidden="true"
                />

                {/* Pinned Apps */}
                {PINNED_APPS.map((app) => (
                    <AppStripItem
                        key={app.id}
                        app={app}
                        isActive={isActive(app.href)}
                        locale={locale}
                    />
                ))}

                {/* Divider */}
                <div
                    style={{
                        width: '1px',
                        height: '40px',
                        backgroundColor: 'rgba(255, 255, 255, 0.10)',
                        margin: '0 4px',
                    }}
                />

                {/* App Library Button - SPEC 3.2 */}
                <button
                    onClick={onOpenLibrary}
                    style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 'var(--dock-icon-slot)',
                        height: 'var(--dock-icon-slot)',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.10)',
                        color: 'rgba(255, 255, 255, 0.60)',
                        transition: 'transform 150ms ease-out, color 150ms ease-out',
                        overflow: 'hidden',
                    }}
                    className="hover:scale-[1.07] hover:-translate-y-0.5 hover:text-white group"
                    title="App Library"
                >
                    {/* SPEC 3.3: Gradient overlay for realism */}
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: '12px',
                            background: 'linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.00) 100%)',
                            pointerEvents: 'none',
                        }}
                    />
                    <Grid3X3 style={{ width: 'var(--dock-icon)', height: 'var(--dock-icon)', position: 'relative', zIndex: 1 }} />
                </button>
            </div>
        </div>
    );
}

// SPEC 3.2: Individual App Item - 44px container, 28px icon
function AppStripItem({
    app,
    isActive,
    locale
}: {
    app: AppItem;
    isActive: boolean;
    locale: string;
}) {
    const Icon = app.icon;

    return (
        <Link
            href={`/${locale}${app.href}`}
            style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: 'var(--dock-icon-slot)',
                height: 'var(--dock-icon-slot)',
                borderRadius: '12px',
                backgroundColor: isActive ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.06)',
                border: isActive ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(255, 255, 255, 0.10)',
                transition: 'transform 150ms ease-out, background-color 150ms ease-out',
                overflow: 'hidden',
            }}
            className="hover:scale-[1.07] hover:-translate-y-0.5 hover:bg-[rgba(255,255,255,0.10)] group"
            title={app.label}
        >
            {/* SPEC 3.3: Gradient overlay for realism */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '12px',
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.00) 100%)',
                    pointerEvents: 'none',
                }}
            />

            {/* Icon - 28px (w-7 h-7) */}
            <Icon
                style={{
                    width: 'var(--dock-icon)',
                    height: 'var(--dock-icon)',
                    position: 'relative',
                    zIndex: 1,
                    color: isActive ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.70)',
                    transition: 'color 150ms ease-out',
                }}
                className="group-hover:text-white"
            />

            {/* SPEC 3.2: Active Indicator Dot - 4px, margin-top 4px, white/70 */}
            {isActive && (
                <span
                    style={{
                        position: 'absolute',
                        bottom: '-6px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--dock-dot)',
                        marginTop: '4px',
                    }}
                />
            )}
        </Link>
    );
}
