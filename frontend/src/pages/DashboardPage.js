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
  Sparkles, MousePointer2, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AICoach from '../components/AICoach';
import ProductivityCircle from '../components/ProductivityCircle';
import SensitivityShield from '../components/layout/SensitivityShield';
import Skeleton, { CardSkeleton, ListSkeleton } from '../components/Skeleton';

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

const AnimatedStat = React.memo(({ value, label, color, icon: Icon }) => {
  const animated = useCountUp(typeof value === 'number' ? value : 0);
  const display = typeof value === 'string' ? value : animated;
  return (
    <div className="stat-card gpu-accel haptic-tap" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        gap: 'clamp(4px, 1vw, 8px)',
        padding: 'clamp(12px, 2vw, 24px)'
    }}>
      <div style={{ color, opacity: 0.8 }}><Icon size={window.innerWidth <= 768 ? 16 : 20} /></div>
      <SensitivityShield>
        <div className="stat-value" style={{ 
            color, 
            fontSize: 'clamp(1.2rem, 4vw, 1.8rem)',
            fontWeight: 800
        }}>{display}</div>
      </SensitivityShield>
      <div className="stat-label" style={{ fontSize: 'clamp(0.6rem, 1.5vw, 0.75rem)' }}>{label}</div>
    </div>
  );
});

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function DashboardSkeleton() {
  const isMobile = window.innerWidth <= 768;
  return (
    <div className="responsive-container">
      <Skeleton width="300px" height="48px" style={{ marginBottom: 8 }} />
      <Skeleton width="200px" height="20px" style={{ marginBottom: 40 }} />
      
      {/* Clock Area */}
      <Skeleton height="200px" borderRadius={24} style={{ marginBottom: 32 }} />

      <div className="stats-grid" style={{ marginBottom: 32 }}>
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} height="120px" borderRadius={20} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 360px', gap: 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <CardSkeleton />
          <CardSkeleton />
        </div>
        {!isMobile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
             <div className="card glass-card" style={{ height: 300 }}><Skeleton height="100%" /></div>
             <div className="card glass-card" style={{ height: 200 }}><Skeleton height="100%" /></div>
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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="card clock-card glass-card" 
      style={{ 
        textAlign: 'center', 
        padding: isMobile ? '32px 16px' : '48px 32px', 
        position: 'relative', 
        overflow: 'hidden',
        borderRadius: 'var(--radius-xl)'
      }}
    >
      <div className="greeting-icon-bg" style={{ 
        position: 'absolute', 
        top: -20, 
        right: -20, 
        opacity: 0.05,
        transform: 'rotate(15deg)'
      }}>
        <GreetingIcon size={isMobile ? 120 : 200} />
      </div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="clock-time" style={{ 
          fontSize: isMobile ? 'clamp(1.5rem, 10vw, 2.2rem)' : 'clamp(3rem, 10vw, 6rem)', 
          letterSpacing: '-0.06em',
          background: 'linear-gradient(180deg, var(--text), var(--text2))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 10px 30px rgba(0,0,0,0.5)'
        }}>
          {format(time, 'HH:mm:ss')}
        </div>
        <div className="clock-date" style={{ 
          fontSize: isMobile ? '12px' : 'var(--fs-sm)', 
          letterSpacing: '0.2em', 
          marginTop: 12,
          color: 'var(--accent)',
          fontWeight: 800
        }}>
          {format(time, 'EEEE, MMMM do').toUpperCase()}
        </div>
      </motion.div>

      <div style={{ marginTop: 'var(--space-8)', maxWidth: '600px', margin: '32px auto 0' }}>
        <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1.5, ease: "circOut" }}
            style={{ 
              height: '100%', 
              background: 'linear-gradient(90deg, var(--accent), var(--accent3))', 
              borderRadius: 2, 
              boxShadow: '0 0 20px var(--accent-glow)'
            }} 
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--muted)', marginTop: 12, fontWeight: 700, letterSpacing: '0.05em' }}>
          <span>SUNRISE</span>
          <span style={{ color: 'var(--text2)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 10 }}>{Math.round(pct)}% OF DAYLIGHT</span>
          <span>SUNSET</span>
        </div>
      </div>
    </motion.div>
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
    
    return (
      <div className="mobile-feed" style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
        {/* Row 1: Key Items */}
        <div style={{ display: 'grid', gridTemplateColumns: nextEvent ? '1.2fr 1fr' : '1fr', gap: 12 }}>
          {nextEvent && (
            <div className="feed-item next-up" onClick={() => navigate('/schedule')} style={{ padding: '16px', borderRadius: 20 }}>
              <div className="feed-label" style={{ fontSize: 10 }}>NEXT UP</div>
              <div className="feed-time" style={{ fontSize: 18, fontWeight: 800 }}>{nextEvent.startTime}</div>
              <div className="feed-title" style={{ fontSize: 13, opacity: 0.9 }}>{nextEvent.title}</div>
            </div>
          )}
          {topTask && (
            <div className="feed-item priority-task" onClick={() => navigate('/tasks')} style={{ padding: '16px', borderRadius: 20 }}>
              <div className="feed-label" style={{ fontSize: 10 }}>TOP FOCUS</div>
              <div className={`feed-priority-tag priority-${topTask.priority}`} style={{ fontSize: 9 }}>{topTask.priority}</div>
              <div className="feed-title" style={{ fontSize: 13, fontWeight: 600 }}>{topTask.title}</div>
            </div>
          )}
        </div>

        {/* Row 2: Rituals & Habits */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="feed-item habits-glance" onClick={() => navigate('/habits')} style={{ padding: '16px', borderRadius: 20 }}>
            <div className="feed-label" style={{ fontSize: 10, marginBottom: 8 }}>RITUALS</div>
            <div className="feed-habits-grid" style={{ gap: 6 }}>
              {d?.habits?.list?.slice(0, 3).map(h => (
                <div key={h._id} className={`feed-habit-dot ${h.completedToday ? 'done' : ''}`} style={{ width: 24, height: 24, fontSize: 12 }}>
                  {h.icon}
                </div>
              ))}
            </div>
          </div>
          {d?.notes?.recent?.length > 0 && (
            <div className="feed-item recent-note" onClick={() => navigate('/notes')} style={{ padding: '16px', borderRadius: 20 }}>
              <div className="feed-label" style={{ fontSize: 10, marginBottom: 4 }}>NOTES</div>
              <div style={{ fontSize: 12, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {d.notes.recent[0].title}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
    <div className="responsive-container">
      <div className="page-header mb-6">
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="page-title flex items-center gap-3" style={{ 
            fontSize: 'clamp(1.2rem, 6vw, 3.5rem)', 
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-0.04em'
          }}>
            <GreetingIcon className="text-accent" size={isMobile ? 24 : 48} style={{ flexShrink: 0 }} />
            <div style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {greeting}, <span style={{ 
                background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline-block'
              }}>{user?.name?.split(' ')[0]}</span>
            </div>
          </div>
          <p className="page-subtitle">Your productivity pulse for today</p>
        </div>
      </div>

      {/* Clock */}
      <Clock />

      {/* Stats Row */}
      <div className="stats-grid mt-6" style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: 'clamp(12px, 2vw, 24px)'
      }}>
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
        className="dashboard-main-grid mt-6"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(24px, 4vw, 40px)', minWidth: 0 }}>

          {/* Activity Consistency Grid (LeetCode Style) */}
          <motion.div variants={itemVariants} className="card glass-card aura-iridescent" style={{ padding: '24px' }}>
            <div className="card-title" style={{ justifyContent: 'space-between', color: 'var(--text)', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Activity size={16} className="text-accent" />
                Consistency Tracker
              </div>
              <MagneticButton 
                className="btn btn-sm btn-ghost haptic-feedback" 
                onClick={() => navigate('/profile')}
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}
              >
                View Profile <ArrowRight size={14} style={{ marginLeft: 4 }} />
              </MagneticButton>
            </div>

            <div style={{ marginBottom: 24, overflowX: 'auto', paddingBottom: 8 }}>
              <ActivityHeatmapYear data={Array.isArray(activityData) ? activityData : []} isMobile={isMobile} onSelectDay={(d, log) => setSelectedLog(log)} />
            </div>

            {/* Selected Day Details */}
            <AnimatePresence mode="wait">
              {selectedLog && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div className="selected-day-card mb-6" style={{ 
                    padding: '20px', 
                    background: 'linear-gradient(135deg, var(--surface2), var(--surface3))',
                    borderRadius: 16,
                    border: '1px solid var(--accent)',
                    boxShadow: '0 0 20px rgba(95, 250, 209, 0.1)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
                          Inspecting Progress
                        </div>
                        <h3 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>
                          {format(new Date(selectedLog.date), 'EEEE, MMMM do')}
                        </h3>
                      </div>
                      <button 
                        className="btn btn-sm btn-ghost" 
                        onClick={() => setSelectedLog(null)}
                        style={{ padding: '4px 8px', fontSize: 11 }}
                      >
                        Clear Selection
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: 12 }}>
                      {[
                        { label: 'Tasks', value: selectedLog.tasksCompleted, icon: CheckCircle2, sub: 'completed' },
                        { label: 'Focus', value: `${selectedLog.focusMinutes}m`, icon: Timer, sub: 'session' },
                        { label: 'Rituals', value: selectedLog.habitsCompleted, icon: Trophy, sub: 'done' },
                        { label: 'Events', value: selectedLog.scheduleEventsCompleted, icon: Calendar, sub: 'attended' }
                      ].map((s, idx) => (
                        <div key={idx} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <s.icon size={14} style={{ color: 'var(--accent)' }} />
                            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>{s.label}</span>
                          </div>
                          <div style={{ fontSize: 18, fontWeight: 800 }}>{s.value}</div>
                          <div style={{ fontSize: 10, color: 'var(--muted)' }}>{s.sub}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Daily Activity Table */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
              <h1 style={{ fontSize: isMobile ? 'var(--fs-xl)' : 'var(--fs-2xl)', fontWeight: 800, fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em', margin: 0 }}>
                Mission <br />Control
              </h1>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(Array.isArray(activityData) ? activityData : []).slice(-5).reverse().map((log, i) => (
                  <div key={log.date} style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr auto' : '1fr 80px 80px 80px 80px',
                    padding: isMobile ? '14px 16px' : '12px 16px',
                    background: 'var(--surface2)',
                    borderRadius: 14,
                    alignItems: 'center',
                    border: '1px solid var(--border)',
                    boxShadow: isMobile ? 'var(--shadow-sm)' : 'none'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: isMobile ? 14 : 13, fontWeight: 700 }}>{format(new Date(log.date), isMobile ? 'EEEE, MMM d' : 'MMM d, yyyy')}</span>
                        {isMobile && <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>{log.tasksCompleted} tasks • {log.focusMinutes}m focus</span>}
                    </div>
                    {!isMobile && (
                      <>
                        <span className="text-center" style={{ fontSize: 12, fontWeight: 700 }}>{log.tasksCompleted}</span>
                        <span className="text-center" style={{ fontSize: 12, fontWeight: 700 }}>{log.focusMinutes}m</span>
                        <span className="text-center" style={{ fontSize: 12, fontWeight: 700 }}>{log.habitsCompleted}</span>
                      </>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <div style={{
                        width: isMobile ? 18 : 14,
                        height: isMobile ? 18 : 14,
                        borderRadius: 4,
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
          <motion.div variants={itemVariants} className="card glass-card">
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
          <motion.div variants={itemVariants} className="card aura-iridescent">
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
          <motion.div variants={itemVariants} className="card glass-card">
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
          <motion.div variants={itemVariants} className="card glass-card">
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
          <motion.div variants={itemVariants} className="card glass-card aura-iridescent">
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
    </div>
    </>
  );
}
