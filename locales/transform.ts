/**
 * i18n Transform Utility
 * 
 * Transforms unified messages format to next-intl format
 * 
 * Input format (unified):
 * {
 *   "common.appName": { "en": "Super Platform", "th": "ซุปเปอร์ แพลตฟอร์ม", "zh": "超级平台" }
 * }
 * 
 * Output format (next-intl):
 * {
 *   "common": { "appName": "Super Platform" }
 * }
 */

// Define Locale type here to avoid circular import
type Locale = 'en' | 'th';

type UnifiedMessages = Record<string, Record<string, string>>;
type NestedMessages = Record<string, unknown>;

/**
 * Transform unified messages to next-intl nested format for a specific locale
 */
export function transformMessages(unified: UnifiedMessages, locale: Locale): NestedMessages {
    const result: NestedMessages = {};

    for (const [flatKey, translations] of Object.entries(unified)) {
        // Skip if translations is not an object with locale keys
        if (!translations || typeof translations !== 'object') {
            continue;
        }

        const value = translations[locale] || translations['en'] || '';
        if (value) {
            setNestedValue(result, flatKey, value);
        }
    }

    return result;
}

/**
 * Set a value in a nested object using dot notation
 * e.g., setNestedValue(obj, "a.b.c", "value") => obj.a.b.c = "value"
 */
function setNestedValue(obj: NestedMessages, path: string, value: string): void {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!(key in current)) {
            current[key] = {};
        }
        current = current[key] as NestedMessages;
    }

    current[keys[keys.length - 1]] = value;
}

/**
 * Validate that all keys have all required locales
 */
export function validateMessages(unified: UnifiedMessages, locales: readonly string[]): string[] {
    const errors: string[] = [];

    for (const [key, translations] of Object.entries(unified)) {
        for (const locale of locales) {
            if (!translations[locale]) {
                errors.push(`Missing "${locale}" for key: ${key}`);
            }
        }
    }

    return errors;
}

/**
 * Convert nested structure back to flat unified format
 * Useful for migration from old format
 */
export function flattenMessages(nested: NestedMessages, prefix = ''): Record<string, string> {
    const result: Record<string, string> = {};

    for (const [key, value] of Object.entries(nested)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;

        if (typeof value === 'string') {
            result[fullKey] = value;
        } else if (typeof value === 'object' && value !== null) {
            Object.assign(result, flattenMessages(value as NestedMessages, fullKey));
        }
    }

    return result;
}
