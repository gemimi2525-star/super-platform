/**
 * ═══════════════════════════════════════════════════════════════════════════
 * APICOREDATA PLATFORM — System Naming Constants
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * SINGLE SOURCE OF TRUTH for platform architecture naming.
 * All system layers reference these constants for consistent branding.
 * 
 * @module coreos/naming
 * @version 1.0.0
 */

// ═══════════════════════════════════════════════════════════════════════════
// SYSTEM LAYER NAMES (Canonical)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * SYNAPSE — Governance Kernel
 * Handles policy enforcement, security contexts, intent routing, capability graph.
 * @see /docs/contracts/SYNAPSE_KERNEL_CONTRACT.md
 */
export const SYSTEM_KERNEL_NAME = 'SYNAPSE' as const;

/**
 * NEXUS — Shell Layer
 * Desktop surface, dock, menu bar, global shell state, system chrome.
 * @see /docs/specs/NEXUS_SHELL_SPEC.md
 */
export const SYSTEM_SHELL_NAME = 'NEXUS' as const;

/**
 * ORBIT — Window System
 * Window manager, window chrome, window state actions, spatial positioning.
 * @see /docs/specs/ORBIT_WINDOW_SYSTEM_SPEC.md
 */
export const SYSTEM_WINDOW_SYSTEM_NAME = 'ORBIT' as const;

// ═══════════════════════════════════════════════════════════════════════════
// DISPLAY STRINGS (For UI)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Full system stack label for display in UI
 * Example: "NEXUS Shell • ORBIT Window System • SYNAPSE Kernel"
 */
export const SYSTEM_STACK_LABEL = `${SYSTEM_SHELL_NAME} Shell • ${SYSTEM_WINDOW_SYSTEM_NAME} Window System • ${SYSTEM_KERNEL_NAME} Kernel` as const;

/**
 * Short version for compact UI
 */
export const SYSTEM_STACK_SHORT = `${SYSTEM_SHELL_NAME}/${SYSTEM_WINDOW_SYSTEM_NAME}/${SYSTEM_KERNEL_NAME}` as const;

// ═══════════════════════════════════════════════════════════════════════════
// NAMING MAP (Documentation Reference)
// ═══════════════════════════════════════════════════════════════════════════

export const SYSTEM_NAMING_MAP = {
    kernel: {
        name: SYSTEM_KERNEL_NAME,
        description: 'Governance Kernel — Policy, Security, Intent Routing',
    },
    shell: {
        name: SYSTEM_SHELL_NAME,
        description: 'Shell Layer — Desktop, Dock, Menu Bar, System Chrome',
    },
    windowSystem: {
        name: SYSTEM_WINDOW_SYSTEM_NAME,
        description: 'Window System — Window Manager, Chrome, Spatial State',
    },
} as const;
