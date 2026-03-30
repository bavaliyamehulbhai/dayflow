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
import MagneticButton from '../components/common/MagneticButton';



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

const AnimatedStat = React.memo(({ value, label, color, icon: Icon, onClick }) => {
  const animated = useCountUp(typeof value === 'number' ? value : 0);
  const display = typeof value === 'string' ? value : animated;
  return (
    <div 
      className="stat-card-premium gpu-accel haptic-tap" 
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="stat-card-glow" style={{ background: color }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ color, opacity: 0.9, marginBottom: 4 }}><Icon size={24} /></div>
        <SensitivityShield>
          <div className="stat-value" style={{ color }}>{display}</div>
        </SensitivityShield>
        <div className="stat-label">{label}</div>
      </div>
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

const AuraOrb = React.memo(({ color, size, top, left, delay, duration = 15 }) => (
  <motion.div
    animate={{
      x: [0, 50, -30, 0],
      y: [0, -40, 60, 0],
      scale: [1, 1.2, 0.9, 1],
      opacity: [0.1, 0.2, 0.1]
    }}
    transition={{
      duration,
      repeat: Infinity,
      ease: "easeInOut",
      delay
    }}
    style={{
      position: 'absolute',
      width: size,
      height: size,
      background: color,
      borderRadius: '50%',
      filter: 'blur(80px)',
      zIndex: -1,
      top,
      left,
      pointerEvents: 'none',
      willChange: 'transform, opacity'
    }}
  />
));

function Clock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  let GreetingIcon = Zap;
  const hours = time.getHours();
  const pct = Math.min(100, Math.max(0, ((hours - 6) * 60 + time.getMinutes()) / (17 * 60) * 100));
  if (hours < 12) GreetingIcon = Sunrise;      // Good Morning
  else if (hours < 17) GreetingIcon = Sun;     // Good Afternoon
  else if (hours < 21) GreetingIcon = Sunset;  // Good Evening
  else GreetingIcon = Moon;                    // Good Night

  const isMobile = window.innerWidth <= 768;
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="clock-card-premium"
    >
      <div className="greeting-icon-bg" style={{ color: 'var(--accent)' }}>
        <GreetingIcon size={isMobile ? 48 : 120} />
      </div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        <div className="clock-time-display">
          {format(time, 'HH:mm:ss')}
        </div>
        <div className="clock-date-display">
          {format(time, 'EEEE, MMMM do')}
        </div>
      </motion.div>

      <div style={{ marginTop: isMobile ? '24px' : '48px', maxWidth: '800px', margin: `${isMobile ? '24px' : '48px'} auto 0` }}>
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
  else if (hours >= 17 && hours < 21) { greeting = 'Good Evening'; GreetingIcon = Sunset; }
  else if (hours >= 21 || hours < 5) { greeting = 'Good Night'; GreetingIcon = Moon; }

  const MobileFeed = () => {
    const nextEvent = d?.schedule?.today?.find(ev => {
      const now = new Date();
      const nowMin = now.getHours() * 60 + now.getMinutes();
      const [sh, sm] = ev.startTime.split(':').map(Number);
      return (sh * 60 + sm) > nowMin;
    });

    const topTask = d?.tasks?.today?.sort((a, b) => (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2))[0];
    
    return (
      <div className="feed-grid" style={{ gap: 12 }}>
        {nextEvent && (
          <div className="feed-item-premium glass-holographic hover-lift haptic-tap" onClick={() => navigate('/schedule')} style={{ border: '1px solid rgba(124, 109, 250, 0.2)' }}>
            <div className="flex-between">
              <div className="feed-label" style={{ color: 'var(--accent)' }}>UPCOMING</div>
              <ClockIcon size={12} className="color-muted" />
            </div>
            <div className="text-xl fw-extrabold ls-tighter mt-2 color-accent">{nextEvent.startTime}</div>
            <div className="text-sm fw-bold opacity-90 truncate">{nextEvent.title}</div>
          </div>
        )}
        {topTask && (
          <div className="feed-item-premium glass-holographic hover-lift haptic-tap" onClick={() => navigate('/tasks')} style={{ border: '1px solid rgba(251, 146, 60, 0.2)' }}>
            <div className="flex-between">
              <div className="feed-label" style={{ color: 'var(--orange)' }}>PRIORITY</div>
              <Zap size={12} className="color-muted" />
            </div>
            <div className={`badge badge-${topTask.priority} mt-2 mb-1`}>{topTask.priority.toUpperCase()}</div>
            <div className="text-sm fw-bold truncate">{topTask.title}</div>
          </div>
        )}
        <div className="feed-item-premium glass-holographic hover-lift haptic-tap" onClick={() => navigate('/habits')} style={{ border: '1px solid rgba(0, 242, 254, 0.2)' }}>
          <div className="flex-between">
            <div className="feed-label" style={{ color: 'var(--accent3)' }}>FLOW</div>
            <RefreshCw size={12} className="color-muted" />
          </div>
          <div className="flex-items-center gap-2 mt-3">
            {d?.habits?.list?.slice(0, 4).map(h => (
              <div key={h._id} className={`feed-habit-dot ${h.completedToday ? 'done success-pop' : ''}`} style={{ 
                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
                background: h.completedToday ? h.color : 'rgba(255,255,255,0.03)',
                border: h.completedToday ? 'none' : '1px solid var(--border)'
              }}>
                {h.completedToday ? <Check size={14} color="white" strokeWidth={3} /> : h.icon}
              </div>
            ))}
          </div>
        </div>
        {d?.notes?.recent?.length > 0 && (
          <div className="feed-item-premium glass-holographic hover-lift haptic-tap" onClick={() => navigate('/notes')} style={{ border: '1px solid rgba(255, 77, 125, 0.2)' }}>
            <div className="flex-between">
              <div className="feed-label" style={{ color: 'var(--accent2)' }}>BRAIN DUMP</div>
              <Sparkles size={12} className="color-muted" />
            </div>
            <div className="text-sm fw-bold truncate mt-2">{d.notes.recent[0].title}</div>
            <div className="text-xs color-muted mt-1 opacity-70">Recently archived</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="responsive-container">
      <div className="dashboard-header" style={{ position: 'relative', overflow: 'visible' }}>
        <AuraOrb color="var(--accent)" size={300} top="-100px" left="-50px" delay={0} />
        <AuraOrb color="var(--accent2)" size={250} top="20px" left="200px" delay={2} duration={12} />
        <AuraOrb color="var(--accent3)" size={200} top="-40px" left="400px" delay={4} duration={18} />
        <div className="flex-items-center gap-4">
          <GreetingIcon className="text-accent aura-float" size={isMobile ? 28 : 44} style={{ filter: 'drop-shadow(0 0 15px var(--accent-glow))' }} />
          <div className="dashboard-title text-display truncate" style={{ fontSize: 'var(--fs-2xl)' }}>
            {greeting}, <span className="holographic-text" style={{ 
              background: 'linear-gradient(135deg, var(--text) 0%, var(--accent) 50%, var(--text) 100%)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'organicShimmer 8s linear infinite'
            }}>{user?.name?.split(' ')[0]}</span>
          </div>
        </div>
        <p className="page-subtitle fw-semibold color-muted mt-2 ls-wide">
          Synchronizing your productivity pulse for today
        </p>
      </div>

      {/* Clock */}
      <Clock />

      <div className="stats-grid-auto">
        {[
          { label: 'Tasks', value: d?.tasks?.summary?.completed || 0, color: 'var(--green)', icon: CheckCircle2, onClick: () => navigate('/tasks?status=completed') },
          { label: 'Pending', value: d?.tasks?.summary?.pending || 0, color: 'var(--yellow)', icon: Zap, onClick: () => navigate('/tasks?status=pending') },
          { label: 'Focus', value: d?.pomodoro?.todayMinutes || 0, color: 'var(--accent)', icon: Timer, onClick: () => navigate('/pomodoro') },
          { label: 'Rituals', value: `${d?.habits?.completedToday || 0}/${d?.habits?.total || 0}`, color: 'var(--accent3)', icon: Trophy, onClick: () => navigate('/habits') },
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
          <motion.div variants={itemVariants} className="card glass-holographic aura-iridescent" style={{ padding: '24px', border: 'none' }}>
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
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: isMobile ? 20 : 32 }}>
              <h1 style={{ fontSize: isMobile ? '1.5rem' : '3.5rem', fontWeight: 800, fontFamily: 'Syne, sans-serif', letterSpacing: '-0.04em', margin: 0, lineHeight: 1 }}>
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
              <div style={{ height: 10, background: 'var(--bg)', borderRadius: 5, overflow: 'hidden', position: 'relative' }}>
                <div className="shimmer-sweep" style={{ position: 'absolute', inset: 0, zIndex: 1 }} />
                <div style={{ width: `${completionPct}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--green))', borderRadius: 5, transition: 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1)', boxShadow: '0 0 15px var(--accent-glow)', position: 'relative', zIndex: 2 }} />
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
          <motion.div variants={itemVariants} className="aura-float">
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
    </div>
  );
}
