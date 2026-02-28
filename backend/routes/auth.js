const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect, generateToken } = require('../middleware/auth');

// ─── Password strength validator ──────────────────────────────────────────────
const passwordStrengthValidator = body('password')
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters')
  .matches(/[A-Z]/)
  .withMessage('Password must contain at least one uppercase letter')
  .matches(/[0-9]/)
  .withMessage('Password must contain at least one number');

// ─── Register ─────────────────────────────────────────────────────────────────
router.post('/register',
  [
    body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    passwordStrengthValidator
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const { name, email, password } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered.' });
      }

      const user = await User.create({ name, email, password });
      const token = generateToken(user._id);

      res.status(201).json({
        success: true,
        token,
        user: user.toJSON()
      });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ error: 'Server error during registration.' });
    }
  }
);

// ─── Login ────────────────────────────────────────────────────────────────────
router.post('/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').exists().withMessage('Password is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const { email, password } = req.body;
      const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';

      // Find user with security fields
      const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil');
      if (!user) {
        // Don't reveal if email exists — same message
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      // Check if account is locked
      if (user.isLocked) {
        const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
        console.warn(`[SECURITY] Locked account login attempt: ${email} from ${ip}`);
        return res.status(423).json({
          error: `Account temporarily locked due to too many failed attempts. Try again in ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}.`,
          lockedUntil: user.lockUntil
        });
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        await user.incLoginAttempts();
        const attemptsLeft = 5 - (user.loginAttempts + 1);
        console.warn(`[SECURITY] Failed login: ${email} from ${ip} (attempts: ${user.loginAttempts + 1})`);
        if (attemptsLeft <= 0) {
          return res.status(423).json({ error: 'Account locked for 15 minutes due to too many failed attempts.' });
        }
        return res.status(401).json({
          error: `Invalid email or password. ${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} remaining before lockout.`
        });
      }

      // Success — reset attempts and record login
      await User.findByIdAndUpdate(user._id, {
        $set: { loginAttempts: 0, lastLoginAt: new Date(), lastLoginIp: ip },
        $unset: { lockUntil: 1 }
      });

      const token = generateToken(user._id);
      res.json({ success: true, token, user: user.toJSON() });

    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Server error during login.' });
    }
  }
);

// ─── Get Me ───────────────────────────────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── Update Profile ───────────────────────────────────────────────────────────
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, preferences, bio, avatarGradient } = req.body;
    const updates = {};
    if (name) updates.name = name.trim();
    if (bio !== undefined) updates.bio = bio.trim().slice(0, 250);
    if (avatarGradient) updates.avatarGradient = avatarGradient;
    if (preferences) updates.preferences = { ...req.user.preferences, ...preferences };

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: 'Server error updating profile.' });
  }
});


// ─── Change Password ──────────────────────────────────────────────────────────
router.put('/password', protect,
  [
    body('currentPassword').exists().withMessage('Current password required'),
    body('newPassword')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
      .matches(/[0-9]/).withMessage('Password must contain at least one number')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const user = await User.findById(req.user._id).select('+password');
      const isMatch = await user.comparePassword(req.body.currentPassword);
      if (!isMatch) {
        return res.status(400).json({ error: 'Current password is incorrect.' });
      }

      user.password = req.body.newPassword;
      await user.save();

      res.json({ success: true, message: 'Password updated successfully.' });
    } catch (err) {
      res.status(500).json({ error: 'Server error updating password.' });
    }
  }
);

module.exports = router;
