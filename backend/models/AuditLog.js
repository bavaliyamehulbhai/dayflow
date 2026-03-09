const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: [
            'LOGIN_SUCCESS',
            'LOGIN_FAILED',
            'LOGOUT',
            'PASSWORD_CHANGE',
            '2FA_ENABLE',
            '2FA_DISABLE',
            'ACCOUNT_DELETE_INITIATED',
            'DATA_EXPORT',
            'AVATAR_UPDATE'
        ]
    },
    status: {
        type: String,
        enum: ['success', 'failure'],
        default: 'success'
    },
    ip: String,
    userAgent: String,
    details: mongoose.Schema.Types.Mixed,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// TTL index to keep logs for 90 days
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
