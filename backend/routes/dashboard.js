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
const { cacheMiddleware } = require('../middleware/cache');
const { decrypt } = require('../utils/cryptoUtils');

router.use(protect);

const pad = (n) => String(n).padStart(2, '0');

// GET complete dashboard summary
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const serverToday = `${year}-${month}-${day}`;
    const clientDateHeader = typeof req.headers['x-client-date'] === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(req.headers['x-client-date']) ? req.headers['x-client-date'] : null;
    const today = (typeof req.query.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(req.query.date)) ? req.query.date : (clientDateHeader || serverToday);
    const [tYear, tMonth, tDay] = today.split('-').map(Number);
    const todayStart = new Date(tYear, tMonth - 1, tDay, 0, 0, 0, 0);
    const todayEnd = new Date(tYear, tMonth - 1, tDay, 23, 59, 59, 999);

    const [
      user,
      taskStats,
      todayTasks,
      todayTasksPendingCount,
      todayTasksCompleted,
      overdueTasks,
      upcomingTasks,
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
      // Today's tasks (due today)
      Task.find({
        user: req.user._id,
        status: { $in: ['pending', 'in-progress'] },
        $or: [
          { date: today },
          { date: null, dueDate: { $gte: todayStart, $lte: todayEnd } }
        ]
      }).sort({ priority: -1 }).limit(10).lean(),
      // Today's pending tasks count
      Task.countDocuments({
        user: req.user._id,
        status: { $in: ['pending', 'in-progress'] },
        $or: [
          { date: today },
          { date: null, dueDate: { $gte: todayStart, $lte: todayEnd } }
        ]
      }),
      // Today's completed tasks
      Task.countDocuments({
        user: req.user._id,
        status: 'completed',
        $or: [
          { date: today },
          { date: null, completedAt: { $gte: todayStart, $lte: todayEnd } }
        ]
      }),
      // Overdue tasks
      Task.countDocuments({
        user: req.user._id,
        status: { $nin: ['completed', 'cancelled'] },
        $or: [
          { date: { $lt: today } },
          { date: null, dueDate: { $lt: todayStart } }
        ]
      }),
      // Upcoming tasks due within the next 48 hours
      Task.find({
        user: req.user._id,
        status: { $in: ['pending', 'in-progress'] },
        $or: [
          { date: { $gt: today } },
          { dueDate: { $gte: now, $lte: new Date(now.getTime() + 48 * 3600000) } }
        ]
      }).sort({ dueDate: 1 }).limit(10).lean(),
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

    const todayTaskTotal = todayTasksCompleted + todayTasksPendingCount;
    const todayTaskSummary = {
      total: todayTaskTotal,
      completed: todayTasksCompleted,
      pending: todayTasksPendingCount,
      pct: todayTaskTotal > 0 ? Math.round((todayTasksCompleted / todayTaskTotal) * 100) : 0
    };

    // Process habits
    const habitSummary = activeHabits.map(h => ({
      _id: h._id,
      name: h.name,
      color: h.color,
      icon: h.icon,
      streak: h.streak || { current: 0, longest: 0 },
      completedToday: h.completions.some(c => c.date === today)
    }));
    const habitsCompleted = habitSummary.filter(h => h.completedToday).length;

    // Focus stats
    const focusMinutesToday = todayPomos.reduce((acc, p) => acc + Math.floor((p.actualDuration || p.duration * 60) / 60), 0);

    // 7-day activity (for chart) based on today's local date
    const last7 = [];
    const [tY, tM, tD] = today.split('-').map(Number);
    for (let i = 6; i >= 0; i--) {
      const d = new Date(tY, tM - 1, tD - i, 12, 0, 0);
      last7.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
    }

    const weekPomos = await Pomodoro.aggregate([
      { $match: { user: req.user._id, completed: true, type: 'work', date: { $in: last7 } } },
      { 
        $group: { 
          _id: '$date', 
          count: { $sum: 1 }, 
          minutes: { 
            $sum: { 
              $ifNull: [
                { $divide: ['$actualDuration', 60] }, 
                { $ifNull: ['$duration', 0] }
              ] 
            } 
          } 
        } 
      }
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

    const weeklyTasksCompleted = weekData.reduce((acc, day) => acc + (day.tasksCompleted || 0), 0);
    const weeklyGoal = user?.preferences?.weeklyGoal || 30;
    const safeGoal = Math.max(1, weeklyGoal);
    const weeklyProgress = {
      completed: weeklyTasksCompleted,
      goal: weeklyGoal,
      percentage: Math.min(100, Math.round((weeklyTasksCompleted / safeGoal) * 100))
    };

    res.json({
      success: true,
      dashboard: {
        user: { name: user?.name || '', stats: user?.stats || {}, preferences: user?.preferences || {} },
        tasks: { summary: taskSummary, todaySummary: todayTaskSummary, today: todayTasks, overdue: overdueTasks, upcoming: upcomingTasks },
        schedule: { today: todayEvents },
        habits: { list: habitSummary, total: activeHabits.length, completedToday: habitsCompleted },
        pomodoro: { todayCount: todayPomos.length, todayMinutes: focusMinutesToday },
        notes: { recent: recentNotes.map(n => ({ ...n, title: decrypt(n.title) })) },
        weekActivity: weekData,
        weeklyProgress: weeklyProgress
      }
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Error fetching dashboard.' });
  }
});

// GET 12-month activity data with advanced analytics
router.get('/activity/12m', cacheMiddleware(300), async (req, res) => {
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
    const hasCompletedWork = (l) => ((l.tasksCompleted || 0) + (l.habitsCompleted || 0) + (l.scheduleEventsCompleted || 0) + (l.pomodoros || 0)) > 0;
    
    // Sanitize logs so days without completed work are strictly inert
    const sanitizedLogs = logs.map(l => {
      const work = (l.tasksCompleted || 0) + (l.habitsCompleted || 0) + (l.scheduleEventsCompleted || 0) + (l.pomodoros || 0);
      if (work === 0) {
        return { ...l, score: 0, intensity: 0 };
      }
      return l;
    });

    const activeDays = sanitizedLogs.filter(hasCompletedWork);
    const personalBestSingleDay = activeDays.length > 0
      ? Math.max(...activeDays.map(l => l.score || 0))
      : 0;

    // Highest Intensity Streak logic requiring daily execution
    const sortedLogs = [...sanitizedLogs].sort((a, b) => a.date.localeCompare(b.date));
    let maxStreak = 0;
    let currentStreak = 0;
    let lastDate = null;

    sortedLogs.forEach(log => {
      if (hasCompletedWork(log)) {
        if (!lastDate) { 
          currentStreak = 1; 
        } else {
          const [y1, m1, d1] = log.date.split('-').map(Number);
          const [y0, m0, d0] = lastDate.split('-').map(Number);
          const dtCurr = new Date(y1, m1 - 1, d1, 12, 0, 0);
          const dtLast = new Date(y0, m0 - 1, d0, 12, 0, 0);
          const roundedDiff = Math.round((dtCurr - dtLast) / 86400000);
          
          if (roundedDiff === 1) {
            currentStreak++;
          } else if (roundedDiff > 1) {
            currentStreak = 1;
          }
        }
        maxStreak = Math.max(maxStreak, currentStreak);
        lastDate = log.date;
      }
    });

    res.json({
      success: true,
      logs: sanitizedLogs,
      activity: sanitizedLogs,
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
