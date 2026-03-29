const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const slowDown = require('express-slow-down');
const querySanitizer = require('./middleware/querySanitizer');
require('dotenv').config();

// ─── Startup Security Guard ───────────────────────────────────────────────────
if (!process.env.JWT_SECRET) {
  console.error('❌ FATAL: JWT_SECRET is not set in environment variables. Refusing to start.');
  process.exit(1);
}

const app = express();

// ─── Query Sanitizer (Deep NoSQL Defense) ────────────────────────────────────
app.use(querySanitizer);

// ─── Compression (gzip responses) ────────────────────────────────────────────
app.use(compression());

// ─── Cookie Parser ───────────────────────────────────────────────────────────
app.use(cookieParser());

// ─── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet({
  // Content Security Policy: Strict hardening
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"], // Block all inline scripts
      styleSrc: ["'self'", "https://fonts.googleapis.com"], // No 'unsafe-inline'
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"], // White-listed media
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    }
  },
  // Cross-Origin Isolation
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-site' },
  // Permissions Policy: Hardening browser features
  permissionsPolicy: {
    features: {
      camera: ["'none'"],
      microphone: ["'none'"],
      geolocation: ["'none'"],
      payment: ["'none'"],
      usb: ["'none'"]
    }
  },
  // Additional security headers
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
  noSniff: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// ─── Privacy: Log Masking ─────────────────────────────────────────────────────
app.use((req, res, next) => {
  const maskSensitive = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    const masked = { ...obj };
    const sensitiveFields = ['password', 'email', 'newPassword', 'currentPassword', 'token', 'secret'];
    sensitiveFields.forEach(field => {
      if (masked[field]) masked[field] = '********';
    });
    return masked;
  };

  const oldJson = res.json;
  res.json = function (data) {
    // Only log in development
    if (process.env.NODE_ENV === 'development' && data) {
      console.log(`[OUTGOING] ${req.method} ${req.url} - Data:`, JSON.stringify(maskSensitive(data)));
    }
    return oldJson.call(this, data);
  };
  next();
});

// CORS: open in dev, whitelist in production
// ─── CORS Configuration ───────────────────────────────────────────────────────
const allowedOrigins = [
  'https://dayflow-inky.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
  ...(process.env.CLIENT_URLS ? process.env.CLIENT_URLS.split(',').map(o => o.trim()) : []),
  ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL.trim()] : [])
];

app.use(cors({
  origin: (origin, callback) => {
    // In development, allow all local origins. In production, be strict but allow vercel previews.
    // In development, allow all local origins. In production, be strict.
    const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
    const isVercelPreview = origin && origin.includes('dayflow') && origin.endsWith('.vercel.app');
    
    if (isDev || !origin || allowedOrigins.includes(origin) || isVercelPreview) {
      return callback(null, true);
    }
    console.warn(`⚠️ CORS blocked for origin: ${origin}`);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Client-Version', 'X-Requested-With'],
}));

// NoSQL injection sanitization
app.use(mongoSanitize());

// HTTP Parameter Pollution Protection
app.use(hpp());

// ─── Rate Limiting & Speed Limiters ───────────────────────────────────────────
// Speed Limiter: Delay responses after 100 requests (prevents aggressive bots)
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 100,
  delayMs: (hits) => hits * 100, // Increase delay by 100ms per hit
});

// General API limiter — 500 req / 15 min per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' }
});

// Stricter limiter for auth endpoints — 10 req / 15 min per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many security-sensitive attempts. Please try again later.' }
});

// GDPR Export Limiter: 5 req / hour per IP
const exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Data export limit reached. Please try again in an hour.' }
});

app.use('/api/', speedLimiter);
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/2fa', authLimiter);
app.use('/api/auth/export', exportLimiter);

// ─── Body Parser ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ─── CSRF Protection ─────────────────────────────────────────────────────────
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' } });

// We apply CSRF protection to all routes except the login/register/refresh
// because they don't have a token to protect yet, or they ARE the protection.
// Actually, it's better to provide a /api/csrf-token endpoint.
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// For simplicity in this MERN stack, we'll skip global CSRF for now to avoid
// breaking the frontend without a corresponding frontend change, 
// BUT we've added the SameSite: Strict cookie which is the primary defense.
// Instead, I'll add a header check middleware as a modern CSRF defense.

app.use((req, res, next) => {
  const origin = req.headers.origin;
  const isVercelPreview = origin && origin.includes('dayflow') && origin.endsWith('.vercel.app');

  // Use the same allowedOrigins list for CSRF protection
  if (req.method !== 'GET' && origin && !allowedOrigins.includes(origin) && !isVercelPreview) {
    console.warn(`⚠️ CSRF origin check failed for: ${origin}`);
    return res.status(403).json({ error: 'CSRF Protection: Invalid origin.' });
  }
  next();
});

// ─── Logger ───────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── Database Connection (with connection pool) ───────────────────────────────
const mongoOpts = {
  maxPoolSize: 20,      // Up to 20 parallel connections
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dayflow', mongoOpts)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Graceful connection error handling
mongoose.connection.on('error', err => {
  console.error('❌ MongoDB runtime error:', err);
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/habits', require('./routes/habits'));
app.use('/api/schedule', require('./routes/schedule'));
app.use('/api/pomodoro', require('./routes/pomodoro'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/badges', require('./routes/badges'));
app.use('/api/ai', require('./routes/ai'));


// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'DayFlow API is running',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development'
  });
});

// ─── Production Static File Serving ───────────────────────────────────────────
const path = require('path');
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'frontend', 'build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'build', 'index.html'));
  });
}

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  // Don't expose CORS errors in detail
  if (err.message && err.message.startsWith('CORS:')) {
    return res.status(403).json({ error: 'Not allowed by CORS policy.' });
  }
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 DayFlow server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Pool size: 20 connections`);
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
  process.exit(1);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    mongoose.connection.close();
    console.log('🛑 Server shut down.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = app;

