const express = require('express');
const router = express.Router();
const { body, validationResult, query } = require('express-validator');
const mongoose = require('mongoose');
const Schedule = require('../models/Schedule');
const { protect } = require('../middleware/auth');
const { sanitizeFields } = require('../middleware/sanitizer');
const { logActivity } = require('../services/activityService');

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
        // Default: today (server local date string)
        const d = new Date();
        filter.date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }

      const events = await Schedule.find(filter)
        .sort({ startTime: 1 })
        .populate('linkedTask', 'title status priority');

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
    const event = await Schedule.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updates,
      { new: true, runValidators: true }
    ).populate('linkedTask', 'title status priority');

    if (!event) return res.status(404).json({ error: 'Event not found.' });
    res.json({ success: true, event });
  } catch (err) {
    console.error('[SCHEDULE UPDATE ERROR]', err);
    res.status(500).json({
      error: 'Error updating event.',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
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
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (event.date === today && event.isCompleted) {
      try {
        await logActivity(req.user._id, { scheduleEventsCompleted: -1 });
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
    event.isCompleted = !event.isCompleted;
    await event.save();

    // Log activity if toggled to/from completed today
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (event.date === today) {
      try {
        if (!wasCompleted && event.isCompleted) {
          await logActivity(req.user._id, { scheduleEventsCompleted: 1 });
        } else if (wasCompleted && !event.isCompleted) {
          await logActivity(req.user._id, { scheduleEventsCompleted: -1 });
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
