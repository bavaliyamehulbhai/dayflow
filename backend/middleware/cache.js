const NodeCache = require('node-cache');

// Initialize cache: 60 seconds default TTL, check every 120 seconds
const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

/**
 * Cache middleware for Express routes.
 * @param {number} duration - Cache duration in seconds (optional)
 */
const cacheMiddleware = (duration) => (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
        return next();
    }

    // Skip cache for auth-sensitive routes or explicit skip header
    if (req.headers['x-skip-cache'] || req.url.includes('/auth/me')) {
        return next();
    }

    // Create a unique key per user + URL
    const userId = req.user ? req.user._id : 'guest';
    const key = `__cache__${userId}__${req.originalUrl || req.url}`;
    
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[CACHE HIT] ${key}`);
        }
        return res.json(cachedResponse);
    } else {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[CACHE MISS] ${key}`);
        }
        // Intercept res.json to store the result in cache
        res.originalJson = res.json;
        res.json = (body) => {
            // Only cache if the status code is success (2xx or 3xx)
            if (res.statusCode >= 400) {
                return res.originalJson(body);
            }

            // Ensure we cache a cleanly serialized JSON object
            // This prevents node-cache deep clone from stripping ObjectId/Date prototypes
            // which causes them to become plain objects and stringify as [object Object] on cache hit
            let cacheBody = body;
            
            try {
                if (body) {
                    cacheBody = JSON.parse(JSON.stringify(body));
                }
            } catch (err) {
                // Squelch conversion errors only if they're harmless, otherwise log for dev
                if (process.env.NODE_ENV === 'development') {
                    console.warn('[CACHE] Document conversion warning:', err.message);
                }
            }

            cache.set(key, cacheBody, duration || 60);
            res.originalJson(body);
        };
        next();
    }
};

/**
 * Clear cache for a specific user or global
 * @param {string} userId - User ID to clear cache for
 */
const clearCache = (userId) => {
    const keys = cache.keys();
    const prefix = userId ? `__cache__${String(userId)}__` : `__cache__`;
    const keysToRemove = keys.filter(k => k.startsWith(prefix));
    
    if (keysToRemove.length > 0) {
        cache.del(keysToRemove);
        if (process.env.NODE_ENV === 'development') {
            console.log(`[CACHE CLEAR] Removed ${keysToRemove.length} keys for prefix: ${prefix}`);
        }
    }
};

module.exports = { cacheMiddleware, clearCache };
