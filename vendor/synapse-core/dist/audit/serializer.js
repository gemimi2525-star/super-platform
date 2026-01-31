"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.toCanonicalJson = toCanonicalJson;
exports.fromCanonicalJson = fromCanonicalJson;
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
function toCanonicalJson(value) {
    return JSON.stringify(sortKeys(value));
}
/**
 * Recursively sort object keys for canonical output
 */
function sortKeys(value) {
    if (value === null || value === undefined) {
        return value;
    }
    if (Array.isArray(value)) {
        return value.map(sortKeys);
    }
    if (typeof value === 'object') {
        const sorted = {};
        const keys = Object.keys(value).sort();
        for (const key of keys) {
            const val = value[key];
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
function fromCanonicalJson(json) {
    return JSON.parse(json);
}
//# sourceMappingURL=serializer.js.map