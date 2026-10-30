const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Pomodoro = require('../models/Pomodoro');
const User = require('../models/User');
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');
const { awardBadges } = require('../services/badgeService');
const { logActivity } = require('../services/activityService');
const { updateStreak } = require('../services/streakService');

router.use(protect);

const getLocalDate = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// GET pomodoros with filters
router.get('/', async (req, res) => {
  try {
    const { date, startDate, endDate, limit = 50 } = req.query;
    const filter = { user: req.user._id };

    if (date) filter.date = date;
    else if (startDate && endDate) filter.date = { $gte: startDate, $lte: endDate };

    const pomodoros = await Pomodoro.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) || 50)
      .populate('linkedTask', 'title')
      .lean();

    res.json({ success: true, pomodoros });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching pomodoros.' });
  }
});

// START a pomodoro session
router.post('/start', async (req, res) => {
  try {
    const { type = 'work', duration, linkedTask, date } = req.body;
    const user = await User.findById(req.user._id);

    const durationMap = {
      work: user?.preferences?.pomodoroWork || 25,
      'short-break': user?.preferences?.pomodoroBreak || 5,
      'long-break': user?.preferences?.pomodoroLong || 15
    };

    const todayStr = getLocalDate();
    const clientDate = (typeof req.body?.clientDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(req.body.clientDate)) ? req.body.clientDate : todayStr;
    const maxAllowed = clientDate > todayStr ? clientDate : todayStr;
    const sessionDate = (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date))
      ? date
      : todayStr;

    if (sessionDate > maxAllowed) {
      return res.status(400).json({ error: 'Focus session date cannot be in the future.' });
    }

    let validLinkedTask = null;
    if (linkedTask && mongoose.Types.ObjectId.isValid(linkedTask)) {
      const taskDoc = await Task.findOne({ _id: linkedTask, user: req.user._id });
      if (taskDoc) validLinkedTask = taskDoc._id;
    }

    const pomo = await Pomodoro.create({
      user: req.user._id,
      type,
      duration: duration || durationMap[type] || 25,
      linkedTask: validLinkedTask,
      startedAt: new Date(),
      date: sessionDate
    });

    res.status(201).json({ success: true, pomodoro: pomo });
  } catch (err) {
    console.error('[POMO START ERROR]', err);
    res.status(500).json({ error: 'Error starting pomodoro.' });
  }
});

// RECORD a completed pomodoro directly (atomic fallback)
router.post('/record', async (req, res) => {
  try {
    const { type = 'work', duration, actualDuration, linkedTask, note, date } = req.body;
    const user = await User.findById(req.user._id);

    const durationMap = {
      work: user?.preferences?.pomodoroWork || 25,
      'short-break': user?.preferences?.pomodoroBreak || 5,
      'long-break': user?.preferences?.pomodoroLong || 15
    };

    const todayStr = getLocalDate();
    const clientDate = (typeof req.body?.clientDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(req.body.clientDate)) ? req.body.clientDate : todayStr;
    const maxAllowed = clientDate > todayStr ? clientDate : todayStr;
    const sessionDate = (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date))
      ? date
      : todayStr;

    if (sessionDate > maxAllowed) {
      return res.status(400).json({ error: 'Focus session date cannot be in the future.' });
    }

    let validLinkedTask = null;
    if (linkedTask && mongoose.Types.ObjectId.isValid(linkedTask)) {
      const taskDoc = await Task.findOne({ _id: linkedTask, user: req.user._id });
      if (taskDoc) validLinkedTask = taskDoc._id;
    }

    const baseDuration = Math.min(1440, Math.max(1, duration || durationMap[type] || 25));
    const totalSeconds = Math.min(86400, Math.max(1, actualDuration || baseDuration * 60));

    const pomo = await Pomodoro.create({
      user: req.user._id,
      type,
      duration: baseDuration,
      actualDuration: totalSeconds,
      linkedTask: validLinkedTask,
      note: note || '',
      completed: true,
      startedAt: new Date(Date.now() - totalSeconds * 1000),
      completedAt: new Date(),
      date: sessionDate
    });

    if (type === 'work') {
      const minutesSpent = Math.max(1, Math.floor(totalSeconds / 60));
      await User.findByIdAndUpdate(req.user._id, {
        $inc: {
          'stats.totalPomodoros': 1,
          'stats.totalFocusMinutes': minutesSpent
        }
      });
      await logActivity(req.user._id, {
        pomodoros: 1,
        focusMinutes: minutesSpent
      }, sessionDate);
      await updateStreak(req.user._id, sessionDate);
    }

    const newBadges = type === 'work' ? await awardBadges(req.user._id) : [];

    res.status(201).json({ success: true, pomodoro: pomo, newBadges });
  } catch (err) {
    console.error('[POMO RECORD ERROR]', err);
    res.status(500).json({ error: 'Error recording pomodoro session.' });
  }
});

// COMPLETE a pomodoro
router.patch('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid session identifier.' });
    }

    const { actualDuration, note } = req.body;
    const pomo = await Pomodoro.findOne({ _id: id, user: req.user._id });
    if (!pomo) return res.status(404).json({ error: 'Pomodoro not found.' });

    if (pomo.completed) {
      return res.status(400).json({ error: 'Pomodoro is already completed.' });
    }

    pomo.completed = true;
    pomo.completedAt = new Date();
    pomo.actualDuration = actualDuration || pomo.duration * 60;
    if (note) pomo.note = note;
    await pomo.save();

    // Update user stats if it's a work session
    if (pomo.type === 'work') {
      const minutesSpent = Math.max(1, Math.floor(pomo.actualDuration / 60));
      const pomoDate = pomo.date || getLocalDate(new Date());
      await User.findByIdAndUpdate(req.user._id, {
        $inc: {
          'stats.totalPomodoros': 1,
          'stats.totalFocusMinutes': minutesSpent
        }
      });
      await logActivity(req.user._id, {
        pomodoros: 1,
        focusMinutes: minutesSpent
      }, pomoDate);
      await updateStreak(req.user._id, pomoDate);
    }

    // Award badges (non-blocking for work sessions)
    const newBadges = pomo.type === 'work'
      ? await awardBadges(req.user._id)
      : [];

    res.json({ success: true, pomodoro: pomo, newBadges });
  } catch (err) {
    console.error('[POMO COMPLETE ERROR]', err);
    res.status(500).json({ error: 'Error completing pomodoro.' });
  }
});

// DELETE a pomodoro
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid session identifier.' });
    }

    const pomo = await Pomodoro.findOneAndDelete({ _id: id, user: req.user._id });
    if (!pomo) return res.status(404).json({ error: 'Session not found.' });

    // Decrement stats if it was a completed work session
    if (pomo.completed && pomo.type === 'work') {
      const minutes = Math.floor((pomo.actualDuration || pomo.duration * 60) / 60);
      await User.findByIdAndUpdate(req.user._id, {
        $inc: {
          'stats.totalPomodoros': -1,
          'stats.totalFocusMinutes': -minutes
        }
      });
      await logActivity(req.user._id, {
        pomodoros: -1,
        focusMinutes: -minutes
      }, pomo.date);
    }

    res.json({ success: true, message: 'Session deleted.' });
  } catch (err) {
    console.error('[POMO DELETE ERROR]', err);
    res.status(500).json({ error: 'Error deleting session.' });
  }
});

// GET stats
router.get('/stats', async (req, res) => {
  try {
    const { period = '7' } = req.query; // days
    const days = Math.min(365, Math.max(1, parseInt(period) || 7));

    const now = new Date();
    const todayStr = getLocalDate(now);
    const startDateObj = new Date(now.getTime() - (days - 1) * 86400000);
    const startDate = getLocalDate(startDateObj);

    // Initialize dailyMap for exactly 'days' number of days
    const dailyMap = {};
    for (let i = 0; i < days; i++) {
      const dObj = new Date(now.getTime() - i * 86400000);
      const d = getLocalDate(dObj);
      dailyMap[d] = { date: d, count: 0, minutes: 0 };
    }

    const pomos = await Pomodoro.find({
      user: req.user._id,
      completed: true,
      type: 'work',
      date: { $gte: startDate, $lte: todayStr }
    });

    let periodFocusMinutes = 0;
    pomos.forEach(p => {
      const minutes = Math.floor((p.actualDuration || p.duration * 60) / 60);
      periodFocusMinutes += minutes;
      if (dailyMap[p.date]) {
        dailyMap[p.date].count++;
        dailyMap[p.date].minutes += minutes;
      }
    });

    const user = await User.findById(req.user._id).select('stats');

    res.json({
      success: true,
      stats: {
        periodPomos: pomos.length,
        periodFocusMinutes,
        totalPomos: user?.stats?.totalPomodoros || 0,
        totalFocusMinutes: user?.stats?.totalFocusMinutes || 0,
        daily: Object.values(dailyMap).reverse()
      }
    });
  } catch (err) {
    console.error('[POMO STATS ERROR]', err);
    res.status(500).json({ error: 'Error fetching pomodoro stats.' });
  }
});

module.exports = router;
