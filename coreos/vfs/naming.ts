/**
 * ═══════════════════════════════════════════════════════════════════════════
 * VFS NAMING KERNEL (Phase 37)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Deterministic name normalization and canonical key generation.
 *
 * Rules:
 *   1. trim whitespace
 *   2. collapse consecutive spaces → single space
 *   3. lowercase
 *   4. Unicode NFKC normalization
 *
 * canonicalKey = SHA-256( parentPath + ":" + normalizedName )
 *
 * @module coreos/vfs/naming
 */

// ─── Name Normalization ─────────────────────────────────────────────────

/**
 * Normalize a file/folder name for canonical comparison.
 *
 * "  My   Documents " → "my documents"
 * "Documents" / "documents" / "DOCUMENTS" → "documents"
 * "ﬁle" (fi ligature) → "file" (NFKC)
 */
export function normalizeName(name: string): string {
    return name
        .trim()                          // 1. strip leading/trailing whitespace
        .replace(/\s+/g, ' ')           // 2. collapse consecutive whitespace
        .toLowerCase()                   // 3. case-fold
        .normalize('NFKC');              // 4. Unicode compatibility normalization
}

// ─── Canonical Key ──────────────────────────────────────────────────────

/**
 * Generate a deterministic canonical key for a name within a parent.
 *
 * canonicalKey = SHA-256( parentPath + ":" + normalizeName(name) )
 *
 * Uses Web Crypto (async) for browser environments.
 */
export async function makeCanonicalKey(parentPath: string, name: string): Promise<string> {
    const normalized = normalizeName(name);
    const input = `${parentPath}:${normalized}`;

    // Web Crypto API (available in browser + Node 18+)
    if (typeof crypto !== 'undefined' && crypto.subtle) {
        const encoder = new TextEncoder();
        const data = encoder.encode(input);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Fallback: simple deterministic hash for environments without Web Crypto
    // (SSR / test environments without crypto.subtle)
    return fallbackHash(input);
}

/**
 * Synchronous canonical key — for test environments / SSR.
 */
export function makeCanonicalKeySync(parentPath: string, name: string): string {
    const normalized = normalizeName(name);
    const input = `${parentPath}:${normalized}`;
    return fallbackHash(input);
}

/**
 * Simple deterministic hash fallback (djb2 + fnv1a combined for uniqueness).
 * NOT cryptographic — used only when crypto.subtle is unavailable.
 */
function fallbackHash(str: string): string {
    let h1 = 5381;   // djb2
    let h2 = 2166136261; // fnv1a offset basis

    for (let i = 0; i < str.length; i++) {
        const c = str.charCodeAt(i);
        h1 = ((h1 << 5) + h1 + c) >>> 0;     // djb2
        h2 = (h2 ^ c) * 16777619 >>> 0;       // fnv1a
    }

    return h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0');
}
