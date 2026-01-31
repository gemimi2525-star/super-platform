'use client';

/**
 * Platform Sidebar Navigation (Refactored Phase 17)
 * 
 * Features:
 * - Linear-style Collapsible Rail
 * - Accordion Groups (Exclusive Open)
 * - Mobile Overlay Drawer
 * - Lucide Icons Integration
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from '@/lib/i18n';
import { useProgram } from '@/contexts/ProgramContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useBrand } from '@/contexts/BrandContext';
import { BrandLogo } from '@/components/BrandLogo';
import {
    LayoutDashboard,
    Building2,
    Users,
    ShieldCheck,
    Briefcase,
    ShoppingBag,
    Package,
    DollarSign,
    FileText,
    LineChart,
    Settings,
    ChevronDown,
    ChevronRight,
    Search,
    AlertCircle,
    FileSearch,
    BarChart2,
    Activity,
    BookOpen,
    Palette,
    Monitor,
    PanelLeft,
    LogIn
} from 'lucide-react';

// --- Types ---

interface NavItem {
    labelKey: string;
    href: string;
    match: string; // Used for active state matching
    icon: React.ElementType;
    disabled?: boolean;
    subItems?: NavItem[]; // Sub-menu items
}

interface NavGroup {
    titleKey: string; // "PLATFORM", "BUSINESS"
    id: string; // Unique ID for accordion state
    items: NavItem[];
}

// --- Icons Map (Helper for Program Switching logic if needed purely data driven later) ---
// For now, we define icons directly in the config below.

export function PlatformSidebar() {
    const pathname = usePathname();
    const t = useTranslations('platform.sidebar');
    const { activeProgram } = useProgram();
    const { isDesktopHidden, isCollapsed, toggleCollapse, isMobileOpen, closeMobile, isProgramMenuOpen, hideDesktopSidebar } = useSidebar();
    const { sidebar } = useBrand();

    // Calculate sizes from per-location settings
    const sidebarFontSize = Math.round(14 * (sidebar.brandNameScale / 100));
    const sidebarGap = sidebar.gap;

    // State for exclusive accordion (Desktop Expanded Only)
    // We persist this per program eventually, but simple state for now is fine.
    const [openGroupId, setOpenGroupId] = useState<string | null>('platform');
    const [expandedSubMenu, setExpandedSubMenu] = useState<string | null>(null);

    const seg = pathname?.split('/')?.[1];
    const locale = seg && ['en', 'th'].includes(seg) ? seg : 'en';

    // --- Configurations ---

    const PLATFORM_GROUPS: NavGroup[] = [
        {
            titleKey: 'domain.platform',
            id: 'platform',
            items: [
                { labelKey: 'nav.dashboard', href: '/platform', match: '/platform$', icon: LayoutDashboard },
                { labelKey: 'nav.organizations', href: '/platform/orgs', match: '/platform/orgs', icon: Building2 },
                { labelKey: 'nav.users', href: '/platform/users', match: '/platform/users', icon: Users },
                { labelKey: 'nav.roles', href: '/platform/roles', match: '/platform/roles', icon: ShieldCheck },
            ]
        },
        {
            titleKey: 'domain.business',
            id: 'business',
            items: [
                { labelKey: 'nav.customers', href: '/platform/customers', match: '/platform/customers', icon: Briefcase },
                { labelKey: 'nav.products', href: '#', match: '', disabled: true, icon: ShoppingBag },
                { labelKey: 'nav.inventory', href: '#', match: '', disabled: true, icon: Package },
                { labelKey: 'nav.finance', href: '#', match: '', disabled: true, icon: DollarSign },
            ]
        },
        {
            titleKey: 'domain.system',
            id: 'system',
            items: [
                { labelKey: 'nav.audit', href: '/platform/audit', match: '/platform/audit', icon: FileText },
                { labelKey: 'nav.insights', href: '/platform/insights', match: '/platform/insights', icon: LineChart },
                { labelKey: 'resources.designSystem', href: '/design-system/index.html', match: '/design-system', icon: BookOpen },
                {
                    labelKey: 'nav.brand',
                    href: '/platform/settings/brand/header',
                    match: '/platform/settings/brand',
                    icon: Palette,
                    subItems: [
                        { labelKey: 'nav.brandHeader', href: '/platform/settings/brand/header', match: '/platform/settings/brand/header', icon: Monitor },
                        { labelKey: 'nav.brandSidebar', href: '/platform/settings/brand/sidebar', match: '/platform/settings/brand/sidebar', icon: PanelLeft },
                        { labelKey: 'nav.brandLogin', href: '/platform/settings/brand/login', match: '/platform/settings/brand/login', icon: LogIn },
                    ]
                },
                { labelKey: 'nav.settings', href: '#', match: '', disabled: true, icon: Settings },
            ]
        }
    ];

    const SEO_GROUPS: NavGroup[] = [
        {
            titleKey: 'SEO Program',
            id: 'seo_overview',
            items: [
                { labelKey: 'Dashboard', href: '#', match: '', disabled: true, icon: LayoutDashboard },
                { labelKey: 'Rankings', href: '#', match: '', disabled: true, icon: Search },
                { labelKey: 'Keywords', href: '#', match: '', disabled: true, icon: FileSearch },
            ]
        },
        {
            titleKey: 'Site Audit',
            id: 'seo_audit',
            items: [
                { labelKey: 'Issues', href: '#', match: '', disabled: true, icon: AlertCircle },
                { labelKey: 'Crawl Log', href: '#', match: '', disabled: true, icon: Activity },
            ]
        }
    ];

    const ANALYTICS_GROUPS: NavGroup[] = [
        {
            titleKey: 'Reports',
            id: 'analytics_reports',
            items: [
                { labelKey: 'Realtime', href: '#', match: '', disabled: true, icon: Activity },
                { labelKey: 'Acquisition', href: '#', match: '', disabled: true, icon: BarChart2 },
            ]
        }
    ];

    // Select Active Groups
    let currentGroups = PLATFORM_GROUPS;
    if (activeProgram === 'seo') currentGroups = SEO_GROUPS;
    if (activeProgram === 'analytics') currentGroups = ANALYTICS_GROUPS;

    // Default open first group if none open and switching programs
    useEffect(() => {
        if (!openGroupId && currentGroups.length > 0) {
            setOpenGroupId(currentGroups[0].id);
        }
    }, [activeProgram, currentGroups, openGroupId]);

    // Handle Group Toggle (Accordion)
    const toggleGroup = (id: string, e?: React.MouseEvent) => {
        // Prevent event bubbling if needed
        e?.stopPropagation();

        if (isCollapsed) {
            // Should auto-expand sidebar if user clicks a group header icon 
            // (But in collapsed mode, we usually don't show headers, just items)
            // If we support clicking group icon to expand:
            toggleCollapse();
            setOpenGroupId(id);
        } else {
            // Exclusive Accordion: Close others
            setOpenGroupId(prev => prev === id ? null : id);
        }
    };

    // --- Helpers ---
    const isGroupActive = (items: NavItem[]) => {
        return items.some(item => {
            const isExact = item.match.endsWith('$');
            const matchPath = isExact ? item.match.slice(0, -1) : item.match;
            return !item.disabled && (
                pathname === `/${locale}${matchPath}` ||
                (!isExact && pathname.startsWith(`/${locale}${matchPath}/`))
            );
        });
    };

    // --- Render ---

    const sidebarWidth = isCollapsed ? 'w-[64px]' : 'w-[260px]';
    const mobileClasses = isMobileOpen
        ? 'translate-x-0 shadow-xl'
        : '-translate-x-full';





    // Check if desktop (xl = 1280px+)
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        const checkDesktop = () => setIsDesktop(window.innerWidth >= 1280);
        checkDesktop();
        window.addEventListener('resize', checkDesktop);
        return () => window.removeEventListener('resize', checkDesktop);
    }, []);

    // Determine if sidebar overlay should show (based on screen size)
    const shouldShowOverlay = isDesktop ? !isDesktopHidden : isMobileOpen;

    // Handler to close sidebar when clicking outside
    const handleOverlayClick = () => {
        if (isDesktop) {
            hideDesktopSidebar();
        } else {
            closeMobile();
        }
    };

    return (
        <>
            {/* Click-outside overlay - closes sidebar when clicking anywhere else */}
            {shouldShowOverlay && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={handleOverlayClick}
                    aria-hidden="true"
                />
            )}

            <aside className={`
                fixed top-0 bottom-0 left-0 z-[250]
                bg-[#FAFAFA] border-r border-[#E8E8E8] 
                transition-transform duration-300 ease-in-out
                flex flex-col
                w-[160px]
                
                /* Mobile/Tablet: Drawer overlay */
                ${isMobileOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'}

                /* Desktop (xl 1280px+): Always overlay, toggle via isDesktopHidden */
                ${isDesktopHidden
                    ? 'xl:-translate-x-full'
                    : 'xl:translate-x-0 xl:w-[180px] xl:shadow-lg'
                }
            `}>

                {/* Sidebar Header with BrandLogo */}
                <div className="px-4 py-4 border-b border-gray-100 mb-2">
                    <Link href="/platform" className="flex items-center group" onClick={() => isMobileOpen && closeMobile()}>
                        <BrandLogo size="sm" location="sidebar" />
                        <span
                            className="font-bold text-[#111827] tracking-tight group-hover:text-gray-700 transition-colors"
                            style={{ fontSize: `${sidebarFontSize}px`, marginLeft: `${sidebarGap}px` }}
                        >
                            {sidebar.brandName}
                        </span>
                    </Link>
                </div>

                {/* Scroll Area */}
                <div className="flex-1 overflow-y-auto py-4 px-3">
                    {currentGroups.map((group) => {
                        // Always expanded logic
                        const isOpen = openGroupId === group.id;

                        return (
                            <div key={group.id} className="mb-4">
                                {/* Group Header */}
                                <button
                                    onClick={() => toggleGroup(group.id)}
                                    className="w-full flex items-center justify-between px-3 py-1.5 mb-1 text-[11px] font-bold text-[#8E8E8E] uppercase tracking-wider hover:text-[#525252] transition-colors"
                                >
                                    <span>{t(group.titleKey) !== group.titleKey ? t(group.titleKey) : group.titleKey}</span>
                                    {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                </button>

                                {/* Group Items */}
                                <div className={`space-y-0.5 ${!isOpen ? 'hidden' : 'block'}`}>
                                    {group.items.map((item) => {
                                        const isExact = item.match.endsWith('$');
                                        const matchPath = isExact ? item.match.slice(0, -1) : item.match;

                                        const isActive = !item.disabled && (
                                            pathname === `/${locale}${matchPath}` ||
                                            (!isExact && pathname.startsWith(`/${locale}${matchPath}/`))
                                        );

                                        return (
                                            <div key={item.labelKey}>
                                                {item.disabled ? (
                                                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 cursor-not-allowed select-none opacity-60">
                                                        <item.icon className="w-4 h-4" />
                                                        <span>{t(item.labelKey)}</span>
                                                    </div>
                                                ) : item.subItems ? (
                                                    /* Item with SubMenu */
                                                    <div>
                                                        <button
                                                            onClick={() => setExpandedSubMenu(expandedSubMenu === item.labelKey ? null : item.labelKey)}
                                                            className={`
                                                                w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-medium
                                                                transition-all duration-200
                                                                ${isActive
                                                                    ? 'bg-white text-[#0F6FDE] shadow-sm ring-1 ring-[#E8E8E8]'
                                                                    : 'text-[#5A5A5A] hover:bg-[#EAEAEA] hover:text-[#242424]'
                                                                }
                                                            `}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <item.icon className="w-4 h-4" aria-hidden="true" />
                                                                <span>{t(item.labelKey)}</span>
                                                            </div>
                                                            {expandedSubMenu === item.labelKey ? (
                                                                <ChevronDown className="w-3 h-3" />
                                                            ) : (
                                                                <ChevronRight className="w-3 h-3" />
                                                            )}
                                                        </button>
                                                        {/* SubMenu Items */}
                                                        {expandedSubMenu === item.labelKey && (
                                                            <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-gray-200 pl-2">
                                                                {item.subItems.map((subItem) => {
                                                                    const subIsExact = subItem.match.endsWith('$');
                                                                    const subMatchPath = subIsExact ? subItem.match.slice(0, -1) : subItem.match;
                                                                    const subIsActive = !subItem.disabled && (
                                                                        pathname === `/${locale}${subMatchPath}` ||
                                                                        (!subIsExact && pathname.startsWith(`/${locale}${subMatchPath}/`))
                                                                    );

                                                                    return (
                                                                        <Link
                                                                            key={subItem.labelKey}
                                                                            href={`/${locale}${subItem.href}`}
                                                                            onClick={() => isMobileOpen && closeMobile()}
                                                                            className={`
                                                                                flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm font-medium
                                                                                transition-all duration-200
                                                                                ${subIsActive
                                                                                    ? 'bg-white text-[#0F6FDE] shadow-sm ring-1 ring-[#E8E8E8]'
                                                                                    : 'text-[#5A5A5A] hover:bg-[#EAEAEA] hover:text-[#242424]'
                                                                                }
                                                                            `}
                                                                        >
                                                                            <subItem.icon className="w-3.5 h-3.5" aria-hidden="true" />
                                                                            <span className="text-[13px]">{t(subItem.labelKey) !== subItem.labelKey ? t(subItem.labelKey) : subItem.labelKey.replace('nav.brand', '')}</span>
                                                                        </Link>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <Link
                                                        href={`/${locale}${item.href}`}
                                                        onClick={() => isMobileOpen && closeMobile()}
                                                        className={`
                                                            flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                                                            transition-all duration-200
                                                            ${isActive
                                                                ? 'bg-white text-[#0F6FDE] shadow-sm ring-1 ring-[#E8E8E8]'
                                                                : 'text-[#5A5A5A] hover:bg-[#EAEAEA] hover:text-[#242424]'
                                                            }
                                                        `}
                                                    >
                                                        <item.icon className="w-4 h-4" aria-hidden="true" />
                                                        <span>{t(item.labelKey)}</span>
                                                    </Link>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </aside>
        </>
    );
}

function ArrowUpRightIcon() {
    return (
        <svg className="w-3 h-3 text-[#8E8E8E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
    );
}
