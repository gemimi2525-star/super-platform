/**
 * Tabs Component
 * Horizontal tab navigation with keyboard support
 * Zero inline styles - Phase 15/16 compliant
 */

import React, { useState } from 'react';

export interface Tab {
    key: string;
    label: string;
    content: React.ReactNode;
}

export type TabsVariant = 'line' | 'enclosed';

export interface TabsProps {
    tabs: Tab[];
    defaultTab?: string;
    variant?: TabsVariant;
    onChange?: (key: string) => void;
    className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
    tabs,
    defaultTab,
    variant = 'line',
    onChange,
    className = '',
}) => {
    const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.key);

    const handleTabChange = (key: string) => {
        setActiveTab(key);
        onChange?.(key);
    };

    const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
        if (e.key === 'ArrowRight' && index < tabs.length - 1) {
            handleTabChange(tabs[index + 1].key);
        } else if (e.key === 'ArrowLeft' && index > 0) {
            handleTabChange(tabs[index - 1].key);
        }
    };

    const activeTabContent = tabs.find((tab) => tab.key === activeTab)?.content;

    // Line variant classes
    const lineContainerClasses = 'w-full';
    const lineTabListClasses = 'flex border-b border-neutral-200';
    const lineTabBaseClasses = 'px-6 py-4 text-base font-medium bg-transparent border-none border-b-2 cursor-pointer transition-all duration-150 ease-out outline-none hover:text-neutral-900';
    const lineTabActiveClasses = 'font-semibold text-primary-600 border-primary-600';
    const lineTabInactiveClasses = 'text-neutral-600 border-transparent';
    const lineContentClasses = 'p-6';

    // Enclosed variant classes
    const enclosedTabListClasses = 'flex gap-1';
    const enclosedTabBaseClasses = 'px-6 py-2 text-base cursor-pointer transition-all duration-150 ease-out outline-none rounded-t-md -mb-px hover:text-neutral-900';
    const enclosedTabActiveClasses = 'font-semibold text-primary-700 bg-white border border-neutral-200 border-b-transparent';
    const enclosedTabInactiveClasses = 'font-medium text-neutral-600 bg-neutral-100 border border-transparent';
    const enclosedContentClasses = 'p-6 bg-white border border-neutral-200 rounded-b-md';

    if (variant === 'line') {
        return (
            <div className={`${lineContainerClasses} ${className}`}>
                <div role="tablist" className={lineTabListClasses}>
                    {tabs.map((tab, index) => {
                        const isActive = tab.key === activeTab;
                        return (
                            <button
                                key={tab.key}
                                role="tab"
                                aria-selected={isActive}
                                aria-controls={`panel-${tab.key}`}
                                tabIndex={isActive ? 0 : -1}
                                className={`${lineTabBaseClasses} ${isActive ? lineTabActiveClasses : lineTabInactiveClasses}`}
                                onClick={() => handleTabChange(tab.key)}
                                onKeyDown={(e) => handleKeyDown(e, index)}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
                <div
                    role="tabpanel"
                    id={`panel-${activeTab}`}
                    aria-labelledby={`tab-${activeTab}`}
                    className={lineContentClasses}
                >
                    {activeTabContent}
                </div>
            </div>
        );
    }

    // Enclosed variant
    return (
        <div className={`w-full ${className}`}>
            <div role="tablist" className={enclosedTabListClasses}>
                {tabs.map((tab, index) => {
                    const isActive = tab.key === activeTab;
                    return (
                        <button
                            key={tab.key}
                            role="tab"
                            aria-selected={isActive}
                            aria-controls={`panel-${tab.key}`}
                            tabIndex={isActive ? 0 : -1}
                            className={`${enclosedTabBaseClasses} ${isActive ? enclosedTabActiveClasses : enclosedTabInactiveClasses}`}
                            onClick={() => handleTabChange(tab.key)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>
            <div
                role="tabpanel"
                id={`panel-${activeTab}`}
                aria-labelledby={`tab-${activeTab}`}
                className={enclosedContentClasses}
            >
                {activeTabContent}
            </div>
        </div>
    );
};
