const Activity = require('../models/Activity');
const Task = require('../models/Task');
const Habit = require('../models/Habit');

/**
 * Generate heuristic-based productivity insights
 * @param {string} userId 
 */
const getCoachInsights = async (userId) => {
    // 1. Fetch recent activity (last 14 days)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const startDateStr = fourteenDaysAgo.toISOString().split('T')[0];

    const logs = await Activity.find({
        user: userId,
        date: { $gte: startDateStr }
    }).sort({ date: -1 }).lean();

    const [tasks, habits] = await Promise.all([
        Task.find({ user: userId, status: { $ne: 'completed' } }).lean(),
        Habit.find({ user: userId, isActive: true }).lean()
    ]);

    const insights = [];

    // --- HEURISTIC 1: STREAK ANALYSIS ---
    const recentActivity = logs.slice(0, 3);
    const activeRecent = recentActivity.filter(l => l.score > 0).length;

    if (activeRecent === 0 && logs.length > 0) {
        insights.push({
            type: 'motivation',
            title: 'Ready to restart?',
            message: "You haven't logged activity in a few days. Small steps count—how about completing just one task today?",
            priority: 'high'
        });
    } else if (activeRecent === 3) {
        insights.push({
            type: 'praise',
            title: 'Unstoppable Momentum!',
            message: "3-day streak! Your consistency is impressive. Keep this energy going.",
            priority: 'medium'
        });
    }

    // --- HEURISTIC 2: FOCUS VS QUANTITY ---
    const totalFocus = logs.reduce((acc, l) => acc + (l.focusMinutes || 0), 0);
    const totalTasks = logs.reduce((acc, l) => acc + (l.tasksCompleted || 0), 0);

    if (totalFocus > 0 && totalTasks / (totalFocus / 60 || 1) > 10) {
        insights.push({
            type: 'advice',
            title: 'Deep Work Opportunity',
            message: "You're knocking out many tasks, but focus sessions are low. Try a Pomodoro for your next big challenge.",
            priority: 'medium'
        });
    }

    // --- HEURISTIC 3: TASK OVERLOAD ---
    const now = new Date();
    const overdueCount = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now).length;
    if (overdueCount > 3) {
        insights.push({
            type: 'warning',
            title: 'Task Overload',
            message: `You have ${overdueCount} overdue tasks. Consider rescheduling some to avoid burnout and maintain clarity.`,
            priority: 'high'
        });
    }

    // --- HEURISTIC 4: HABIT CONSISTENCY ---
    // Only flag habits that the user has shown commitment to (at least 5 completions)
    // but hasn't completed in the last 2 days.
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    const inconsistentHabits = habits.filter(h => {
        const lastCompletion = h.completions?.length > 0 
            ? new Date(h.completions[h.completions.length - 1].date) 
            : null;
        return h.completions?.length >= 5 && (!lastCompletion || lastCompletion < twoDaysAgo);
    });

    if (inconsistentHabits.length > 0) {
        insights.push({
            type: 'habit',
            title: 'Ritual Recovery',
            message: `Your ritual "${inconsistentHabits[0].name}" has lost its rhythm. Small actions today can restore your momentum.`,
            priority: 'medium'
        });
    }

    // Default insight if empty
    if (insights.length === 0) {
        insights.push({
            type: 'general',
            title: 'Keep it up!',
            message: "Your productivity profile looks balanced. Focus on your most important 'High Priority' tasks today.",
            priority: 'low'
        });
    }

    return insights.sort((a, b) => {
        const p = { high: 3, medium: 2, low: 1 };
        return p[b.priority] - p[a.priority];
    });
};

module.exports = { getCoachInsights };
