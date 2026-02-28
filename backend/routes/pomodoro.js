const express = require('express');
const router = express.Router();
const Pomodoro = require('../models/Pomodoro');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { awardBadges } = require('../services/badgeService');
const { logActivity } = require('../services/activityService');

router.use(protect);

// GET pomodoros with filters
router.get('/', async (req, res) => {
  try {
    const { date, startDate, endDate, limit = 50 } = req.query;
    const filter = { user: req.user._id };

    if (date) filter.date = date;
    else if (startDate && endDate) filter.date = { $gte: startDate, $lte: endDate };

    const pomodoros = await Pomodoro.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('linkedTask', 'title');

    res.json({ success: true, pomodoros });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching pomodoros.' });
  }
});

// START a pomodoro session
router.post('/start', async (req, res) => {
  try {
    const { type = 'work', duration, linkedTask } = req.body;
    const user = await User.findById(req.user._id);

    const durationMap = {
      work: user.preferences.pomodoroWork || 25,
      'short-break': user.preferences.pomodoroBreak || 5,
      'long-break': user.preferences.pomodoroLong || 15
    };

    const pomo = await Pomodoro.create({
      user: req.user._id,
      type,
      duration: duration || durationMap[type],
      linkedTask: linkedTask || null,
      startedAt: new Date(),
      date: new Date().toISOString().split('T')[0]
    });

    res.status(201).json({ success: true, pomodoro: pomo });
  } catch (err) {
    res.status(500).json({ error: 'Error starting pomodoro.' });
  }
});

// COMPLETE a pomodoro
router.patch('/:id/complete', async (req, res) => {
  try {
    const { actualDuration, note } = req.body;
    const pomo = await Pomodoro.findOne({ _id: req.params.id, user: req.user._id });
    if (!pomo) return res.status(404).json({ error: 'Pomodoro not found.' });

    pomo.completed = true;
    pomo.completedAt = new Date();
    pomo.actualDuration = actualDuration || pomo.duration * 60;
    if (note) pomo.note = note;
    await pomo.save();

    // Update user stats if it's a work session
    if (pomo.type === 'work') {
      await User.findByIdAndUpdate(req.user._id, {
        $inc: {
          'stats.totalPomodoros': 1,
          'stats.totalFocusMinutes': Math.floor(pomo.actualDuration / 60)
        }
      });
    }

    // Award badges and log activity (non-blocking for work sessions)
    const newBadges = pomo.type === 'work'
      ? await awardBadges(req.user._id)
      : [];

    if (pomo.type === 'work') {
      await logActivity(req.user._id, {
        pomodoros: 1,
        focusMinutes: Math.floor(pomo.actualDuration / 60)
      });
    }

    res.json({ success: true, pomodoro: pomo, newBadges });
  } catch (err) {
    res.status(500).json({ error: 'Error completing pomodoro.' });
  }
});

// GET stats
router.get('/stats', async (req, res) => {
  try {
    const { period = '7' } = req.query; // days
    const days = parseInt(period);

    // Calculate startDate: today - (days - 1) to get exactly 'days' number of dates including today
    const now = new Date();
    const startDate = new Date(now.getTime() - (days - 1) * 86400000).toISOString().split('T')[0];
    const todayStr = now.toISOString().split('T')[0];

    // Initialize dailyMap for exactly 'days' number of days
    const dailyMap = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(now.getTime() - i * 86400000).toISOString().split('T')[0];
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
    res.status(500).json({ error: 'Error fetching pomodoro stats.' });
  }
});

module.exports = router;
