const Activity = require('../models/Activity');

/**
 * Update daily activity log for a user
 * @param {string} userId - User ID
 * @param {object} updates - Object containing fields to increment (e.g. { tasksCompleted: 1 })
 */
const logActivity = async (userId, updates) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Using findOne + save instead of findOneAndUpdate to trigger the 'save' middleware for intensity calculation
        let activity = await Activity.findOne({ user: userId, date: today });

        if (!activity) {
            activity = new Activity({ user: userId, date: today, ...updates });
        } else {
            Object.keys(updates).forEach(key => {
                activity[key] = (activity[key] || 0) + updates[key];
            });
        }

        // --- RELATIVE INTENSITY CALCULATION ---
        // 1. Calculate the raw score for today
        const score = (activity.tasksCompleted * 2) +
            (Math.floor(activity.focusMinutes / 25)) +
            (activity.habitsCompleted * 1.5) +
            (activity.notesCreated * 1) +
            (activity.scheduleEventsCompleted * 1.5);

        activity.score = score;

        // 2. Fetch last 90 days to find personal baseline
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        const startDateStr = ninetyDaysAgo.toISOString().split('T')[0];

        const recentLogs = await Activity.find({
            user: userId,
            date: { $gte: startDateStr, $lt: today },
            score: { $gt: 0 } // Only compare against active days
        }).select('score').lean();

        if (recentLogs.length < 5) {
            // Fallback to fixed thresholds for new users
            if (score === 0) activity.intensity = 0;
            else if (score < 3) activity.intensity = 1;
            else if (score < 6) activity.intensity = 2;
            else if (score < 10) activity.intensity = 3;
            else activity.intensity = 4;
        } else {
            // Calculate personal percentiles
            const scores = recentLogs.map(l => l.score).sort((a, b) => a - b);
            const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

            // Relative Scaling logic:
            if (score === 0) activity.intensity = 0;
            else if (score < avg * 0.5) activity.intensity = 1;
            else if (score < avg) activity.intensity = 2;
            else if (score < avg * 1.5) activity.intensity = 3;
            else activity.intensity = 4;
        }

        await activity.save();
        return activity;
    } catch (err) {
        console.error('Error logging activity:', err);
        // Fail silently in production to avoid crashing routes for background logging
    }
};

module.exports = { logActivity };
