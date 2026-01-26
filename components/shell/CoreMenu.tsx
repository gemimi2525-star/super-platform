'use client';

/**
 * Core Menu Component (Apple Menu equivalent)
 * 
 * macOS-style dropdown menu from Workspace Bar logo
 * Round 1.6 STRICT SPEC compliant
 * 
 * SPEC 2: Dropdown
 * - Background: bg-black/55 + backdrop-blur-2xl
 * - Border radius: 12px (rounded-xl)
 * - Shadow: 0_16px_48px_rgba(0,0,0,0.35)
 * - Padding: 8px (p-2)
 */
import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useLocale, useTranslations } from '@/lib/i18n';
import { Portal } from '@/components/ui-base/Portal';
import { useBrand } from '@/contexts/BrandContext';
import { Grid3X3 } from 'lucide-react';

interface CoreMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenAppLibrary: () => void;
}

export function CoreMenu({ isOpen, onClose, onOpenAppLibrary }: CoreMenuProps) {
    const router = useRouter();
    const locale = useLocale();
    const t = useTranslations();
    const { header } = useBrand();
    const menuRef = useRef<HTMLDivElement>(null);

    // Focus first item when opened
    useEffect(() => {
        if (isOpen && menuRef.current) {
            const firstButton = menuRef.current.querySelector('button:not([disabled])');
            if (firstButton) {
                (firstButton as HTMLButtonElement).focus();
            }
        }
    }, [isOpen]);

    // ESC key closes menu
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push(`/${locale}/auth/login`);
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const handleOpenLibrary = () => {
        onClose();
        onOpenAppLibrary();
    };

    const handleSettings = () => {
        // Route to System Settings > Appearance as per SPEC PART 4
        router.push(`/${locale}/platform/settings/appearance`);
        onClose();
    };

    const handleLockScreen = () => {
        // Todo: Implement lock screen logic
        console.log('Lock Screen');
        onClose();
    };

    return (
        <Portal>
            {/* Backdrop */}
            <div className="fixed inset-0 z-50" onClick={onClose} />

            {/* SPEC 2.1-2.3: Dropdown with dark glass effect */}
            <div
                ref={menuRef}
                /*
                style={{
                    position: 'fixed',
                    zIndex: 50,
                    top: '40px',
                    left: '12px',
                    minWidth: '220px',
                    backgroundColor: 'var(--dropdown-bg)',
                    backdropFilter: 'blur(26px) saturate(1.2)',
                    WebkitBackdropFilter: 'blur(26px) saturate(1.2)',
                    borderRadius: 'var(--dropdown-radius)',
                    border: '1px solid var(--dropdown-border)',
                    boxShadow: 'var(--dropdown-shadow)',
                    padding: 'var(--dropdown-p)',
                    animation: 'fadeIn 140ms ease-out',
                }}
                */
                onClick={(e) => e.stopPropagation()}
                role="menu"
                className="fixed z-50 top-10 left-3 min-w-[220px] bg-black/80 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl p-2"
            >
                {/* About */}
                <MenuItem
                    label="About This Platform"
                    onClick={() => { alert('APICOREDATA Platform v1.2'); onClose(); }}
                />

                <div style={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.10)', margin: '6px 0' }} />

                {/* Settings Hub & Updates - SPEC PART 4: System Settings -> /settings/appearance */}
                <MenuItem
                    label="System Settings..."
                    shortcut="⌘,"
                    onClick={handleSettings}
                />
                <MenuItem
                    label="Core Hub..."
                    icon={Grid3X3}
                    onClick={handleOpenLibrary}
                />
                <MenuItem
                    label="Check for Updates..."
                    disabled
                />

                <div style={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.10)', margin: '6px 0' }} />

                {/* Recent Items Placeholder */}
                <MenuItem
                    label="Recent Items"
                    hasSubmenu
                    disabled
                />

                <div style={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.10)', margin: '6px 0' }} />

                {/* Force Quit */}
                <MenuItem
                    label="Force Quit..."
                    shortcut="⌥⌘Q"
                    disabled
                />

                <div style={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.10)', margin: '6px 0' }} />

                {/* Power Options */}
                <MenuItem label="Sleep" disabled />
                <MenuItem label="Restart..." disabled />
                <MenuItem label="Shut Down..." disabled />

                <div style={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.10)', margin: '6px 0' }} />

                {/* Lock & Logout - SPEC PART 4: Logout works */}
                <MenuItem
                    label="Lock Screen"
                    shortcut="^⌘Q"
                    onClick={handleLockScreen}
                />
                <MenuItem
                    label={t('common.logout') || 'Log Out...'}
                    shortcut="⇧⌘Q"
                    onClick={handleLogout}
                />
            </div>
        </Portal>
    );
}

// SPEC 2.3: MenuItem with 28px height, 13px/20px font
interface MenuItemProps {
    label: string;
    shortcut?: string;
    icon?: React.ElementType;
    disabled?: boolean;
    hasSubmenu?: boolean;
    onClick?: () => void;
}

function MenuItem({ label, shortcut, icon: Icon, disabled, hasSubmenu, onClick }: MenuItemProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            role="menuitem"
            className={`
                w-full flex items-center justify-between
                px-3 h-7
                text-left text-[13px] leading-[20px]
                rounded-md
                transition-colors
                group
                ${disabled
                    ? 'text-white/30 cursor-default'
                    : 'text-[var(--menubar-text)] hover:bg-[var(--dropdown-row-hover)] active:bg-[rgba(255,255,255,0.14)]'}
            `}
        >
            <div className="flex items-center gap-2">
                {Icon && <Icon className={`w-3.5 h-3.5 ${disabled ? 'opacity-30' : 'text-white/70 group-hover:text-white'}`} />}
                <span>{label}</span>
            </div>
            <div className="flex items-center gap-1">
                {shortcut && <span className={`text-xs tracking-tighter ${disabled ? 'text-white/20' : 'text-white/50 group-hover:text-white/70'}`}>{shortcut}</span>}
                {hasSubmenu && <span className="text-white/40 group-hover:text-white/70">▸</span>}
            </div>
        </button>
    );
}
