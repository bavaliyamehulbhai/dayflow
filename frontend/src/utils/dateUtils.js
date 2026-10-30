import { format, isValid, parseISO } from 'date-fns';

/**
 * Safely creates a local Date object, parsing YYYY-MM-DD at local noon
 * to completely eliminate off-by-one timezone rollover bugs.
 * @param {Date|string|number} dateValue 
 * @returns {Date|null}
 */
export const safeNewDate = (dateValue) => {
  if (!dateValue) return null;
  
  try {
    if (typeof dateValue === 'string') {
      const trimmed = dateValue.trim();
      // Handle plain YYYY-MM-DD format: parse in local time at 12:00 (noon)
      // so it never rolls over to yesterday or tomorrow in any timezone (-12 to +14)
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        const [y, m, day] = trimmed.split('-').map(Number);
        return new Date(y, m - 1, day, 12, 0, 0);
      }
      const d = parseISO(trimmed);
      return isValid(d) ? d : null;
    }
    const d = new Date(dateValue);
    return isValid(d) ? d : null;
  } catch {
    return null;
  }
};

/**
 * Safely formats a date, returning a fallback if the date is invalid.
 * @param {Date|string|number} dateValue - The date to format
 * @param {string} formatStr - The format string (date-fns style)
 * @param {string} fallback - The string to return if the date is invalid (default: '—')
 * @returns {string}
 */
export const safeFormat = (dateValue, formatStr, fallback = '—') => {
  if (!dateValue) return fallback;
  
  try {
    const d = safeNewDate(dateValue);
    if (!d || !isValid(d)) return fallback;
    return format(d, formatStr);
  } catch (err) {
    console.warn('Date formatting error:', err);
    return fallback;
  }
};

/**
 * Returns a 'YYYY-MM-DD' string for the given date, accounting for local timezone.
 * Useful for sync between UI and API without "off-by-one" day errors.
 * @param {Date|string|number} dateValue 
 * @returns {string}
 */
export const safeToLocalISO = (dateValue) => {
  if (typeof dateValue === 'string') {
    const trimmed = dateValue.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
  }
  const d = safeNewDate(dateValue) || new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
