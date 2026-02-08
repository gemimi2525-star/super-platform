
import type { Capability } from '../runtime/types';
import type { CapabilityTier } from './types';

// Source of Truth for Capability Tiers
export const CAPABILITY_TIER_MAP: Record<Capability, CapabilityTier> = {
    // SAFE: Essential / Low Risk
    'ui.window': 'SAFE',

    // STANDARD: Moderate Risk / Common Resources
    'fs.temp': 'STANDARD',
    'ui.notify': 'STANDARD',

    // DANGEROUS: Persistent Data / Network
    'fs.read': 'DANGEROUS',
    'fs.write': 'DANGEROUS',
    'net.fetch': 'DANGEROUS',

    // CRITICAL: System / Admin
    'process.spawn': 'CRITICAL',
    'audit.read': 'CRITICAL',
};

// Default checked state in UI prompt
export const DEFAULT_TIER_STATE: Record<CapabilityTier, boolean> = {
    'SAFE': true,       // Locked (Allow)
    'STANDARD': true,   // Checked by default
    'DANGEROUS': false, // Unchecked by default
    'CRITICAL': false,  // Disabled (Admin only)
};

export function getCapabilityTier(capability: Capability): CapabilityTier {
    return CAPABILITY_TIER_MAP[capability] || 'CRITICAL'; // Fallback to Critical for unknown caps
}
