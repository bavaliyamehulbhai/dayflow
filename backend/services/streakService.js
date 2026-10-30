const User = require('../models/User');

/**
 * Update user streak based on activity
 * @param {string} userId - User ID
 * @param {string} [clientDate] - Optional client local date (YYYY-MM-DD)
 */
const updateStreak = async (userId, clientDate) => {
    try {
        const user = await User.findById(userId).select('stats');
        if (!user) return;

        let today;
        if (typeof clientDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(clientDate)) {
            const [y, m, d] = clientDate.split('-').map(Number);
            today = new Date(y, m - 1, d, 12, 0, 0);
        } else {
            const now = new Date();
            today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
        }

        const now = new Date();
        const lastActive = user.stats.lastActiveDate 
            ? new Date(user.stats.lastActiveDate.getFullYear(), user.stats.lastActiveDate.getMonth(), user.stats.lastActiveDate.getDate(), 12, 0, 0)
            : null;

        if (!lastActive) {
            // First activity ever
            user.stats.currentStreak = 1;
            user.stats.lastActiveDate = now;
        } else {
            const diffTime = today - lastActive;
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays <= 0) {
                // Already active today, just refresh timestamp
                user.stats.lastActiveDate = now;
            } else if (diffDays === 1) {
                // Active consecutive day, increment streak
                user.stats.currentStreak += 1;
                user.stats.lastActiveDate = now;
                if (user.stats.currentStreak > (user.stats.longestStreak || 0)) {
                    user.stats.longestStreak = user.stats.currentStreak;
                }
            } else {
                // Missed at least one day, reset streak
                user.stats.currentStreak = 1;
                user.stats.lastActiveDate = now;
            }
        }

        await user.save();
        return user.stats.currentStreak;
    } catch (err) {
        console.error('Streak Update Error:', err);
        return 0;
    }
};

module.exports = { updateStreak };
