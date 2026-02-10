/**
 * ═══════════════════════════════════════════════════════════════════════════
 * DATA VISIBILITY CLASSIFICATION (Phase 18)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Classifies VFS paths into visibility levels for AI access control.
 * 
 * Levels:
 * - WORK:      AI can read metadata + content
 * - SENSITIVE:  AI can read metadata only (not content)
 * - SECRET:     AI cannot access at all
 * 
 * @module coreos/brain/data-visibility
 * @version 1.0.0 (Phase 18)
 */

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type DataVisibilityClass = 'WORK' | 'SENSITIVE' | 'SECRET';

export interface VisibilityResult {
    classification: DataVisibilityClass;
    canReadMetadata: boolean;
    canReadContent: boolean;
    reason: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// CLASSIFICATION RULES
// ═══════════════════════════════════════════════════════════════════════════

interface ClassificationRule {
    pattern: RegExp;
    classification: DataVisibilityClass;
    reason: string;
}

/**
 * Classification rules — evaluated in order, first match wins.
 * More specific rules go first.
 */
const CLASSIFICATION_RULES: ClassificationRule[] = [
    // SECRET — system paths (highest priority)
    {
        pattern: /^system:\/\//,
        classification: 'SECRET',
        reason: 'System paths are restricted — OS internal configuration'
    },

    // SENSITIVE — private user data
    {
        pattern: /^user:\/\/private\//,
        classification: 'SENSITIVE',
        reason: 'Private user data — metadata only'
    },
    {
        pattern: /^user:\/\/\.config\//,
        classification: 'SENSITIVE',
        reason: 'User configuration — metadata only'
    },
    {
        pattern: /^user:\/\/\.secrets?\//,
        classification: 'SECRET',
        reason: 'User secrets — AI access denied'
    },

    // WORK — general user data
    {
        pattern: /^user:\/\//,
        classification: 'WORK',
        reason: 'User workspace — AI can read'
    },

    // WORK — shared data
    {
        pattern: /^shared:\/\//,
        classification: 'WORK',
        reason: 'Shared workspace — AI can read'
    },

    // WORK — temporary data
    {
        pattern: /^tmp:\/\//,
        classification: 'WORK',
        reason: 'Temporary data — AI can read'
    },
];

// ═══════════════════════════════════════════════════════════════════════════
// CLASSIFICATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Classify a VFS path into a visibility level
 */
export function classifyPath(path: string): VisibilityResult {
    for (const rule of CLASSIFICATION_RULES) {
        if (rule.pattern.test(path)) {
            return {
                classification: rule.classification,
                canReadMetadata: rule.classification !== 'SECRET',
                canReadContent: rule.classification === 'WORK',
                reason: rule.reason,
            };
        }
    }

    // Default: SECRET (deny by default for unknown schemes)
    return {
        classification: 'SECRET',
        canReadMetadata: false,
        canReadContent: false,
        reason: 'Unknown scheme — denied by default',
    };
}

/**
 * Check if AI can read a path's content
 */
export function canAIReadContent(path: string): boolean {
    return classifyPath(path).canReadContent;
}

/**
 * Check if AI can read a path's metadata
 */
export function canAIReadMetadata(path: string): boolean {
    return classifyPath(path).canReadMetadata;
}

/**
 * Get human-readable visibility description (for AI context)
 */
export function describeVisibility(path: string): string {
    const result = classifyPath(path);
    switch (result.classification) {
        case 'WORK':
            return `🟢 ${path} — AI สามารถอ่านได้ (${result.reason})`;
        case 'SENSITIVE':
            return `🟡 ${path} — AI เห็น metadata เท่านั้น (${result.reason})`;
        case 'SECRET':
            return `🔴 ${path} — AI เข้าถึงไม่ได้ (${result.reason})`;
    }
}
