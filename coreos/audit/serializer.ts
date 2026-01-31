/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CORE OS — Audit Serializer (Phase S)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Canonical JSON serialization for deterministic, diff-friendly output.
 * Ensures same input produces identical string output for hashing.
 * 
 * @module coreos/audit/serializer
 * @version 1.0.0 (Phase S)
 */

// ═══════════════════════════════════════════════════════════════════════════
// CANONICAL JSON SERIALIZER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Convert any value to canonical JSON string.
 * 
 * Rules:
 * - Keys are sorted alphabetically
 * - Arrays preserve order
 * - No whitespace variance (minified)
 * - undefined values are omitted
 * - null is preserved
 * 
 * @param value - Value to serialize
 * @returns Canonical JSON string
 */
export function toCanonicalJson(value: unknown): string {
    return JSON.stringify(sortKeys(value));
}

/**
 * Recursively sort object keys for canonical output
 */
function sortKeys(value: unknown): unknown {
    if (value === null || value === undefined) {
        return value;
    }

    if (Array.isArray(value)) {
        return value.map(sortKeys);
    }

    if (typeof value === 'object') {
        const sorted: Record<string, unknown> = {};
        const keys = Object.keys(value as Record<string, unknown>).sort();

        for (const key of keys) {
            const val = (value as Record<string, unknown>)[key];
            // Omit undefined values
            if (val !== undefined) {
                sorted[key] = sortKeys(val);
            }
        }

        return sorted;
    }

    return value;
}

/**
 * Parse canonical JSON back to object
 */
export function fromCanonicalJson<T>(json: string): T {
    return JSON.parse(json) as T;
}
