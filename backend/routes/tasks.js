const express = require('express');
const router = express.Router();
const { body, validationResult, query } = require('express-validator');
const mongoose = require('mongoose');
const Task = require('../models/Task');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { sanitizeFields } = require('../middleware/sanitizer');
const { awardBadges } = require('../services/badgeService');
const { logActivity } = require('../services/activityService');
const { updateStreak } = require('../services/streakService');
const { cacheMiddleware, clearCache } = require('../middleware/cache');

// Helper to validate MongoDB ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// All routes protected
router.use(protect);

// ─── GET all tasks ────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { status, priority, category, search, sortBy = 'createdAt', order = 'desc', page = 1, limit = 50, dueDate, date, dayFilter } = req.query;

    const filter = { user: req.user._id };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category; // ReDoS Safe Exact Match

    // Flexible partial keyword search across title, description, and tags
    if (search && typeof search === 'string' && search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { title: { $regex: escaped, $options: 'i' } },
        { description: { $regex: escaped, $options: 'i' } },
        { tags: { $regex: escaped, $options: 'i' } }
      ];
    }

    const d = new Date();
    const serverTodayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const clientDate = (typeof req.query.clientDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(req.query.clientDate))
      ? req.query.clientDate
      : (typeof req.headers['x-client-date'] === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(req.headers['x-client-date']))
        ? req.headers['x-client-date']
        : serverTodayStr;
    const [cYear, cMonth, cDay] = clientDate.split('-').map(Number);
    const clientDayStart = new Date(cYear, cMonth - 1, cDay, 0, 0, 0, 0);
    const clientDayEnd = new Date(cYear, cMonth - 1, cDay, 23, 59, 59, 999);

    if (date) {
      filter.$and = filter.$and || [];
      const targetStart = new Date(date + 'T00:00:00.000Z');
      const targetEnd = new Date(date + 'T23:59:59.999Z');
      filter.$and.push({
        $or: [
          { date: date },
          { date: null, dueDate: { $gte: targetStart, $lte: targetEnd } }
        ]
      });
    } else if (dayFilter === 'today') {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { date: clientDate },
          { date: null, dueDate: { $gte: clientDayStart, $lte: clientDayEnd } }
        ]
      });
    } else if (dayFilter === 'upcoming') {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { date: { $gt: clientDate } },
          { date: null, dueDate: { $gt: clientDayEnd } }
        ]
      });
    } else if (dayFilter === 'overdue') {
      filter.status = { $in: ['pending', 'in-progress'] };
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { date: { $lt: clientDate } },
          { date: null, dueDate: { $lt: clientDayStart } }
        ]
      });
    } else if (dayFilter === 'completed') {
      filter.status = 'completed';
    } else if (dueDate) {
      const date = new Date(dueDate);
      if (!isNaN(date.getTime())) {
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        filter.dueDate = { $gte: date, $lt: nextDay };
      }
    }

    const parsedPage = Math.max(1, parseInt(page) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit) || 50));
    const skip = (parsedPage - 1) * parsedLimit;
    const sortOrder = order === 'asc' ? 1 : -1;
    const sortField = { [sortBy]: sortOrder };

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .sort(sortField)
        .skip(skip)
        .limit(parsedLimit)
        .lean(),
      Task.countDocuments(filter)
    ]);

    res.json({ success: true, tasks, total, page: parsedPage, pages: Math.ceil(total / parsedLimit) });
  } catch (err) {
    console.error('[TASKS GET ERROR]', err);
    res.status(500).json({ error: 'Error fetching tasks.' });
  }
});

// ─── GET single task ──────────────────────────────────────────────────────────
router.get('/:id', cacheMiddleware(300), async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ error: 'Task not found.' });

    res.json({ success: true, task });
  } catch (err) {
    console.error('[TASK GET ONE ERROR]', err);
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

      const { title, description, priority, status, category, dueDate, estimatedMinutes, tags, subtasks, date, clientDate: passedClientDate } = req.body;
      const d = new Date();
      const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const clientDate = (typeof passedClientDate === 'string' && passedClientDate) ? passedClientDate : todayStr;
      const taskDate = date || (dueDate ? (typeof dueDate === 'string' && dueDate.includes('T') ? dueDate.split('T')[0] : String(dueDate).slice(0, 10)) : clientDate);

      // Block creating tasks for past dates
      if (taskDate < clientDate) {
        return res.status(400).json({ error: 'Tasks cannot be created for past dates.' });
      }

      const parsedDueDate = dueDate ? new Date(dueDate) : new Date(taskDate + 'T23:59:59.999Z');
      const task = await Task.create({
        title,
        description: description ? description.trim() : '',
        priority: priority || 'medium',
        status: status || 'pending',
        category: category || 'General',
        date: taskDate,
        dueDate: parsedDueDate,
        estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes) : null,
        tags: Array.isArray(tags) ? tags.map(t => String(t).trim()).filter(Boolean) : [],
        subtasks: Array.isArray(subtasks) ? subtasks.map(s => ({ title: String(s.title || '').trim(), completed: Boolean(s.completed) })) : [],
        user: req.user._id
      });
      clearCache(req.user._id);
      res.status(201).json({ success: true, task });
    } catch (err) {
      console.error('[TASK CREATE ERROR]', err);
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
      if (!isValidObjectId(req.params.id)) {
        return res.status(404).json({ error: 'Task not found.' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

      const { title, description, priority, status, category, dueDate, estimatedMinutes, tags, subtasks, date, clientDate: passedClientDate } = req.body;
      const d = new Date();
      const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const clientDate = (typeof passedClientDate === 'string' && passedClientDate) ? passedClientDate : todayStr;
      const taskDate = date || (dueDate ? (typeof dueDate === 'string' && dueDate.includes('T') ? dueDate.split('T')[0] : String(dueDate).slice(0, 10)) : clientDate);

      // Block moving tasks to past dates
      if (date !== undefined && date && date < clientDate) {
        return res.status(400).json({ error: 'Tasks cannot be moved to past dates.' });
      }

      const updates = {};
      if (title !== undefined) updates.title = title.trim();
      if (description !== undefined) updates.description = description ? description.trim() : '';
      if (priority !== undefined) updates.priority = priority;
      if (status !== undefined) updates.status = status;
      if (category !== undefined) updates.category = category;
      if (date !== undefined) {
        updates.date = date;
        if (dueDate === undefined) updates.dueDate = new Date(date + 'T23:59:59.999Z');
      }
      if (dueDate !== undefined) {
        updates.dueDate = dueDate ? new Date(dueDate) : null;
        if (date === undefined && dueDate) {
          updates.date = typeof dueDate === 'string' && dueDate.includes('T') ? dueDate.split('T')[0] : String(dueDate).slice(0, 10);
        }
      }
      if (estimatedMinutes !== undefined) updates.estimatedMinutes = estimatedMinutes ? parseInt(estimatedMinutes) : null;
      if (tags !== undefined) updates.tags = Array.isArray(tags) ? tags.map(t => String(t).trim()).filter(Boolean) : [];
      if (subtasks !== undefined && Array.isArray(subtasks)) {
        updates.subtasks = subtasks.map(s => ({
          title: String(s.title || '').trim(),
          completed: Boolean(s.completed),
          completedAt: s.completed ? (s.completedAt || new Date()) : null
        }));
      }

      const existingTask = await Task.findOne({ _id: req.params.id, user: req.user._id });
      if (!existingTask) return res.status(404).json({ error: 'Task not found.' });

      const effectiveDate = updates.date || existingTask.date || (existingTask.dueDate ? new Date(existingTask.dueDate).toISOString().slice(0, 10) : clientDate);

      // Enforce status change rule: Only tasks scheduled for today can be completed, uncompleted, or have status changed
      if (updates.status !== undefined && updates.status !== existingTask.status) {
        if (effectiveDate !== clientDate) {
          if (effectiveDate < clientDate) {
            return res.status(400).json({
              error: `Past tasks (${effectiveDate}) cannot be completed or uncompleted. Only today's tasks can be modified.`
            });
          } else {
            return res.status(400).json({
              error: `Upcoming tasks (${effectiveDate}) cannot be completed early. Only today's tasks can be modified.`
            });
          }
        }
      }

      // Checklist completion rule: Only today's tasks can have subtasks toggled
      if (updates.subtasks !== undefined && effectiveDate !== clientDate && existingTask.subtasks && existingTask.subtasks.length > 0) {
        const anySubtaskChanged = updates.subtasks.some((s, idx) => {
          const ex = existingTask.subtasks[idx];
          return ex && ex.completed !== Boolean(s.completed);
        });
        if (anySubtaskChanged) {
          return res.status(400).json({
            error: `Checklist items on past/upcoming tasks cannot be toggled. Only today's tasks can be completed.`
          });
        }
      }

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
        await logActivity(req.user._id, { tasksCompleted: 1 }, clientDate);
        await updateStreak(req.user._id, clientDate);
      } else if (wasCompleted && updates.status && updates.status !== 'completed') {
        await logActivity(req.user._id, { tasksCompleted: -1 }, clientDate);
      }

      clearCache(req.user._id);
      res.json({ success: true, task, newBadges });
    } catch (err) {
      console.error('[TASK UPDATE ERROR]', err);
      res.status(500).json({ error: 'Error updating task.' });
    }
  }
);

// ─── DELETE task ──────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ error: 'Task not found.' });

    // If task was completed, adjust completed count
    if (task.status === 'completed') {
      try {
        await User.findByIdAndUpdate(req.user._id, { $inc: { 'stats.tasksCompleted': -1 } });
        await logActivity(req.user._id, { tasksCompleted: -1 });
      } catch (logErr) {
        console.error('[TASK DELETE LOG ERROR]', logErr);
      }
    }

    clearCache(req.user._id);
    res.json({ success: true, message: 'Task deleted.' });
  } catch (err) {
    console.error('[TASK DELETE ERROR]', err);
    res.status(500).json({ error: 'Error deleting task.' });
  }
});

// ─── BULK operations ──────────────────────────────────────────────────────────
router.post('/bulk/delete', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Valid IDs array required.' });
    }

    const validIds = ids.filter(isValidObjectId);
    if (validIds.length === 0) {
      return res.status(400).json({ error: 'No valid task IDs provided.' });
    }

    // Check how many completed tasks are being deleted to adjust stats
    const completedCount = await Task.countDocuments({
      _id: { $in: validIds },
      user: req.user._id,
      status: 'completed'
    });

    const result = await Task.deleteMany({ _id: { $in: validIds }, user: req.user._id });

    if (completedCount > 0) {
      try {
        await User.findByIdAndUpdate(req.user._id, { $inc: { 'stats.tasksCompleted': -completedCount } });
        await logActivity(req.user._id, { tasksCompleted: -completedCount });
      } catch (logErr) {
        console.error('[BULK DELETE LOG ERROR]', logErr);
      }
    }

    clearCache(req.user._id);
    res.json({ success: true, deleted: result.deletedCount });
  } catch (err) {
    console.error('[BULK DELETE ERROR]', err);
    res.status(500).json({ error: 'Error deleting tasks.' });
  }
});

router.post('/bulk/status', async (req, res) => {
  try {
    const { ids, status, clientDate: passedClientDate } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0 || !status) {
      return res.status(400).json({ error: 'IDs array and status required.' });
    }

    const validIds = ids.filter(isValidObjectId);
    if (validIds.length === 0) {
      return res.status(400).json({ error: 'No valid task IDs provided.' });
    }

    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const clientDate = (typeof passedClientDate === 'string' && passedClientDate) ? passedClientDate : todayStr;

    // Check if any of the tasks belong to other dates
    const nonTodayTasks = await Task.find({
      _id: { $in: validIds },
      user: req.user._id,
      date: { $ne: clientDate }
    }).select('_id title date');

    if (nonTodayTasks.length > 0) {
      return res.status(400).json({
        error: `Only tasks scheduled for today (${clientDate}) can be completed or uncompleted. Some selected tasks belong to other dates.`
      });
    }

    const update = { status };
    if (status === 'completed') {
      const pendingTasks = await Task.find({
        _id: { $in: validIds },
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
      const completedTasks = await Task.find({
        _id: { $in: validIds },
        user: req.user._id,
        status: 'completed'
      }).select('_id');

      const countToRevert = completedTasks.length;
      if (countToRevert > 0) {
        update.completedAt = null;
        await User.findByIdAndUpdate(req.user._id, { $inc: { 'stats.tasksCompleted': -countToRevert } });
        await logActivity(req.user._id, { tasksCompleted: -countToRevert });
      }

      await Task.updateMany({ _id: { $in: validIds }, user: req.user._id }, update);
    }

    clearCache(req.user._id);
    res.json({ success: true, message: 'Tasks updated successfully.' });
  } catch (err) {
    console.error('[BULK STATUS ERROR]', err);
    res.status(500).json({ error: 'Error updating tasks.' });
  }
});

// ─── Subtask toggle ───────────────────────────────────────────────────────────
router.patch('/:id/subtasks/:subtaskId', async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id) || !isValidObjectId(req.params.subtaskId)) {
      return res.status(404).json({ error: 'Task or subtask not found.' });
    }

    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ error: 'Task not found.' });

    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const clientDate = (typeof req.body?.clientDate === 'string' && req.body.clientDate) ? req.body.clientDate : todayStr;
    const taskDate = task.date || (task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : clientDate);

    if (taskDate !== clientDate) {
      return res.status(400).json({
        error: `Only checklist items on today's tasks can be toggled. This task belongs to ${taskDate}.`
      });
    }

    const subtask = task.subtasks.id(req.params.subtaskId);
    if (!subtask) return res.status(404).json({ error: 'Subtask not found.' });

    subtask.completed = !subtask.completed;
    subtask.completedAt = subtask.completed ? new Date() : null;
    await task.save();
    clearCache(req.user._id);
    res.json({ success: true, task });
  } catch (err) {
    console.error('[SUBTASK TOGGLE ERROR]', err);
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
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const [statusCounts, overdueCount, todayActiveCount, todayCompletedCount] = await Promise.all([
      Task.aggregate([
        { $match: { user: req.user._id } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Task.countDocuments({
        user: req.user._id,
        status: { $in: ['pending', 'in-progress'] },
        $or: [
          { date: { $lt: todayStr } },
          { date: null, dueDate: { $lt: today } }
        ]
      }),
      Task.countDocuments({
        user: req.user._id,
        status: { $in: ['pending', 'in-progress'] },
        $or: [
          { date: todayStr },
          { date: null, dueDate: { $gte: today, $lt: tomorrow } }
        ]
      }),
      Task.countDocuments({
        user: req.user._id,
        status: 'completed',
        $or: [
          { date: todayStr },
          { date: null, completedAt: { $gte: today, $lt: tomorrow } }
        ]
      })
    ]);

    const stats = {
      total: 0,
      completed: 0,
      pending: 0,
      inProgress: 0,
      cancelled: 0,
      overdue: overdueCount,
      todayCompleted: todayCompletedCount,
      todayActive: todayActiveCount,
      todayTotal: todayCompletedCount + todayActiveCount
    };
    statusCounts.forEach(s => {
      const key = s._id === 'in-progress' ? 'inProgress' : s._id;
      if (key in stats) stats[key] = s.count;
      stats.total += s.count;
    });

    res.json({ success: true, stats });
  } catch (err) {
    console.error('[STATS SUMMARY ERROR]', err);
    res.status(500).json({ error: 'Error fetching stats.' });
  }
});

module.exports = router;
