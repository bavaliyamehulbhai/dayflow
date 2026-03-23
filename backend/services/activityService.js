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
            activity = new Activity({ user: userId, date: today });
        }
        
        // Apply updates if any
        if (updates && Object.keys(updates).length > 0) {
            Object.keys(updates).forEach(key => {
                activity[key] = (activity[key] || 0) + updates[key];
            });
        }

        // --- RELATIVE INTENSITY CALCULATION ---
        // 1. Calculate the raw score for today (End-To-End)
        const score = (activity.tasksCompleted * 3) + // Tasks are highly prioritized
            (Math.floor(activity.focusMinutes / 25) * 2) + // Focus sessions
            (activity.habitsCompleted * 2) + // Consistency
            (activity.notesCreated * 1) + // Knowledge base expansion
            (activity.scheduleEventsCompleted * 1.5); // Planning

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

        if (recentLogs.length < 3) { // Reduced threshold for new users to see progress faster
            // Fallback to fixed thresholds for new users
            if (score === 0) activity.intensity = 0;
            else if (score < 4) activity.intensity = 1;
            else if (score < 8) activity.intensity = 2;
            else if (score < 12) activity.intensity = 3;
            else activity.intensity = 4;
        } else {
            // Calculate personal percentiles (Z-Score like approach)
            const scores = recentLogs.map(l => l.score).sort((a, b) => a - b);
            const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

            // Relative Scaling logic:
            if (score === 0) activity.intensity = 0;
            else if (score < avg * 0.6) activity.intensity = 1;
            else if (score < avg * 1.1) activity.intensity = 2;
            else if (score < avg * 1.6) activity.intensity = 3;
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
