/**
 * ═══════════════════════════════════════════════════════════════════════════
 * APICOREDATA — Date & Time Formatter
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Single Source of Truth for date/time formatting across:
 * - Login Screen
 * - Lock Screen
 * - Unlock Screen
 * - Any future datetime displays
 * 
 * PHASE 7.8: Custom format implementation
 * 
 * @version 1.0.0
 * @date 2026-01-29
 */

// ═══════════════════════════════════════════════════════════════════════════
// WEEKDAY MAPPINGS
// ═══════════════════════════════════════════════════════════════════════════

/** English weekday abbreviations (Sun = 0, Sat = 6) */
const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

/** Thai weekday names - full with วัน prefix (Sun = 0, Sat = 6) */
const WEEKDAYS_TH = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัส', 'วันศุกร์', 'วันเสาร์'] as const;

// ═══════════════════════════════════════════════════════════════════════════
// MONTH MAPPINGS
// ═══════════════════════════════════════════════════════════════════════════

/** English month names (Jan = 0, Dec = 11) */
const MONTHS_EN = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
] as const;

/** Thai month names (Jan = 0, Dec = 11) */
const MONTHS_TH = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
] as const;

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type SupportedLocale = 'en' | 'th';

export interface FormattedDateTime {
    /** Formatted date string */
    date: string;
    /** Formatted time string (24h, HH:mm) */
    time: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// FORMAT FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Format time in 24-hour format (HH:mm)
 * @param date - Date object to format
 * @returns Time string like "20:19"
 */
export function formatTime24h(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

/**
 * Format date according to locale
 * 
 * EN: "Thu, 29 January 2026"
 * TH: "วันพฤหัส, 29 มกราคม 2569" (Buddhist Era with วัน prefix)
 * 
 * @param date - Date object to format
 * @param locale - 'en' or 'th'
 * @returns Formatted date string
 */
export function formatDate(date: Date, locale: SupportedLocale): string {
    const dayOfWeek = date.getDay(); // 0 = Sunday
    const dayOfMonth = date.getDate();
    const month = date.getMonth(); // 0 = January
    const year = date.getFullYear();

    if (locale === 'th') {
        // Thai: วันพฤหัส, 29 มกราคม 2569
        const weekday = WEEKDAYS_TH[dayOfWeek];
        const monthName = MONTHS_TH[month];
        const buddhistYear = year + 543; // Convert to Buddhist Era
        return `${weekday}, ${dayOfMonth} ${monthName} ${buddhistYear}`;
    } else {
        // English: Thu, 29 January 2026
        const weekday = WEEKDAYS_EN[dayOfWeek];
        const monthName = MONTHS_EN[month];
        return `${weekday}, ${dayOfMonth} ${monthName} ${year}`;
    }
}

/**
 * Get both formatted date and time
 * 
 * @param date - Date object to format
 * @param locale - 'en' or 'th'
 * @returns Object with date and time strings
 */
export function formatDateTime(date: Date, locale: SupportedLocale): FormattedDateTime {
    return {
        date: formatDate(date, locale),
        time: formatTime24h(date),
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export {
    WEEKDAYS_EN,
    WEEKDAYS_TH,
    MONTHS_EN,
    MONTHS_TH,
};

export default formatDateTime;
