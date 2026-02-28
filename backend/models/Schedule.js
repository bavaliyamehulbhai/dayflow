const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  date: {
    type: String, // YYYY-MM-DD
    required: [true, 'Date is required']
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: String,
    default: null
  },
  color: {
    type: String,
    default: '#7c6dfa'
  },
  category: {
    type: String,
    enum: ['work', 'personal', 'health', 'learning', 'social', 'other'],
    default: 'other'
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringDays: {
    type: [Number],
    default: []
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  reminder: {
    type: Number, // minutes before
    default: null
  },
  linkedTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    default: null
  }
}, { timestamps: true });

scheduleSchema.index({ user: 1, date: 1 });

module.exports = mongoose.model('Schedule', scheduleSchema);
