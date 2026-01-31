'use client';

/**
 * OS Desktop Widgets Component
 * 
 * Renders the System Status zone on the OS Home Desktop.
 * Shows minimal, "quiet" status widgets for OS-level information.
 * 
 * STEP 2: Added Framer Motion
 * - Staggered grid entrance
 * - Subtle hover elevation
 * - Calm, trustworthy feel (like System Preferences)
 * 
 * RESPONSIBILITY: System Status Zone only
 * - Widget data resolved from WIDGET_REGISTRY client-side
 * - IDs passed from server (serializable)
 * - Full i18n support
 */

import React from 'react';
import { motion } from 'framer-motion';
import { OSWidgetDefinition } from '@super-platform/core/src/os/widgets/types';
import { OSWidget } from '@/modules/design-system/src/patterns/OSWidget';
import { WIDGET_REGISTRY } from '@/config/widget-registry';
import { useTranslations } from '@/lib/i18n';
import { staggerContainer, staggerItem } from '@/lib/motion/os-motion';

interface OSDesktopWidgetsProps {
    widgetIds: string[];
}

export function OSDesktopWidgets({ widgetIds }: OSDesktopWidgetsProps) {
    const t = useTranslations('v2.desktop');

    // Return null if no widgets
    if (!widgetIds || widgetIds.length === 0) {
        return null;
    }

    // Resolve widgets from registry based on IDs passed from server
    // This ensures we don't pass functions (components) from server to client
    const activeWidgets = widgetIds
        .map(id => WIDGET_REGISTRY.find(w => w.widgetId === id))
        .filter((w): w is OSWidgetDefinition => !!w);

    if (activeWidgets.length === 0) return null;

    return (
        <section className="w-full mb-10">
            {/* Section Header */}
            <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4 px-1">
                {t('systemStatus')}
            </h2>

            {/* Widget Grid with staggered entrance */}
            <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-min"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
            >
                {activeWidgets.map(widget => (
                    <motion.div
                        key={widget.widgetId}
                        variants={staggerItem}
                        whileHover={{
                            scale: 1.01,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                            transition: { duration: 0.18 }
                        }}
                        className="rounded-xl"
                    >
                        <OSWidget widget={widget} />
                    </motion.div>
                ))}
            </motion.div>
        </section>
    );
}

