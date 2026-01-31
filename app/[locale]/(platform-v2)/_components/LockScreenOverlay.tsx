/**
 * ═══════════════════════════════════════════════════════════════════════════
 * APICOREDATA OS — Lock Screen Overlay
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * PHASE 7.4 + 7.2.1: Soft-lock overlay using Core UI
 * 
 * PHASE 7.2.1 INTEGRATION:
 * - CoreButton (unlock button)
 * - CoreIconCircle (lock icon)
 * 
 * @version 2.0.0 (Core UI Integrated)
 * @date 2026-01-29
 */

'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from '@/lib/i18n';
import { useCorePreferences } from '@/lib/stores/corePreferencesStore';
import { Lock, Unlock } from 'lucide-react';
import { CoreButton, CoreIconCircle } from '@/core-ui';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface LockScreenOverlayProps {
    isLocked: boolean;
    onUnlock: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATION VARIANTS
// ═══════════════════════════════════════════════════════════════════════════

const overlayVariants = {
    initial: { opacity: 0 },
    enter: {
        opacity: 1,
        transition: { duration: 0.3 }
    },
    exit: {
        opacity: 0,
        transition: { duration: 0.2 }
    },
};

const contentVariants = {
    initial: { opacity: 0, scale: 0.95, y: 20 },
    enter: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { duration: 0.3, delay: 0.1 }
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        y: -10,
        transition: { duration: 0.2 }
    },
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function LockScreenOverlay({
    isLocked,
    onUnlock,
}: LockScreenOverlayProps) {
    const t = useTranslations('v2.coreSystem.lock');
    const [isUnlocking, setIsUnlocking] = useState(false);

    const handleUnlock = useCallback(async () => {
        setIsUnlocking(true);

        // v1: Simple unlock without re-authentication
        // v1.1: Add session verification here
        await new Promise(resolve => setTimeout(resolve, 500));

        setIsUnlocking(false);
        onUnlock();
    }, [onUnlock]);

    // Current time display
    const [time, setTime] = React.useState(new Date());
    React.useEffect(() => {
        if (!isLocked) return;
        const interval = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, [isLocked]);

    const formattedTime = time.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });
    const formattedDate = time.toLocaleDateString([], {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    });

    return (
        <AnimatePresence>
            {isLocked && (
                <motion.div
                    variants={overlayVariants}
                    initial="initial"
                    animate="enter"
                    exit="exit"
                    className="fixed inset-0 z-[999] flex items-center justify-center"
                    style={{
                        background: 'linear-gradient(135deg, rgb(15, 23, 42) 0%, rgb(30, 64, 175) 100%)',
                    }}
                >
                    {/* Blur overlay to hide content */}
                    <div className="absolute inset-0 backdrop-blur-xl" />

                    {/* Lock Screen Content */}
                    <motion.div
                        variants={contentVariants}
                        className="relative z-10 text-center text-white"
                    >
                        {/* Time */}
                        <div className="text-7xl font-light mb-2">
                            {formattedTime}
                        </div>

                        {/* Date */}
                        <div className="text-xl text-white/70 mb-12">
                            {formattedDate}
                        </div>

                        {/* Lock Icon using CoreIconCircle */}
                        <div className="flex justify-center mb-6">
                            <CoreIconCircle
                                icon={<Lock />}
                                size="xl"
                                variant="subtle"
                                color="info"
                                style={{
                                    width: '80px',
                                    height: '80px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    color: 'rgba(255, 255, 255, 0.8)',
                                }}
                            />
                        </div>

                        {/* Message */}
                        <p className="text-white/60 mb-6">
                            {t('message')}
                        </p>

                        {/* Unlock Button using CoreButton */}
                        <CoreButton
                            variant="secondary"
                            size="lg"
                            iconLeft={<Unlock size={18} />}
                            onClick={handleUnlock}
                            loading={isUnlocking}
                            style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                borderColor: 'rgba(255, 255, 255, 0.2)',
                                color: 'white',
                                borderRadius: '9999px',
                                paddingLeft: 'var(--os-space-6)',
                                paddingRight: 'var(--os-space-6)',
                            }}
                        >
                            {isUnlocking ? t('unlocking') : t('unlock')}
                        </CoreButton>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// WRAPPER WITH STORE
// ═══════════════════════════════════════════════════════════════════════════

export function LockScreenOverlayWithStore() {
    const { isLocked, setLocked } = useCorePreferences();

    return (
        <LockScreenOverlay
            isLocked={isLocked}
            onUnlock={() => setLocked(false)}
        />
    );
}

export default LockScreenOverlay;
