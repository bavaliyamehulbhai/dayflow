/**
 * Safely extracts a string ID from various Mongoose/MongoDB data shapes.
 * Handles:
 * - Raw string ID
 * - { _id: "..." }
 * - { _id: { $oid: "..." } } (Raw MongoDB JSON)
 * - { id: "..." }
 * - Fallback to index-based keys if all else fails
 * 
 * @param {Object|string} item - The object or ID to extract from
 * @param {number|string} fallbackIndex - Optional fallback index/string
 * @returns {string}
 */
export const getSafeId = (item, fallbackIndex = 'id') => {
  if (!item) return String(fallbackIndex);
  
  // If item itself is a string/number and not an object string
  if (typeof item === 'string' && item !== '[object Object]') return item;
  if (typeof item === 'number') return String(item);

  // Check _id
  if (item._id) {
    if (typeof item._id === 'string' && item._id !== '[object Object]') return item._id;
    if (typeof item._id === 'object' && item._id.$oid) return String(item._id.$oid);
    const strId = String(item._id);
    if (strId !== '[object Object]') return strId;
  }

  // Check id
  if (item.id) return String(item.id);

  // Check type (for dashboard widgets)
  if (item.type) return String(item.type);

  return String(fallbackIndex);
};
