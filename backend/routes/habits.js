const express = require('express');
const router = express.Router();
const Habit = require('../models/Habit');
const { protect } = require('../middleware/auth');
const { logActivity } = require('../services/activityService');

router.use(protect);

// GET all habits
router.get('/', async (req, res) => {
  try {
    const habits = await Habit.find({ user: req.user._id, isActive: true }).sort({ order: 1, createdAt: 1 });
    res.json({ success: true, habits });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching habits.' });
  }
});

// CREATE habit
router.post('/', async (req, res) => {
  try {
    const habit = await Habit.create({ ...req.body, user: req.user._id });
    res.status(201).json({ success: true, habit });
  } catch (err) {
    res.status(500).json({ error: 'Error creating habit.' });
  }
});

// UPDATE habit
router.put('/:id', async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.user;
    delete updates.completions;

    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updates,
      { new: true, runValidators: true }
    );
    if (!habit) return res.status(404).json({ error: 'Habit not found.' });
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
    res.json({ success: true, message: 'Habit archived.' });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting habit.' });
  }
});

// TOGGLE completion for a date
router.post('/:id/complete', async (req, res) => {
  try {
    const { date, count = 1, note = '' } = req.body;
    if (!date) return res.status(400).json({ error: 'Date required.' });

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
      const today = new Date().toISOString().split('T')[0];
      if (date === today) {
        await logActivity(req.user._id, { habitsCompleted: 1 });
      }
    }

    // Recalculate streak
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const completedDates = habit.completions.map(c => c.date).sort();

    // Current streak
    let streak = 0;
    let checkDate = today;
    while (completedDates.includes(checkDate)) {
      streak++;
      const d = new Date(checkDate);
      d.setDate(d.getDate() - 1);
      checkDate = d.toISOString().split('T')[0];
    }

    habit.streak.current = streak;
    habit.streak.longest = Math.max(habit.streak.longest, streak);
    habit.streak.lastCompletedDate = completedDates[completedDates.length - 1] || null;

    await habit.save();
    res.json({ success: true, habit });
  } catch (err) {
    res.status(500).json({ error: 'Error toggling habit completion.' });
  }
});

// GET habit stats
router.get('/:id/stats', async (req, res) => {
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
