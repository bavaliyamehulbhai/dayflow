// ─────────────────────────────────────────────────────────────────────────────
// services/badgeService.js
// Central badge definitions + award logic. Called after mutations.
// ─────────────────────────────────────────────────────────────────────────────

const User = require('../models/User');
const Task = require('../models/Task');
const Habit = require('../models/Habit');
const Note = require('../models/Note');
const Schedule = require('../models/Schedule');

// ── Badge Definitions ────────────────────────────────────────────────────────
const BADGE_DEFS = [
    // Bronze
    {
        id: 'first_task',
        name: 'First Step',
        description: 'Complete your very first task',
        icon: '🎯',
        tier: 'bronze',
        check: async (user, counts) => counts.tasksCompleted >= 1
    },
    {
        id: 'first_pomo',
        name: 'Tomato Timer',
        description: 'Complete your first Pomodoro session',
        icon: '🍅',
        tier: 'bronze',
        check: async (user, counts) => (user.stats?.totalPomodoros || 0) >= 1
    },
    {
        id: 'first_habit',
        name: 'Habit Seed',
        description: 'Create and complete your first habit',
        icon: '🌱',
        tier: 'bronze',
        check: async (user, counts) => counts.habitsCreated >= 1
    },
    {
        id: 'first_note',
        name: 'Scribe',
        description: 'Write your first note',
        icon: '📝',
        tier: 'bronze',
        check: async (user, counts) => counts.notesCreated >= 1
    },
    // Silver
    {
        id: 'tasks_10',
        name: 'Momentum',
        description: 'Complete 10 tasks',
        icon: '⚡',
        tier: 'silver',
        check: async (user, counts) => counts.tasksCompleted >= 10
    },
    {
        id: 'streak_3',
        name: 'Streak Seeker',
        description: 'Maintain a 3-day productivity streak',
        icon: '🔥',
        tier: 'silver',
        check: async (user, counts) => (user.stats?.currentStreak || 0) >= 3
    },
    {
        id: 'focus_60',
        name: 'Flow State',
        description: 'Log 1 hour of focused work',
        icon: '⏱',
        tier: 'silver',
        check: async (user, counts) => (user.stats?.totalFocusMinutes || 0) >= 60
    },
    {
        id: 'planner_5',
        name: 'Day Architect',
        description: 'Create 5 schedule events',
        icon: '📅',
        tier: 'silver',
        check: async (user, counts) => counts.eventsCreated >= 5
    },
    // Gold
    {
        id: 'tasks_100',
        name: 'Centurion',
        description: 'Complete 100 tasks',
        icon: '💯',
        tier: 'gold',
        check: async (user, counts) => counts.tasksCompleted >= 100
    },
    {
        id: 'pomo_10',
        name: 'Sprint Legend',
        description: 'Complete 10 Pomodoro sessions',
        icon: '🏃',
        tier: 'gold',
        check: async (user, counts) => (user.stats?.totalPomodoros || 0) >= 10
    },
    {
        id: 'focus_600',
        name: 'Focus Oracle',
        description: 'Log 10 hours of focused work',
        icon: '🔮',
        tier: 'gold',
        check: async (user, counts) => (user.stats?.totalFocusMinutes || 0) >= 600
    },
    {
        id: 'streak_7',
        name: 'Flame Keeper',
        description: 'Maintain a 7-day productivity streak',
        icon: '⚔️',
        tier: 'gold',
        check: async (user, counts) => (user.stats?.currentStreak || 0) >= 7
    },
    {
        id: 'streak_14',
        name: 'Momentum Master',
        description: 'Maintain a 14-day productivity streak',
        icon: '☄️',
        tier: 'gold',
        check: async (user, counts) => (user.stats?.currentStreak || 0) >= 14
    },
    // Platinum
    {
        id: 'tasks_500',
        name: 'Legend',
        description: 'Complete 500 tasks — a true legend',
        icon: '👑',
        tier: 'platinum',
        check: async (user, counts) => counts.tasksCompleted >= 500
    },
    {
        id: 'focus_3000',
        name: 'Flow God',
        description: 'Log 50 hours of focused work',
        icon: '🧘',
        tier: 'platinum',
        check: async (user, counts) => (user.stats?.totalFocusMinutes || 0) >= 3000
    },
    {
        id: 'streak_30',
        name: 'Unstoppable',
        description: 'Maintain a 30-day productivity streak',
        icon: '🛡️',
        tier: 'platinum',
        check: async (user, counts) => (user.stats?.currentStreak || 0) >= 30
    },
    {
        id: 'streak_100',
        name: 'Productivity Titan',
        description: 'Maintain a 100-day productivity streak',
        icon: '🪐',
        tier: 'platinum',
        check: async (user, counts) => (user.stats?.currentStreak || 0) >= 100
    },
    {
        id: 'total_mastery',
        name: 'Total Mastery',
        description: 'Earn all other badges',
        icon: '🌟',
        tier: 'platinum',
        check: async (user, counts) => {
            const allOtherIds = BADGE_DEFS.filter(b => b.id !== 'total_mastery').map(b => b.id);
            const earnedIds = (user.badges || []).map(b => b.id);
            return allOtherIds.every(id => earnedIds.includes(id));
        }
    },
];

// ── Award Helper ─────────────────────────────────────────────────────────────

/**
 * Check all badges for a given user and award any newly earned ones.
 * Returns an array of newly awarded badge objects (empty if none).
 */
async function awardBadges(userId) {
    try {
        const user = await User.findById(userId).select('+badges +stats');
        if (!user) return [];

        // Pre-fetch counts in parallel to avoid multiple queries per badge
        const [tasksCompleted, habitsCreated, notesCreated, eventsCreated] = await Promise.all([
            Task.countDocuments({ user: userId, status: 'completed' }),
            Habit.countDocuments({ user: userId }),
            Note.countDocuments({ user: userId }),
            Schedule.countDocuments({ user: userId }).catch(() => 0),
        ]);

        const counts = { tasksCompleted, habitsCreated, notesCreated, eventsCreated };
        const earnedIds = new Set((user.badges || []).map(b => b.id));
        const newBadges = [];

        for (const def of BADGE_DEFS) {
            if (earnedIds.has(def.id)) continue; // already earned
            try {
                const qualifies = await def.check(user, counts);
                if (qualifies) {
                    const badge = {
                        id: def.id,
                        name: def.name,
                        description: def.description,
                        icon: def.icon,
                        tier: def.tier,
                        earnedAt: new Date()
                    };
                    newBadges.push(badge);
                    earnedIds.add(def.id); // so total_mastery check below sees it
                }
            } catch (_) { /* skip on error */ }
        }

        if (newBadges.length > 0) {
            await User.findByIdAndUpdate(userId, { $push: { badges: { $each: newBadges } } });
        }

        return newBadges;
    } catch (err) {
        console.error('Badge award error:', err.message);
        return [];
    }
}

module.exports = { BADGE_DEFS, awardBadges };
