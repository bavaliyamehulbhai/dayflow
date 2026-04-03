const express = require('express');
const router = express.Router();
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
  body('frequency').optional().isIn(['daily', 'weekly']),
  body('color').optional().matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).withMessage('Invalid color hex')
];

// GET all habits
router.get('/', cacheMiddleware(60), async (req, res) => {
  try {
    const habits = await Habit.find({ user: req.user._id, isActive: true }).sort({ order: 1, createdAt: 1 });
    res.json({ success: true, habits });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching habits.' });
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
    res.status(500).json({ error: 'Error creating habit.' });
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

      const habit = await Habit.findOne({ _id: req.params.id, user: req.user._id });
      if (!habit) return res.status(404).json({ error: 'Habit not found.' });

      const existing = habit.completions.find(c => c.date === date);

      if (existing) {
        // Remove completion (toggle off)
        habit.completions = habit.completions.filter(c => c.date !== date);
      } else {
        // Add completion
        habit.completions.push({ date, count, note });
        // Log as daily activity if completing for today
        const todayStr = new Date().toISOString().split('T')[0];
        if (date === todayStr) {
          await logActivity(req.user._id, { habitsCompleted: 1 });
          await updateStreak(req.user._id);
        }
      }

      // Recalculate streak
      const todayStr = new Date().toISOString().split('T')[0];
      const completedDates = habit.completions.map(c => c.date).sort();

      // Current streak
      let streak = 0;
      let checkDateStr = todayStr;
      while (completedDates.includes(checkDateStr)) {
        streak++;
        const d = new Date(checkDateStr);
        d.setDate(d.getDate() - 1);
        checkDateStr = d.toISOString().split('T')[0];
      }

      habit.streak.current = streak;
      habit.streak.longest = Math.max(habit.streak.longest, streak);
      habit.streak.lastCompletedDate = completedDates[completedDates.length - 1] || null;

      await habit.save();
      clearCache(req.user._id);
      res.json({ success: true, habit });
    } catch (err) {
      res.status(500).json({ error: 'Error toggling habit completion.' });
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
