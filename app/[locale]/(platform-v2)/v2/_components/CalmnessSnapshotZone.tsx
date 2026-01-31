'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * APICOREDATA OS — Calmness Snapshot Zone
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * PHASE 7.5 + 7.2.1: System Snapshot Zone using Core UI
 * 
 * PURPOSE:
 * - Show "just enough" system context
 * - NOT a dashboard — calm status awareness
 * - 2-3 snapshot cards maximum
 * 
 * PHASE 7.2.1 INTEGRATION:
 * - CoreCard (glass variant)
 * - CoreBadge (status dot)
 * - CoreIcon / CoreIconCircle
 * - CoreEmptyState
 * 
 * @version 2.0.0 (Core UI Integrated)
 * @date 2026-01-29
 */

import React from 'react';
import { motion, type Variants } from 'framer-motion';
import { useTranslations } from '@/lib/i18n';
import { Users, Building2, ShieldCheck } from 'lucide-react';
import { CoreCard, CoreBadge, CoreIconCircle, CoreEmptyState } from '@/core-ui';

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATION
// ═══════════════════════════════════════════════════════════════════════════

const cardVariants: Variants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.25,
            ease: [0.25, 0.1, 0.25, 1.0] as const,
        },
    },
};

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.06,
        },
    },
};


// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface CalmnessSnapshotZoneProps {
    widgetIds: string[];
    isDark?: boolean;
}

interface SnapshotCard {
    id: string;
    icon: React.ReactNode;
    label: string;
    context: string;
    status: 'ok' | 'info';
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function CalmnessSnapshotZone({ widgetIds, isDark = false }: CalmnessSnapshotZoneProps) {
    const t = useTranslations('v2.desktop.snapshot');

    // Static snapshot cards — calm, minimal data
    // In future: connect to real data with slow refresh
    const snapshotCards: SnapshotCard[] = [
        {
            id: 'users',
            icon: <Users className="w-5 h-5" />,
            label: t('usersLabel'),
            context: t('usersContext'),
            status: 'ok',
        },
        {
            id: 'orgs',
            icon: <Building2 className="w-5 h-5" />,
            label: t('orgsLabel'),
            context: t('orgsContext'),
            status: 'ok',
        },
        {
            id: 'security',
            icon: <ShieldCheck className="w-5 h-5" />,
            label: t('securityLabel'),
            context: t('securityContext'),
            status: 'ok',
        },
    ];

    // Filter to show max 3 cards (based on widgetIds if available)
    const visibleCards = widgetIds.length > 0
        ? snapshotCards.filter(card =>
            widgetIds.some(id => id.includes(card.id))
        ).slice(0, 3)
        : snapshotCards.slice(0, 3);

    // If no cards to show, display calm empty state
    if (visibleCards.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <CoreEmptyState
                    size="sm"
                    title={t('calmEmpty')}
                />
            </motion.div>
        );
    }

    return (
        <motion.div
            className="calmness-snapshot-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {visibleCards.map(card => (
                <motion.div
                    key={card.id}
                    variants={cardVariants}
                    whileHover={{
                        y: -2,
                        transition: { duration: 0.2 }
                    }}
                >
                    <CoreCard
                        variant={isDark ? 'glass' : 'default'}
                        hoverable
                        padding="md"
                        style={{
                            // Override for dark mode glass
                            ...(isDark ? {
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                borderColor: 'rgba(255, 255, 255, 0.1)',
                            } : {}),
                        }}
                    >
                        {/* Card Header: Icon + Status */}
                        <div className="flex items-center justify-between mb-3">
                            <CoreIconCircle
                                icon={card.icon}
                                size="sm"
                                variant="subtle"
                                color={isDark ? 'info' : 'primary'}
                                style={isDark ? {
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    color: 'rgba(255, 255, 255, 0.8)',
                                } : {}}
                            />
                            {/* Status Dot using CoreBadge */}
                            <CoreBadge
                                type="dot"
                                variant={card.status === 'ok' ? 'success' : 'info'}
                            />
                        </div>

                        {/* Card Content: Label + Context */}
                        <h3
                            className={`
                                text-sm font-medium mb-1
                                ${isDark ? 'text-white/90' : 'text-neutral-800'}
                            `}
                        >
                            {card.label}
                        </h3>
                        <p
                            className={`
                                text-xs leading-relaxed
                                ${isDark ? 'text-white/50' : 'text-neutral-500'}
                            `}
                        >
                            {card.context}
                        </p>
                    </CoreCard>
                </motion.div>
            ))}
        </motion.div>
    );
}

export default CalmnessSnapshotZone;
