const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Session = require('../models/Session');
const { protect, generateToken, generateRefreshToken } = require('../middleware/auth');
const logSecurityEvent = require('../utils/logger');
const sendEmail = require('../utils/sendEmail');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const crypto = require('crypto');

// ─── Helper: Send token response & Track Session ──────────────────────────────
const sendTokenResponse = async (user, statusCode, res, req) => {
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  // Track session in DB
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  await Session.create({
    user: user._id,
    refreshToken,
    ip,
    userAgent,
    expiresAt: cookieOptions.expires
  });

  res
    .status(statusCode)
    .cookie('refreshToken', refreshToken, cookieOptions)
    .json({
      success: true,
      token,
      user: user.toJSON()
    });
};

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

      // Create user
      const user = await User.create({ name, email, password });

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      user.verificationToken = verificationToken;
      user.verificationTokenExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
      await user.save();

      // Send verification email
      const verifyUrl = `${req.protocol}://${req.get('host')}/api/auth/verify-email/${verificationToken}`;
      const message = `Welcome to DayFlow! Please verify your email by clicking: ${verifyUrl}`;

      try {
        await sendEmail({
          email: user.email,
          subject: 'DayFlow Email Verification',
          message
        });
      } catch (err) {
        console.error('Error sending verification email:', err);
      }

      await sendTokenResponse(user, 201, res, req);
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
        await logSecurityEvent({ userId: user._id, action: 'LOGIN_FAILED', status: 'failure', req, details: { email } });

        const attemptsLeft = 5 - (user.loginAttempts + 1);
        console.warn(`[SECURITY] Failed login: ${email} from ${ip} (attempts: ${user.loginAttempts + 1})`);
        if (attemptsLeft <= 0) {
          return res.status(423).json({ error: 'Account locked for 15 minutes due to too many failed attempts.' });
        }
        return res.status(401).json({
          error: `Invalid email or password. ${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} remaining before lockout.`
        });
      }

      // Check if 2FA is enabled
      if (user.twoFactorEnabled) {
        // Return a partial success indicating 2FA is required
        // We don't issue the full token yet
        return res.json({
          success: true,
          twoFactorRequired: true,
          userId: user._id // Used for subsequent 2FA verification
        });
      }

      // Success — reset attempts and record login
      await User.findByIdAndUpdate(user._id, {
        $set: { loginAttempts: 0, lastLoginAt: new Date(), lastLoginIp: ip },
        $unset: { lockUntil: 1 }
      });

      await logSecurityEvent({ userId: user._id, action: 'LOGIN_SUCCESS', req });

      // Suspicious Login Alert: Check if IP or UA is new
      if (user.lastLoginIp && user.lastLoginIp !== ip) {
        await sendEmail({
          email: user.email,
          subject: 'DayFlow: New Login Detected',
          message: `A new login was detected for your account from IP: ${ip}. If this wasn't you, please change your password immediately.`
        });
      }

      await sendTokenResponse(user, 200, res, req);
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Server error during login.' });
    }
  }
);

// ─── Verify Email ─────────────────────────────────────────────────────────────
router.get('/verify-email/:token', async (req, res) => {
  try {
    const user = await User.findOne({
      verificationToken: req.params.token,
      verificationTokenExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification token.' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpire = undefined;
    await user.save();

    res.json({ success: true, message: 'Email verified successfully! You now have full access.' });
  } catch (err) {
    res.status(500).json({ error: 'Error verifying email.' });
  }
});

// ─── List Active Sessions ─────────────────────────────────────────────────────
router.get('/sessions', protect, async (req, res) => {
  try {
    const sessions = await Session.find({ user: req.user._id }).sort({ lastActive: -1 });
    res.json({ success: true, sessions });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching sessions.' });
  }
});

// ─── Revoke Session ───────────────────────────────────────────────────────────
router.delete('/sessions/:id', protect, async (req, res) => {
  try {
    const session = await Session.findOne({ _id: req.params.id, user: req.user._id });
    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    // Blacklist the refresh token
    const decoded = require('jsonwebtoken').decode(session.refreshToken);
    if (decoded) {
      await require('../models/Blacklist').create({
        token: session.refreshToken,
        expiresAt: new Date(decoded.exp * 1000)
      });
    }

    await session.deleteOne();
    res.json({ success: true, message: 'Session revoked successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Error revoking session.' });
  }
});

// ─── 2FA Setup ────────────────────────────────────────────────────────────────
router.post('/2fa/setup', protect, async (req, res) => {
  try {
    if (req.user.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA is already enabled.' });
    }

    const secret = speakeasy.generateSecret({
      name: `DayFlow:${req.user.email}`,
      issuer: 'DayFlow'
    });

    // We store the secret temporarily in the user object (select: false fields)
    // but don't enable it until verified
    await User.findByIdAndUpdate(req.user._id, {
      twoFactorSecret: secret.base32
    });

    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

    res.json({
      success: true,
      qrCode: qrCodeUrl,
      secret: secret.base32 // For manual entry
    });
  } catch (err) {
    res.status(500).json({ error: 'Error setting up 2FA.' });
  }
});

// ─── 2FA Verify & Enable ──────────────────────────────────────────────────────
router.post('/2fa/verify', protect, async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user._id).select('+twoFactorSecret');

    if (!user.twoFactorSecret) {
      return res.status(400).json({ error: '2FA setup not initiated.' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token
    });

    if (!verified) {
      return res.status(400).json({ error: 'Invalid verification code.' });
    }

    // Generate recovery codes
    const recoveryCodes = Array.from({ length: 8 }, () =>
      require('crypto').randomBytes(4).toString('hex').toUpperCase()
    );

    user.twoFactorEnabled = true;
    user.twoFactorRecoveryCodes = recoveryCodes;
    await user.save();

    await logSecurityEvent({ userId: user._id, action: '2FA_ENABLE', req });

    res.json({
      success: true,
      message: '2FA enabled successfully.',
      recoveryCodes
    });
  } catch (err) {
    res.status(500).json({ error: 'Error verifying 2FA.' });
  }
});

// ─── 2FA Login ────────────────────────────────────────────────────────────────
router.post('/2fa/login', async (req, res) => {
  try {
    const { userId, token } = req.body;
    const user = await User.findById(userId).select('+twoFactorSecret');

    if (!user || !user.twoFactorEnabled) {
      return res.status(401).json({ error: 'Invalid request.' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token
    });

    if (!verified) {
      // Check recovery codes
      const recoveryIndex = user.twoFactorRecoveryCodes.indexOf(token);
      if (recoveryIndex === -1) {
        return res.status(401).json({ error: 'Invalid code.' });
      }
      // Use recovery code — remove it after use
      user.twoFactorRecoveryCodes.splice(recoveryIndex, 1);
      await user.save();
    }

    // Success — mark login
    await User.findByIdAndUpdate(user._id, {
      $set: { loginAttempts: 0, lastLoginAt: new Date(), lastLoginIp: req.ip }
    });

    await logSecurityEvent({ userId: user._id, action: 'LOGIN_SUCCESS', req, details: { method: '2FA' } });
    await sendTokenResponse(user, 200, res, req);
  } catch (err) {
    res.status(500).json({ error: 'Error during 2FA login.' });
  }
});

// ─── Refresh Token ────────────────────────────────────────────────────────────
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token provided.' });
    }

    // Verify refresh token
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET, { issuer: 'dayflow-api' });

    // Check if blacklisted (optional for refresh tokens, but good for forced logouts)
    const isBlacklisted = await require('../models/Blacklist').findOne({ token: refreshToken });
    if (isBlacklisted) {
      return res.status(401).json({ error: 'Session invalidated.' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User not found.' });
    }

    // Refresh Token Rotation: Delete old session and issue new tokens
    await Session.deleteOne({ refreshToken });
    await sendTokenResponse(user, 200, res, req);
  } catch (err) {
    res.status(401).json({ error: 'Invalid refresh token.' });
  }
});

// ─── Logout ───────────────────────────────────────────────────────────────────
router.post('/logout', protect, async (req, res) => {
  try {
    const token = req.headers.authorization ? req.headers.authorization.split(' ')[1] : req.cookies.accessToken;
    if (token) {
      const decoded = require('jsonwebtoken').decode(token);
      if (decoded) {
        // Blacklist token until its natural expiry
        await require('../models/Blacklist').create({
          token,
          expiresAt: new Date(decoded.exp * 1000)
        });
      }
    }

    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Error during logout.' });
  }
});

// ─── Delete Account (Right to be Forgotten) ──────────────────────────────────
router.delete('/account', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // Cascading delete
    await Promise.all([
      require('../models/Task').deleteMany({ user: userId }),
      require('../models/Note').deleteMany({ user: userId }),
      require('../models/Habit').deleteMany({ user: userId }),
      require('../models/Schedule').deleteMany({ user: userId }),
      require('../models/User').findByIdAndDelete(userId)
    ]);

    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.json({ success: true, message: 'Account and all associated data deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error deleting account.' });
  }
});

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

      // Invalidate current session after password change
      const token = req.headers.authorization.split(' ')[1];
      const decoded = require('jsonwebtoken').decode(token);
      await require('../models/Blacklist').create({
        token,
        expiresAt: new Date(decoded.exp * 1000)
      });

      res.json({ success: true, message: 'Password updated successfully. Please login again.' });
    } catch (err) {
      res.status(500).json({ error: 'Server error updating password.' });
    }
  }
);

// ─── Security History ─────────────────────────────────────────────────────────
router.get('/security-history', protect, async (req, res) => {
  try {
    const logs = await require('../models/AuditLog')
      .find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching security logs.' });
  }
});

// ─── Data Export (GDPR Portability) ───────────────────────────────────────────
router.get('/export', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch all user data
    const [tasks, notes, habits, schedules, pomodoros, logs] = await Promise.all([
      require('../models/Task').find({ user: userId }),
      require('../models/Note').find({ user: userId }),
      require('../models/Habit').find({ user: userId }),
      require('../models/Schedule').find({ user: userId }),
      require('../models/Pomodoro').find({ user: userId }),
      require('../models/AuditLog').find({ user: userId })
    ]);

    const exportData = {
      profile: req.user.toJSON(),
      tasks,
      notes,
      habits,
      schedules,
      pomodoros,
      securityLogs: logs,
      exportedAt: new Date().toISOString()
    };

    await logSecurityEvent({ userId, action: 'DATA_EXPORT', req });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=dayflow_export_${userId}.json`);
    res.json(exportData);
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ error: 'Error exporting your data.' });
  }
});

module.exports = router;
