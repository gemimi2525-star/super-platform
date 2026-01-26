'use client';

/**
 * Organization Switcher Component
 * 
 * Dropdown to switch between user's organizations
 */

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Building2, Plus, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Organization {
    id: string;
    name: string;
    role: string;
}

interface OrgSwitcherProps {
    currentOrgId?: string;
    currentOrgName?: string;
}

export function OrgSwitcher({ currentOrgId, currentOrgName }: OrgSwitcherProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fetch user's organizations
    useEffect(() => {
        async function fetchOrgs() {
            try {
                const response = await fetch('/api/app/organizations/list');
                if (response.ok) {
                    const data = await response.json();
                    setOrgs(data.organizations || []);
                }
            } catch (error) {
                const msg = error instanceof Error ? error.message : String(error);
                if (process.env.NODE_ENV === 'development') {
                    console.error('[OrgSwitcher] Failed to fetch organizations:', error);
                } else {
                    console.error(`[OrgSwitcher] Failed to fetch organizations: ${msg}`);
                }
            } finally {
                setIsLoading(false);
            }
        }

        fetchOrgs();
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleOrgSelect = async (orgId: string) => {
        // Store selected org in localStorage
        localStorage.setItem('currentOrgId', orgId);

        // Refresh the page to load new org data
        setIsOpen(false);
        router.refresh();
    };

    const displayName = currentOrgName || 'Select Organization';

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
            >
                <Building2 className="w-4 h-4 text-gray-500" />
                <span className="max-w-[150px] truncate">{displayName}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    {/* Organization List */}
                    {isLoading ? (
                        <div className="px-4 py-3 text-sm text-gray-500">Loading...</div>
                    ) : orgs.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-500">No organizations found</div>
                    ) : (
                        <div className="max-h-60 overflow-y-auto">
                            {orgs.map((org) => (
                                <button
                                    key={org.id}
                                    onClick={() => handleOrgSelect(org.id)}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                                >
                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Building2 className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-gray-900 truncate">
                                            {org.name}
                                        </div>
                                        <div className="text-xs text-gray-500 capitalize">
                                            {org.role}
                                        </div>
                                    </div>
                                    {org.id === currentOrgId && (
                                        <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Divider */}
                    <div className="my-1 border-t border-gray-100" />

                    {/* Create New Org */}
                    <button
                        onClick={() => {
                            setIsOpen(false);
                            router.push('/onboarding/create-organization');
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                    >
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Plus className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                            Create new organization
                        </span>
                    </button>
                </div>
            )}
        </div>
    );
}
