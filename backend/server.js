const cluster = require("cluster");
const os = require("os");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");
const slowDown = require("express-slow-down");
const querySanitizer = require("./middleware/querySanitizer");
require("dotenv").config();

// ─── Startup Security Guard ───────────────────────────────────────────────────
if (!process.env.JWT_SECRET) {
  console.error(
    "❌ FATAL: JWT_SECRET is not set in environment variables. Refusing to start.",
  );
  process.exit(1);
}

const app = express();

// Trust proxy for rate limiting (essential for Render/CRA proxies)
app.set("trust proxy", 1);

// ─── Query Sanitizer (Deep NoSQL Defense) ────────────────────────────────────
app.use(querySanitizer);

// ─── Compression (gzip responses) ────────────────────────────────────────────
app.use(compression());

// ─── Cookie Parser ───────────────────────────────────────────────────────────
app.use(cookieParser());

// ─── Security Middleware ───────────────────────────────────────────────────────
app.use(
  helmet({
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
      },
    },
    // Cross-Origin Isolation
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "same-site" },
    // Permissions Policy: Hardening browser features
    permissionsPolicy: {
      features: {
        camera: ["'none'"],
        microphone: ["'none'"],
        geolocation: ["'none'"],
        payment: ["'none'"],
        usb: ["'none'"],
      },
    },
    // Additional security headers
    dnsPrefetchControl: { allow: false },
    frameguard: { action: "deny" },
    permittedCrossDomainPolicies: { permittedPolicies: "none" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true,
    noSniff: true,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }),
);

// ─── Privacy: Dev Logging ─────────────────────────────────────────────────────
// The expensive res.json patch has been removed. Sensitive data scrubbing
// is now handled natively via Mongoose userSchema.toJSON()
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    const oldJson = res.json;
    res.json = function (data) {
      console.log(`[OUTGOING] ${req.method} ${req.url}`);
      return oldJson.call(this, data);
    };
    next();
  });
}

// CORS: open in dev, whitelist in production
// ─── CORS Configuration ───────────────────────────────────────────────────────
const allowedOrigins = [
  "https://dayflow-inky.vercel.app",
  "http://localhost:3000",
  "http://localhost:5000",
  "http://localhost:5173",
  ...(process.env.CLIENT_URLS
    ? process.env.CLIENT_URLS.split(",").map((o) => o.trim())
    : []),
  ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL.trim()] : []),
];

app.use(
  cors({
    origin: (origin, callback) => {
      // In development, allow all local origins. In production, be strict but allow vercel previews.
      // In development, allow all local origins. In production, be strict.
      const isDev =
        !process.env.NODE_ENV || process.env.NODE_ENV === "development";
      const isVercelPreview =
        origin && origin.includes("dayflow") && origin.endsWith(".vercel.app");

      if (
        isDev ||
        !origin ||
        allowedOrigins.includes(origin) ||
        isVercelPreview
      ) {
        return callback(null, true);
      }
      console.warn(`⚠️ CORS blocked for origin: ${origin}`);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-CSRF-Token",
      "X-Client-Version",
      "X-Requested-With",
    ],
  }),
);

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
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => !process.env.NODE_ENV || process.env.NODE_ENV === 'development',
  message: { 
    error: "Too many requests. Please try again later.",
    code: "RATE_LIMIT_EXCEEDED"
  },
});

// Stricter limiter for auth endpoints — 10 req / 15 min per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many security-sensitive attempts. Please try again later. Safety lockout active.",
    code: "AUTH_RATE_LIMIT_EXCEEDED"
  },
});

// GDPR Export Limiter: 5 req / hour per IP
const exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    error: "Data export limit reached. Please try again in an hour.",
    code: "EXPORT_LIMIT_EXCEEDED"
  },
});

app.use("/api/", speedLimiter);
app.use("/api/", apiLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/2fa", authLimiter);
app.use("/api/auth/export", exportLimiter);

// ─── Body Parser ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// ─── CSRF Protection ─────────────────────────────────────────────────────────
const csrf = require("csurf");
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  },
});

// We apply CSRF protection to all routes except the login/register/refresh
// because they don't have a token to protect yet, or they ARE the protection.
// Actually, it's better to provide a /api/csrf-token endpoint.
app.get("/api/csrf-token", csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// For simplicity in this MERN stack, we'll skip global CSRF for now to avoid
// breaking the frontend without a corresponding frontend change,
// BUT we've added the SameSite: Strict cookie which is the primary defense.
// Instead, I'll add a header check middleware as a modern CSRF defense.

app.use((req, res, next) => {
  const origin = req.headers.origin;
  const isVercelPreview =
    origin && origin.includes("dayflow") && origin.endsWith(".vercel.app");
  const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === "development";
  const isLocalDevOrigin =
    origin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/.test(origin);

  // Use the same allowedOrigins list for CSRF protection
  if (
    req.method !== "GET" &&
    origin &&
    !allowedOrigins.includes(origin) &&
    !allowedOrigins.includes(origin.replace(/\/$/, "")) &&
    !isVercelPreview &&
    !(isDev && isLocalDevOrigin)
  ) {
    console.warn(`⚠️ CSRF origin check failed for: ${origin}`);
    return res.status(403).json({ error: "CSRF Protection: Invalid origin." });
  }
  next();
});

// ─── Logger ───────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ─── Database Connection (with dynamic connection pool) ───────────────────────────────
// ─── Database Connection Helper ───────────────────────────────────────────────────
const connectDB = async (numWorkers) => {
  const mongoOpts = {
    maxPoolSize: Math.max(2, Math.floor(100 / numWorkers)), // Dynamically bound to avoid Free Tier limits
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/dayflow",
      mongoOpts,
    );
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    // In production, we might want to exit if DB fails
    if (process.env.NODE_ENV === "production") process.exit(1);
  }
};

// Graceful connection error handling
mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB runtime error:", err);
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", require("./routes/auth"));
app.use("/api/tasks", require("./routes/tasks"));
app.use("/api/habits", require("./routes/habits"));
app.use("/api/schedule", require("./routes/schedule"));
app.use("/api/pomodoro", require("./routes/pomodoro"));
app.use("/api/notes", require("./routes/notes"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/badges", require("./routes/badges"));
app.use("/api/ai", require("./routes/ai"));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  const buildPath = path.join(__dirname, "..", "frontend", "build");
  const distPath = path.join(__dirname, "..", "frontend", "dist");
  
  res.json({
    status: "ok",
    message: "DayFlow API is running",
    timestamp: new Date().toISOString(),
    mongodb:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    environment: process.env.NODE_ENV || "development",
    frontendBuild: {
      expectedPath: buildPath,
      exists: fs.existsSync(buildPath),
      alternativeDistExists: fs.existsSync(distPath)
    }
  });
});

// ─── Production Static File Serving ───────────────────────────────────────────
const path = require("path");
const fs = require("fs");

if (process.env.NODE_ENV === "production") {
  const buildPath = path.join(__dirname, "..", "frontend", "build");
  
  // Debug log to help identify path issues on Render
  if (fs.existsSync(buildPath)) {
    console.log(`✅ Frontend build found at: ${buildPath}`);
  } else {
    console.error(`❌ WARNING: Frontend build NOT found at: ${buildPath}`);
    console.error(`   Current __dirname: ${__dirname}`);
    console.log("   Checking alternative path: ../frontend/dist (for Vite apps)");
    if (fs.existsSync(path.join(__dirname, "..", "frontend", "dist"))) {
       console.log("   ✅ Found 'dist' folder instead of 'build'.");
    }
  }

  app.use(express.static(buildPath));
  app.get("*", (req, res) => {
    const indexPath = path.join(buildPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send("Frontend build not found. Please ensure 'npm run build' completed successfully.");
    }
  });
}

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  // Don't expose CORS errors in detail
  if (err.message && err.message.startsWith("CORS:")) {
    return res.status(403).json({ error: "Not allowed by CORS policy." });
  }
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// ─── Master / Worker Clustering ───────────────────────────────────────────────
// On Render Free tier, we MUST limit workers because of 512MB RAM limit.
// Render sets WEB_CONCURRENCY=1 by default.
const getWorkerCount = () => {
  // Always respect WEB_CONCURRENCY if explicitly set (e.g. by Render)
  if (process.env.WEB_CONCURRENCY) return parseInt(process.env.WEB_CONCURRENCY);
  
  // For production environments not setting WEB_CONCURRENCY, default to 1 for safety
  if (process.env.NODE_ENV === "production") return 1;
  
  // For local development, use 1 worker to ensure stability on Windows and save RAM
  // Only use multiple workers if you are specifically testing clustering logic.
  return 1; 
};

const numWorkers = getWorkerCount();

console.log(`[STARTUP] Environment: ${process.env.NODE_ENV || "development"}`);
console.log(`[STARTUP] Configured Workers: ${numWorkers}`);
console.log(`[STARTUP] Trust Proxy: ${app.get("trust proxy")}`);

if (cluster.isPrimary && numWorkers > 1) {
  console.log(
    `🛡️ Primary ${process.pid} is running. Spawning ${numWorkers} workers...`,
  );

  // Fork workers
  for (let i = 0; i < numWorkers; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.warn(
      `⚠️ Worker ${worker.process.pid} died. Spawning replacement...`,
    );
    cluster.fork();
  });
} else {
  // ─── Start Server (Worker Process or Single Process) ─────────────────────────
  // Connect to database ONLY in the process that will handle requests
  connectDB(numWorkers);

  const PORT = process.env.PORT || 5000;
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 DayFlow Worker ${process.pid} running on port ${PORT}`);
  });

  server.on("error", (err) => {
    console.error(`❌ Worker ${process.pid} error:`, err);
    process.exit(1);
  });

  // Graceful shutdown for workers
  const gracefulShutdown = (signal) => {
    console.log(
      `\n🛑 Worker ${process.pid} received ${signal}. Shutting down...`,
    );
    server.close(() => {
      mongoose.connection.close();
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
}

module.exports = app;
