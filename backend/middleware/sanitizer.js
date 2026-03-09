const xss = require('xss');

/**
 * Middleware to sanitize specified fields in req.body using xss
 * @param {string[]} fields - Array of field names to sanitize
 */
const sanitizeFields = (fields) => {
    return (req, res, next) => {
        if (req.body) {
            fields.forEach(field => {
                if (req.body[field] && typeof req.body[field] === 'string') {
                    req.body[field] = xss(req.body[field]);
                }
            });
        }
        next();
    };
};

module.exports = { sanitizeFields };
