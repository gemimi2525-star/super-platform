'use client';

import React from 'react';
import { OSWidgetDefinition } from '@super-platform/core/src/os/widgets/types';

interface OSWidgetProps {
    widget: OSWidgetDefinition;
}

export const OSWidget: React.FC<OSWidgetProps> = ({ widget }) => {
    // Dynamic component rendering
    const WidgetComponent = widget.render;

    // Size classes mapping
    const sizeClasses = {
        sm: 'col-span-1', // 1 unit wide
        md: 'col-span-1 sm:col-span-2 lg:col-span-1 xl:col-span-1 row-span-2', // Taller or wider depending on grid? 
        // Let's stick to standard grid units. 
        // For simplicity:
        // sm = 1x1
        // md = 1x2 (tall) or 2x1 (wide)? Typically wide.
        // lg = 2x2
        // xl = full width
        // But for this grid/requirement, let's keep it simple responsive.
    };

    // Refined sizing logic for typical dashboard grid (auto-rows)
    // sm: min-h-[160px]
    // md: min-h-[320px] ?
    // Actually, let's handle sizing at the Grid level via classNames passed to wrapper,
    // or internal styling.

    // Height mapping
    const heightClass = widget.size === 'md' || widget.size === 'lg' ? 'h-[340px]' : 'h-[160px]';
    // Col span
    const colClass = widget.size === 'lg' ? 'col-span-1 sm:col-span-2' : 'col-span-1';

    return (
        <div className={`bg-white border border-neutral-200 rounded-xl shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col ${heightClass} ${colClass}`}>
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-neutral-900 leading-none">
                    {widget.title}
                </h3>
                {/* Optional Actions/Menu icon could go here */}
            </div>

            <div className="flex-1 min-h-0 overflow-hidden relative">
                <WidgetComponent />
            </div>
        </div>
    );
};
