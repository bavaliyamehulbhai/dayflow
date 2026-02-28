const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  avatar: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    default: '',
    maxlength: [250, 'Bio cannot exceed 250 characters'],
    trim: true
  },
  avatarGradient: {
    type: String,
    default: 'purple'
  },
  // ─── Security Fields ────────────────────────────────────────────────────
  loginAttempts: {
    type: Number,
    default: 0,
    select: false
  },
  lockUntil: {
    type: Date,
    default: null,
    select: false
  },
  lastLoginAt: {
    type: Date,
    default: null,
    select: false
  },
  lastLoginIp: {
    type: String,
    default: null,
    select: false
  },
  // ─── User Preferences ───────────────────────────────────────────────────
  preferences: {
    theme: { type: String, enum: ['dark', 'light'], default: 'dark' },
    pomodoroWork: { type: Number, default: 25 },
    pomodoroBreak: { type: Number, default: 5 },
    pomodoroLong: { type: Number, default: 15 },
    weekStart: { type: String, enum: ['sun', 'mon'], default: 'mon' },
    timezone: { type: String, default: 'UTC' }
  },
  stats: {
    totalFocusMinutes: { type: Number, default: 0 },
    totalPomodoros: { type: Number, default: 0 },
    tasksCompleted: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    lastActiveDate: { type: Date, default: null }
  },
  badges: [
    {
      id: { type: String, required: true },
      name: { type: String, required: true },
      description: { type: String },
      icon: { type: String },
      tier: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum'], default: 'bronze' },
      earnedAt: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

// Virtual to check if account is locked
userSchema.virtual('isLocked').get(function () {
  return this.lockUntil && this.lockUntil > Date.now();
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Increment failed login attempts, lock if threshold reached
userSchema.methods.incLoginAttempts = async function () {
  const MAX_ATTEMPTS = 5;
  const LOCK_TIME = 15 * 60 * 1000; // 15 minutes

  // If previous lock has expired, reset count and remove lock
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }

  const newAttempts = (this.loginAttempts || 0) + 1;
  const updates = { $inc: { loginAttempts: 1 } };

  // Lock account if max attempts reached
  if (newAttempts >= MAX_ATTEMPTS && !this.isLocked) {
    updates.$set = { lockUntil: new Date(Date.now() + LOCK_TIME) };
  }

  return this.updateOne(updates);
};

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.loginAttempts;
  delete obj.lockUntil;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
