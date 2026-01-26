'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, Clock, ArrowRight, Users, Building2, Settings, ShoppingBag, Package } from 'lucide-react';
import { Portal } from '@/components/ui-base/Portal';
import { useSidebar } from '@/contexts/SidebarContext';
import { useRouter } from 'next/navigation';

// Quick access categories with real page links
const searchCategories = [
    { icon: Users, label: 'Users', href: '/platform/users', color: 'text-blue-600' },
    { icon: Building2, label: 'Organizations', href: '/platform/orgs', color: 'text-green-600' },
    { icon: ShoppingBag, label: 'Customers', href: '/platform/customers', color: 'text-orange-600' },
    { icon: Package, label: 'Products', href: '/platform/products', color: 'text-purple-600' },
    { icon: Settings, label: 'Settings', href: '/platform/settings', color: 'text-gray-600' },
];

// Recent searches mock data
const recentSearches = [
    { text: 'John Doe', href: '/platform/users' },
    { text: 'Acme Corporation', href: '/platform/orgs' },
    { text: 'Monthly report', href: '/platform/reports' },
];

export function SearchPanel() {
    const { isSearchOpen, closeSearchPanel } = useSidebar();
    const [query, setQuery] = useState('');
    const router = useRouter();

    // Animation state - separate from visibility for smooth transition
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isSearchOpen) {
            // Small delay to trigger CSS transition after mount
            const timer = setTimeout(() => setIsVisible(true), 10);
            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
        }
    }, [isSearchOpen]);

    // Clear query when closing
    useEffect(() => {
        if (!isSearchOpen) {
            setQuery('');
        }
    }, [isSearchOpen]);

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Close on Escape
            if (e.key === 'Escape' && isSearchOpen) {
                closeSearchPanel();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isSearchOpen, closeSearchPanel]);

    const handleCategoryClick = (href: string) => {
        closeSearchPanel();
        router.push(href);
    };

    const handleRecentClick = (href: string) => {
        closeSearchPanel();
        router.push(href);
    };

    if (!isSearchOpen) return null;

    return (
        <Portal>
            {/* Backdrop - No blur/opacity, transparent click area */}
            <div
                className="fixed inset-0 z-[240]"
                onClick={closeSearchPanel}
            />

            {/* Search Panel - Below Header, Using transition-transform like Main Sidebar */}
            <div className={`
                fixed top-[56px] sm:top-[64px] left-0 right-0 z-[250]
                transition-transform duration-300 ease-in-out
                ${isVisible ? 'translate-y-0' : '-translate-y-full'}
            `}>
                <div className="mx-auto max-w-4xl px-4 sm:px-6">
                    <div className="bg-[#FAFAFA] rounded-b-xl shadow-lg border border-t-0 border-[#E8E8E8] overflow-hidden">
                        {/* Search Input - Matching Main Sidebar Style */}
                        <div className="px-4 py-3 border-b border-[#E8E8E8]">
                            <div className="flex items-center gap-3">
                                <Search className="w-4 h-4 text-[#8E8E8E]" />
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search anything in the platform..."
                                    className="flex-1 text-sm font-medium outline-none bg-transparent placeholder:text-[#8E8E8E] text-[#111827]"
                                    autoFocus
                                />
                                {query && (
                                    <button
                                        onClick={() => setQuery('')}
                                        className="p-1.5 rounded-lg hover:bg-[#EAEAEA] transition-colors"
                                    >
                                        <X className="w-4 h-4 text-[#8E8E8E]" />
                                    </button>
                                )}
                                <button
                                    onClick={closeSearchPanel}
                                    className="p-1.5 rounded-lg hover:bg-[#EAEAEA] transition-colors"
                                >
                                    <span className="text-[10px] text-[#8E8E8E] font-medium">ESC</span>
                                </button>
                            </div>
                        </div>

                        {/* Search Content */}
                        <div className="max-h-[60vh] overflow-y-auto">
                            {query ? (
                                /* Search Results */
                                <div className="p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Search className="w-4 h-4 text-[#0F6FDE]" />
                                        <span className="text-sm font-medium text-[#111827]">
                                            Searching for &quot;{query}&quot;
                                        </span>
                                    </div>
                                    <p className="text-sm text-[#8E8E8E] py-8 text-center">
                                        Type to search across all modules...
                                    </p>
                                </div>
                            ) : (
                                /* Default View: Quick Access + Recent */
                                <div className="p-4">
                                    {/* Quick Access Categories */}
                                    <div className="mb-4">
                                        <h3 className="text-[11px] font-bold text-[#8E8E8E] uppercase tracking-wider mb-2">
                                            Quick Access
                                        </h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1">
                                            {searchCategories.map((cat) => (
                                                <button
                                                    key={cat.label}
                                                    onClick={() => handleCategoryClick(cat.href)}
                                                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#EAEAEA] transition-colors group text-left"
                                                >
                                                    <cat.icon className={`w-4 h-4 ${cat.color}`} />
                                                    <span className="text-sm font-medium text-[#5A5A5A] group-hover:text-[#242424]">{cat.label}</span>
                                                    <ArrowRight className="w-3 h-3 text-[#CCCCCC] ml-auto opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Recent Searches */}
                                    <div>
                                        <h3 className="text-[11px] font-bold text-[#8E8E8E] uppercase tracking-wider mb-2">
                                            Recent Searches
                                        </h3>
                                        <div className="space-y-0.5">
                                            {recentSearches.map((search, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => handleRecentClick(search.href)}
                                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#EAEAEA] transition-colors group"
                                                >
                                                    <Clock className="w-4 h-4 text-[#CCCCCC]" />
                                                    <span className="text-sm font-medium text-[#5A5A5A] group-hover:text-[#242424]">{search.text}</span>
                                                    <ArrowRight className="w-3 h-3 text-[#CCCCCC] ml-auto opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer - Matching Main Sidebar Style */}
                        <div className="px-4 py-2 border-t border-[#E8E8E8] flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[10px] text-[#8E8E8E]">
                                <kbd className="px-1.5 py-0.5 rounded bg-[#EAEAEA] text-[#5A5A5A] font-mono text-[9px]">⌘K</kbd>
                                <span>to toggle search</span>
                            </div>
                            <div className="text-[10px] text-[#8E8E8E]">
                                Global Search
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Portal>
    );
}
