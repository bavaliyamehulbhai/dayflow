const mongoose = require('mongoose');

const blacklistSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        index: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 } // TTL index for automatic deletion
    }
}, { timestamps: true });

module.exports = mongoose.model('Blacklist', blacklistSchema);
