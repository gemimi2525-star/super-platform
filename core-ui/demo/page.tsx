/**
 * ═══════════════════════════════════════════════════════════════════════════
 * APICOREDATA OS — Core UI Demo Page
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * PHASE 7.2: Showcase all Core UI components
 * For testing responsiveness, i18n, and visual consistency
 * 
 * @version 1.0.0
 * @date 2026-01-29
 */

'use client';

import React from 'react';
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
} from '@/core-ui';
import { Users, Building2, ShieldCheck, Search, Plus, Trash2, Edit, ChevronRight } from 'lucide-react';

export default function CoreUIDemoPage() {
    const [isLoading, setIsLoading] = React.useState(false);
    const [showTableLoading, setShowTableLoading] = React.useState(false);

    return (
        <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: 'var(--os-space-8)',
            fontFamily: 'var(--os-font-sans)',
        }}>
            <h1 style={{
                fontSize: 'var(--os-text-2xl)',
                fontWeight: 600,
                marginBottom: 'var(--os-space-8)',
                color: 'var(--os-color-text)',
            }}>
                🧩 Core UI — Component Library (PHASE 7.2)
            </h1>

            {/* ═══════════════════════════════════════════════════════════════
                BUTTONS
            ═══════════════════════════════════════════════════════════════ */}
            <CoreSectionHeader
                title="Buttons"
                subtitle="Primary actions and interactions"
                divider
            />

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--os-space-3)', marginBottom: 'var(--os-space-8)' }}>
                <CoreButton variant="primary">Primary</CoreButton>
                <CoreButton variant="secondary">Secondary</CoreButton>
                <CoreButton variant="ghost">Ghost</CoreButton>
                <CoreButton variant="danger">Danger</CoreButton>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--os-space-3)', marginBottom: 'var(--os-space-8)' }}>
                <CoreButton size="sm">Small</CoreButton>
                <CoreButton size="md">Medium</CoreButton>
                <CoreButton size="lg">Large</CoreButton>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--os-space-3)', marginBottom: 'var(--os-space-8)' }}>
                <CoreButton iconLeft={<Plus />}>With Icon Left</CoreButton>
                <CoreButton iconRight={<ChevronRight />}>With Icon Right</CoreButton>
                <CoreButton loading onClick={() => setIsLoading(!isLoading)}>Loading</CoreButton>
                <CoreButton disabled>Disabled</CoreButton>
            </div>

            <CoreDivider spacing="lg" />

            {/* ═══════════════════════════════════════════════════════════════
                INPUTS
            ═══════════════════════════════════════════════════════════════ */}
            <CoreSectionHeader
                title="Inputs"
                subtitle="Form elements and text fields"
                divider
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--os-space-4)', marginBottom: 'var(--os-space-8)' }}>
                <CoreInput label="Default Input" placeholder="Enter text..." />
                <CoreInput label="With Helper" helperText="This is helper text" placeholder="Enter text..." />
                <CoreInput label="With Error" error="This field is required" placeholder="Enter text..." />
                <CoreInput label="With Icons" prefixIcon={<Search size={16} />} placeholder="Search..." />
                <CoreInput label="Disabled" disabled placeholder="Cannot edit" />
            </div>

            <CoreDivider spacing="lg" />

            {/* ═══════════════════════════════════════════════════════════════
                CARDS
            ═══════════════════════════════════════════════════════════════ */}
            <CoreSectionHeader
                title="Cards"
                subtitle="Container components with variants"
                divider
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--os-space-4)', marginBottom: 'var(--os-space-8)' }}>
                <CoreCard variant="default">
                    <CoreCardHeader>
                        <strong>Default Card</strong>
                    </CoreCardHeader>
                    <CoreCardBody>
                        Content goes here with normal surface.
                    </CoreCardBody>
                </CoreCard>

                <CoreCard variant="elevated">
                    <CoreCardHeader>
                        <strong>Elevated Card</strong>
                    </CoreCardHeader>
                    <CoreCardBody>
                        Content with stronger shadow.
                    </CoreCardBody>
                </CoreCard>

                <CoreCard variant="outlined">
                    <CoreCardHeader>
                        <strong>Outlined Card</strong>
                    </CoreCardHeader>
                    <CoreCardBody>
                        Transparent with border only.
                    </CoreCardBody>
                </CoreCard>

                <CoreCard variant="glass" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.8), rgba(255,255,255,0.4))' }}>
                    <CoreCardHeader>
                        <strong>Glass Card</strong>
                    </CoreCardHeader>
                    <CoreCardBody>
                        Frosted glass effect.
                    </CoreCardBody>
                </CoreCard>
            </div>

            <div style={{ display: 'flex', gap: 'var(--os-space-4)', marginBottom: 'var(--os-space-8)' }}>
                <CoreCard hoverable padding="lg">
                    <strong>Hoverable</strong>
                    <p style={{ margin: 0, marginTop: 'var(--os-space-2)', color: 'var(--os-color-text-muted)' }}>
                        Hover to see lift effect
                    </p>
                </CoreCard>

                <CoreCard clickable padding="lg">
                    <strong>Clickable</strong>
                    <p style={{ margin: 0, marginTop: 'var(--os-space-2)', color: 'var(--os-color-text-muted)' }}>
                        Click to see press effect
                    </p>
                </CoreCard>
            </div>

            <CoreDivider spacing="lg" />

            {/* ═══════════════════════════════════════════════════════════════
                BADGES
            ═══════════════════════════════════════════════════════════════ */}
            <CoreSectionHeader
                title="Badges & Status"
                subtitle="Status indicators and labels"
                divider
            />

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--os-space-3)', alignItems: 'center', marginBottom: 'var(--os-space-6)' }}>
                <CoreBadge variant="default">Default</CoreBadge>
                <CoreBadge variant="success">Success</CoreBadge>
                <CoreBadge variant="warning">Warning</CoreBadge>
                <CoreBadge variant="danger">Danger</CoreBadge>
                <CoreBadge variant="info">Info</CoreBadge>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--os-space-4)', alignItems: 'center', marginBottom: 'var(--os-space-6)' }}>
                <strong>Dots:</strong>
                <CoreBadge type="dot" variant="success" />
                <CoreBadge type="dot" variant="warning" />
                <CoreBadge type="dot" variant="danger" />
                <CoreBadge type="dot" variant="info" />
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--os-space-4)', alignItems: 'center', marginBottom: 'var(--os-space-8)' }}>
                <strong>Status:</strong>
                <CoreBadge type="status" variant="success">Active</CoreBadge>
                <CoreBadge type="status" variant="warning">Pending</CoreBadge>
                <CoreBadge type="status" variant="danger">Error</CoreBadge>
            </div>

            <CoreDivider spacing="lg" />

            {/* ═══════════════════════════════════════════════════════════════
                ICONS
            ═══════════════════════════════════════════════════════════════ */}
            <CoreSectionHeader
                title="Icons"
                subtitle="Standardized icon sizing and colors"
                divider
            />

            <div style={{ display: 'flex', gap: 'var(--os-space-4)', alignItems: 'center', marginBottom: 'var(--os-space-6)' }}>
                <CoreIcon icon={<Users />} size="xs" />
                <CoreIcon icon={<Users />} size="sm" />
                <CoreIcon icon={<Users />} size="md" />
                <CoreIcon icon={<Users />} size="lg" />
                <CoreIcon icon={<Users />} size="xl" />
            </div>

            <div style={{ display: 'flex', gap: 'var(--os-space-4)', alignItems: 'center', marginBottom: 'var(--os-space-6)' }}>
                <CoreIcon icon={<ShieldCheck />} color="default" />
                <CoreIcon icon={<ShieldCheck />} color="muted" />
                <CoreIcon icon={<ShieldCheck />} color="primary" />
                <CoreIcon icon={<ShieldCheck />} color="success" />
                <CoreIcon icon={<ShieldCheck />} color="warning" />
                <CoreIcon icon={<ShieldCheck />} color="danger" />
            </div>

            <div style={{ display: 'flex', gap: 'var(--os-space-4)', alignItems: 'center', marginBottom: 'var(--os-space-8)' }}>
                <CoreIconCircle icon={<Users />} variant="subtle" color="primary" />
                <CoreIconCircle icon={<Users />} variant="solid" color="success" />
                <CoreIconCircle icon={<Users />} variant="outline" color="danger" />
                <CoreIconCircle icon={<Building2 />} size="lg" variant="subtle" color="info" />
            </div>

            <CoreDivider spacing="lg" />

            {/* ═══════════════════════════════════════════════════════════════
                TABLE
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
                        Toggle Loading
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
                                        <CoreButton size="sm" variant="ghost" iconLeft={<Edit size={14} />}>Edit</CoreButton>
                                        <CoreButton size="sm" variant="ghost" iconLeft={<Trash2 size={14} />}>Delete</CoreButton>
                                    </div>
                                </CoreTableCell>
                            </CoreTableRow>
                            <CoreTableRow>
                                <CoreTableCell>Jane Smith</CoreTableCell>
                                <CoreTableCell>jane@example.com</CoreTableCell>
                                <CoreTableCell><CoreBadge variant="info" size="sm">User</CoreBadge></CoreTableCell>
                                <CoreTableCell align="right">
                                    <div style={{ display: 'flex', gap: 'var(--os-space-2)', justifyContent: 'flex-end' }}>
                                        <CoreButton size="sm" variant="ghost" iconLeft={<Edit size={14} />}>Edit</CoreButton>
                                        <CoreButton size="sm" variant="ghost" iconLeft={<Trash2 size={14} />}>Delete</CoreButton>
                                    </div>
                                </CoreTableCell>
                            </CoreTableRow>
                        </CoreTableBody>
                    </CoreTable>
                )}
            </div>

            <CoreDivider spacing="lg" />

            {/* ═══════════════════════════════════════════════════════════════
                EMPTY STATE
            ═══════════════════════════════════════════════════════════════ */}
            <CoreSectionHeader
                title="Empty State"
                subtitle="Calm, non-aggressive feedback"
                divider
            />

            <CoreCard variant="outlined" style={{ marginBottom: 'var(--os-space-8)' }}>
                <CoreEmptyState
                    icon={<Users size={48} />}
                    title="No users yet"
                    subtitle="Get started by adding your first user to the system."
                    action={<CoreButton iconLeft={<Plus />}>Add User</CoreButton>}
                />
            </CoreCard>

            <CoreDivider spacing="lg" />

            {/* ═══════════════════════════════════════════════════════════════
                DIVIDERS
            ═══════════════════════════════════════════════════════════════ */}
            <CoreSectionHeader
                title="Dividers"
                subtitle="Visual separators"
                divider
            />

            <div style={{ marginBottom: 'var(--os-space-8)' }}>
                <p>Content above</p>
                <CoreDivider spacing="md" />
                <p>Content below</p>
                <CoreDivider spacing="md" label="OR" />
                <p>Content after labeled divider</p>
            </div>

            <CoreDivider spacing="lg" />

            {/* ═══════════════════════════════════════════════════════════════
                FOOTER
            ═══════════════════════════════════════════════════════════════ */}
            <div style={{
                textAlign: 'center',
                color: 'var(--os-color-text-muted)',
                fontSize: 'var(--os-text-sm)',
                paddingTop: 'var(--os-space-8)',
            }}>
                ✅ Core UI = OS VISUAL LANGUAGE ONLINE
            </div>
        </div>
    );
}
