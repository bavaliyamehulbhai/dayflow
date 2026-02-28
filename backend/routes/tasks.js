const express = require('express');
const router = express.Router();
const { body, validationResult, query } = require('express-validator');
const Task = require('../models/Task');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { awardBadges } = require('../services/badgeService');
const { logActivity } = require('../services/activityService');

// All routes protected
router.use(protect);

// ─── GET all tasks ────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { status, priority, category, search, sortBy = 'createdAt', order = 'desc', page = 1, limit = 50, dueDate } = req.query;

    const filter = { user: req.user._id };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = new RegExp(category, 'i');
    // Use MongoDB text search if available, fall back to regex for partial matches
    if (search) {
      filter.$text = { $search: search };
    }
    if (dueDate) {
      const date = new Date(dueDate);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      filter.dueDate = { $gte: date, $lt: nextDay };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === 'asc' ? 1 : -1;
    const sortField = search ? { score: { $meta: 'textScore' }, [sortBy]: sortOrder } : { [sortBy]: sortOrder };

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .sort(sortField)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Task.countDocuments(filter)
    ]);

    res.json({ success: true, tasks, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching tasks.' });
  }
});

// ─── GET single task ──────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ error: 'Task not found.' });
    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching task.' });
  }
});

// ─── CREATE task ──────────────────────────────────────────────────────────────
router.post('/',
  [
    body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required (max 200 chars)'),
    body('description').optional().trim().isLength({ max: 2000 }).withMessage('Description too long'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    body('status').optional().isIn(['pending', 'in-progress', 'completed', 'cancelled']),
    body('tags').optional().isArray(),
    body('tags.*').optional().trim().isLength({ max: 50 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

      const { title, description, priority, status, category, dueDate, estimatedMinutes, tags, subtasks } = req.body;
      const task = await Task.create({
        title, description, priority, status, category,
        dueDate: dueDate || null,
        estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes) : null,
        tags: Array.isArray(tags) ? tags.map(t => String(t).trim()).filter(Boolean) : [],
        subtasks: Array.isArray(subtasks) ? subtasks.map(s => ({ title: String(s.title || '').trim(), completed: Boolean(s.completed) })) : [],
        user: req.user._id
      });
      res.status(201).json({ success: true, task });
    } catch (err) {
      res.status(500).json({ error: 'Error creating task.' });
    }
  }
);

// ─── UPDATE task ──────────────────────────────────────────────────────────────
router.put('/:id',
  [
    body('title').optional().trim().isLength({ min: 1, max: 200 }),
    body('description').optional().trim().isLength({ max: 2000 }),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    body('status').optional().isIn(['pending', 'in-progress', 'completed', 'cancelled']),
    body('tags').optional().isArray(),
    body('tags.*').optional().trim().isLength({ max: 50 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

      const { title, description, priority, status, category, dueDate, estimatedMinutes, tags, subtasks } = req.body;
      const updates = {};
      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (priority !== undefined) updates.priority = priority;
      if (status !== undefined) updates.status = status;
      if (category !== undefined) updates.category = category;
      if (dueDate !== undefined) updates.dueDate = dueDate || null;
      if (estimatedMinutes !== undefined) updates.estimatedMinutes = estimatedMinutes ? parseInt(estimatedMinutes) : null;
      if (tags !== undefined) updates.tags = tags.map(t => String(t).trim()).filter(Boolean);
      if (subtasks !== undefined) updates.subtasks = subtasks.map(s => ({ title: String(s.title || '').trim(), completed: Boolean(s.completed) }));

      // Set completedAt if completing task
      if (updates.status === 'completed') {
        updates.completedAt = new Date();
        await User.findByIdAndUpdate(req.user._id, { $inc: { 'stats.tasksCompleted': 1 } });
      }

      const task = await Task.findOneAndUpdate(
        { _id: req.params.id, user: req.user._id },
        updates,
        { new: true, runValidators: true }
      );

      if (!task) return res.status(404).json({ error: 'Task not found.' });

      // Award badges and log activity async (non-blocking)
      let newBadges = [];
      if (updates.status === 'completed') {
        newBadges = await awardBadges(req.user._id);
        await logActivity(req.user._id, { tasksCompleted: 1 });
      }

      res.json({ success: true, task, newBadges });
    } catch (err) {
      res.status(500).json({ error: 'Error updating task.' });
    }
  }
);

// ─── DELETE task ──────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ error: 'Task not found.' });
    res.json({ success: true, message: 'Task deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting task.' });
  }
});

// ─── BULK operations ──────────────────────────────────────────────────────────
router.post('/bulk/delete', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) return res.status(400).json({ error: 'IDs array required.' });
    const result = await Task.deleteMany({ _id: { $in: ids }, user: req.user._id });
    res.json({ success: true, deleted: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting tasks.' });
  }
});

router.post('/bulk/status', async (req, res) => {
  try {
    const { ids, status } = req.body;
    if (!ids || !status) return res.status(400).json({ error: 'IDs and status required.' });
    const update = { status };
    if (status === 'completed') {
      update.completedAt = new Date();
      // Increment stats and log activity
      await User.findByIdAndUpdate(req.user._id, { $inc: { 'stats.tasksCompleted': ids.length } });
      await logActivity(req.user._id, { tasksCompleted: ids.length });
    }
    await Task.updateMany({ _id: { $in: ids }, user: req.user._id }, update);
    res.json({ success: true, message: 'Tasks updated.' });
  } catch (err) {
    res.status(500).json({ error: 'Error updating tasks.' });
  }
});

// ─── Subtask toggle ───────────────────────────────────────────────────────────
router.patch('/:id/subtasks/:subtaskId', async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ error: 'Task not found.' });

    const subtask = task.subtasks.id(req.params.subtaskId);
    if (!subtask) return res.status(404).json({ error: 'Subtask not found.' });

    subtask.completed = !subtask.completed;
    subtask.completedAt = subtask.completed ? new Date() : null;
    await task.save();

    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ error: 'Error updating subtask.' });
  }
});

// ─── Stats ────────────────────────────────────────────────────────────────────
router.get('/stats/summary', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Single aggregate instead of 6 countDocuments round-trips
    const [statusCounts, overdueCount, todayCompletedCount] = await Promise.all([
      Task.aggregate([
        { $match: { user: req.user._id } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Task.countDocuments({
        user: req.user._id,
        status: { $ne: 'completed' },
        dueDate: { $lt: today }
      }),
      Task.countDocuments({
        user: req.user._id,
        status: 'completed',
        completedAt: { $gte: today, $lt: tomorrow }
      })
    ]);

    const stats = { total: 0, completed: 0, pending: 0, inProgress: 0, cancelled: 0, overdue: overdueCount, todayCompleted: todayCompletedCount };
    statusCounts.forEach(s => {
      const key = s._id === 'in-progress' ? 'inProgress' : s._id;
      if (key in stats) stats[key] = s.count;
      stats.total += s.count;
    });

    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching stats.' });
  }
});

module.exports = router;

