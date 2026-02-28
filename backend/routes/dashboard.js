const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Habit = require('../models/Habit');
const Schedule = require('../models/Schedule');
const Pomodoro = require('../models/Pomodoro');
const Note = require('../models/Note');
const User = require('../models/User');
const Activity = require('../models/Activity');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET complete dashboard summary
router.get('/', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

    const [
      user,
      taskStats,
      todayTasks,
      overdueTasks,
      todayEvents,
      activeHabits,
      todayPomos,
      recentNotes
    ] = await Promise.all([
      User.findById(req.user._id).select('name stats preferences'),
      // Task stats
      Task.aggregate([
        { $match: { user: req.user._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      // Today's tasks (due today or no due date)
      Task.find({
        user: req.user._id,
        status: { $in: ['pending', 'in-progress'] },
        $or: [
          { dueDate: { $gte: todayStart, $lte: todayEnd } },
          { dueDate: null }
        ]
      }).sort({ priority: -1 }).limit(5).lean(),
      // Overdue tasks
      Task.countDocuments({
        user: req.user._id,
        status: { $nin: ['completed', 'cancelled'] },
        dueDate: { $lt: todayStart }
      }),
      // Today's events
      Schedule.find({ user: req.user._id, date: today }).sort({ startTime: 1 }).lean(),
      // Active habits
      Habit.find({ user: req.user._id, isActive: true }).lean(),
      // Today's pomodoros
      Pomodoro.find({ user: req.user._id, date: today, completed: true, type: 'work' }).lean(),
      // Recent notes
      Note.find({ user: req.user._id, isArchived: false }).sort({ updatedAt: -1 }).limit(3).select('title updatedAt color').lean()
    ]);

    // Process task stats
    const taskSummary = { pending: 0, 'in-progress': 0, completed: 0, cancelled: 0, total: 0 };
    taskStats.forEach(s => {
      taskSummary[s._id] = s.count;
      taskSummary.total += s.count;
    });

    // Process habits
    const habitSummary = activeHabits.map(h => ({
      _id: h._id,
      name: h.name,
      color: h.color,
      icon: h.icon,
      streak: h.streak,
      completedToday: h.completions.some(c => c.date === today)
    }));
    const habitsCompleted = habitSummary.filter(h => h.completedToday).length;

    // Focus stats
    const focusMinutesToday = todayPomos.reduce((acc, p) => acc + Math.floor((p.actualDuration || p.duration * 60) / 60), 0);

    // 7-day activity (for chart)
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      last7.push(d.toISOString().split('T')[0]);
    }

    const weekPomos = await Pomodoro.aggregate([
      { $match: { user: req.user._id, completed: true, type: 'work', date: { $in: last7 } } },
      { $group: { _id: '$date', count: { $sum: 1 }, minutes: { $sum: { $divide: ['$actualDuration', 60] } } } }
    ]);

    const weekCompletedTasks = await Task.aggregate([
      { $match: { user: req.user._id, status: 'completed', completedAt: { $gte: new Date(Date.now() - 7 * 86400000) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } }, count: { $sum: 1 } } }
    ]);

    const weekData = last7.map(date => {
      const pomo = weekPomos.find(p => p._id === date);
      const tasks = weekCompletedTasks.find(t => t._id === date);
      return { date, pomos: pomo?.count || 0, minutes: Math.round(pomo?.minutes || 0), tasksCompleted: tasks?.count || 0 };
    });

    res.json({
      success: true,
      dashboard: {
        user: { name: user.name, stats: user.stats, preferences: user.preferences },
        tasks: { summary: taskSummary, today: todayTasks, overdue: overdueTasks },
        schedule: { today: todayEvents },
        habits: { list: habitSummary, total: activeHabits.length, completedToday: habitsCompleted },
        pomodoro: { todayCount: todayPomos.length, todayMinutes: focusMinutesToday },
        notes: { recent: recentNotes },
        weekActivity: weekData
      }
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Error fetching dashboard.' });
  }
});

// GET 12-month activity data with advanced analytics
router.get('/activity/12m', async (req, res) => {
  try {
    const months = 12;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setHours(0, 0, 0, 0);
    const startDateStr = startDate.toISOString().split('T')[0];

    const logs = await Activity.find({
      user: req.user._id,
      date: { $gte: startDateStr }
    }).sort({ date: 1 }).lean();

    // --- GROWTH ANALYTICS ---
    const today = new Date();
    const sevenDaysAgo = new Date(today); sevenDaysAgo.setDate(today.getDate() - 7);
    const fourteenDaysAgo = new Date(today); fourteenDaysAgo.setDate(today.getDate() - 14);

    const currentWeekScore = logs
      .filter(l => new Date(l.date) >= sevenDaysAgo)
      .reduce((acc, l) => acc + (l.score || 0), 0);

    const lastWeekScore = logs
      .filter(l => {
        const d = new Date(l.date);
        return d >= fourteenDaysAgo && d < sevenDaysAgo;
      })
      .reduce((acc, l) => acc + (l.score || 0), 0);

    const growth = lastWeekScore > 0
      ? Math.round(((currentWeekScore - lastWeekScore) / lastWeekScore) * 100)
      : (currentWeekScore > 0 ? 100 : 0);

    // --- MILESTONES & RECORDS ---
    const activeDays = logs.filter(l => (l.score || 0) > 0);
    const personalBestSingleDay = activeDays.length > 0
      ? Math.max(...activeDays.map(l => l.score))
      : 0;

    // Highest Intensity Streak logic already in ProfilePage but lets send Record data
    const sortedLogs = [...logs].sort((a, b) => a.date.localeCompare(b.date));
    let maxStreak = 0;
    let currentStreak = 0;
    let lastDate = null;

    sortedLogs.forEach(log => {
      if (log.score > 0) {
        if (!lastDate) { currentStreak = 1; }
        else {
          const diff = (new Date(log.date) - new Date(lastDate)) / 86400000;
          if (diff <= 1.1) currentStreak++;
          else currentStreak = 1;
        }
        maxStreak = Math.max(maxStreak, currentStreak);
        lastDate = log.date;
      }
    });

    res.json({
      success: true,
      logs,
      analytics: {
        growth,
        currentWeekScore,
        lastWeekScore,
        records: {
          maxStreak,
          personalBestSingleDay
        },
        predictions: {
          nextStreakMilestone: Math.ceil((maxStreak + 1) / 5) * 5,
          daysToNextMilestone: Math.max(0, (Math.ceil((maxStreak + 1) / 5) * 5) - currentStreak)
        }
      }
    });
  } catch (err) {
    console.error('Activity 12m error:', err);
    res.status(500).json({ error: 'Error fetching activity analytics.' });
  }
});

module.exports = router;
