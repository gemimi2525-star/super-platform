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
export declare function toCanonicalJson(value: unknown): string;
/**
 * Parse canonical JSON back to object
 */
export declare function fromCanonicalJson<T>(json: string): T;
//# sourceMappingURL=serializer.d.ts.map