const mongoose = require('mongoose');

const pomodoroSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['work', 'short-break', 'long-break'],
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  actualDuration: {
    type: Number, // in seconds - actual time spent
    default: null
  },
  linkedTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    default: null
  },
  note: {
    type: String,
    trim: true,
    maxlength: [500, 'Note cannot exceed 500 characters']
  },
  completed: {
    type: Boolean,
    default: false
  },
  startedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  date: {
    type: String, // YYYY-MM-DD for easy grouping
    default: () => new Date().toISOString().split('T')[0]
  }
}, { timestamps: true });

pomodoroSchema.index({ user: 1, date: 1 });
pomodoroSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Pomodoro', pomodoroSchema);
