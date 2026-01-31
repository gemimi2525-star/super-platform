'use client';

import React from 'react';
import { OSWidgetDefinition } from '@super-platform/core/src/os/widgets/types';
import { OSWidget } from './OSWidget';
import { WIDGET_REGISTRY } from '../../../../config/widget-registry';
import { useTranslations } from '@/lib/i18n';

interface OSWidgetGridProps {
    widgetIds: string[];
}

export const OSWidgetGrid: React.FC<OSWidgetGridProps> = ({ widgetIds }) => {
    const t = useTranslations('v2.dashboard');

    if (!widgetIds || widgetIds.length === 0) {
        return null; // Or render nothing if no widgets
    }

    // Resolve widgets from registry based on IDs passed from server
    // This ensures we don't pass functions (components) from server to client
    const activeWidgets = widgetIds
        .map(id => WIDGET_REGISTRY.find(w => w.widgetId === id))
        .filter((w): w is OSWidgetDefinition => !!w);

    if (activeWidgets.length === 0) return null;

    return (
        <div className="w-full mb-10">
            <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4 px-1">
                {t('overviewStatus')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-min">
                {activeWidgets.map(widget => (
                    <OSWidget key={widget.widgetId} widget={widget} />
                ))}
            </div>
        </div>
    );
};
