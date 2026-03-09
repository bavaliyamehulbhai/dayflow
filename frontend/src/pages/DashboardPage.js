import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ActivityHeatmapYear from '../components/ActivityHeatmapYear';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';
import {
  Sun, Moon, Sunrise, Sunset, Flame, Check, CheckCircle2,
  ArrowRight, Clock as ClockIcon, Zap, Target, Trophy,
  Activity, History, Timer, Calendar, RefreshCw, FileText,
  Sparkles, MousePointer2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AICoach from '../components/AICoach';
import ProductivityCircle from '../components/ProductivityCircle';

// ─── Magnetic Effect Component ──────────────────────────────────────────────
const MagneticButton = ({ children, className, onClick, style }) => {
  const ref = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const x = clientX - (left + width / 2);
    const y = clientY - (top + height / 2);
    setPosition({ x, y });
  };

  const handleMouseLeave = () => setPosition({ x: 0, y: 0 });

  return (
    <motion.button
      ref={ref}
      className={className}
      onClick={onClick}
      style={{ ...style, position: 'relative' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x * 0.2, y: position.y * 0.2 }}
      transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }}
    >
      {children}
    </motion.button>
  );
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 100, damping: 12 }
  }
};

const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };

function useWindowWidth() {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return w;
}

// ─── Animated count-up hook ───────────────────────────────────────────────────
function useCountUp(target, duration = 800) {
  const [value, setValue] = useState(0);
  const prevTarget = useRef(null);

  useEffect(() => {
    if (prevTarget.current === target) return;
    prevTarget.current = target;
    const numTarget = parseFloat(target) || 0;
    if (numTarget === 0) { setValue(0); return; }
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      if (progress < 1) {
        setValue(Math.round(eased * numTarget));
        requestAnimationFrame(tick);
      } else {
        setValue(numTarget);
      }
    };
    requestAnimationFrame(tick);
  }, [target, duration]);

  return value;
}

function AnimatedStat({ value, label, color, icon: Icon }) {
  const animated = useCountUp(typeof value === 'number' ? value : 0);
  const display = typeof value === 'string' ? value : animated;
  return (
    <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ color, opacity: 0.8 }}><Icon size={20} /></div>
      <div className="stat-value" style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: 'var(--fs-2xl)' }}>
        {display}
      </div>
      <div className="stat-label" style={{ fontWeight: 600 }}>{label}</div>
    </div>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function DashboardSkeleton() {
  const isMobile = window.innerWidth <= 768;
  return (
    <div className="responsive-container">
      <div className="skeleton skeleton-text" style={{ width: 260, height: 36, marginBottom: 8 }} />
      <div className="skeleton skeleton-text" style={{ width: 180, height: 18, marginBottom: 32 }} />
      {/* Clock skeleton */}
      <div className="skeleton" style={{ height: 160, borderRadius: 16, marginBottom: 24 }} />
      {/* Stats skeleton */}
      <div className="stats-grid" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 110, borderRadius: 16 }} />
        ))}
      </div>
      {/* Main grid skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 340px', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="skeleton" style={{ height: 280, borderRadius: 16 }} />
          <div className="skeleton" style={{ height: 260, borderRadius: 16 }} />
        </div>
        {!isMobile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="skeleton" style={{ height: 240, borderRadius: 16 }} />
            <div className="skeleton" style={{ height: 220, borderRadius: 16 }} />
            <div className="skeleton" style={{ height: 180, borderRadius: 16 }} />
          </div>
        )}
      </div>
    </div>
  );
}

function Clock() {
  const [time, setTime] = useState(new Date());
  const width = useWindowWidth();
  const isMobile = width <= 768;

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const hours = time.getHours();
  const pct = Math.min(100, Math.max(0, ((hours - 6) * 60 + time.getMinutes()) / (17 * 60) * 100));

  let GreetingIcon = Sunrise;
  if (hours >= 12 && hours < 17) GreetingIcon = Sun;
  if (hours >= 17 && hours < 22) GreetingIcon = Sunset;
  if (hours >= 22 || hours < 6) GreetingIcon = Moon;

  return (
    <div className="card clock-card" style={{ textAlign: 'center', padding: isMobile ? '20px 14px' : '32px 24px', position: 'relative', overflow: 'hidden' }}>
      <div className="greeting-icon-bg" style={{ position: 'absolute', top: -10, right: -10, opacity: 0.1 }}>
        <GreetingIcon size={isMobile ? 80 : 120} />
      </div>
      <div className="clock-time" style={{ fontSize: isMobile ? 'clamp(1.8rem, 8vw, 3rem)' : 'var(--fs-3xl)', letterSpacing: isMobile ? '-1px' : '-3px' }}>
        {format(time, 'hh:mm:ss a')}
      </div>
      <div className="clock-date" style={{ fontSize: isMobile ? '10px' : 'var(--fs-xs)', letterSpacing: isMobile ? '1px' : '3px', marginTop: 6 }}>
        {format(time, 'EEEE, MMMM d, yyyy')}
      </div>
      <div style={{ marginTop: 'var(--space-4)' }}>
        <div style={{ height: 6, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--accent2))', borderRadius: 3, boxShadow: '0 0 15px rgba(130,114,255,0.5)', transition: 'width 1s linear' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--muted)', marginTop: 8, fontWeight: 500 }}>
          <span>6 AM</span>
          <span style={{ color: 'var(--text2)' }}>{Math.round(pct)}% complete</span>
          <span>11 PM</span>
        </div>
      </div>
    </div >
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--surface-solid)',
      backdropFilter: 'var(--glass)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '12px 16px',
      fontSize: 12,
      boxShadow: 'var(--shadow-md)'
    }}>
      <div style={{ color: 'var(--muted)', marginBottom: 8, fontWeight: 600 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
          {p.name}: <span style={{ fontWeight: 700 }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const width = useWindowWidth();
  const isMobile = width <= 768;
  const isTablet = width <= 1024 && width > 768;
  const [selectedLog, setSelectedLog] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardAPI.get().then(r => r.data.dashboard),
    refetchInterval: 60000
  });

  const { data: activityData } = useQuery({
    queryKey: ['activity12m'],
    queryFn: () => dashboardAPI.getActivity12m().then(r => r.data.activity)
  });

  if (isLoading) return <DashboardSkeleton />;

  const d = data;
  const taskTotal = d?.tasks?.summary?.total || 0;
  const taskCompleted = d?.tasks?.summary?.completed || 0;
  const completionPct = taskTotal ? Math.round((taskCompleted / taskTotal) * 100) : 0;

  const hours = new Date().getHours();
  let greeting = 'Good Morning';
  let GreetingIcon = Sunrise;
  if (hours >= 12 && hours < 17) { greeting = 'Good Afternoon'; GreetingIcon = Sun; }
  else if (hours >= 17 && hours < 22) { greeting = 'Good Evening'; GreetingIcon = Sunset; }
  else if (hours >= 22 || hours < 6) { greeting = 'Good Night'; GreetingIcon = Moon; }

  const MobileFeed = () => {
    const nextEvent = d?.schedule?.today?.find(ev => {
      const now = new Date();
      const nowMin = now.getHours() * 60 + now.getMinutes();
      const [sh, sm] = ev.startTime.split(':').map(Number);
      return (sh * 60 + sm) > nowMin;
    });

    const topTask = d?.tasks?.today?.sort((a, b) => (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2))[0];
    const pendingHabits = d?.habits?.list?.filter(h => !h.completedToday);

    return (
      <div className="mobile-feed">
        {/* Next Up Moment */}
        {nextEvent && (
          <div className="feed-item next-up" onClick={() => navigate('/schedule')}>
            <div className="feed-label">Next Up</div>
            <div className="feed-content">
              <div className="feed-time">{nextEvent.startTime}</div>
              <div className="feed-title">{nextEvent.title}</div>
            </div>
            <ArrowRight size={18} className="feed-arrow" />
          </div>
        )}

        {/* Top Objective */}
        {topTask && (
          <div className="feed-item priority-task" onClick={() => navigate('/tasks')}>
            <div className="feed-label">Primary Objective</div>
            <div className="feed-content">
              <div className={`feed-priority-tag priority-${topTask.priority}`}>{topTask.priority.toUpperCase()}</div>
              <div className="feed-title">{topTask.title}</div>
            </div>
          </div>
        )}

        {/* Rituals Progress */}
        <div className="feed-item habits-glance" onClick={() => navigate('/habits')}>
          <div className="feed-label">Rituals for Today</div>
          <div className="feed-habits-grid">
            {d?.habits?.list?.slice(0, 4).map(h => (
              <div key={h._id} className={`feed-habit-dot ${h.completedToday ? 'done' : ''}`} style={{ borderColor: h.color, '--habit-color': h.color }}>
                {h.icon}
              </div>
            ))}
            {d?.habits?.total > 4 && <div className="feed-habit-more">+{d.habits.total - 4}</div>}
          </div>
        </div>

        {/* Quick Knowledge */}
        {d?.notes?.recent?.length > 0 && (
          <div className="feed-item recent-note" onClick={() => navigate('/notes')}>
            <div className="feed-label">Refine Knowledge</div>
            <div className="feed-content">
              <FileText size={16} className="text-muted" />
              <div className="feed-note-title">{d.notes.recent[0].title}</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="responsive-container">
      <div className="page-header mb-6">
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="page-title flex items-center gap-3" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: isMobile ? 'clamp(1.1rem, 5vw, 1.6rem)' : undefined }}>
            <GreetingIcon className="text-accent" size={isMobile ? 20 : 32} style={{ flexShrink: 0 }} />
            {greeting}, {user?.name?.split(' ')[0]}
          </div>
          <p className="page-subtitle">Your productivity pulse for today</p>
        </div>
      </div>

      {/* Clock */}
      <Clock />

      {/* Stats Row */}
      <div className="stats-grid mt-6">
        {[
          { label: 'Tasks', value: d?.tasks?.summary?.completed || 0, color: 'var(--green)', icon: CheckCircle2 },
          { label: 'Pending', value: d?.tasks?.summary?.pending || 0, color: 'var(--yellow)', icon: Zap },
          { label: 'Focus', value: d?.pomodoro?.todayMinutes || 0, color: 'var(--accent)', icon: Timer },
          { label: 'Rituals', value: `${d?.habits?.completedToday || 0}/${d?.habits?.total || 0}`, color: 'var(--accent3)', icon: Trophy },
        ].map((s, i) => (
          <AnimatedStat key={i} {...s} />
        ))}
      </div>

      {isMobile && <MobileFeed />}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="dashboard-main-grid"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>

          {/* Activity Consistency Grid (LeetCode Style) */}
          <motion.div variants={itemVariants} className="card" style={{ padding: '24px' }}>
            <div className="card-title" style={{ justifyContent: 'space-between', color: 'var(--text)', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Activity size={16} className="text-accent" />
                Consistency Tracker
              </div>
              <button className="btn btn-sm btn-ghost" onClick={() => navigate('/profile')}>
                View Profile <ArrowRight size={14} style={{ marginLeft: 4 }} />
              </button>
            </div>

            <div style={{ marginBottom: 24, overflowX: 'auto', paddingBottom: 8 }}>
              <ActivityHeatmapYear data={Array.isArray(activityData) ? activityData : []} isMobile={isMobile} onSelectDay={(d, log) => setSelectedLog(log)} />
            </div>

            {/* Daily Activity Table */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>
                Recent activity history
              </div>
              <div className="hide-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px 80px', padding: '10px 16px', borderRadius: 8, background: 'var(--surface2)', fontSize: 10, fontWeight: 700, color: 'var(--muted)', marginBottom: 8 }}>
                <span>DATE</span>
                <span className="text-center">TASKS</span>
                <span className="text-center">FOCUS</span>
                <span className="text-center">HABITS</span>
                <span className="text-center">LEVEL</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(Array.isArray(activityData) ? activityData : []).slice(-5).reverse().map((log, i) => (
                  <div key={log.date} style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr auto' : '1fr 80px 80px 80px 80px',
                    padding: '12px 16px',
                    background: 'var(--surface2)',
                    borderRadius: 10,
                    alignItems: 'center',
                    border: '1px solid var(--border)'
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{format(new Date(log.date), 'MMM d, yyyy')}</span>
                    {!isMobile && (
                      <>
                        <span className="text-center" style={{ fontSize: 12, fontWeight: 700 }}>{log.tasksCompleted}</span>
                        <span className="text-center" style={{ fontSize: 12, fontWeight: 700 }}>{log.focusMinutes}m</span>
                        <span className="text-center" style={{ fontSize: 12, fontWeight: 700 }}>{log.habitsCompleted}</span>
                      </>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <div style={{
                        width: 14,
                        height: 14,
                        borderRadius: 3,
                        background: ['var(--surface3)', '#2ecc7133', '#2ecc7166', '#27ae6099', '#27ae60'][log.intensity || 0],
                        border: '1px solid var(--border)'
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Today's Tasks */}
          <motion.div variants={itemVariants} className="card">
            <div className="card-title" style={{ justifyContent: 'space-between', color: 'var(--text)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Target size={16} />
                Priority Focus
              </div>
              <button className="btn btn-sm btn-ghost" onClick={() => navigate('/tasks')}>
                All Tasks <ArrowRight size={14} style={{ marginLeft: 4 }} />
              </button>
            </div>

            {/* Progress bar */}
            <div style={{ marginBottom: 20, background: 'var(--surface2)', padding: '16px', borderRadius: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 10 }}>
                <span>Daily Progress</span>
                <span style={{ color: 'var(--accent)' }}>{completionPct}%</span>
              </div>
              <div style={{ height: 8, background: 'var(--bg)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${completionPct}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--green))', borderRadius: 4, transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)', boxShadow: 'var(--shadow-accent)' }} />
              </div>
            </div>

            {d?.tasks?.today?.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {d.tasks.today.sort((a, b) => (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2)).slice(0, 5).map(task => (
                  <div key={task._id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 16px',
                    background: 'var(--surface2)',
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                    transition: 'transform 0.2s ease',
                    cursor: 'pointer'
                  }} className="hover-lift">
                    <div style={{ width: 8, height: 8, borderRadius: '4px', background: task.priority === 'urgent' ? 'var(--red)' : task.priority === 'high' ? 'var(--orange)' : task.priority === 'medium' ? 'var(--yellow)' : 'var(--green)', flexShrink: 0, boxShadow: '0 0 8px currentColor' }} />
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</span>
                    <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <div className="empty-icon" style={{ fontSize: 32, opacity: 0.8 }}>✨</div>
                <div className="empty-title">Clear horizons</div>
                <div className="empty-desc">No high priority tasks remaining for today</div>
              </div>
            )}
          </motion.div>

        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>
          {/* AI Coach */}
          <motion.div variants={itemVariants}>
            <AICoach />
          </motion.div>

          {/* Productivity Circle */}
          <motion.div variants={itemVariants}>
            <ProductivityCircle
              stats={{
                tasks: d?.tasks?.summary?.completed || 0,
                habits: d?.habits?.completedToday || 0,
                focus: d?.pomodoro?.todayMinutes ? Math.round(d.pomodoro.todayMinutes / 25) : 0,
                schedule: d?.schedule?.today?.length || 0
              }}
            />
          </motion.div>

          {/* Today's Schedule */}
          <motion.div variants={itemVariants} className="card">
            <div className="card-title" style={{ justifyContent: 'space-between', color: 'var(--text)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={16} />
                Timeline
              </div>
              <button className="btn btn-sm btn-ghost" onClick={() => navigate('/schedule')}>Edit</button>
            </div>
            {d?.schedule?.today?.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 300, overflowY: 'auto', paddingRight: 4 }}>
                {d.schedule.today.map((ev, i) => {
                  const now = new Date();
                  const nowMin = now.getHours() * 60 + now.getMinutes();
                  const [sh, sm] = ev.startTime.split(':').map(Number);
                  const startMin = sh * 60 + sm;
                  const isCurrent = ev.endTime ? (() => { const [eh, em] = ev.endTime.split(':').map(Number); return nowMin >= startMin && nowMin < eh * 60 + em; })() : false;
                  const isPast = ev.endTime ? (() => { const [eh, em] = ev.endTime.split(':').map(Number); return nowMin >= eh * 60 + em; })() : false;

                  return (
                    <div key={ev._id} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                      borderRadius: 12, borderLeft: `4px solid ${isCurrent ? 'var(--green)' : isPast ? 'var(--muted)' : 'var(--accent)'}`,
                      background: isCurrent ? 'rgba(95,250,209,0.08)' : 'var(--surface2)',
                      opacity: isPast ? 0.6 : 1,
                      transition: 'all 0.2s ease'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>{ev.startTime}{ev.endTime ? ` – ${ev.endTime}` : ''}</div>
                        <div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{ev.title}</div>
                      </div>
                      {isCurrent && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 10px var(--green)', animation: 'pulse 2s ease infinite' }} />}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '40px 24px', opacity: 0.8 }}>
                <div className="empty-icon" style={{ fontSize: 32, marginBottom: 12, filter: 'drop-shadow(0 0 8px var(--accent))' }}>🍃</div>
                <div className="empty-title" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Quiet day</div>
                <div className="empty-desc" style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Your timeline is peaceful.</div>
              </div>
            )}
          </motion.div>

          {/* Habits */}
          <motion.div variants={itemVariants} className="card">
            <div className="card-title" style={{ justifyContent: 'space-between', color: 'var(--text)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <RefreshCw size={16} />
                Rituals
              </div>
              <button className="btn btn-sm btn-ghost" onClick={() => navigate('/habits')}>All</button>
            </div>
            {d?.habits?.list?.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {d.habits.list.slice(0, 5).map(h => (
                  <div key={h._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 0' }}>
                    <div style={{ fontSize: 20 }}>{h.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{h.name}</div>
                      {h.streak.current > 0 && <div style={{ fontSize: 11, color: 'var(--orange)', display: 'flex', alignItems: 'center', gap: 4 }}><Flame size={12} /> {h.streak.current} day streak</div>}
                    </div>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: h.completedToday ? h.color : 'var(--surface2)',
                      border: `2px solid ${h.completedToday ? h.color : 'var(--border)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white',
                      boxShadow: h.completedToday ? `0 0 10px ${h.color}44` : 'none',
                      transition: 'all 0.2s ease'
                    }}>
                      {h.completedToday && <Check size={16} strokeWidth={3} />}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '40px 24px', opacity: 0.8 }}>
                <div className="empty-icon" style={{ fontSize: 32, marginBottom: 12, filter: 'drop-shadow(0 0 8px var(--green))' }}>🌱</div>
                <div className="empty-title" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Start a ritual</div>
                <div className="empty-desc" style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Small steps lead to big changes.</div>
              </div>
            )}
          </motion.div>

          {/* Recent Notes */}
          <motion.div variants={itemVariants} className="card">
            <div className="card-title" style={{ justifyContent: 'space-between', color: 'var(--text)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={16} />
                Knowledge
              </div>
              <button className="btn btn-sm btn-ghost" onClick={() => navigate('/notes')}>All</button>
            </div>
            {d?.notes?.recent?.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {d.notes.recent.slice(0, 3).map(n => (
                  <div key={n._id} style={{
                    padding: '12px 14px',
                    background: 'var(--surface2)',
                    borderRadius: 12,
                    cursor: 'pointer',
                    borderLeft: `4px solid ${n.color || 'var(--accent)'}`,
                    transition: 'all 0.2s ease'
                  }} className="hover-lift" onClick={() => navigate('/notes')}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{n.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Updated {format(new Date(n.updatedAt), 'MMM d')}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '40px 24px', opacity: 0.8 }}>
                <div className="empty-icon" style={{ fontSize: 32, marginBottom: 12, filter: 'drop-shadow(0 0 8px var(--accent2))' }}>📔</div>
                <div className="empty-title" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Empty pages</div>
                <div className="empty-desc" style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Capture your thoughts.</div>
              </div>
            )}
          </motion.div>

        </div>
      </motion.div>

      <style>{`
        /* Utility */
        .text-accent { color: var(--accent); }
        .clock-card::before { content: ''; position: absolute; inset: 0; background: radial-gradient(circle at top right, rgba(130, 114, 255, 0.05), transparent 70%); pointer-events: none; }
        
        .clock-time {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: clamp(2rem, 8vw, 4rem);
          line-height: 1.1;
          letter-spacing: -0.05em;
        }

        .clock-date {
          color: var(--muted);
          font-weight: 700;
          font-size: clamp(0.75rem, 3vw, 1rem);
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        /* Stats Grid Optimization */        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
        }

        /* Mobile Feed Styles */
        .mobile-feed {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-top: 20px;
        }

        .feed-item {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 16px 20px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          position: relative;
          box-shadow: var(--shadow-sm);
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .feed-item:active {
          transform: scale(0.97);
          background: var(--surface2);
        }

        .feed-label {
          font-size: clamp(9px, 2.5vw, 11px);
          font-weight: 800;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 1.5px;
        }

        .feed-title {
          font-size: clamp(15px, 4vw, 18px);
          font-weight: 700;
          color: var(--text);
          line-height: 1.3;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .feed-note-title {
          font-size: clamp(13px, 3.5vw, 16px);
          font-weight: 600;
          color: var(--text2);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .feed-content {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        @media (min-width: 769px) {
          .hover-lift:hover { transform: translateY(-2px); border-color: var(--border2); background: var(--surface3) !important; }
        }
      `}</style>
    </div >
  );
}
