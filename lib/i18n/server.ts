import fs from 'fs';
import path from 'path';

type Locale = 'en' | 'th' | 'zh';

/**
 * Transform flat keys format to nested format
 * Input:  { "auth.login": { "en": "Login", "th": "เข้าสู่ระบบ" } }
 * Output: { "auth": { "login": "Login" } } (for 'en' locale)
 */
function transformMessages(unifiedMessages: Record<string, any>, locale: string): Record<string, any> {
    const result: Record<string, any> = {};

    for (const [flatKey, translations] of Object.entries(unifiedMessages)) {
        const value = (translations as Record<string, string>)[locale] ||
            (translations as Record<string, string>)['en'] ||
            flatKey;

        const keys = flatKey.split('.');
        let current = result;

        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in current)) {
                current[key] = {};
            }
            current = current[key];
        }

        current[keys[keys.length - 1]] = value;
    }

    return result;
}

/**
 * Load dictionary for a specific locale (Server-side only)
 * 
 * @example
 * const dict = await getDictionary('th');
 * const message = tFromDict(dict, 'auth.login');
 */
export async function getDictionary(locale: Locale): Promise<Record<string, any>> {
    const filePath = path.join(process.cwd(), 'locales', 'messages.json');

    try {
        const fileContents = fs.readFileSync(filePath, 'utf8');
        const unifiedMessages = JSON.parse(fileContents);
        return transformMessages(unifiedMessages, locale);
    } catch (error) {
        console.error(`Failed to load dictionary for locale ${locale}:`, error);
        return {};
    }
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Replace {param} placeholders in message with actual values
 */
function interpolate(message: string, params?: Record<string, string | number>): string {
    if (!params) return message;

    return Object.entries(params).reduce((result, [key, value]) => {
        return result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
    }, message);
}

/**
 * Translate a key using pre-loaded dictionary (Server-side only)
 * 
 * @param dict - Dictionary object from getDictionary()
 * @param key - Translation key in dot notation (e.g., 'auth.login')
 * @param params - Optional parameters for interpolation (e.g., {count: 5})
 * 
 * @example
 * const dict = await getDictionary('th');
 * const title = tFromDict(dict, 'platform.roles.title');
 * const message = tFromDict(dict, 'common.itemCount', { count: 5 });
 */
export function tFromDict(
    dict: Record<string, any>,
    key: string,
    params?: Record<string, string | number>
): string {
    const message = getNestedValue(dict, key);

    if (message === undefined) {
        console.warn(`Translation missing for key: ${key}`);
        return key;
    }

    return interpolate(message, params);
}
