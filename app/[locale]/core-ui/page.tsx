/**
 * ═══════════════════════════════════════════════════════════════════════════
 * APICOREDATA OS — Core UI Demo Page
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * PHASE 7.3: Core Hub Demo + Enhanced Components
 * Route: /en/core-ui or /th/core-ui
 * 
 * Includes:
 * - CoreHub launcher demo
 * - CoreAppIcon showcase
 * - CoreActionBar/Button demo
 * - OS Icon set
 * - CoreDropdown showcase
 * - Icon-only buttons (square/circle)
 * 
 * @version 3.0.0
 * @date 2026-01-29
 */

'use client';

import React, { useState } from 'react';
import { useTranslations } from '@/lib/i18n';
import {
    CoreButton,
    CoreInput,
    CoreCard,
    CoreCardHeader,
    CoreCardBody,
    CoreCardFooter,
    CoreBadge,
    CoreTable,
    CoreTableHead,
    CoreTableBody,
    CoreTableRow,
    CoreTableHeader,
    CoreTableCell,
    CoreTableLoading,
    CoreEmptyState,
    CoreDivider,
    CoreSectionHeader,
    CoreIcon,
    CoreIconCircle,
    CoreDropdown,
    CoreDropdownTrigger,
    CoreDropdownContent,
    CoreDropdownItem,
    CoreDropdownDivider,
    CoreDropdownLabel,
    // PHASE 7.3: Core Hub Components
    CoreAppIcon,
    CoreAppGrid,
    CoreHub,
    CoreActionButton,
    CoreActionBar,
    CoreActionBarDivider,
} from '@/core-ui';
import {
    Users, Building2, ShieldCheck, Search, Plus, Trash2, Edit,
    ChevronRight, ChevronDown, ChevronUp, ChevronLeft,
    AlertCircle, CheckCircle, Clock, Info,
    Minus, X, Check, MoreHorizontal, MoreVertical,
    Filter, ArrowRight, ArrowLeft, ArrowUp, ArrowDown,
    ExternalLink, Settings, LogOut, Globe,
    // PHASE 7.3: OS Icon Set
    Home, Computer, Folder, File, Grid3X3, List, Move, Maximize2, ScrollText
} from 'lucide-react';

export default function CoreUIDemoPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [showTableLoading, setShowTableLoading] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [isHubOpen, setIsHubOpen] = useState(false);
    const [selectedAppId, setSelectedAppId] = useState<string | undefined>();
    const t = useTranslations('common');

    return (
        <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: 'var(--os-space-8)',
            fontFamily: 'var(--os-font-sans)',
            backgroundColor: 'var(--os-bg)',
            minHeight: '100vh',
        }}>
            <h1 style={{
                fontSize: 'var(--os-text-3xl)',
                fontWeight: 600,
                marginBottom: 'var(--os-space-2)',
                color: 'var(--os-color-text)',
            }}>
                🧩 Core UI — Component Library
            </h1>
            <p style={{
                fontSize: 'var(--os-text-base)',
                color: 'var(--os-color-text-muted)',
                marginBottom: 'var(--os-space-10)',
            }}>
                PHASE 7.3: Core Hub + OS Visual Language — All components use Core System tokens
            </p>

            {/* ═══════════════════════════════════════════════════════════════
                SECTION: CORE HUB (PHASE 7.3)
            ═══════════════════════════════════════════════════════════════ */}
            <CoreSectionHeader
                title="Core Hub (NEW)"
                subtitle="OS-grade app launcher with icons and grid"
                divider
            />

            <h4 style={{ marginBottom: 'var(--os-space-3)', color: 'var(--os-color-text-secondary)' }}>CoreAppIcon Sizes</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--os-space-6)', marginBottom: 'var(--os-space-6)', alignItems: 'flex-start' }}>
                <CoreAppIcon icon={<Users size={16} />} label="Small" size="sm" />
                <CoreAppIcon icon={<Users size={20} />} label="Medium" size="md" />
                <CoreAppIcon icon={<Users size={24} />} label="Large" size="lg" />
                <CoreAppIcon icon={<Users size={28} />} label="X-Large" size="xl" />
            </div>

            <h4 style={{ marginBottom: 'var(--os-space-3)', color: 'var(--os-color-text-secondary)' }}>CoreAppIcon States</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--os-space-4)', marginBottom: 'var(--os-space-6)', alignItems: 'flex-start' }}>
                <CoreAppIcon icon={<Building2 size={24} />} label="Default" size="lg" />
                <CoreAppIcon icon={<Settings size={24} />} label="Selected" size="lg" selected />
                <CoreAppIcon icon={<ScrollText size={24} />} label="Disabled" size="lg" disabled />
                <CoreAppIcon icon={<ShieldCheck size={24} />} label="With Badge" size="lg" badge={5} />
                <CoreAppIcon icon={<Users size={24} />} label="Dot Badge" size="lg" badge="dot" />
            </div>

            <h4 style={{ marginBottom: 'var(--os-space-3)', color: 'var(--os-color-text-secondary)' }}>CoreAppGrid Layout</h4>
            <CoreCard padding="md" style={{ marginBottom: 'var(--os-space-6)' }}>
                <CoreAppGrid minItemWidth={88} gap="md">
                    <CoreAppIcon icon={<Users size={24} />} label="Users" size="lg" onClick={() => console.log('Users')} />
                    <CoreAppIcon icon={<Building2 size={24} />} label="Orgs" size="lg" onClick={() => console.log('Orgs')} />
                    <CoreAppIcon icon={<ScrollText size={24} />} label="Audit" size="lg" onClick={() => console.log('Audit')} />
                    <CoreAppIcon icon={<Settings size={24} />} label="Settings" size="lg" onClick={() => console.log('Settings')} />
                    <CoreAppIcon icon={<Home size={24} />} label="Home" size="lg" onClick={() => console.log('Home')} />
                    <CoreAppIcon icon={<Folder size={24} />} label="Files" size="lg" onClick={() => console.log('Files')} />
                </CoreAppGrid>
            </CoreCard>

            <h4 style={{ marginBottom: 'var(--os-space-3)', color: 'var(--os-color-text-secondary)' }}>Core Hub Launcher</h4>
            <div style={{ marginBottom: 'var(--os-space-6)' }}>
                <CoreButton
                    variant="primary"
                    iconLeft={<Grid3X3 size={18} />}
                    onClick={() => setIsHubOpen(true)}
                >
                    Open Core Hub
                </CoreButton>
                <CoreHub
                    isOpen={isHubOpen}
                    onClose={() => setIsHubOpen(false)}
                    activeAppId={selectedAppId}
                    onSelectApp={(app) => {
                        setSelectedAppId(app.id);
                        console.log('Selected app:', app);
                    }}
                />
                {selectedAppId && (
                    <p style={{ marginTop: 'var(--os-space-2)', color: 'var(--os-color-text-muted)', fontSize: 'var(--os-text-sm)' }}>
                        Last selected: <strong>{selectedAppId}</strong>
                    </p>
                )}
            </div>

            <CoreDivider spacing="lg" />

            {/* ═══════════════════════════════════════════════════════════════
                SECTION: CORE ACTIONS (PHASE 7.3)
            ═══════════════════════════════════════════════════════════════ */}
            <CoreSectionHeader
                title="Core Actions (NEW)"
                subtitle="Action buttons and toolbars for OS interactions"
                divider
            />

            <h4 style={{ marginBottom: 'var(--os-space-3)', color: 'var(--os-color-text-secondary)' }}>CoreActionButton Variants</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--os-space-3)', marginBottom: 'var(--os-space-6)' }}>
                <CoreActionButton icon={<Plus size={16} />} label="New" />
                <CoreActionButton icon={<Edit size={16} />} label="Edit" variant="primary" />
                <CoreActionButton icon={<Trash2 size={16} />} label="Delete" variant="danger" />
                <CoreActionButton icon={<Move size={16} />} label="Move" />
                <CoreActionButton icon={<Maximize2 size={16} />} label="Resize" />
            </div>

            <h4 style={{ marginBottom: 'var(--os-space-3)', color: 'var(--os-color-text-secondary)' }}>CoreActionButton Icon-Only</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--os-space-2)', marginBottom: 'var(--os-space-6)' }}>
                <CoreActionButton icon={<Plus size={16} />} iconOnly aria-label="New" />
                <CoreActionButton icon={<Edit size={16} />} iconOnly variant="primary" aria-label="Edit" />
                <CoreActionButton icon={<Trash2 size={16} />} iconOnly variant="danger" aria-label="Delete" />
                <CoreActionButton icon={<Move size={16} />} iconOnly aria-label="Move" />
                <CoreActionButton icon={<Maximize2 size={16} />} iconOnly aria-label="Resize" />
            </div>

            <h4 style={{ marginBottom: 'var(--os-space-3)', color: 'var(--os-color-text-secondary)' }}>CoreActionBar</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--os-space-4)', marginBottom: 'var(--os-space-6)' }}>
                <CoreActionBar>
                    <CoreActionButton icon={<Plus size={16} />} iconOnly aria-label="New" />
                    <CoreActionButton icon={<Edit size={16} />} iconOnly aria-label="Edit" />
                    <CoreActionBarDivider />
                    <CoreActionButton icon={<Trash2 size={16} />} iconOnly variant="danger" aria-label="Delete" />
                </CoreActionBar>

                <CoreActionBar variant="surface">
                    <CoreActionButton icon={<Grid3X3 size={16} />} iconOnly aria-label="Grid view" />
                    <CoreActionButton icon={<List size={16} />} iconOnly aria-label="List view" />
                    <CoreActionBarDivider />
                    <CoreActionButton icon={<Filter size={16} />} label="Filter" />
                </CoreActionBar>
            </div>

            <CoreDivider spacing="lg" />

            {/* ═══════════════════════════════════════════════════════════════
                SECTION: OS ICON SET (PHASE 7.3)
            ═══════════════════════════════════════════════════════════════ */}
            <CoreSectionHeader
                title="OS Icon Set (NEW)"
                subtitle="System-level icons for Core Hub and OS interactions"
                divider
            />

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                gap: 'var(--os-space-4)',
                marginBottom: 'var(--os-space-8)'
            }}>
                {[
                    { icon: <Home size={24} />, name: 'Home' },
                    { icon: <Computer size={24} />, name: 'Computer' },
                    { icon: <Folder size={24} />, name: 'Folder' },
                    { icon: <File size={24} />, name: 'File' },
                    { icon: <Grid3X3 size={24} />, name: 'Grid' },
                    { icon: <List size={24} />, name: 'List' },
                    { icon: <Plus size={24} />, name: 'New' },
                    { icon: <Trash2 size={24} />, name: 'Delete' },
                    { icon: <Move size={24} />, name: 'Move' },
                    { icon: <Maximize2 size={24} />, name: 'Resize' },
                    { icon: <Search size={24} />, name: 'Search' },
                    { icon: <Settings size={24} />, name: 'Settings' },
                ].map(({ icon, name }) => (
                    <div key={name} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 'var(--os-space-2)',
                        padding: 'var(--os-space-3)',
                        backgroundColor: 'var(--os-color-surface)',
                        borderRadius: 'var(--os-radius-md)',
                        border: '1px solid var(--os-color-border)',
                    }}>
                        <div style={{ color: 'var(--os-color-text)' }}>{icon}</div>
                        <span style={{ fontSize: 'var(--os-text-xs)', color: 'var(--os-color-text-muted)' }}>{name}</span>
                    </div>
                ))}
            </div>

            <CoreDivider spacing="lg" />

            {/* ═══════════════════════════════════════════════════════════════
                SECTION: DROPDOWN (NEW)
            ═══════════════════════════════════════════════════════════════ */}
            <CoreSectionHeader
                title="Dropdown"
                subtitle="Menus, selectors, and action lists"
                divider
            />

            <h4 style={{ marginBottom: 'var(--os-space-3)', color: 'var(--os-color-text-secondary)' }}>Basic Dropdown</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--os-space-4)', marginBottom: 'var(--os-space-6)' }}>
                <CoreDropdown>
                    <CoreDropdownTrigger asChild>
                        <CoreButton variant="secondary" iconRight={<ChevronDown size={16} />}>
                            Select Option
                        </CoreButton>
                    </CoreDropdownTrigger>
                    <CoreDropdownContent align="start">
                        <CoreDropdownItem icon={<Settings size={16} />} onSelect={() => console.log('Settings')}>
                            Settings
                        </CoreDropdownItem>
                        <CoreDropdownItem icon={<Users size={16} />} onSelect={() => console.log('Profile')}>
                            Profile
                        </CoreDropdownItem>
                        <CoreDropdownDivider />
                        <CoreDropdownItem icon={<LogOut size={16} />} danger onSelect={() => console.log('Logout')}>
                            Logout
                        </CoreDropdownItem>
                    </CoreDropdownContent>
                </CoreDropdown>

                <CoreDropdown>
                    <CoreDropdownTrigger asChild>
                        <CoreButton variant="ghost" shape="square" iconOnly iconLeft={<MoreHorizontal size={18} />} aria-label="More options" />
                    </CoreDropdownTrigger>
                    <CoreDropdownContent align="start">
                        <CoreDropdownLabel>Actions</CoreDropdownLabel>
                        <CoreDropdownItem icon={<Edit size={16} />}>Edit</CoreDropdownItem>
                        <CoreDropdownItem icon={<Plus size={16} />}>Duplicate</CoreDropdownItem>
                        <CoreDropdownDivider />
                        <CoreDropdownItem icon={<Trash2 size={16} />} danger>Delete</CoreDropdownItem>
                    </CoreDropdownContent>
                </CoreDropdown>

                <CoreDropdown>
                    <CoreDropdownTrigger asChild>
                        <CoreButton variant="secondary" iconLeft={<Globe size={16} />} iconRight={<ChevronDown size={14} />}>
                            Language
                        </CoreButton>
                    </CoreDropdownTrigger>
                    <CoreDropdownContent minWidth={180}>
                        <CoreDropdownItem icon={<Check size={16} />}>English (EN)</CoreDropdownItem>
                        <CoreDropdownItem>Thai (TH)</CoreDropdownItem>
                        <CoreDropdownItem disabled>Spanish (ES)</CoreDropdownItem>
                    </CoreDropdownContent>
                </CoreDropdown>
            </div>

            <h4 style={{ marginBottom: 'var(--os-space-3)', color: 'var(--os-color-text-secondary)' }}>Filter / Sort Dropdown</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--os-space-4)', marginBottom: 'var(--os-space-8)' }}>
                <CoreDropdown>
                    <CoreDropdownTrigger asChild>
                        <CoreButton variant="ghost" iconLeft={<Filter size={16} />} iconRight={<ChevronDown size={14} />}>
                            Filter
                        </CoreButton>
                    </CoreDropdownTrigger>
                    <CoreDropdownContent minWidth={200}>
                        <CoreDropdownLabel>Status</CoreDropdownLabel>
                        <CoreDropdownItem icon={<Check size={16} />}>Active</CoreDropdownItem>
                        <CoreDropdownItem>Pending</CoreDropdownItem>
                        <CoreDropdownItem>Inactive</CoreDropdownItem>
                        <CoreDropdownDivider />
                        <CoreDropdownLabel>Role</CoreDropdownLabel>
                        <CoreDropdownItem>Admin</CoreDropdownItem>
                        <CoreDropdownItem>User</CoreDropdownItem>
                        <CoreDropdownItem>Guest</CoreDropdownItem>
                    </CoreDropdownContent>
                </CoreDropdown>
            </div>

            <CoreDivider spacing="lg" />

            {/* ═══════════════════════════════════════════════════════════════
                SECTION: BUTTONS
            ═══════════════════════════════════════════════════════════════ */}
            <CoreSectionHeader
                title="Buttons"
                subtitle="Primary actions and interactions"
                divider
            />

            <h4 style={{ marginBottom: 'var(--os-space-3)', color: 'var(--os-color-text-secondary)' }}>Variants</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--os-space-3)', marginBottom: 'var(--os-space-6)' }}>
                <CoreButton variant="primary">Primary</CoreButton>
                <CoreButton variant="secondary">Secondary</CoreButton>
                <CoreButton variant="ghost">Ghost</CoreButton>
                <CoreButton variant="danger">Danger</CoreButton>
            </div>

            <h4 style={{ marginBottom: 'var(--os-space-3)', color: 'var(--os-color-text-secondary)' }}>Quiet / Low-Emphasis (NEW)</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--os-space-3)', marginBottom: 'var(--os-space-6)' }}>
                <CoreButton variant="primary" quiet>Primary Quiet</CoreButton>
                <CoreButton variant="secondary" quiet>Secondary Quiet</CoreButton>
                <CoreButton variant="danger" quiet>Danger Quiet</CoreButton>
            </div>

            <h4 style={{ marginBottom: 'var(--os-space-3)', color: 'var(--os-color-text-secondary)' }}>Sizes</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--os-space-3)', alignItems: 'center', marginBottom: 'var(--os-space-6)' }}>
                <CoreButton size="sm">Small</CoreButton>
                <CoreButton size="md">Medium</CoreButton>
                <CoreButton size="lg">Large</CoreButton>
            </div>

            <h4 style={{ marginBottom: 'var(--os-space-3)', color: 'var(--os-color-text-secondary)' }}>Icon-Only Buttons (NEW)</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--os-space-3)', alignItems: 'center', marginBottom: 'var(--os-space-6)' }}>
                {/* Square shape */}
                <span style={{ textAlign: 'center' }}>
                    <CoreButton variant="secondary" shape="square" iconOnly iconLeft={<Plus size={18} />} size="sm" aria-label="Add" />
                    <div style={{ fontSize: '10px', color: 'var(--os-color-text-muted)', marginTop: '4px' }}>sm square</div>
                </span>
                <span style={{ textAlign: 'center' }}>
                    <CoreButton variant="secondary" shape="square" iconOnly iconLeft={<Edit size={18} />} size="md" aria-label="Edit" />
                    <div style={{ fontSize: '10px', color: 'var(--os-color-text-muted)', marginTop: '4px' }}>md square</div>
                </span>
                <span style={{ textAlign: 'center' }}>
                    <CoreButton variant="secondary" shape="square" iconOnly iconLeft={<Trash2 size={18} />} size="lg" aria-label="Delete" />
                    <div style={{ fontSize: '10px', color: 'var(--os-color-text-muted)', marginTop: '4px' }}>lg square</div>
                </span>
                {/* Circle shape */}
                <span style={{ textAlign: 'center' }}>
                    <CoreButton variant="primary" shape="circle" iconOnly iconLeft={<Plus size={18} />} size="sm" aria-label="Add" />
                    <div style={{ fontSize: '10px', color: 'var(--os-color-text-muted)', marginTop: '4px' }}>sm circle</div>
                </span>
                <span style={{ textAlign: 'center' }}>
                    <CoreButton variant="primary" shape="circle" iconOnly iconLeft={<Check size={18} />} size="md" aria-label="Confirm" />
                    <div style={{ fontSize: '10px', color: 'var(--os-color-text-muted)', marginTop: '4px' }}>md circle</div>
                </span>
                <span style={{ textAlign: 'center' }}>
                    <CoreButton variant="danger" shape="circle" iconOnly iconLeft={<X size={20} />} size="lg" aria-label="Close" />
                    <div style={{ fontSize: '10px', color: 'var(--os-color-text-muted)', marginTop: '4px' }}>lg circle</div>
                </span>
                {/* Ghost variants */}
                <span style={{ textAlign: 'center' }}>
                    <CoreButton variant="ghost" shape="square" iconOnly iconLeft={<MoreHorizontal size={18} />} aria-label="More" />
                    <div style={{ fontSize: '10px', color: 'var(--os-color-text-muted)', marginTop: '4px' }}>ghost</div>
                </span>
                <span style={{ textAlign: 'center' }}>
                    <CoreButton variant="ghost" shape="square" iconOnly iconLeft={<MoreVertical size={18} />} aria-label="More vertical" />
                    <div style={{ fontSize: '10px', color: 'var(--os-color-text-muted)', marginTop: '4px' }}>ghost</div>
                </span>
            </div>

            <h4 style={{ marginBottom: 'var(--os-space-3)', color: 'var(--os-color-text-secondary)' }}>States & Variants</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--os-space-3)', alignItems: 'center', marginBottom: 'var(--os-space-8)' }}>
                <CoreButton iconLeft={<Plus size={16} />}>With Icon Left</CoreButton>
                <CoreButton iconRight={<ChevronRight size={16} />}>With Icon Right</CoreButton>
                <CoreButton loading onClick={() => setIsLoading(!isLoading)}>Loading</CoreButton>
                <CoreButton disabled>Disabled</CoreButton>
                <CoreButton fullWidth variant="secondary" style={{ maxWidth: '300px' }}>Full Width</CoreButton>
            </div>

            <CoreDivider spacing="lg" />

            {/* ═══════════════════════════════════════════════════════════════
                SECTION: GENERIC ICONS (NEW)
            ═══════════════════════════════════════════════════════════════ */}
            <CoreSectionHeader
                title="Generic OS-Safe Icons"
                subtitle="Universal icons for any context (no business semantics)"
                divider
            />

            <h4 style={{ marginBottom: 'var(--os-space-3)', color: 'var(--os-color-text-secondary)' }}>Navigation / Actions</h4>
            <div style={{ display: 'flex', gap: 'var(--os-space-4)', alignItems: 'center', flexWrap: 'wrap', marginBottom: 'var(--os-space-6)' }}>
                <span style={{ textAlign: 'center' }}>
                    <CoreIcon icon={<Plus />} size="md" /><div style={{ fontSize: '10px', color: 'var(--os-color-text-muted)' }}>plus</div>
                </span>
                <span style={{ textAlign: 'center' }}>
                    <CoreIcon icon={<Minus />} size="md" /><div style={{ fontSize: '10px', color: 'var(--os-color-text-muted)' }}>minus</div>
                </span>
                <span style={{ textAlign: 'center' }}>
                    <CoreIcon icon={<X />} size="md" /><div style={{ fontSize: '10px', color: 'var(--os-color-text-muted)' }}>close</div>
                </span>
                <span style={{ textAlign: 'center' }}>
                    <CoreIcon icon={<Check />} size="md" color="success" /><div style={{ fontSize: '10px', color: 'var(--os-color-text-muted)' }}>check</div>
                </span>
                <span style={{ textAlign: 'center' }}>
                    <CoreIcon icon={<Search />} size="md" /><div style={{ fontSize: '10px', color: 'var(--os-color-text-muted)' }}>search</div>
                </span>
                <span style={{ textAlign: 'center' }}>
                    <CoreIcon icon={<Filter />} size="md" /><div style={{ fontSize: '10px', color: 'var(--os-color-text-muted)' }}>filter</div>
                </span>
                <span style={{ textAlign: 'center' }}>
                    <CoreIcon icon={<ExternalLink />} size="md" color="primary" /><div style={{ fontSize: '10px', color: 'var(--os-color-text-muted)' }}>external</div>
                </span>
            </div>

            <h4 style={{ marginBottom: 'var(--os-space-3)', color: 'var(--os-color-text-secondary)' }}>Chevrons</h4>
            <div style={{ display: 'flex', gap: 'var(--os-space-4)', alignItems: 'center', flexWrap: 'wrap', marginBottom: 'var(--os-space-6)' }}>
                <span style={{ textAlign: 'center' }}>
                    <CoreIcon icon={<ChevronUp />} size="md" /><div style={{ fontSize: '10px', color: 'var(--os-color-text-muted)' }}>up</div>
                </span>
                <span style={{ textAlign: 'center' }}>
                    <CoreIcon icon={<ChevronDown />} size="md" /><div style={{ fontSize: '10px', color: 'var(--os-color-text-muted)' }}>down</div>
                </span>
                <span style={{ textAlign: 'center' }}>
                    <CoreIcon icon={<ChevronLeft />} size="md" /><div style={{ fontSize: '10px', color: 'var(--os-color-text-muted)' }}>left</div>
                </span>
                <span style={{ textAlign: 'center' }}>
                    <CoreIcon icon={<ChevronRight />} size="md" /><div style={{ fontSize: '10px', color: 'var(--os-color-text-muted)' }}>right</div>
                </span>
            </div>

            <h4 style={{ marginBottom: 'var(--os-space-3)', color: 'var(--os-color-text-secondary)' }}>Arrows</h4>
            <div style={{ display: 'flex', gap: 'var(--os-space-4)', alignItems: 'center', flexWrap: 'wrap', marginBottom: 'var(--os-space-6)' }}>
                <span style={{ textAlign: 'center' }}>
                    <CoreIcon icon={<ArrowUp />} size="md" /><div style={{ fontSize: '10px', color: 'var(--os-color-text-muted)' }}>up</div>
                </span>
                <span style={{ textAlign: 'center' }}>
                    <CoreIcon icon={<ArrowDown />} size="md" /><div style={{ fontSize: '10px', color: 'var(--os-color-text-muted)' }}>down</div>
                </span>
                <span style={{ textAlign: 'center' }}>
                    <CoreIcon icon={<ArrowLeft />} size="md" /><div style={{ fontSize: '10px', color: 'var(--os-color-text-muted)' }}>left</div>
                </span>
                <span style={{ textAlign: 'center' }}>
                    <CoreIcon icon={<ArrowRight />} size="md" /><div style={{ fontSize: '10px', color: 'var(--os-color-text-muted)' }}>right</div>
                </span>
            </div>

            <h4 style={{ marginBottom: 'var(--os-space-3)', color: 'var(--os-color-text-secondary)' }}>Menu Dots</h4>
            <div style={{ display: 'flex', gap: 'var(--os-space-4)', alignItems: 'center', flexWrap: 'wrap', marginBottom: 'var(--os-space-8)' }}>
                <span style={{ textAlign: 'center' }}>
                    <CoreIcon icon={<MoreHorizontal />} size="md" /><div style={{ fontSize: '10px', color: 'var(--os-color-text-muted)' }}>horizontal</div>
                </span>
                <span style={{ textAlign: 'center' }}>
                    <CoreIcon icon={<MoreVertical />} size="md" /><div style={{ fontSize: '10px', color: 'var(--os-color-text-muted)' }}>vertical</div>
                </span>
            </div>

            <CoreDivider spacing="lg" />

            {/* ═══════════════════════════════════════════════════════════════
                SECTION: INPUTS
            ═══════════════════════════════════════════════════════════════ */}
            <CoreSectionHeader
                title="Inputs"
                subtitle="Form elements and text fields"
                divider
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--os-space-4)', marginBottom: 'var(--os-space-8)' }}>
                <CoreInput
                    label="Default Input"
                    placeholder="Enter text..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                />
                <CoreInput
                    label="With Helper Text"
                    helperText="This is helper text explaining the field"
                    placeholder="Enter text..."
                />
                <CoreInput
                    label="Error State"
                    error="This field is required"
                    placeholder="Enter text..."
                />
                <CoreInput
                    label="With Prefix Icon"
                    prefixIcon={<Search size={16} />}
                    placeholder="Search..."
                />
                <CoreInput
                    label="Disabled"
                    disabled
                    placeholder="Cannot edit"
                    value="Disabled value"
                />
                <CoreInput
                    label="Read Only"
                    readOnly
                    value="Read-only value"
                />
            </div>

            <CoreDivider spacing="lg" />

            {/* ═══════════════════════════════════════════════════════════════
                SECTION: CARDS
            ═══════════════════════════════════════════════════════════════ */}
            <CoreSectionHeader
                title="Cards"
                subtitle="Container components with variants"
                divider
            />

            <h4 style={{ marginBottom: 'var(--os-space-3)', color: 'var(--os-color-text-secondary)' }}>Variants</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--os-space-4)', marginBottom: 'var(--os-space-6)' }}>
                <CoreCard variant="default">
                    <CoreCardHeader><strong>Default</strong></CoreCardHeader>
                    <CoreCardBody>Standard surface card with subtle shadow.</CoreCardBody>
                </CoreCard>

                <CoreCard variant="elevated">
                    <CoreCardHeader><strong>Elevated</strong></CoreCardHeader>
                    <CoreCardBody>Stronger shadow for emphasis.</CoreCardBody>
                </CoreCard>

                <CoreCard variant="outlined">
                    <CoreCardHeader><strong>Outlined</strong></CoreCardHeader>
                    <CoreCardBody>Transparent with border only.</CoreCardBody>
                </CoreCard>

                <CoreCard variant="glass" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.6))' }}>
                    <CoreCardHeader><strong>Glass</strong></CoreCardHeader>
                    <CoreCardBody>Frosted glass effect.</CoreCardBody>
                </CoreCard>
            </div>

            <h4 style={{ marginBottom: 'var(--os-space-3)', color: 'var(--os-color-text-secondary)' }}>Interactive</h4>
            <div style={{ display: 'flex', gap: 'var(--os-space-4)', flexWrap: 'wrap', marginBottom: 'var(--os-space-8)' }}>
                <CoreCard hoverable padding="lg" style={{ minWidth: '200px' }}>
                    <strong>Hoverable</strong>
                    <p style={{ margin: 0, marginTop: 'var(--os-space-2)', color: 'var(--os-color-text-muted)', fontSize: 'var(--os-text-sm)' }}>
                        Hover to see lift effect
                    </p>
                </CoreCard>

                <CoreCard clickable padding="lg" style={{ minWidth: '200px' }}>
                    <strong>Clickable</strong>
                    <p style={{ margin: 0, marginTop: 'var(--os-space-2)', color: 'var(--os-color-text-muted)', fontSize: 'var(--os-text-sm)' }}>
                        Click to see press effect
                    </p>
                </CoreCard>

                <CoreCard variant="default" padding="lg" style={{ minWidth: '200px' }}>
                    <CoreCardHeader>With Footer</CoreCardHeader>
                    <CoreCardBody>Card with header, body, and footer sections.</CoreCardBody>
                    <CoreCardFooter>
                        <CoreButton size="sm" variant="ghost">Cancel</CoreButton>
                        <CoreButton size="sm" variant="primary" style={{ marginLeft: 'var(--os-space-2)' }}>Save</CoreButton>
                    </CoreCardFooter>
                </CoreCard>
            </div>

            <CoreDivider spacing="lg" />

            {/* ═══════════════════════════════════════════════════════════════
                SECTION: BADGES
            ═══════════════════════════════════════════════════════════════ */}
            <CoreSectionHeader
                title="Badges & Status Indicators"
                subtitle="Labels and status display"
                divider
            />

            <h4 style={{ marginBottom: 'var(--os-space-3)', color: 'var(--os-color-text-secondary)' }}>Badge Type</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--os-space-3)', alignItems: 'center', marginBottom: 'var(--os-space-6)' }}>
                <CoreBadge variant="default">Default</CoreBadge>
                <CoreBadge variant="success">Success</CoreBadge>
                <CoreBadge variant="warning">Warning</CoreBadge>
                <CoreBadge variant="danger">Danger</CoreBadge>
                <CoreBadge variant="info">Info</CoreBadge>
            </div>

            <h4 style={{ marginBottom: 'var(--os-space-3)', color: 'var(--os-color-text-secondary)' }}>Dot Type</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--os-space-4)', alignItems: 'center', marginBottom: 'var(--os-space-6)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--os-space-2)' }}>
                    <CoreBadge type="dot" variant="success" /> Active
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--os-space-2)' }}>
                    <CoreBadge type="dot" variant="warning" /> Pending
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--os-space-2)' }}>
                    <CoreBadge type="dot" variant="danger" /> Error
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--os-space-2)' }}>
                    <CoreBadge type="dot" variant="info" /> Info
                </span>
            </div>

            <h4 style={{ marginBottom: 'var(--os-space-3)', color: 'var(--os-color-text-secondary)' }}>Status Type (Dot + Text)</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--os-space-4)', alignItems: 'center', marginBottom: 'var(--os-space-8)' }}>
                <CoreBadge type="status" variant="success">Online</CoreBadge>
                <CoreBadge type="status" variant="warning">Away</CoreBadge>
                <CoreBadge type="status" variant="danger">Offline</CoreBadge>
                <CoreBadge type="status" variant="info">Busy</CoreBadge>
            </div>

            <CoreDivider spacing="lg" />

            {/* ═══════════════════════════════════════════════════════════════
                SECTION: ICONS
            ═══════════════════════════════════════════════════════════════ */}
            <CoreSectionHeader
                title="Icons"
                subtitle="Standardized icon sizing and colors"
                divider
            />

            <h4 style={{ marginBottom: 'var(--os-space-3)', color: 'var(--os-color-text-secondary)' }}>Sizes</h4>
            <div style={{ display: 'flex', gap: 'var(--os-space-4)', alignItems: 'center', marginBottom: 'var(--os-space-6)' }}>
                <span style={{ textAlign: 'center' }}>
                    <CoreIcon icon={<Users />} size="xs" />
                    <div style={{ fontSize: '10px', color: 'var(--os-color-text-muted)' }}>xs</div>
                </span>
                <span style={{ textAlign: 'center' }}>
                    <CoreIcon icon={<Users />} size="sm" />
                    <div style={{ fontSize: '10px', color: 'var(--os-color-text-muted)' }}>sm</div>
                </span>
                <span style={{ textAlign: 'center' }}>
                    <CoreIcon icon={<Users />} size="md" />
                    <div style={{ fontSize: '10px', color: 'var(--os-color-text-muted)' }}>md</div>
                </span>
                <span style={{ textAlign: 'center' }}>
                    <CoreIcon icon={<Users />} size="lg" />
                    <div style={{ fontSize: '10px', color: 'var(--os-color-text-muted)' }}>lg</div>
                </span>
                <span style={{ textAlign: 'center' }}>
                    <CoreIcon icon={<Users />} size="xl" />
                    <div style={{ fontSize: '10px', color: 'var(--os-color-text-muted)' }}>xl</div>
                </span>
            </div>

            <h4 style={{ marginBottom: 'var(--os-space-3)', color: 'var(--os-color-text-secondary)' }}>Colors</h4>
            <div style={{ display: 'flex', gap: 'var(--os-space-4)', alignItems: 'center', marginBottom: 'var(--os-space-6)' }}>
                <CoreIcon icon={<ShieldCheck />} color="default" size="lg" />
                <CoreIcon icon={<ShieldCheck />} color="muted" size="lg" />
                <CoreIcon icon={<ShieldCheck />} color="primary" size="lg" />
                <CoreIcon icon={<CheckCircle />} color="success" size="lg" />
                <CoreIcon icon={<Clock />} color="warning" size="lg" />
                <CoreIcon icon={<AlertCircle />} color="danger" size="lg" />
                <CoreIcon icon={<Info />} color="info" size="lg" />
            </div>

            <h4 style={{ marginBottom: 'var(--os-space-3)', color: 'var(--os-color-text-secondary)' }}>Icon Circles</h4>
            <div style={{ display: 'flex', gap: 'var(--os-space-4)', alignItems: 'center', marginBottom: 'var(--os-space-8)' }}>
                <CoreIconCircle icon={<Users />} variant="subtle" color="primary" />
                <CoreIconCircle icon={<CheckCircle />} variant="subtle" color="success" />
                <CoreIconCircle icon={<Users />} variant="solid" color="primary" />
                <CoreIconCircle icon={<CheckCircle />} variant="solid" color="success" />
                <CoreIconCircle icon={<AlertCircle />} variant="outline" color="danger" />
                <CoreIconCircle icon={<Building2 />} size="lg" variant="subtle" color="info" />
            </div>

            <CoreDivider spacing="lg" />

            {/* ═══════════════════════════════════════════════════════════════
                SECTION: TABLE
            ═══════════════════════════════════════════════════════════════ */}
            <CoreSectionHeader
                title="Table"
                subtitle="Data display with loading states"
                action={
                    <CoreButton
                        size="sm"
                        variant="secondary"
                        onClick={() => setShowTableLoading(!showTableLoading)}
                    >
                        {showTableLoading ? 'Show Data' : 'Show Loading'}
                    </CoreButton>
                }
                divider
            />

            <div style={{ marginBottom: 'var(--os-space-8)' }}>
                {showTableLoading ? (
                    <CoreTableLoading rows={3} columns={4} />
                ) : (
                    <CoreTable hoverable striped>
                        <CoreTableHead>
                            <CoreTableRow>
                                <CoreTableHeader>Name</CoreTableHeader>
                                <CoreTableHeader>Email</CoreTableHeader>
                                <CoreTableHeader>Role</CoreTableHeader>
                                <CoreTableHeader align="right">Actions</CoreTableHeader>
                            </CoreTableRow>
                        </CoreTableHead>
                        <CoreTableBody>
                            <CoreTableRow>
                                <CoreTableCell>John Doe</CoreTableCell>
                                <CoreTableCell>john@example.com</CoreTableCell>
                                <CoreTableCell><CoreBadge variant="success" size="sm">Admin</CoreBadge></CoreTableCell>
                                <CoreTableCell align="right">
                                    <div style={{ display: 'flex', gap: 'var(--os-space-2)', justifyContent: 'flex-end' }}>
                                        <CoreButton size="sm" variant="ghost" shape="square" iconOnly iconLeft={<Edit size={14} />} aria-label="Edit" />
                                        <CoreButton size="sm" variant="ghost" shape="square" iconOnly iconLeft={<Trash2 size={14} />} aria-label="Delete" />
                                    </div>
                                </CoreTableCell>
                            </CoreTableRow>
                            <CoreTableRow>
                                <CoreTableCell>Jane Smith</CoreTableCell>
                                <CoreTableCell>jane@example.com</CoreTableCell>
                                <CoreTableCell><CoreBadge variant="info" size="sm">User</CoreBadge></CoreTableCell>
                                <CoreTableCell align="right">
                                    <div style={{ display: 'flex', gap: 'var(--os-space-2)', justifyContent: 'flex-end' }}>
                                        <CoreButton size="sm" variant="ghost" shape="square" iconOnly iconLeft={<Edit size={14} />} aria-label="Edit" />
                                        <CoreButton size="sm" variant="ghost" shape="square" iconOnly iconLeft={<Trash2 size={14} />} aria-label="Delete" />
                                    </div>
                                </CoreTableCell>
                            </CoreTableRow>
                            <CoreTableRow>
                                <CoreTableCell>Bob Wilson</CoreTableCell>
                                <CoreTableCell>bob@example.com</CoreTableCell>
                                <CoreTableCell><CoreBadge variant="warning" size="sm">Pending</CoreBadge></CoreTableCell>
                                <CoreTableCell align="right">
                                    <div style={{ display: 'flex', gap: 'var(--os-space-2)', justifyContent: 'flex-end' }}>
                                        <CoreButton size="sm" variant="ghost" shape="square" iconOnly iconLeft={<Edit size={14} />} aria-label="Edit" />
                                        <CoreButton size="sm" variant="ghost" shape="square" iconOnly iconLeft={<Trash2 size={14} />} aria-label="Delete" />
                                    </div>
                                </CoreTableCell>
                            </CoreTableRow>
                        </CoreTableBody>
                    </CoreTable>
                )}
            </div>

            <CoreDivider spacing="lg" />

            {/* ═══════════════════════════════════════════════════════════════
                SECTION: EMPTY STATE
            ═══════════════════════════════════════════════════════════════ */}
            <CoreSectionHeader
                title="Empty State"
                subtitle="Calm, non-aggressive feedback"
                divider
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--os-space-4)', marginBottom: 'var(--os-space-8)' }}>
                <CoreCard variant="outlined">
                    <CoreEmptyState
                        size="sm"
                        icon={<Users size={32} />}
                        title="No users yet"
                        subtitle="Add your first user to get started."
                    />
                </CoreCard>

                <CoreCard variant="outlined">
                    <CoreEmptyState
                        size="md"
                        icon={<Building2 size={48} />}
                        title="No organizations"
                        subtitle="Create an organization to start managing your team."
                        action={<CoreButton iconLeft={<Plus size={16} />}>Create Organization</CoreButton>}
                    />
                </CoreCard>
            </div>

            <CoreDivider spacing="lg" />

            {/* ═══════════════════════════════════════════════════════════════
                SECTION: DIVIDERS
            ═══════════════════════════════════════════════════════════════ */}
            <CoreSectionHeader
                title="Dividers & Section Headers"
                subtitle="Visual separators"
                divider
            />

            <CoreCard variant="outlined" padding="lg" style={{ marginBottom: 'var(--os-space-8)' }}>
                <p style={{ margin: 0, marginBottom: 'var(--os-space-2)' }}>Content above divider</p>
                <CoreDivider spacing="md" />
                <p style={{ margin: 0, marginBottom: 'var(--os-space-2)' }}>Content below simple divider</p>
                <CoreDivider spacing="md" label="OR" />
                <p style={{ margin: 0 }}>Content after labeled divider</p>
            </CoreCard>

            {/* ═══════════════════════════════════════════════════════════════
                FOOTER
            ═══════════════════════════════════════════════════════════════ */}
            <div style={{
                textAlign: 'center',
                color: 'var(--os-color-text-muted)',
                fontSize: 'var(--os-text-sm)',
                paddingTop: 'var(--os-space-10)',
                paddingBottom: 'var(--os-space-8)',
            }}>
                <p style={{ marginBottom: 'var(--os-space-2)' }}>
                    ✅ Core UI = OS VISUAL LANGUAGE ONLINE
                </p>
                <p style={{ fontSize: 'var(--os-text-xs)', opacity: 0.6 }}>
                    PHASE 7.2.1 — Enhanced with Dropdown, Icon-only Buttons, Generic Icons
                </p>
            </div>
        </div>
    );
}
