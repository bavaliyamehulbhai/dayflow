const express = require('express');
const router = express.Router();
const Schedule = require('../models/Schedule');
const { protect } = require('../middleware/auth');
const { logActivity } = require('../services/activityService');

router.use(protect);

// GET schedule for date range
router.get('/', async (req, res) => {
  try {
    const { date, startDate, endDate } = req.query;
    const filter = { user: req.user._id };

    if (date) {
      filter.date = date;
    } else if (startDate && endDate) {
      filter.date = { $gte: startDate, $lte: endDate };
    } else {
      // Default: today
      filter.date = new Date().toISOString().split('T')[0];
    }

    const events = await Schedule.find(filter).sort({ startTime: 1 }).populate('linkedTask', 'title status priority');
    res.json({ success: true, events });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching schedule.' });
  }
});

// CREATE event
router.post('/', async (req, res) => {
  try {
    const event = await Schedule.create({ ...req.body, user: req.user._id });
    const populated = await event.populate('linkedTask', 'title status priority');
    res.status(201).json({ success: true, event: populated });
  } catch (err) {
    res.status(500).json({ error: 'Error creating event.' });
  }
});

// UPDATE event
router.put('/:id', async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.user;
    const event = await Schedule.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updates,
      { new: true, runValidators: true }
    ).populate('linkedTask', 'title status priority');
    if (!event) return res.status(404).json({ error: 'Event not found.' });
    res.json({ success: true, event });
  } catch (err) {
    res.status(500).json({ error: 'Error updating event.' });
  }
});

// DELETE event
router.delete('/:id', async (req, res) => {
  try {
    const event = await Schedule.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!event) return res.status(404).json({ error: 'Event not found.' });
    res.json({ success: true, message: 'Event deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting event.' });
  }
});

// TOGGLE complete
router.patch('/:id/complete', async (req, res) => {
  try {
    const event = await Schedule.findOne({ _id: req.params.id, user: req.user._id });
    if (!event) return res.status(404).json({ error: 'Event not found.' });

    const wasCompleted = event.isCompleted;
    event.isCompleted = !event.isCompleted;
    await event.save();

    // Log activity if toggled to completed today
    if (!wasCompleted && event.isCompleted) {
      const today = new Date().toISOString().split('T')[0];
      if (event.date === today) {
        await logActivity(req.user._id, { scheduleEventsCompleted: 1 });
      }
    }

    res.json({ success: true, event });
  } catch (err) {
    res.status(500).json({ error: 'Error toggling event.' });
  }
});

module.exports = router;
