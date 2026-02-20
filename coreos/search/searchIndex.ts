/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Search Index — Phase 17N (Global Search / Spotlight)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Builds the search index from registered apps, OS commands, and settings.
 * Uses capability-graph manifests as the source of truth for apps.
 *
 * Index is built once and cached — no Firestore queries per keystroke.
 *
 * @module coreos/search/searchIndex
 * @version 1.0.0
 */

import type { SearchItem } from './searchTypes';

// ═══════════════════════════════════════════════════════════════════════════
// STATIC COMMAND ENTRIES
// ═══════════════════════════════════════════════════════════════════════════

const OS_COMMANDS: SearchItem[] = [
    {
        id: 'cmd:open-ops-status',
        kind: 'command',
        title: 'System Status',
        subtitle: 'Open Ops Center → System Status',
        icon: '🟢',
        keywords: ['system', 'health', 'status', 'ops', 'monitor'],
        action: { type: 'openTab', capabilityId: 'ops.center', tabId: 'status' },
    },
    {
        id: 'cmd:open-ops-metrics',
        kind: 'command',
        title: 'Runtime Metrics',
        subtitle: 'Open Ops Center → Metrics',
        icon: '📊',
        keywords: ['metrics', 'performance', 'cpu', 'memory', 'telemetry'],
        action: { type: 'openTab', capabilityId: 'ops.center', tabId: 'metrics' },
    },
    {
        id: 'cmd:open-ops-jobs',
        kind: 'command',
        title: 'Job Queue',
        subtitle: 'Open Ops Center → Jobs',
        icon: '📋',
        keywords: ['jobs', 'queue', 'worker', 'background', 'task'],
        action: { type: 'openTab', capabilityId: 'ops.center', tabId: 'jobs' },
    },
    {
        id: 'cmd:open-ops-audit',
        kind: 'command',
        title: 'Audit Trail',
        subtitle: 'Open Ops Center → Audit',
        icon: '📜',
        keywords: ['audit', 'log', 'trail', 'history', 'trace'],
        action: { type: 'openTab', capabilityId: 'ops.center', tabId: 'audit' },
    },
    {
        id: 'cmd:open-ops-outbox',
        kind: 'command',
        title: 'Outbox Inspector',
        subtitle: 'Open Ops Center → Outbox',
        icon: '📤',
        keywords: ['outbox', 'sync', 'queue', 'offline', 'pending'],
        action: { type: 'openTab', capabilityId: 'ops.center', tabId: 'outbox' },
    },
    {
        id: 'cmd:open-ops-vfs',
        kind: 'command',
        title: 'VFS Inspector',
        subtitle: 'Open Ops Center → VFS',
        icon: '📂',
        keywords: ['vfs', 'filesystem', 'files', 'storage'],
        action: { type: 'openTab', capabilityId: 'ops.center', tabId: 'vfs' },
    },
    {
        id: 'cmd:go-system-hub',
        kind: 'command',
        title: 'System Hub',
        subtitle: 'Open System Hub',
        icon: '⚙️',
        keywords: ['system', 'settings', 'preferences', 'configure', 'hub'],
        action: { type: 'openApp', capabilityId: 'system.hub' },
    },
];

// ═══════════════════════════════════════════════════════════════════════════
// STATIC SETTINGS ENTRIES
// ═══════════════════════════════════════════════════════════════════════════

const SETTINGS_ENTRIES: SearchItem[] = [
    {
        id: 'setting:theme',
        kind: 'setting',
        title: 'Theme & Appearance',
        subtitle: 'System Hub → Configuration',
        icon: '🎨',
        keywords: ['theme', 'dark', 'light', 'appearance', 'color', 'mode'],
        action: { type: 'openApp', capabilityId: 'system.configure' },
    },
    {
        id: 'setting:language',
        kind: 'setting',
        title: 'Language / ภาษา',
        subtitle: 'System Hub → Configuration',
        icon: '🌐',
        keywords: ['language', 'locale', 'i18n', 'thai', 'english', 'ภาษา'],
        action: { type: 'openApp', capabilityId: 'system.configure' },
    },
    {
        id: 'setting:security',
        kind: 'setting',
        title: 'Security & Permissions',
        subtitle: 'System Hub → Security',
        icon: '🔐',
        keywords: ['security', 'permission', 'auth', 'access', 'policy'],
        action: { type: 'openApp', capabilityId: 'system.hub' },
    },
];

// ═══════════════════════════════════════════════════════════════════════════
// INDEX BUILDER
// ═══════════════════════════════════════════════════════════════════════════

let cachedIndex: SearchItem[] | null = null;

/**
 * Build the search index from manifests + commands + settings.
 * Result is cached — call invalidateIndex() to rebuild.
 */
export function buildIndex(): SearchItem[] {
    if (cachedIndex) return cachedIndex;

    const items: SearchItem[] = [];

    // 1) Apps from capability-graph manifests
    try {
        // Dynamic import to avoid circular dependencies
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { CoreOSCapabilityGraph } = require('@/coreos/capability-graph');
        const graph = new CoreOSCapabilityGraph();
        const manifests = graph.getAllManifests();

        for (const m of manifests) {
            if (!m.hasUI) continue; // Skip non-UI capabilities

            items.push({
                id: `app:${m.id}`,
                kind: 'app',
                title: m.title,
                subtitle: `Open ${m.title}`,
                icon: m.icon || '📦',
                keywords: [m.id, ...(m.id.split('.'))],
                action: { type: 'openApp', capabilityId: m.id },
            });
        }
    } catch {
        console.warn('[SearchIndex] Failed to load capability graph');
    }

    // 2) OS Commands
    items.push(...OS_COMMANDS);

    // 3) Settings
    items.push(...SETTINGS_ENTRIES);

    cachedIndex = items;
    console.log(`[SearchIndex] Built index with ${items.length} items`);
    return items;
}

/**
 * Invalidate cached index (call after manifest changes).
 */
export function invalidateIndex(): void {
    cachedIndex = null;
}
