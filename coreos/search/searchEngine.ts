/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Search Engine — Phase 17N (Global Search / Spotlight)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Fuzzy matching + deterministic ranking.
 * Pure functions — no side effects.
 *
 * Ranking: score DESC → kind priority ASC → title lexical ASC
 *
 * @module coreos/search/searchEngine
 * @version 1.0.0
 */

import type { SearchItem, SearchResult } from './searchTypes';
import { KIND_PRIORITY } from './searchTypes';

// ═══════════════════════════════════════════════════════════════════════════
// FUZZY MATCH
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fuzzy match a query against a target string.
 * Returns score (0 = no match) and matched character ranges.
 *
 * Scoring:
 *   - Exact prefix match: +100
 *   - Word boundary match: +50 per word
 *   - Consecutive match bonus: +10 per consecutive
 *   - Per character match: +1
 */
export function fuzzyMatch(
    query: string,
    target: string,
): { score: number; matchedRanges: [number, number][] } {
    if (!query || !target) return { score: 0, matchedRanges: [] };

    const q = query.toLowerCase();
    const t = target.toLowerCase();

    // Exact prefix match — highest priority
    if (t.startsWith(q)) {
        return {
            score: 100 + q.length,
            matchedRanges: [[0, q.length]],
        };
    }

    // Includes match
    const idx = t.indexOf(q);
    if (idx >= 0) {
        return {
            score: 50 + q.length,
            matchedRanges: [[idx, idx + q.length]],
        };
    }

    // Fuzzy character-by-character match
    let score = 0;
    let qi = 0;
    let lastMatchIdx = -2;
    const ranges: [number, number][] = [];
    let rangeStart = -1;

    for (let ti = 0; ti < t.length && qi < q.length; ti++) {
        if (t[ti] === q[qi]) {
            score += 1;
            // Consecutive bonus
            if (ti === lastMatchIdx + 1) {
                score += 10;
            }
            // Word boundary bonus
            if (ti === 0 || t[ti - 1] === ' ' || t[ti - 1] === '.' || t[ti - 1] === '-') {
                score += 5;
            }

            if (rangeStart === -1 || ti !== lastMatchIdx + 1) {
                if (rangeStart !== -1) {
                    ranges.push([rangeStart, lastMatchIdx + 1]);
                }
                rangeStart = ti;
            }
            lastMatchIdx = ti;
            qi++;
        }
    }

    // Close last range
    if (rangeStart !== -1 && qi > 0) {
        ranges.push([rangeStart, lastMatchIdx + 1]);
    }

    // All query chars must match for a valid result
    if (qi < q.length) {
        return { score: 0, matchedRanges: [] };
    }

    return { score, matchedRanges: ranges };
}

// ═══════════════════════════════════════════════════════════════════════════
// SEARCH
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Search items with fuzzy matching and deterministic ranking.
 *
 * Ranking order (deterministic):
 *   1) score DESC (best match first)
 *   2) kind priority ASC (app > command > setting > file)
 *   3) title lexical ASC (stable tie-break)
 *
 * @param query - User input
 * @param items - Search index items
 * @param maxResults - Maximum results to return (default: 10)
 */
export function search(
    query: string,
    items: readonly SearchItem[],
    maxResults: number = 10,
): SearchResult[] {
    if (!query.trim()) return [];

    const results: SearchResult[] = [];

    for (const item of items) {
        // Match against title
        let best = fuzzyMatch(query, item.title);

        // Match against keywords (take best score)
        for (const kw of item.keywords) {
            const kwMatch = fuzzyMatch(query, kw);
            if (kwMatch.score > best.score) {
                best = kwMatch;
                // For keyword matches, highlight in title instead
                const titleMatch = fuzzyMatch(query, item.title);
                best.matchedRanges = titleMatch.matchedRanges;
            }
        }

        // Match against subtitle
        if (item.subtitle) {
            const subMatch = fuzzyMatch(query, item.subtitle);
            if (subMatch.score > best.score) {
                best = { score: subMatch.score, matchedRanges: [] };
            }
        }

        if (best.score > 0) {
            results.push({
                item,
                score: best.score,
                matchedRanges: best.matchedRanges,
            });
        }
    }

    // Deterministic sort: score DESC → kind ASC → title ASC
    results.sort((a, b) => {
        if (a.score !== b.score) return b.score - a.score;
        const kindA = KIND_PRIORITY[a.item.kind] ?? 9;
        const kindB = KIND_PRIORITY[b.item.kind] ?? 9;
        if (kindA !== kindB) return kindA - kindB;
        return a.item.title.localeCompare(b.item.title);
    });

    return results.slice(0, maxResults);
}
