const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const Habit = require('../models/Habit');
const { protect } = require('../middleware/auth');
const { sanitizeFields } = require('../middleware/sanitizer');
const { logActivity } = require('../services/activityService');
const { updateStreak } = require('../services/streakService');
const { cacheMiddleware, clearCache } = require('../middleware/cache');

router.use(protect);

// ─── Validation ──────────────────────────────────────────────────────────────
const habitValidation = [
  sanitizeFields(['name', 'description', 'icon', 'unit']),
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name 1-100 characters'),
  body('description').optional().trim().isLength({ max: 500 }),
  body('frequency').optional().isIn(['daily', 'weekdays', 'weekends', 'custom']).withMessage('Invalid frequency'),
  body('color').optional().matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).withMessage('Invalid color hex'),
  body('targetCount').optional().isInt({ min: 1 }).withMessage('Target count must be at least 1'),
  body('unit').optional().trim().isLength({ max: 20 }).withMessage('Unit cannot exceed 20 characters'),
  body('customDays').optional().isArray().withMessage('Custom days must be an array of day numbers')
];

// GET all habits
router.get('/', async (req, res) => {
  try {
    const habits = await Habit.find({ user: req.user._id, isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .lean();
    res.json({ success: true, habits });
  } catch (err) {
    console.error('[GET HABITS ERROR]', err);
    res.status(500).json({ error: 'Error fetching habits.', details: err.message });
  }
});

// REORDER habits
router.put('/reorder',
  [
    body('habitIds').isArray({ min: 1 }).withMessage('Array of habit IDs required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

      const { habitIds } = req.body;
      const validIds = habitIds.filter(id => mongoose.Types.ObjectId.isValid(id));

      const bulkOps = validIds.map((id, index) => ({
        updateOne: {
          filter: { _id: id, user: req.user._id },
          update: { $set: { order: index } }
        }
      }));

      if (bulkOps.length > 0) {
        await Habit.bulkWrite(bulkOps);
      }
      clearCache(req.user._id);
      res.json({ success: true, message: 'Habits reordered.' });
    } catch (err) {
      console.error('[HABIT REORDER ERROR]', err);
      res.status(500).json({ error: 'Error reordering habits.' });
    }
  }
);

// CREATE habit
router.post('/', habitValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const habit = await Habit.create({ ...req.body, user: req.user._id });
    clearCache(req.user._id);
    res.status(201).json({ success: true, habit });
  } catch (err) {
    console.error('[HABIT CREATE ERROR]', err);
    res.status(500).json({ error: 'Error creating habit.', details: process.env.NODE_ENV === 'development' ? err.message : undefined });
  }
});

// UPDATE habit
router.put('/:id', habitValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid ritual identifier.' });
    }

    const updates = { ...req.body };
    delete updates.user;
    delete updates.completions;

    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updates,
      { new: true, runValidators: true }
    );
    if (!habit) return res.status(404).json({ error: 'Habit not found.' });
    clearCache(req.user._id);
    res.json({ success: true, habit });
  } catch (err) {
    res.status(500).json({ error: 'Error updating habit.' });
  }
});

// DELETE habit
router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid ritual identifier.' });
    }

    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isActive: false },
      { new: true }
    );
    if (!habit) return res.status(404).json({ error: 'Habit not found.' });
    clearCache(req.user._id);
    res.json({ success: true, message: 'Habit archived.' });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting habit.' });
  }
});

// TOGGLE completion for a date
router.post('/:id/complete',
  [
    body('date').isISO8601().withMessage('Valid date required (YYYY-MM-DD)'),
    body('count').optional().isInt({ min: 1 }),
    sanitizeFields(['note']),
    body('note').optional().trim().isLength({ max: 200 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

      const { date, count = 1, note = '' } = req.body;
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid ritual identifier.' });
      }

      const habit = await Habit.findOne({ _id: id, user: req.user._id });
      if (!habit) return res.status(404).json({ error: 'Habit not found.' });

      const idx = habit.completions.findIndex(c => c.date === date);

      // Standardized Today calculation (Local Server Time)
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;
      const clientDate = (typeof req.body.clientDate === 'string' && req.body.clientDate) ? req.body.clientDate : todayStr;
      const isToday = (date === clientDate || date === todayStr);

      // Enforce day-wise isolation: only today's habits can be completed/uncompleted
      if (!isToday) {
        return res.status(400).json({
          error: "Only today's ritual habits can be checked in or modified."
        });
      }

      if (idx > -1) {
        // Remove completion
        habit.completions.splice(idx, 1);
        // Log negative activity only if the completion was for today
        if (isToday) {
          await logActivity(req.user._id, { habitsCompleted: -1 }, clientDate);
          await updateStreak(req.user._id, clientDate);
        }
      } else {
        // Add completion
        habit.completions.push({ date, count, note });
        // Log as daily activity if completing for today
        if (isToday) {
          await logActivity(req.user._id, { habitsCompleted: 1 }, clientDate);
          await updateStreak(req.user._id, clientDate);
        }
      }

      // Helper to check if a specific calendar day is scheduled for this habit
      const isScheduledDay = (dStr) => {
        const dObj = new Date(dStr + 'T12:00:00Z');
        const dayOfWeek = dObj.getUTCDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
        if (habit.frequency === 'weekdays') {
          return dayOfWeek >= 1 && dayOfWeek <= 5;
        }
        if (habit.frequency === 'weekends') {
          return dayOfWeek === 0 || dayOfWeek === 6;
        }
        if (habit.frequency === 'custom' && Array.isArray(habit.customDays) && habit.customDays.length > 0) {
          return habit.customDays.includes(dayOfWeek);
        }
        return true; // daily
      };

      const completedDatesSet = new Set(habit.completions.map(c => c.date));
      const sortedCompleted = [...completedDatesSet].sort();
      const lastCompleted = sortedCompleted[sortedCompleted.length - 1];

      let streak = 0;
      if (lastCompleted) {
        // Find the most recent scheduled day on or before today
        let checkDate = new Date();
        let mostRecentScheduled = null;
        for (let i = 0; i < 7; i++) {
          const cY = checkDate.getFullYear();
          const cM = String(checkDate.getMonth() + 1).padStart(2, '0');
          const cD = String(checkDate.getDate()).padStart(2, '0');
          const cStr = `${cY}-${cM}-${cD}`;
          if (isScheduledDay(cStr)) {
            mostRecentScheduled = cStr;
            break;
          }
          checkDate.setDate(checkDate.getDate() - 1);
        }

        // Streak is alive if completed today OR completed on the most recent scheduled day
        const canSustainStreak = (lastCompleted === todayStr) || (mostRecentScheduled && lastCompleted === mostRecentScheduled);

        if (canSustainStreak) {
          let curr = lastCompleted;
          let safety = 0;
          while (safety < 1000) {
            safety++;
            if (isScheduledDay(curr)) {
              if (completedDatesSet.has(curr)) {
                streak++;
              } else {
                // Missed a scheduled day; streak ends
                break;
              }
            }
            // Step back 1 day
            const d = new Date(curr + 'T12:00:00Z');
            d.setUTCDate(d.getUTCDate() - 1);
            curr = d.toISOString().split('T')[0];
          }
        }
      }

      if (!habit.streak) {
        habit.streak = { current: 0, longest: 0, lastCompletedDate: null };
      }
      habit.streak.current = streak;
      habit.streak.longest = Math.max(habit.streak.longest || 0, streak);
      habit.streak.lastCompletedDate = lastCompleted || null;

      await habit.save();
      clearCache(req.user._id);
      res.json({ success: true, habit });
    } catch (err) {
      console.error('[HABIT TOGGLE ERROR]', err);
      res.status(500).json({ 
        error: 'Error toggling habit completion.', 
        details: process.env.NODE_ENV === 'development' ? err.message : undefined 
      });
    }
  });

// GET habit stats
router.get('/:id/stats', cacheMiddleware(120), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid ritual identifier.' });
    }

    const habit = await Habit.findOne({ _id: req.params.id, user: req.user._id });
    if (!habit) return res.status(404).json({ error: 'Habit not found.' });

    const totalCompletions = habit.completions.length;
    const thisMonth = habit.completions.filter(c => c.date.startsWith(new Date().toISOString().substring(0, 7))).length;
    const last30Days = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const last30 = habit.completions.filter(c => c.date >= last30Days).length;

    res.json({
      success: true,
      stats: {
        totalCompletions,
        thisMonth,
        last30,
        streak: habit.streak,
        completionRate: Math.round((last30 / 30) * 100)
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching habit stats.' });
  }
});

module.exports = router;
