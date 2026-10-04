# ⚡ DayFlow v2.0 — High-Performance Cognitive Life Operating System

[![React](https://img.shields.io/badge/React-18.x-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-11.x-0055FF?style=for-the-badge&logo=framer&logoColor=white)](https://www.framer.com/motion/)
[![TanStack Query](https://img.shields.io/badge/TanStack_Query-v5-FF4154?style=for-the-badge&logo=reactquery&logoColor=white)](https://tanstack.com/query)

**DayFlow v2.0** is an ultra-premium, full-stack personal productivity and cognitive alignment operating system built on the **MERN** stack (MongoDB, Express, React, Node.js). Designed for high-performing knowledge workers, it seamlessly integrates tasks, daily rituals, schedule time-blocking, flow-state intervals, and neural notes into a single, unified, 100% lag-free interface.

---

## 🌟 Key Highlights & Architecture

- **⚡ 100% Lag-Free Architecture**: Hardware-accelerated GPU rendering, zero expensive backdrop-filter thrashing, layout containment (`content-visibility: auto`), and debounced/deferred state sync.
- **🎨 DayFlow v2.0 Luxury Aesthetic**: Syne & Plus Jakarta Sans typography, deep-space dark themes, crisp glass borders, iridescent accents, and haptic-feel micro-interactions.
- **🛡 Enterprise-Grade Security**: HTTP-only dual-token (Access + Refresh) authentication, multi-session management, brute-force lockout, privacy blur mode, and session inactivity guard.
- **📈 12-Month GitHub-Style Telemetry**: Interactive activity matrix tracking tasks, pomodoro minutes, and rituals completed over 365 days.
- **🤖 Adaptive AI Coaching & Gamification**: Smart productivity suggestions and unlocked achievement badges.

---

## ✨ Modules & Capabilities

| Module | Route | Key Features |
|---|---|---|
| **🌐 Landing Page** | `/` | Ultra-premium presentation showcase, feature spotlights, live interactive preview, dynamic stats, and direct authentication entry. |
| **📊 Neuro Dashboard** | `/dashboard` | Live cognitive progress, 12-month activity heatmap, daily completion trajectory, quick actions, and AI daily briefings. |
| **✅ Tasks & Objectives** | `/tasks` | Multi-view filtering (pending, in-progress, completed), deferred instant search, subtasks with progress tracking, priority tags, and bulk deletion/status actions. |
| **🔄 Habits & Rituals** | `/habits` | 7-day completion matrix, streak multipliers, weekly frequency schedules, color/icon identity, and activity logging. |
| **⏱ Flow State Pomodoro** | `/pomodoro` | Focus, short-break, and long-break modes, linked task accountability, ambient audio generators, and automatic session telemetry. |
| **📅 Schedule & Agenda** | `/schedule` | Daily time-blocking calendar, real-time status indicators (past, current, future), task association, and category domain grouping. |
| **📝 Notes & Knowledge** | `/notes` | Multi-tag indexing, instant client & server search, auto-save synchronization, pinning, and memory archiving. |
| **⚙️ Profile & Settings** | `/profile` | Pomodoro interval preferences, active login sessions management, account data export, and security audit log. |
| **🔒 Security Guard** | System | Auto-lock screen after 10 minutes of inactivity, tab-switch privacy protection, and sensitive content toggle (`SensitivityShield`). |

---

## 🏗 Project Architecture

```
dayflow/
├── backend/
│   ├── middleware/
│   │   ├── auth.js            # Dual-token JWT verification & extraction
│   │   ├── cache.js           # In-memory Redis-like response cache
│   │   └── sanitizer.js       # ReDoS & XSS protection
│   ├── models/
│   │   ├── User.js            # User schema, security lockout, preferences
│   │   ├── Session.js         # Active device sessions & refresh tokens
│   │   ├── Task.js            # Tasks with subtasks, tags, text search
│   │   ├── Habit.js           # Habit streaks and completion timestamps
│   │   ├── Schedule.js        # Scheduled agenda events & domains
│   │   ├── Pomodoro.js        # Focus sessions & focus minutes
│   │   ├── Note.js            # Notes with tag indexing
│   │   ├── Badge.js           # Gamification badges & milestones
│   │   └── ActivityLog.js     # Daily activity tracking
│   ├── routes/
│   │   ├── auth.js            # Authentication, sessions, 2FA, data export
│   │   ├── tasks.js           # Tasks CRUD, bulk operations, statistics
│   │   ├── habits.js          # Rituals, streak calculation, completions
│   │   ├── schedule.js        # Schedule events, time-blocks
│   │   ├── pomodoro.js        # Pomodoro sessions, stats aggregation
│   │   ├── notes.js           # Notes CRUD, multi-field regex search
│   │   ├── dashboard.js       # Aggregated telemetry & 12-month heatmap
│   │   ├── badges.js          # Achievement badges
│   │   └── ai.js              # Productivity recommendations engine
│   ├── services/
│   │   ├── activityService.js # Daily activity aggregation
│   │   ├── badgeService.js    # Automated achievement unlocks
│   │   └── streakService.js   # User streak calculation
│   └── server.js              # Express app, helmet, CORS, MongoDB connection
│
└── frontend/
    └── src/
        ├── components/
        │   ├── layout/
        │   │   ├── Layout.js            # Responsive shell with sidebar
        │   │   └── SensitivityShield.js # Privacy blur wrapper
        │   ├── common/
        │   │   ├── AuraOrb.js           # Zero-cost aura component
        │   │   ├── MagneticButton.js    # Smooth cursor magnetic effect
        │   │   └── MobileBottomSheet.js # Native-style mobile drawers
        │   ├── ActivityHeatmapYear.js   # 365-day SVG activity matrix
        │   ├── ConfirmDialog.js         # Non-blocking confirmation modal
        │   └── EmptyState.js            # Rich empty state placeholders
        ├── context/
        │   ├── AuthContext.js           # Auth state & session interceptors
        │   ├── NotificationContext.js   # Toast notification dispatcher
        │   └── SecurityGuard.js         # Inactivity & privacy tab guard
        ├── pages/
        │   ├── LandingPage.js           # Premium public landing page
        │   ├── LoginPage.js             # Modern split-screen authentication
        │   ├── RegisterPage.js          # Interactive account registration
        │   ├── DashboardPage.js         # Central productivity mission control
        │   ├── TasksPage.js             # Task management
        │   ├── HabitsPage.js            # Rituals & habit builder
        │   ├── SchedulePage.js          # Time-block schedule calendar
        │   ├── PomodoroPage.js          # Flow state focus timer
        │   ├── NotesPage.js             # Knowledge vault & notes
        │   └── ProfilePage.js           # Account preferences & sessions
        ├── styles/
        │   └── globals.css              # 100% lag-free design system & utilities
        └── utils/
            ├── api.js                   # Axios client with interceptors
            ├── dateUtils.js             # Safe date-fns helpers
            └── idUtils.js               # Cross-entity safe ID helper
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: Local instance running on `mongodb://localhost:27017` or a MongoDB Atlas URI.

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/dayflow-mern-stack.git
cd dayflow-mern-stack/dayflow
```

---

### Step 2: Configure Environment Variables

Create a `.env` file in `dayflow/backend/`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/dayflow
JWT_SECRET=your_super_secret_jwt_key_here_dayflow_v2
JWT_EXPIRE=7d
REFRESH_TOKEN_EXPIRE=30d
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

---

### Step 3: Start the Backend Server
```bash
cd backend
npm install
npm run dev
# Server will run on http://localhost:5000
```

---

### Step 4: Start the Frontend Application
In a separate terminal window:
```bash
cd frontend
npm install
npm start
# App will open at http://localhost:3000
```

---

## 🔌 API Reference Overview

| Endpoint Prefix | Description | Auth Required |
|---|---|:---:|
| `/api/health` | Service health status and MongoDB connection check | ❌ |
| `/api/auth` | User registration, login, logout, profile update, session tracking | Optional |
| `/api/dashboard` | Main metrics, weekly progress, and 12-month activity heatmap | ✅ |
| `/api/tasks` | CRUD, subtasks, bulk actions, priority updates, search | ✅ |
| `/api/habits` | CRUD, daily completion toggle, streak calculations, history | ✅ |
| `/api/schedule` | Time-blocking events, date-range filtering, completion | ✅ |
| `/api/pomodoro` | Start & complete interval sessions, duration stats | ✅ |
| `/api/notes` | Notes CRUD, multi-field regex search, color coding, pin/archive | ✅ |
| `/api/badges` | User gamification badge milestones and criteria check | ✅ |
| `/api/ai` | Adaptive productivity recommendations & daily coach | ✅ |

---

## 🛡 Performance & Optimization Best Practices

1. **Zero-Lag UI**: All heavy continuous CSS blurs (`backdrop-filter`) have been replaced with optimized solid alpha surfaces and pure CSS compositing.
2. **Layout Stability**: Components use `content-visibility: auto` and `contain-intrinsic-size` where appropriate to prevent unnecessary DOM reflows.
3. **Smart Search**: Rapid user keystrokes in search bars utilize `useDeferredValue` and debouncing to prevent network spam and race conditions.
4. **Resilient Data Handling**: Full null-safety checks across date formatters, object IDs, and streak calculations prevent unexpected client or server exceptions.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

Crafted with precision for high-performance productivity. 🌊 **DayFlow**
