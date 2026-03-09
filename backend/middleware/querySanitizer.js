/**
 * Middleware to recursively sanitize NoSQL injection operators ($) from 
 * req.body, req.query, and req.params.
 * This provides a "Defense in Depth" layer on top of express-mongo-sanitize.
 */
const sanitizeObject = (obj) => {
    if (obj instanceof Object) {
        for (const key in obj) {
            if (key.startsWith('$')) {
                delete obj[key];
            } else {
                sanitizeObject(obj[key]);
            }
        }
    }
};

const querySanitizer = (req, res, next) => {
    if (req.body) sanitizeObject(req.body);
    if (req.query) sanitizeObject(req.query);
    if (req.params) sanitizeObject(req.params);
    next();
};

module.exports = querySanitizer;
