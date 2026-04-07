import { format, isValid, parseISO } from 'date-fns';

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
    const d = typeof dateValue === 'string' ? parseISO(dateValue) : new Date(dateValue);
    if (!isValid(d)) return fallback;
    return format(d, formatStr);
  } catch (err) {
    console.error('Date formatting error:', err);
    return fallback;
  }
};

/**
 * Safely creates a Date object, fallback to null if invalid.
 * @param {Date|string|number} dateValue 
 * @returns {Date|null}
 */
export const safeNewDate = (dateValue) => {
  if (!dateValue) return null;
  
  try {
    // If it's a string, try parseISO first for consistency
    const d = typeof dateValue === 'string' ? parseISO(dateValue) : new Date(dateValue);
    return isValid(d) ? d : null;
  } catch {
    return null;
  }
};

/**
 * Returns a 'YYYY-MM-DD' string for the given date, accounting for local timezone.
 * Useful for sync between UI and API without "off-by-one" day errors.
 * @param {Date|string|number} dateValue 
 * @returns {string}
 */
export const safeToLocalISO = (dateValue) => {
  const d = safeNewDate(dateValue) || new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
