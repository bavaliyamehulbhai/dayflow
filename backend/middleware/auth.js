const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ISSUER = 'dayflow-api';

// Crash at startup if JWT_SECRET is not set
if (!JWT_SECRET) {
  console.error('❌ FATAL: JWT_SECRET environment variable is not set. Server cannot start securely.');
  process.exit(1);
}

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'Not authorized. No token provided.' });
    }

    // Verify token with issuer claim
    const decoded = jwt.verify(token, JWT_SECRET, { issuer: JWT_ISSUER });

    // Check if token is blacklisted
    const isBlacklisted = await require('../models/Blacklist').findOne({ token });
    if (isBlacklisted) {
      return res.status(401).json({ error: 'Session invalidated. Please login again.' });
    }

    // Fetch user including lockout fields
    const user = await User.findById(decoded.id).select('-password +lockUntil +loginAttempts');
    if (!user) {
      return res.status(401).json({ error: 'User not found. Token invalid.' });
    }

    // Block locked accounts from using existing sessions
    if (user.isLocked) {
      const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(423).json({
        error: `Account is temporarily locked. Try again in ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}.`,
        lockedUntil: user.lockUntil
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please login again.' });
    }
    if (error.name === 'NotBeforeError') {
      return res.status(401).json({ error: 'Token not yet active.' });
    }
    res.status(500).json({ error: 'Server error during authentication.' });
  }
};

// Generate short-lived Access Token (15 minutes)
const generateToken = (id) => {
  if (!JWT_SECRET) throw new Error('JWT_SECRET is not set');
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: '15m',
    issuer: JWT_ISSUER
  });
};

// Generate long-lived Refresh Token (7 days)
const generateRefreshToken = (id) => {
  if (!JWT_SECRET) throw new Error('JWT_SECRET is not set');
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: '7d',
    issuer: JWT_ISSUER
  });
};

module.exports = { protect, generateToken, generateRefreshToken };
