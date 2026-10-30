const Activity = require('../models/Activity');

/**
 * Update daily activity log for a user
 * @param {string} userId - User ID
 * @param {object} updates - Object containing fields to increment (e.g. { tasksCompleted: 1 })
 */
const logActivity = async (userId, updates, clientDate) => {
    try {
        const today = (typeof clientDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(clientDate)) ? clientDate : new Date().toISOString().split('T')[0];

        // Using findOne + save instead of findOneAndUpdate to trigger the 'save' middleware for intensity calculation
        let activity = await Activity.findOne({ user: userId, date: today });

        if (!activity) {
            activity = new Activity({ user: userId, date: today });
        }
        
        // Apply updates if any, ensuring no negative counters
        if (updates && Object.keys(updates).length > 0) {
            Object.keys(updates).forEach(key => {
                activity[key] = Math.max(0, (activity[key] || 0) + updates[key]);
            });
        }

        // --- LEETCODE-STYLE EXECUTION LOGIC ---
        // A day ONLY counts as active if at least one actual work item is completed:
        // (Task completed, Habit ritual completed, Pomodoro focus session completed, or Schedule event completed)
        const totalCompletedWork = (activity.tasksCompleted || 0) +
            (activity.habitsCompleted || 0) +
            (activity.pomodoros || 0) +
            (activity.scheduleEventsCompleted || 0);

        if (totalCompletedWork === 0) {
            // No work completed today -> Day remains completely inert
            activity.score = 0;
            activity.intensity = 0;
        } else {
            // Calculate score when actual work was completed
            const score = (activity.tasksCompleted * 3) +
                (activity.pomodoros * 2) +
                (Math.floor(activity.focusMinutes / 25) * 1) +
                (activity.habitsCompleted * 2) +
                (activity.scheduleEventsCompleted * 1.5) +
                ((activity.notesCreated || 0) * 0.5);

            activity.score = score;

            // Discrete intensity levels based on work volume
            if (totalCompletedWork === 1) {
                activity.intensity = 1;
            } else if (totalCompletedWork <= 3) {
                activity.intensity = 2;
            } else if (totalCompletedWork <= 6) {
                activity.intensity = 3;
            } else {
                activity.intensity = 4;
            }
        }

        await activity.save();
        return activity;
    } catch (err) {
        console.error('Error logging activity:', err);
        // Fail silently in production to avoid crashing routes for background logging
    }
};

module.exports = { logActivity };
