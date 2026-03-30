const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/cryptoUtils');

const noteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
    default: 'Untitled Note'
  },
  content: {
    type: String,
    default: '',
    maxlength: [50000, 'Note content cannot exceed 50000 characters']
  },
  color: {
    type: String,
    default: '#1a1a26'
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  isPinned: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  linkedTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    default: null
  }
}, { timestamps: true });

// ─── Encryption Hooks ───────────────────────────────────────────────────────

// Encrypt before saving
noteSchema.pre('save', function (next) {
  if (this.isModified('title')) {
    this.title = encrypt(this.title);
  }
  if (this.isModified('content')) {
    this.content = encrypt(this.content);
  }
  next();
});

// Decrypt after fetching
noteSchema.post('init', function (doc) {
  try {
    if (doc.title) doc.title = decrypt(doc.title);
    if (doc.content) doc.content = decrypt(doc.content);
  } catch (err) {
    console.error(`Post-init Decryption Error for Note ${doc._id}:`, err.message);
  }
});

noteSchema.index({ user: 1, isPinned: -1, updatedAt: -1 });
noteSchema.index({ user: 1, isArchived: 1 });

// Note: Text index removed to support encryption at rest (privacy first)

module.exports = mongoose.model('Note', noteSchema);
