const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: String, // YYYY-MM-DD
        required: true,
        index: true
    },
    tasksCompleted: {
        type: Number,
        default: 0
    },
    focusMinutes: {
        type: Number,
        default: 0
    },
    pomodoros: {
        type: Number,
        default: 0
    },
    habitsCompleted: {
        type: Number,
        default: 0
    },
    notesCreated: {
        type: Number,
        default: 0
    },
    scheduleEventsCompleted: {
        type: Number,
        default: 0
    },
    score: {
        type: Number,
        default: 0
    },
    intensity: {
        type: Number, // Composite score for visual intensity (0-4)
        default: 0
    }
}, { timestamps: true });

// Ensure unique entry per user per day
activitySchema.index({ user: 1, date: 1 }, { unique: true });

// Intensity is now handled by activityService.js for relative scaling
activitySchema.pre('save', function (next) {
    next();
});

module.exports = mongoose.model('Activity', activitySchema);
