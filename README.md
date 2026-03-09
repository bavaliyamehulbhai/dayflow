# 🌊 DayFlow — MERN Stack Time Management App

A full-featured, production-ready time management application built with **MongoDB, Express, React, and Node.js**.

🚀 **Live Demo:** [https://dayflow-inky.vercel.app](https://dayflow-inky.vercel.app)

---

## ✨ Features

| Module | Features |
|--------|----------|
| **🔐 Auth** | JWT login/register, protected routes, profile management, password change |
| **✅ Tasks** | Full CRUD, priority levels (low/medium/high/urgent), status tracking, subtasks, tags, due dates, bulk operations, search & filters |
| **📅 Schedule** | Timeline view, recurring events, category color-coding, task linking, current event highlight |
| **🔄 Habits** | Daily/weekly tracking, streaks, 7-day grid view, completion history, color/icon customization |
| **⏱ Pomodoro** | SVG circle timer, work/break modes, auto-advance, session history, task linking, Web Audio API bell |
| **📝 Notes** | Rich textarea editor, auto-save, pin/archive, tags, color themes, search, grid/list views |
| **📊 Dashboard** | Live clock, day progress bar, weekly activity charts (Recharts), stats overview |
| **⚙️ Profile** | Pomodoro duration settings, stats overview, password management |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Step 1: Backend
```bash
cd backend
cp .env.example .env        # Edit with your MongoDB URI + JWT secret
npm install
npm run dev                 # Starts on http://localhost:5000
```

### Step 2: Frontend
```bash
cd frontend
npm install
npm start                   # Opens http://localhost:3000
```

---

## 🏗 Project Structure

```
dayflow/
├── backend/
│   ├── models/
│   │   ├── User.js        # Auth, preferences, stats
│   │   ├── Task.js        # Tasks with subtasks, tags, recurrence
│   │   ├── Habit.js       # Habits with completion history & streaks
│   │   ├── Schedule.js    # Calendar events
│   │   ├── Pomodoro.js    # Focus session records
│   │   └── Note.js        # Rich notes with full-text search
│   ├── routes/
│   │   ├── auth.js        # Register, login, profile
│   │   ├── tasks.js       # Full CRUD + bulk ops + stats
│   │   ├── habits.js      # CRUD + completion toggle + streak calc
│   │   ├── schedule.js    # Events + date filtering
│   │   ├── pomodoro.js    # Start/complete sessions + stats
│   │   ├── notes.js       # Notes CRUD + pin/archive
│   │   └── dashboard.js   # Aggregated dashboard data
│   ├── middleware/
│   │   └── auth.js        # JWT verify + token generation
│   └── server.js          # Express app, helmet, CORS, rate limiting
│
└── frontend/
    └── src/
        ├── context/
        │   └── AuthContext.js   # Global auth state
        ├── utils/
        │   └── api.js           # Axios + all API modules
        ├── components/
        │   └── layout/
        │       └── Layout.js    # Sidebar nav layout
        ├── pages/
        │   ├── LoginPage.js
        │   ├── RegisterPage.js
        │   ├── DashboardPage.js
        │   ├── TasksPage.js
        │   ├── HabitsPage.js
        │   ├── SchedulePage.js
        │   ├── PomodoroPage.js
        │   ├── NotesPage.js
        │   └── ProfilePage.js
        └── styles/
            └── globals.css      # Full design system
```

---

## 🔌 API Endpoints

### Auth `/api/auth`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register new user |
| POST | `/login` | Login with email/password |
| GET | `/me` | Get current user |
| PUT | `/profile` | Update name/preferences |
| PUT | `/password` | Change password |

### Tasks `/api/tasks`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all tasks (filters, search, sort, pagination) |
| POST | `/` | Create task |
| PUT | `/:id` | Update task |
| DELETE | `/:id` | Delete task |
| POST | `/bulk/delete` | Bulk delete |
| POST | `/bulk/status` | Bulk status update |
| PATCH | `/:id/subtasks/:sid` | Toggle subtask |
| GET | `/stats/summary` | Task statistics |

### Habits, Schedule, Pomodoro, Notes — full REST CRUD

---

## 🛡 Security
- JWT authentication with 7-day expiry
- Helmet.js security headers
- Rate limiting (100 req/15min)
- bcrypt password hashing (12 rounds)
- Input validation with express-validator
- User isolation — all queries scoped to authenticated user

---

## 🎨 Tech Stack

**Backend:** Node.js, Express.js, MongoDB, Mongoose, JWT, bcryptjs, Helmet, express-rate-limit, express-validator

**Frontend:** React 18, React Router v6, TanStack Query v5, Axios, Recharts, date-fns, react-hot-toast

---

## 📝 Environment Variables

```env
# backend/.env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/dayflow
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=7d
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch
3. Make changes and test
4. Submit a pull request

---

Made with ❤️ using the MERN Stack
