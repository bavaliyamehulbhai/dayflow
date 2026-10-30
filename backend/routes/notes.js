const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { body, validationResult } = require("express-validator");
const Note = require("../models/Note");
const Task = require("../models/Task");
const { protect } = require("../middleware/auth");
const { sanitizeFields } = require("../middleware/sanitizer");
const { logActivity } = require("../services/activityService");
const { cacheMiddleware, clearCache } = require("../middleware/cache");
const { decrypt } = require("../utils/cryptoUtils");

router.use(protect);

// Helper to ensure returned note has decrypted title & content
const formatNoteResponse = (noteDoc) => {
  if (!noteDoc) return null;
  const noteObj = noteDoc.toObject ? noteDoc.toObject() : { ...noteDoc };
  if (noteObj.title) noteObj.title = decrypt(noteObj.title);
  if (noteObj.content) noteObj.content = decrypt(noteObj.content);
  return noteObj;
};

// ─── Validation rules ─────────────────────────────────────────────────────────
const noteValidation = [
  sanitizeFields(["title", "content"]),
  body("title")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Title too long (max 200)"),
  body("content")
    .optional()
    .trim()
    .isLength({ max: 50000 })
    .withMessage("Content too long (max 50000)"),
  body("tags").optional().isArray().withMessage("Tags must be an array"),
  body("tags.*")
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage("Tag too long (max 30)"),
];

// GET all notes
router.get("/", async (req, res) => {
  try {
    const { search, tag, archived = "false", page = 1, limit = 50 } = req.query;
    const isArchivedBool = archived === "true";
    const filter = { user: req.user._id, isArchived: isArchivedBool };

    if (tag && typeof tag === "string" && tag.trim()) {
      filter.tags = tag.trim();
    }

    // Retrieve notes for user (post-init hook automatically decrypts title & content)
    let notes = await Note.find(filter)
      .sort({ isPinned: -1, updatedAt: -1 })
      .populate("linkedTask", "title status priority");

    // Perform case-insensitive search in-memory to handle encrypted fields at rest
    if (search && typeof search === "string" && search.trim()) {
      const q = search.trim().toLowerCase();
      notes = notes.filter((n) => {
        const titleMatch = (n.title || "").toLowerCase().includes(q);
        const contentMatch = (n.content || "").toLowerCase().includes(q);
        const tagsMatch = Array.isArray(n.tags) && n.tags.some((t) => (t || "").toLowerCase().includes(q));
        return titleMatch || contentMatch || tagsMatch;
      });
    }

    const total = notes.length;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;
    const paginatedNotes = notes.slice(skip, skip + limitNum).map(formatNoteResponse);

    res.json({
      success: true,
      notes: paginatedNotes,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
    });
  } catch (err) {
    console.error("Error fetching notes:", err);
    res.status(500).json({ error: "Error fetching notes." });
  }
});

// GET single note
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid note ID format." });
    }
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id })
      .populate("linkedTask", "title status priority");
    if (!note) return res.status(404).json({ error: "Note not found." });
    res.json({ success: true, note: formatNoteResponse(note) });
  } catch (err) {
    res.status(500).json({ error: "Error fetching note." });
  }
});

// CREATE note
router.post("/", noteValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ error: errors.array()[0].msg });

    const { title, content, color, tags, linkedTask } = req.body;
    let sanitizedLinkedTask = null;
    if (linkedTask && mongoose.Types.ObjectId.isValid(linkedTask)) {
      const taskDoc = await Task.findOne({ _id: linkedTask, user: req.user._id });
      if (taskDoc) sanitizedLinkedTask = taskDoc._id;
    }

    const note = await Note.create({
      title: title || "Untitled Note",
      content: content || "",
      color: color || "#7c6dfa",
      tags: Array.isArray(tags) ? tags : [],
      linkedTask: sanitizedLinkedTask,
      user: req.user._id,
    });

    if (sanitizedLinkedTask) {
      await note.populate("linkedTask", "title status priority");
    }

    // Log activity
    await logActivity(req.user._id, { notesCreated: 1 });
    clearCache(req.user._id);

    res.status(201).json({ success: true, note: formatNoteResponse(note) });
  } catch (err) {
    console.error("Error creating note:", err);
    res.status(500).json({ error: "Error creating note." });
  }
});

// UPDATE note (uses note.save() to trigger AES encryption pre('save') hook)
router.put("/:id", noteValidation, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid note ID format." });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ error: errors.array()[0].msg });

    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
    if (!note) return res.status(404).json({ error: "Note not found." });

    const { title, content, color, tags, linkedTask, isPinned, isArchived } = req.body;

    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;
    if (color !== undefined) note.color = color;
    if (tags !== undefined) note.tags = Array.isArray(tags) ? tags : [];
    if (linkedTask !== undefined) {
      let sanitizedLinkedTask = null;
      if (linkedTask && mongoose.Types.ObjectId.isValid(linkedTask)) {
        const taskDoc = await Task.findOne({ _id: linkedTask, user: req.user._id });
        if (taskDoc) sanitizedLinkedTask = taskDoc._id;
      }
      note.linkedTask = sanitizedLinkedTask;
    }
    if (isPinned !== undefined) note.isPinned = Boolean(isPinned);
    if (isArchived !== undefined) note.isArchived = Boolean(isArchived);

    await note.save();

    if (note.linkedTask) {
      await note.populate("linkedTask", "title status priority");
    }

    clearCache(req.user._id);
    res.json({ success: true, note: formatNoteResponse(note) });
  } catch (err) {
    console.error("Error updating note:", err);
    res.status(500).json({ error: "Error updating note." });
  }
});

// DELETE note
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid note ID format." });
    }
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!note) return res.status(404).json({ error: "Note not found." });
    clearCache(req.user._id);
    res.json({ success: true, message: "Note deleted." });
  } catch (err) {
    res.status(500).json({ error: "Error deleting note." });
  }
});

// TOGGLE pin
router.patch("/:id/pin", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid note ID format." });
    }
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
    if (!note) return res.status(404).json({ error: "Note not found." });
    note.isPinned = !note.isPinned;
    await note.save();
    clearCache(req.user._id);
    res.json({ success: true, note: formatNoteResponse(note) });
  } catch (err) {
    res.status(500).json({ error: "Error toggling pin." });
  }
});

// TOGGLE archive
router.patch("/:id/archive", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid note ID format." });
    }
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
    if (!note) return res.status(404).json({ error: "Note not found." });
    note.isArchived = !note.isArchived;
    await note.save();
    clearCache(req.user._id);
    res.json({ success: true, note: formatNoteResponse(note) });
  } catch (err) {
    res.status(500).json({ error: "Error archiving note." });
  }
});

module.exports = router;
