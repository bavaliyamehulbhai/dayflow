const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Habit name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  color: {
    type: String,
    default: '#7c6dfa'
  },
  icon: {
    type: String,
    default: '⭐'
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekdays', 'weekends', 'custom'],
    default: 'daily'
  },
  customDays: {
    type: [Number], // 0=Sun, 1=Mon, ..., 6=Sat
    default: []
  },
  targetCount: {
    type: Number,
    default: 1,
    min: 1
  },
  unit: {
    type: String,
    default: 'times',
    maxlength: [20, 'Unit cannot exceed 20 characters']
  },
  completions: [{
    date: { type: String, required: true }, // YYYY-MM-DD format
    count: { type: Number, default: 1 },
    note: { type: String, default: '' }
  }],
  streak: {
    current: { type: Number, default: 0 },
    longest: { type: Number, default: 0 },
    lastCompletedDate: { type: String, default: null }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  order: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

habitSchema.index({ user: 1, isActive: 1 });

module.exports = mongoose.model('Habit', habitSchema);
