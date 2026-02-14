/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CAPABILITY DESCRIPTION REGISTRY (OS-GRADE)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Maps technical capability IDs to human-readable descriptions for 
 * Permission UX prompts.
 * 
 * @module coreos/manifests/descriptions
 */

import type { CapabilityId } from '../types';

export const CAPABILITY_DESCRIPTIONS: Record<CapabilityId | string, string> = {
    // Core Capabilities
    'core.finder': 'Manage files and folders on your system.',
    'core.settings': 'Modify system configuration and preferences.',
    'core.tools': 'Access system utility tools.',

    // Dangerous Capabilities (Network/FS)
    'fs.read': 'Read files from your local system.',
    'fs.write': 'Write files and save data to your local system.',
    'net.fetch': 'Connect to external servers to send or receive data.',

    // Administrative
    'user.manage': 'Manage user accounts and permissions.',
    'org.manage': 'Manage organization settings and members.',
    'audit.view': 'Access security and audit logs.',
    'system.configure': 'Change critical system operations.',

    // Operational
    'ops.center': 'Monitor system performance and operations.',
    'brain.dashboard': 'Access AI governance dashboard and proposal engine.',

    // Experimental
    'plugin.analytics': 'Collect usage data for analysis.',
};

/**
 * Get human-readable description for a capability
 */
export function getCapabilityDescription(capabilityId: string): string {
    return CAPABILITY_DESCRIPTIONS[capabilityId] || `Perform operations related to ${capabilityId}.`;
}
