const AuditLog = require('../models/AuditLog');

/**
 * Log a security event to the AuditLog collection
 * @param {Object} options - Log options
 * @param {String} options.userId - ID of the user performing the action
 * @param {String} options.action - The action being performed (from AuditLog enum)
 * @param {String} [options.status='success'] - Status of the action
 * @param {Object} [options.req] - Express request object to extract IP and UA
 * @param {Object} [options.details] - Additional JSON metadata
 */
const logSecurityEvent = async ({ userId, action, status = 'success', req, details }) => {
    try {
        const logData = {
            user: userId,
            action,
            status,
            details
        };

        if (req) {
            logData.ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
            logData.userAgent = req.headers['user-agent'];
        }

        await AuditLog.create(logData);
    } catch (err) {
        // Fail silently in production to avoid crashing on log errors, 
        // but log to console in dev
        if (process.env.NODE_ENV === 'development') {
            console.error('Audit Log Error:', err);
        }
    }
};

module.exports = logSecurityEvent;
