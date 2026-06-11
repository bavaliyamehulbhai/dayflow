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
  sanitizeFields(['name', 'description', 'icon']),
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name 1-100 characters'),
  body('description').optional().trim().isLength({ max: 500 }),
  body('frequency').optional().isIn(['daily', 'weekly', 'weekdays', 'weekends', 'custom']),
  body('color').optional().matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).withMessage('Invalid color hex')
];

// GET all habits
router.get('/', cacheMiddleware(60), async (req, res) => {
  try {
    console.log(`[HABITS] Fetching for user: ${req.user?._id}`);
    const habits = await Habit.find({ user: req.user._id, isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .lean();
    console.log(`[HABITS] Found ${habits?.length || 0} habits`);
    res.json({ success: true, habits });
  } catch (err) {
    console.error('[GET HABITS ERROR]', err);
    res.status(500).json({ error: 'Error fetching habits.', details: err.message });
  }
});

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

      if (idx > -1) {
        // Remove completion
        habit.completions.splice(idx, 1);
        // Log negative activity only if the completion was for today
        if (date === todayStr) {
          await logActivity(req.user._id, { habitsCompleted: -1 });
        }
      } else {
        // Add completion
        habit.completions.push({ date, count, note });
        // Log as daily activity if completing for today
        if (date === todayStr) {
          await logActivity(req.user._id, { habitsCompleted: 1 });
          await updateStreak(req.user._id);
        }
      }

      // Recalculate streak: Walk backwards from the most recent completion
      // Optimization: Only scan if completions exist
      const completedDates = [...new Set(habit.completions.map(c => c.date))].sort();
      const lastCompleted = completedDates[completedDates.length - 1];
      
      let streak = 0;
      if (lastCompleted) {
        let current = lastCompleted;
        // Check if last completion is today or yesterday to maintain streak
        const yesterday = new Date(); 
        yesterday.setDate(yesterday.getDate() - 1);
        const yestYear = yesterday.getFullYear();
        const yestMonth = String(yesterday.getMonth() + 1).padStart(2, '0');
        const yestDay = String(yesterday.getDate()).padStart(2, '0');
        const yestStr = `${yestYear}-${yestMonth}-${yestDay}`;

        // Only calculate if the last completion is recent enough to sustain a streak
        if (lastCompleted === todayStr || lastCompleted === yestStr) {
          while (completedDates.includes(current)) {
            streak++;
            let d = new Date(current + 'T12:00:00Z'); 
            d.setUTCDate(d.getUTCDate() - 1);
            current = d.toISOString().split('T')[0];
            // Safety break for extremely large data
            if (streak > 1000) break; 
          }
        }
      }

      habit.streak.current = streak;
      habit.streak.longest = Math.max(habit.streak.longest, streak);
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
