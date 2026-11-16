/**
 * Converts scraped event date strings like "Tuesday Apr 15" or "Sat Apr 19"
 * into ISO 8601 format ("2026-04-15") required by schema.org Event.
 *
 * Rules:
 *  - Assumes current year.
 *  - If the resulting date is more than 1 day in the past, bumps to next year
 *    (handles Dec → Jan cross-year events).
 *  - Returns null if the string cannot be parsed.
 */
export function toISODate(dateStr: string): string | null {
    if (!dateStr) return null;

    // Match "Day MonthName DayNum" — e.g. "Tuesday Apr 15" or "Sat Apr 19"
    const match = dateStr.match(/[A-Za-z]+\s+([A-Za-z]+)\s+(\d{1,2})/);
    if (!match) return null;

    const [, monthStr, dayStr] = match;
    const year = new Date().getFullYear();
    const parsed = new Date(`${monthStr} ${dayStr}, ${year}`);

    if (isNaN(parsed.getTime())) return null;

    // If more than 1 day in the past, assume next year
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    if (parsed.getTime() < todayStart.getTime() - 24 * 60 * 60 * 1000) {
        parsed.setFullYear(year + 1);
    }

    // Return YYYY-MM-DD
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/**
 * Returns true if the ISO date string is within the next N days from today.
 */
export function isWithinDays(isoDate: string, days: number): boolean {
    const date = new Date(isoDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const limit = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
    return date >= today && date <= limit;
}
