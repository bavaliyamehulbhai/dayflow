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
    if (typeof item._id === 'object') {
      // Handle { buffer: {...}, _id: "hexstring" } shape (server.js toPOJO artifact)
      if (item._id._id && typeof item._id._id === 'string') return item._id._id;
      // Handle { $oid: "hexstring" } shape (raw MongoDB JSON)
      if (item._id.$oid) return String(item._id.$oid);
      // Handle { type: 'Buffer', data: [...] } shape (JSON-serialized Buffer)
      if (item._id.type === 'Buffer' && Array.isArray(item._id.data)) {
        return item._id.data.map(b => b.toString(16).padStart(2, '0')).join('');
      }
      // Handle { buffer: { 0: n, 1: n, ... } } numeric-keyed buffer
      if (item._id.buffer && typeof item._id.buffer === 'object') {
        const buf = item._id.buffer;
        const bytes = Object.keys(buf).sort((a,b) => Number(a)-Number(b)).map(k => buf[k]);
        if (bytes.length === 12) return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
      }
    }
    const strId = String(item._id);
    if (strId !== '[object Object]') return strId;
  }

  // Check id
  if (item.id) return String(item.id);

  // Check type (for dashboard widgets)
  if (item.type) return String(item.type);

  return String(fallbackIndex);
};
