const express = require('express');
const router = express.Router();
const { body, validationResult, query } = require('express-validator');
const Task = require('../models/Task');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { sanitizeFields } = require('../middleware/sanitizer');
const { awardBadges } = require('../services/badgeService');
const { logActivity } = require('../services/activityService');
const { updateStreak } = require('../services/streakService');
const { cacheMiddleware, clearCache } = require('../middleware/cache');

// All routes protected
router.use(protect);

// ─── GET all tasks ────────────────────────────────────────────────────────────
router.get('/', cacheMiddleware(60), async (req, res) => {
  try {
    const { status, priority, category, search, sortBy = 'createdAt', order = 'desc', page = 1, limit = 50, dueDate } = req.query;

    const filter = { user: req.user._id };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category; // ReDoS Safe Exact Match
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
router.get('/:id', cacheMiddleware(300), async (req, res) => {
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
    protect,
    sanitizeFields(['title', 'description']),
    body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required (1-200 characters)'),
    body('description').optional().trim().isLength({ max: 2000 }).withMessage('Description too long (max 2000)'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority value'),
    body('status').optional().isIn(['pending', 'in-progress', 'completed', 'cancelled']).withMessage('Invalid status value'),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    body('tags.*').optional().trim().isLength({ max: 50 }).withMessage('Tag too long (max 50)')
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
      clearCache(req.user._id);
      res.status(201).json({ success: true, task });
    } catch (err) {
      res.status(500).json({ error: 'Error creating task.' });
    }
  }
);

// ─── UPDATE task ──────────────────────────────────────────────────────────────
router.put('/:id',
  [
    protect,
    sanitizeFields(['title', 'description']),
    body('title').optional().trim().isLength({ min: 1, max: 200 }).withMessage('Title 1-200 characters'),
    body('description').optional().trim().isLength({ max: 2000 }).withMessage('Description max 2000'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
    body('status').optional().isIn(['pending', 'in-progress', 'completed', 'cancelled']).withMessage('Invalid status'),
    body('tags').optional().isArray().withMessage('Tags must be array'),
    body('tags.*').optional().trim().isLength({ max: 50 }).withMessage('Tag max 50')
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
      if (subtasks !== undefined && Array.isArray(subtasks)) updates.subtasks = subtasks.map(s => ({ title: String(s.title || '').trim(), completed: Boolean(s.completed) }));

      const existingTask = await Task.findOne({ _id: req.params.id, user: req.user._id });
      if (!existingTask) return res.status(404).json({ error: 'Task not found.' });

      const wasCompleted = existingTask.status === 'completed';

      // Adjust completedAt and stats depending on status transitions
      if (updates.status === 'completed' && !wasCompleted) {
        updates.completedAt = new Date();
        await User.findByIdAndUpdate(req.user._id, { $inc: { 'stats.tasksCompleted': 1 } });
      } else if (wasCompleted && updates.status && updates.status !== 'completed') {
        updates.completedAt = null;
        await User.findByIdAndUpdate(req.user._id, { $inc: { 'stats.tasksCompleted': -1 } });
      }

      const task = await Task.findByIdAndUpdate(
        existingTask._id,
        updates,
        { new: true, runValidators: true }
      );

      // Award badges and log activity async (non-blocking)
      let newBadges = [];
      if (updates.status === 'completed' && !wasCompleted) {
        newBadges = await awardBadges(req.user._id);
        await logActivity(req.user._id, { tasksCompleted: 1 });
        await updateStreak(req.user._id);
      } else if (wasCompleted && updates.status && updates.status !== 'completed') {
        await logActivity(req.user._id, { tasksCompleted: -1 });
      }

      clearCache(req.user._id);
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
    clearCache(req.user._id);
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
    clearCache(req.user._id);
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
      // Find the tasks in this list that are not already completed
      const pendingTasks = await Task.find({
        _id: { $in: ids },
        user: req.user._id,
        status: { $ne: 'completed' }
      }).select('_id');

      const countToComplete = pendingTasks.length;
      if (countToComplete > 0) {
        update.completedAt = new Date();
        await User.findByIdAndUpdate(req.user._id, { $inc: { 'stats.tasksCompleted': countToComplete } });
        await logActivity(req.user._id, { tasksCompleted: countToComplete });
        await updateStreak(req.user._id);
        
        const pendingIds = pendingTasks.map(t => t._id);
        await Task.updateMany({ _id: { $in: pendingIds }, user: req.user._id }, update);
      }
    } else {
      // If changing to pending, in-progress, or cancelled, decrement stats for tasks that WERE completed
      const completedTasks = await Task.find({
        _id: { $in: ids },
        user: req.user._id,
        status: 'completed'
      }).select('_id');

      const countToRevert = completedTasks.length;
      if (countToRevert > 0) {
        update.completedAt = null;
        await User.findByIdAndUpdate(req.user._id, { $inc: { 'stats.tasksCompleted': -countToRevert } });
        await logActivity(req.user._id, { tasksCompleted: -countToRevert });
      }

      await Task.updateMany({ _id: { $in: ids }, user: req.user._id }, update);
    }
    clearCache(req.user._id);
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
    clearCache(req.user._id);
    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ error: 'Error updating subtask.' });
  }
});

// ─── Stats ────────────────────────────────────────────────────────────────────
router.get('/stats/summary', cacheMiddleware(300), async (req, res) => {
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

