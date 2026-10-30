const express = require('express');
const router = express.Router();
const { body, validationResult, query } = require('express-validator');
const mongoose = require('mongoose');
const Schedule = require('../models/Schedule');
const { protect } = require('../middleware/auth');
const { sanitizeFields } = require('../middleware/sanitizer');
const { logActivity } = require('../services/activityService');
const { updateStreak } = require('../services/streakService');

router.use(protect);

// Helper to validate MongoDB ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Clean request payload to prevent Mongoose CastErrors
const cleanPayload = (body) => {
  const payload = { ...body };
  delete payload.user;
  if (!payload.endTime || payload.endTime.trim?.() === '') payload.endTime = null;
  if (!payload.linkedTask || payload.linkedTask.trim?.() === '') payload.linkedTask = null;
  return payload;
};

// ─── Validation ──────────────────────────────────────────────────────────────
const eventValidation = [
  sanitizeFields(['title', 'description', 'category']),
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title 1-200 characters required'),
  body('date').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Valid date (YYYY-MM-DD) required'),
  body('startTime').matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage('Start time (HH:mm) required'),
  body('endTime')
    .optional({ values: 'falsy' })
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/)
    .withMessage('End time must be in HH:mm format')
    .custom((endTime, { req }) => {
      if (endTime && req.body.startTime && endTime <= req.body.startTime) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),
  body('category')
    .optional({ values: 'falsy' })
    .isIn(['work', 'personal', 'health', 'learning', 'social', 'other'])
    .withMessage('Invalid category'),
  body('linkedTask')
    .optional({ values: 'falsy' })
    .custom((val) => {
      if (val && !isValidObjectId(val)) {
        throw new Error('Invalid linked task ID');
      }
      return true;
    })
];

// GET schedule for date range
router.get('/',
  [
    query('date').optional().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Valid date (YYYY-MM-DD) required'),
    query('startDate').optional().matches(/^\d{4}-\d{2}-\d{2}$/),
    query('endDate').optional().matches(/^\d{4}-\d{2}-\d{2}$/)
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

      const { date, startDate, endDate } = req.query;
      const filter = { user: req.user._id };

      if (date) {
        filter.date = date;
      } else if (startDate && endDate) {
        filter.date = { $gte: startDate, $lte: endDate };
      } else {
        // Default: today (client local date or server fallback)
        const d = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const serverToday = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        filter.date = (typeof req.headers['x-client-date'] === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(req.headers['x-client-date']))
          ? req.headers['x-client-date']
          : serverToday;
      }

      const events = await Schedule.find(filter)
        .sort({ startTime: 1 })
        .populate('linkedTask', 'title status priority')
        .lean();

      res.json({ success: true, events });
    } catch (err) {
      console.error('[SCHEDULE GET ERROR]', err);
      res.status(500).json({ error: 'Error fetching schedule.' });
    }
  });

// CREATE event
router.post('/', eventValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const payload = cleanPayload(req.body);

    // Prevent creating events for past dates
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const serverTodayStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const clientDate = (typeof req.body?.clientDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(req.body.clientDate))
      ? req.body.clientDate
      : (typeof req.headers['x-client-date'] === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(req.headers['x-client-date']))
        ? req.headers['x-client-date']
        : serverTodayStr;
    const minAllowed = clientDate < serverTodayStr ? clientDate : serverTodayStr;
    if (payload.date && payload.date < minAllowed) {
      return res.status(400).json({ error: 'Events cannot be scheduled for past dates.' });
    }
    const event = await Schedule.create({ ...payload, user: req.user._id });
    const populated = await event.populate('linkedTask', 'title status priority');
    res.status(201).json({ success: true, event: populated });
  } catch (err) {
    console.error('[SCHEDULE CREATE ERROR]', err);
    res.status(500).json({
      error: 'Error creating event.',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// UPDATE event
router.put('/:id', eventValidation, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const updates = cleanPayload(req.body);

    // Prevent rescheduling events to past dates
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const serverTodayStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const clientDate = (typeof req.body?.clientDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(req.body.clientDate))
      ? req.body.clientDate
      : (typeof req.headers['x-client-date'] === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(req.headers['x-client-date']))
        ? req.headers['x-client-date']
        : serverTodayStr;
    const minAllowed = clientDate < serverTodayStr ? clientDate : serverTodayStr;
    if (updates.date && updates.date < minAllowed) {
      return res.status(400).json({ error: 'Events cannot be rescheduled to past dates.' });
    }
    const event = await Schedule.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updates,
      { new: true, runValidators: true }
    ).populate('linkedTask', 'title status priority');

    if (!event) return res.status(404).json({ error: 'Event not found.' });
    res.json({ success: true, event });
  } catch (err) {
    console.error('[SCHEDULE UPDATE ERROR]', err);
    res.status(500).json({ error: 'Error updating event.' });
  }
});

// DELETE event
router.delete('/:id', async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    const event = await Schedule.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!event) return res.status(404).json({ error: 'Event not found.' });

    // Deduct activity if event was completed today
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const serverToday = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const clientDate = (typeof req.headers['x-client-date'] === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(req.headers['x-client-date']))
      ? req.headers['x-client-date']
      : serverToday;

    if ((event.date === clientDate || event.date === serverToday) && event.isCompleted) {
      try {
        await logActivity(req.user._id, { scheduleEventsCompleted: -1 }, event.date);
      } catch (logErr) {
        console.error('[SCHEDULE DELETE LOG ERROR]', logErr);
      }
    }

    res.json({ success: true, message: 'Event deleted.' });
  } catch (err) {
    console.error('[SCHEDULE DELETE ERROR]', err);
    res.status(500).json({ error: 'Error deleting event.' });
  }
});

// TOGGLE complete
router.patch('/:id/complete', async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    const event = await Schedule.findOne({ _id: req.params.id, user: req.user._id });
    if (!event) return res.status(404).json({ error: 'Event not found.' });

    const wasCompleted = event.isCompleted;

    // Strict Day & Window validation: Events can only be completed/modified on their scheduled date and time window
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const fallbackDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const fallbackTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

    const clientDate = (typeof req.body?.clientDate === 'string' && req.body.clientDate) ? req.body.clientDate : fallbackDate;
    const clientTime = (typeof req.body?.clientTime === 'string' && req.body.clientTime) ? req.body.clientTime : fallbackTime;

    // Strict Day isolation: Only today's scheduled events can be completed or modified
    if (clientDate !== event.date) {
      return res.status(400).json({
        error: `Only events scheduled for today (${clientDate}) can be completed or modified.`
      });
    }

    if (!wasCompleted) {
      // Time comparison
      const toMinutes = (timeStr) => {
        if (!timeStr || typeof timeStr !== 'string') return 0;
        const [h = 0, m = 0] = timeStr.split(':').map(Number);
        return h * 60 + m;
      };

      const currentMins = toMinutes(clientTime);
      const startMins = toMinutes(event.startTime);
      let endMins;
      if (event.endTime && typeof event.endTime === 'string') {
        endMins = toMinutes(event.endTime);
      } else {
        endMins = Math.min(startMins + 60, 24 * 60 - 1);
      }

      if (currentMins < startMins) {
        return res.status(400).json({
          error: `Event cannot be completed before its scheduled time (${event.startTime}).`
        });
      }

      if (currentMins > endMins) {
        return res.status(400).json({
          error: `Event scheduled time has already passed (${event.startTime}${event.endTime ? ' - ' + event.endTime : ''}). It can only be completed during its scheduled time.`
        });
      }
    }
    event.isCompleted = !event.isCompleted;
    await event.save();

    // Log activity if toggled to/from completed today
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const serverToday = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    if (event.date === clientDate || event.date === serverToday) {
      try {
        if (!wasCompleted && event.isCompleted) {
          await logActivity(req.user._id, { scheduleEventsCompleted: 1 }, clientDate);
          await updateStreak(req.user._id, clientDate);
        } else if (wasCompleted && !event.isCompleted) {
          await logActivity(req.user._id, { scheduleEventsCompleted: -1 }, clientDate);
        }
      } catch (logErr) {
        console.error('[SCHEDULE TOGGLE LOG ERROR]', logErr);
      }
    }

    res.json({ success: true, event });
  } catch (err) {
    console.error('[SCHEDULE TOGGLE ERROR]', err);
    res.status(500).json({ error: 'Error toggling event.' });
  }
});

module.exports = router;
