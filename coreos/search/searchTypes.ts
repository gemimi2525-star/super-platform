/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Search Types — Phase 17N (Global Search / Spotlight)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Type definitions for the OS-level search system.
 *
 * @module coreos/search/searchTypes
 * @version 1.0.0
 */

// ═══════════════════════════════════════════════════════════════════════════
// SEARCH ITEM KINDS
// ═══════════════════════════════════════════════════════════════════════════

export type SearchItemKind = 'app' | 'command' | 'file' | 'setting';

/** Priority for deterministic tie-breaking (lower = higher priority) */
export const KIND_PRIORITY: Record<SearchItemKind, number> = {
    app: 0,
    command: 1,
    setting: 2,
    file: 3,
};

// ═══════════════════════════════════════════════════════════════════════════
// SEARCH ITEM
// ═══════════════════════════════════════════════════════════════════════════

export interface SearchItem {
    /** Unique key for dedup (e.g. 'app:ops.center', 'cmd:open-jobs') */
    id: string;
    /** Kind of item */
    kind: SearchItemKind;
    /** Display title */
    title: string;
    /** Subtitle / description */
    subtitle?: string;
    /** Icon (emoji or URL) */
    icon: string;
    /** Searchable keywords (extra terms to match against) */
    keywords: string[];
    /** Action to perform when selected */
    action: SearchAction;
}

// ═══════════════════════════════════════════════════════════════════════════
// SEARCH ACTION
// ═══════════════════════════════════════════════════════════════════════════

export type SearchAction =
    | { type: 'openApp'; capabilityId: string }
    | { type: 'navigate'; route: string }
    | { type: 'openTab'; capabilityId: string; tabId: string }
    | { type: 'custom'; handler: () => void };

// ═══════════════════════════════════════════════════════════════════════════
// SEARCH RESULT
// ═══════════════════════════════════════════════════════════════════════════

export interface SearchResult {
    /** The matched item */
    item: SearchItem;
    /** Match score (higher = better match, 0 = no match) */
    score: number;
    /** Character ranges that matched in the title [start, end][] */
    matchedRanges: [number, number][];
}
