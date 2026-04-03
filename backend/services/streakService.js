const User = require('../models/User');

/**
 * Update user streak based on activity
 * @param {string} userId - User ID
 */
const updateStreak = async (userId) => {
    try {
        const user = await User.findById(userId).select('stats');
        if (!user) return;

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const lastActive = user.stats.lastActiveDate 
            ? new Date(user.stats.lastActiveDate.getFullYear(), user.stats.lastActiveDate.getMonth(), user.stats.lastActiveDate.getDate())
            : null;

        if (!lastActive) {
            // First activity ever
            user.stats.currentStreak = 1;
            user.stats.lastActiveDate = now;
        } else {
            const diffTime = today - lastActive;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 0) {
                // Already active today, do nothing to streak count
                user.stats.lastActiveDate = now;
            } else if (diffDays === 1) {
                // Active yesterday, increment streak
                user.stats.currentStreak += 1;
                user.stats.lastActiveDate = now;
                if (user.stats.currentStreak > user.stats.longestStreak) {
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
