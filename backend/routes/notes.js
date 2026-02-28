const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Note = require('../models/Note');
const { protect } = require('../middleware/auth');
const { logActivity } = require('../services/activityService');

router.use(protect);

// ─── Validation rules ─────────────────────────────────────────────────────────
const noteValidation = [
  body('title').optional().trim().isLength({ max: 200 }).withMessage('Title too long'),
  body('content').optional().trim().isLength({ max: 50000 }).withMessage('Content too long'),
  body('tags').optional().isArray()
];

// GET all notes
router.get('/', async (req, res) => {
  try {
    const { search, tag, archived = false, page = 1, limit = 50 } = req.query;
    const filter = { user: req.user._id, isArchived: archived === 'true' };

    if (tag) filter.tags = tag;
    if (search) {
      // Use text index if search term is available
      filter.$text = { $search: search };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const notes = await Note.find(filter)
      .sort({ isPinned: -1, updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({ success: true, notes });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching notes.' });
  }
});

// GET single note
router.get('/:id', async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
    if (!note) return res.status(404).json({ error: 'Note not found.' });
    res.json({ success: true, note });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching note.' });
  }
});

// CREATE note
router.post('/', noteValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const { title, content, color, tags, linkedTask } = req.body;
    const note = await Note.create({ title, content, color, tags, linkedTask, user: req.user._id });

    // Log activity
    await logActivity(req.user._id, { notesCreated: 1 });

    res.status(201).json({ success: true, note });
  } catch (err) {
    res.status(500).json({ error: 'Error creating note.' });
  }
});

// UPDATE note (auto-saves)
router.put('/:id', noteValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const { title, content, color, tags, linkedTask, isPinned, isArchived } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (color !== undefined) updates.color = color;
    if (tags !== undefined) updates.tags = tags;
    if (linkedTask !== undefined) updates.linkedTask = linkedTask;
    if (isPinned !== undefined) updates.isPinned = isPinned;
    if (isArchived !== undefined) updates.isArchived = isArchived;

    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updates,
      { new: true, runValidators: true }
    );
    if (!note) return res.status(404).json({ error: 'Note not found.' });
    res.json({ success: true, note });
  } catch (err) {
    res.status(500).json({ error: 'Error updating note.' });
  }
});

// DELETE note
router.delete('/:id', async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!note) return res.status(404).json({ error: 'Note not found.' });
    res.json({ success: true, message: 'Note deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting note.' });
  }
});

// TOGGLE pin
router.patch('/:id/pin', async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
    if (!note) return res.status(404).json({ error: 'Note not found.' });
    note.isPinned = !note.isPinned;
    await note.save();
    res.json({ success: true, note });
  } catch (err) {
    res.status(500).json({ error: 'Error toggling pin.' });
  }
});

// ARCHIVE note
router.patch('/:id/archive', async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
    if (!note) return res.status(404).json({ error: 'Note not found.' });
    note.isArchived = !note.isArchived;
    await note.save();
    res.json({ success: true, note });
  } catch (err) {
    res.status(500).json({ error: 'Error archiving note.' });
  }
});

module.exports = router;
