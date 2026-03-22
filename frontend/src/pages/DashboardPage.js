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
    <div className="glass-card gpu-accel haptic-tap" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        gap: '8px',
        padding: '24px',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border-premium)'
    }}>
      <div style={{ color, opacity: 0.9, marginBottom: 4 }}><Icon size={24} /></div>
      <SensitivityShield>
        <div className="stat-value" style={{ 
            color, 
            fontSize: 'clamp(1.5rem, 5vw, 2rem)',
            fontWeight: 800,
            fontFamily: 'Syne, sans-serif',
            letterSpacing: '-0.02em'
        }}>{display}</div>
      </SensitivityShield>
      <div className="stat-label" style={{ 
          fontSize: '11px', 
          fontWeight: 700, 
          color: 'var(--muted)', 
          textTransform: 'uppercase', 
          letterSpacing: '1px' 
      }}>{label}</div>
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
      transition={{ duration: 0.8 }}
      className="card clock-card premium-card" 
      style={{ 
        textAlign: 'center', 
        padding: isMobile ? '40px 20px' : '64px 40px', 
        position: 'relative', 
        overflow: 'hidden',
        background: 'rgba(13, 13, 22, 0.6)',
        border: '1px solid var(--border-premium)'
      }}
    >
      <div className="greeting-icon-bg" style={{ 
        position: 'absolute', 
        top: -30, 
        right: -30, 
        opacity: 0.08,
        transform: 'rotate(15deg)',
        color: 'var(--accent)'
      }}>
        <GreetingIcon size={isMobile ? 140 : 260} />
      </div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        <div className="clock-time" style={{ 
          fontSize: isMobile ? 'clamp(2.5rem, 12vw, 3.5rem)' : 'clamp(4rem, 12vw, 8rem)', 
          letterSpacing: '-0.07em',
          fontWeight: 800,
          fontFamily: 'Syne, sans-serif',
          background: 'linear-gradient(180deg, #fff, var(--text2))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 20px 50px rgba(0,0,0,0.4)'
        }}>
          {format(time, 'HH:mm:ss')}
        </div>
        <div className="clock-date" style={{ 
          fontSize: '14px', 
          letterSpacing: '0.3em', 
          marginTop: 16,
          color: 'var(--accent)',
          fontWeight: 800,
          opacity: 0.9
        }}>
          {format(time, 'EEEE, MMMM do').toUpperCase()}
        </div>
      </motion.div>

      <div style={{ marginTop: '48px', maxWidth: '800px', margin: '48px auto 0' }}>
        <div style={{ height: 6, background: 'rgba(255,255,255,0.03)', borderRadius: 3, overflow: 'hidden' }}>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 2, ease: "circOut" }}
            style={{ 
              height: '100%', 
              background: 'var(--grad-premium)', 
              borderRadius: 3, 
              boxShadow: '0 0 25px var(--accent-glow)'
            }} 
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginTop: 16, fontWeight: 800, letterSpacing: '0.1em' }}>
          <span>SUNRISE</span>
          <span style={{ color: 'var(--text)', background: 'rgba(124, 109, 250, 0.1)', padding: '4px 12px', borderRadius: 20, border: '1px solid rgba(124, 109, 250, 0.2)' }}>
            {Math.round(pct)}% JOURNEY COMPLETE
          </span>
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
      <div className="mobile-feed" style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 32 }}>
        {/* Row 1: Key Items */}
        <div style={{ display: 'grid', gridTemplateColumns: nextEvent ? '1.2fr 1fr' : '1fr', gap: 16 }}>
          {nextEvent && (
            <div className="glass-card feed-item next-up" onClick={() => navigate('/schedule')} style={{ padding: '20px', borderRadius: 24, border: '1px solid var(--border-premium)' }}>
              <div className="feed-label" style={{ fontSize: 10, fontWeight: 800, color: 'var(--accent)', letterSpacing: 1 }}>NEXT UP</div>
              <div className="feed-time" style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Syne', margin: '4px 0' }}>{nextEvent.startTime}</div>
              <div className="feed-title" style={{ fontSize: 14, opacity: 0.8, fontWeight: 600 }}>{nextEvent.title}</div>
            </div>
          )}
          {topTask && (
            <div className="glass-card feed-item priority-task" onClick={() => navigate('/tasks')} style={{ padding: '20px', borderRadius: 24, border: '1px solid var(--border-premium)' }}>
              <div className="feed-label" style={{ fontSize: 10, fontWeight: 800, color: 'var(--orange)', letterSpacing: 1 }}>TOP FOCUS</div>
              <div className={`feed-priority-tag priority-${topTask.priority}`} style={{ fontSize: 9, margin: '8px 0' }}>{topTask.priority.toUpperCase()}</div>
              <div className="feed-title" style={{ fontSize: 14, fontWeight: 700 }}>{topTask.title}</div>
            </div>
          )}
        </div>

        {/* Row 2: Rituals & Habits */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="glass-card feed-item habits-glance" onClick={() => navigate('/habits')} style={{ padding: '20px', borderRadius: 24 }}>
            <div className="feed-label" style={{ fontSize: 10, fontWeight: 800, color: 'var(--accent3)', letterSpacing: 1, marginBottom: 12 }}>RITUALS</div>
            <div className="feed-habits-grid" style={{ display: 'flex', gap: 8 }}>
              {d?.habits?.list?.slice(0, 3).map(h => (
                <div key={h._id} className={`feed-habit-dot ${h.completedToday ? 'done' : ''}`} style={{ 
                  width: 32, height: 32, borderRadius: 10, fontSize: 16,
                  background: h.completedToday ? h.color : 'var(--surface2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid var(--border)'
                }}>
                  {h.icon}
                </div>
              ))}
            </div>
          </div>
          {d?.notes?.recent?.length > 0 && (
            <div className="glass-card feed-item recent-note" onClick={() => navigate('/notes')} style={{ padding: '20px', borderRadius: 24 }}>
              <div className="feed-label" style={{ fontSize: 10, fontWeight: 800, color: 'var(--accent2)', letterSpacing: 1, marginBottom: 8 }}>KNOWLEDGE</div>
              <div style={{ fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {d.notes.recent[0].title}
              </div>
              <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>Recently captured</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
    <div className="responsive-container">
      <div className="page-header mb-8">
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="page-title flex items-center gap-4" style={{ 
            fontSize: 'clamp(1.5rem, 7vw, 4rem)', 
            fontWeight: 800,
            fontFamily: 'Syne, sans-serif',
            lineHeight: 1.05,
            letterSpacing: '-0.05em'
          }}>
            <GreetingIcon className="text-accent" size={isMobile ? 32 : 56} style={{ flexShrink: 0, filter: 'drop-shadow(0 0 15px var(--accent-glow))' }} />
            <div style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {greeting}, <span style={{ 
                background: 'var(--grad-premium)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline-block'
              }}>{user?.name?.split(' ')[0]}</span>
            </div>
          </div>
          <p className="page-subtitle" style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--muted)', marginTop: 8, letterSpacing: '0.02em' }}>
            Synchronizing your productivity pulse for today
          </p>
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
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 32 }}>
              <h1 style={{ fontSize: isMobile ? '2rem' : '3.5rem', fontWeight: 800, fontFamily: 'Syne, sans-serif', letterSpacing: '-0.04em', margin: 0, lineHeight: 1 }}>
                Mission <br />Control
              </h1>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', marginBottom: 24, textTransform: 'uppercase', letterSpacing: 2 }}>
                Sub-orbital activity logs
              </div>
              <div className="hide-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 100px 80px', padding: '12px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', fontSize: 10, fontWeight: 800, color: 'var(--muted)', marginBottom: 12, letterSpacing: 1 }}>
                <span>SOLAR DATE</span>
                <span className="text-center">EXECUTIONS</span>
                <span className="text-center">RECOVERY</span>
                <span className="text-center">RITUALS</span>
                <span className="text-center">SIGNATURE</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(Array.isArray(activityData) ? activityData : []).slice(-5).reverse().map((log, i) => (
                  <div key={log.date} style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr auto' : '1fr 100px 100px 100px 80px',
                    padding: isMobile ? '16px 20px' : '16px 20px',
                    background: 'var(--surface2)',
                    borderRadius: 18,
                    alignItems: 'center',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'var(--transition)'
                  }} className="hover-lift">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{format(new Date(log.date), isMobile ? 'EEEE, MMM d' : 'MMMM do, yyyy')}</span>
                        {isMobile && <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>{log.tasksCompleted} executions • {log.focusMinutes}m recovery</span>}
                    </div>
                    {!isMobile && (
                      <>
                        <span className="text-center" style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>{log.tasksCompleted}</span>
                        <span className="text-center" style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent3)' }}>{log.focusMinutes}m</span>
                        <span className="text-center" style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent2)' }}>{log.habitsCompleted}</span>
                      </>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <div style={{
                        width: 14,
                        height: 14,
                        borderRadius: 4,
                        background: ['var(--surface3)', 'var(--accent)', 'var(--accent4)', 'var(--accent3)', 'linear-gradient(135deg, var(--accent), var(--accent2))'][log.intensity || 0],
                        border: '1px solid var(--border)',
                        boxShadow: (log.intensity || 0) > 2 ? '0 0 10px var(--accent-glow)' : 'none'
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
