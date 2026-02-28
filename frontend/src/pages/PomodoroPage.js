import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pomodoroAPI, tasksAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format } from 'date-fns';
import {
  Target, Coffee, Trees, Play, Pause, RotateCcw,
  History, Zap, Trophy, Brain, Timer, Layers,
  StickyNote, Award, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmDialog from '../components/ConfirmDialog';

const MODES = {
  work: { label: 'Focus', color: 'var(--accent)', icon: Brain, gradient: 'linear-gradient(135deg, #8272ff, #fa6d8a)' },
  'short-break': { label: 'Short Break', color: 'var(--green)', icon: Coffee, gradient: 'linear-gradient(135deg, #5ffad1, #3ecf8e)' },
  'long-break': { label: 'Long Break', color: 'var(--accent2)', icon: Trees, gradient: 'linear-gradient(135deg, #fa6d8a, #8272ff)' }
};

// Responsive hook
function useWindowWidth() {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return w;
}

export default function PomodoroPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const width = useWindowWidth();
  const isMobile = width <= 768;
  const isTablet = width <= 1024 && width > 768;

  const prefs = user?.preferences || { pomodoroWork: 25, pomodoroBreak: 5, pomodoroLong: 15 };
  const DURATIONS = {
    work: (prefs.pomodoroWork || 25) * 60,
    'short-break': (prefs.pomodoroBreak || 5) * 60,
    'long-break': (prefs.pomodoroLong || 15) * 60
  };

  const [mode, setMode] = useState('work');
  const [timeLeft, setTimeLeft] = useState(DURATIONS.work);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [currentPomoId, setCurrentPomoId] = useState(null);
  const [startedAt, setStartedAt] = useState(null);
  const [linkedTask, setLinkedTask] = useState('');
  const [note, setNote] = useState('');
  const [confirmState, setConfirmState] = useState({ open: false, action: null, message: '' });
  const intervalRef = useRef(null);

  const { data: statsData } = useQuery({
    queryKey: ['pomo-stats'],
    queryFn: () => pomodoroAPI.stats({ period: 7 }).then(r => r.data.stats)
  });

  const { data: tasksData } = useQuery({
    queryKey: ['tasks-for-pomo'],
    queryFn: () => tasksAPI.getAll({ status: 'pending', limit: 20 }).then(r => r.data.tasks)
  });

  const startMutation = useMutation({
    mutationFn: (data) => pomodoroAPI.start(data),
    onSuccess: (r) => setCurrentPomoId(r.data.pomodoro?._id)
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, data }) => pomodoroAPI.complete(id, data),
    onSuccess: () => {
      qc.invalidateQueries(['pomo-stats']);
      qc.invalidateQueries(['dashboard']);
    }
  });

  const duration = DURATIONS[mode];
  const progress = ((duration - timeLeft) / duration) * 100;
  const modeInfo = MODES[mode];
  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const playSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 440; osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.8);
    } catch { }
  }, []);

  const handleComplete = useCallback(() => {
    clearInterval(intervalRef.current);
    setRunning(false);
    playSound();
    if (currentPomoId && mode === 'work') {
      const actualDuration = startedAt ? Math.round((Date.now() - startedAt) / 1000) : DURATIONS.work;
      completeMutation.mutate({ id: currentPomoId, data: { actualDuration, note } });
      setSessions(s => s + 1);
    }
    const nextMode = mode === 'work' ? ((sessions + 1) % 4 === 0 ? 'long-break' : 'short-break') : 'work';
    toast.success(`✨ ${modeInfo.label} session complete!`);
    setTimeout(() => {
      setMode(nextMode); setTimeLeft(DURATIONS[nextMode]);
      setCurrentPomoId(null); setStartedAt(null);
    }, 500);
  }, [mode, currentPomoId, sessions, startedAt, note, modeInfo, completeMutation, DURATIONS, playSound]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => { if (t <= 1) { handleComplete(); return 0; } return t - 1; });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, handleComplete]);

  useEffect(() => {
    document.title = running ? `${formatTime(timeLeft)} · ${modeInfo.label}` : 'Flow State';
    return () => { document.title = 'DayFlow'; };
  }, [running, timeLeft, modeInfo]);

  const handleStart = () => {
    if (!running) {
      setStartedAt(Date.now());
      if (mode === 'work' && !currentPomoId) {
        startMutation.mutate({ type: mode, linkedTask: linkedTask || undefined });
      }
    }
    setRunning(!running);
  };

  const handleReset = () => {
    setConfirmState({ open: true, action: 'reset', message: 'Reset this session? Your progress will be lost.' });
  };

  const handleModeChange = (newMode) => {
    if (running) {
      setConfirmState({ open: true, action: 'mode', newMode, message: 'Abandon current session and switch mode?' });
      return;
    }
    switchMode(newMode);
  };

  const switchMode = (newMode) => {
    clearInterval(intervalRef.current);
    setRunning(false); setMode(newMode); setTimeLeft(DURATIONS[newMode]);
    setCurrentPomoId(null); setStartedAt(null);
  };

  const handleConfirm = () => {
    const { action, newMode } = confirmState;
    if (action === 'reset') {
      clearInterval(intervalRef.current);
      setRunning(false); setTimeLeft(DURATIONS[mode]);
      setCurrentPomoId(null); setStartedAt(null);
    } else if (action === 'mode') {
      switchMode(newMode);
    }
    setConfirmState({ open: false, action: null, message: '' });
  };

  // Responsive SVG timer size
  const timerSize = isMobile ? Math.min(width - 80, 260) : isTablet ? 250 : 280;
  const radius = timerSize * 0.39;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const sidebarContent = (
    <>
      {/* Stats */}
      <div className="card glass-card">
        <div className="card-title" style={{ marginBottom: 18 }}>
          <History size={15} className="text-accent" /> Mastery Statistics
        </div>
        <div className="stats-grid mb-6">
          {[
            { label: 'This Week', value: statsData?.periodPomos ?? 0, sub: `${statsData?.periodFocusMinutes || 0} min`, icon: Zap, color: 'var(--accent)' },
            { label: 'All Time', value: statsData?.totalPomos ?? 0, sub: 'sessions', icon: Layers, color: 'var(--accent2)' },
            { label: 'Lifetime Flow', value: statsData?.totalFocusMinutes ? `${Math.floor(statsData.totalFocusMinutes / 60)}h ${statsData.totalFocusMinutes % 60}m` : '0m', sub: 'pure focus', icon: Trophy, color: 'var(--yellow)' },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '14px', background: 'var(--surface2)', borderRadius: 14, border: '1px solid var(--border)' }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <s.icon size={18} style={{ color: s.color }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                  <span style={{ fontSize: 'var(--fs-xl)', fontWeight: 800 }}>{s.value}</span>
                  <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>{s.sub}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Link Task */}
      <div className="card glass-card">
        <div className="card-title" style={{ marginBottom: 14 }}>
          <Target size={15} className="text-accent" /> Active Objective
        </div>
        <div style={{ position: 'relative' }}>
          <select className="select" value={linkedTask} onChange={e => setLinkedTask(e.target.value)}>
            <option value="">— Unlinked Session —</option>
            {tasksData?.map(t => <option key={t._id} value={t._id}>{t.title}</option>)}
          </select>
        </div>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 10, lineHeight: 1.5 }}>
          Link a task to attribute focus time and boost productivity insights.
        </p>
      </div>

      {/* Session Note */}
      <div className="card glass-card">
        <div className="card-title" style={{ marginBottom: 14 }}>
          <StickyNote size={15} className="text-accent" /> Session Intent
        </div>
        <textarea
          className="textarea"
          rows={3}
          style={{ minHeight: 90 }}
          placeholder="What are you focusing on this interval?"
          value={note}
          onChange={e => setNote(e.target.value)}
        />
      </div>

      {/* Config */}
      <div className="card glass-card" style={{ padding: '18px 20px' }}>
        <div className="card-title" style={{ marginBottom: 14, opacity: 0.6 }}>Config</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: 'Work', value: prefs.pomodoroWork, icon: Brain, color: 'var(--accent)' },
            { label: 'Short Break', value: prefs.pomodoroBreak, icon: Coffee, color: 'var(--green)' },
            { label: 'Long Break', value: prefs.pomodoroLong, icon: Trees, color: 'var(--accent2)' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text2)' }}>
                <s.icon size={14} style={{ color: s.color }} /> {s.label}
              </div>
              <span style={{ fontWeight: 700, color: s.color }}>{s.value}m</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <div className={`responsive-container ${running && isMobile ? 'focus-immersion' : ''}`}>
      <div className="page-header mb-6">
        <div>
          <div className="page-title flex items-center gap-3">
            <div className="text-accent"><Timer size={isMobile ? 24 : 32} /></div>
            Flow State
          </div>
          <p className="page-subtitle">Master your attention through intentional intervals</p>
        </div>
      </div>

      {/* Main grid: on mobile stack vertically, tablet/desktop side-by-side */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile || isTablet ? '1fr' : '1fr 320px',
        gap: isMobile ? 16 : 24
      }}>
        {/* LEFT: Timer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 14 : 20 }}>

          {/* Timer Card */}
          <div className="card glass-card" style={{ textAlign: 'center', padding: 'var(--space-8) var(--space-6)', position: 'relative', overflow: 'hidden' }}>
            {/* Background glow blobs */}
            <div style={{ position: 'absolute', top: -80, left: -80, width: 240, height: 240, background: modeInfo.color, opacity: 0.06, filter: 'blur(70px)', borderRadius: '50%', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -80, right: -80, width: 240, height: 240, background: 'var(--accent2)', opacity: 0.05, filter: 'blur(70px)', borderRadius: '50%', pointerEvents: 'none' }} />

            {/* Mode switcher */}
            <div style={{ display: 'flex', gap: isMobile ? 6 : 10, justifyContent: 'center', marginBottom: isMobile ? 28 : 44, flexWrap: 'wrap' }}>
              {Object.entries(MODES).map(([key, info]) => (
                <button
                  key={key}
                  onClick={() => handleModeChange(key)}
                  style={{
                    padding: isMobile ? '8px 14px' : '10px 20px',
                    fontSize: isMobile ? 12 : 13,
                    fontWeight: 700,
                    borderRadius: 50,
                    border: mode === key ? 'none' : '1px solid var(--border)',
                    background: mode === key ? info.gradient : 'transparent',
                    color: mode === key ? 'white' : 'var(--muted)',
                    cursor: 'pointer',
                    boxShadow: mode === key ? `0 4px 16px ${info.color}44` : 'none',
                    display: 'flex', alignItems: 'center', gap: 6,
                    transition: 'all 0.25s ease',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <info.icon size={isMobile ? 13 : 15} />
                  {info.label}
                </button>
              ))}
            </div>

            {/* SVG Circular Timer — fully responsive */}
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: isMobile ? 28 : 44 }}>
              <svg
                width={timerSize}
                height={timerSize}
                style={{ transform: 'rotate(-90deg)', display: 'block' }}
                viewBox={`0 0 ${timerSize} ${timerSize}`}
              >
                <defs>
                  <linearGradient id="pomoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={modeInfo.color} />
                    <stop offset="100%" stopColor="var(--accent2)" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>
                {/* Track */}
                <circle cx={timerSize / 2} cy={timerSize / 2} r={radius} fill="none" stroke="var(--border)" strokeWidth={isMobile ? 7 : 10} opacity={0.3} />
                {/* Progress */}
                <motion.circle
                  cx={timerSize / 2} cy={timerSize / 2} r={radius}
                  fill="none"
                  stroke="url(#pomoGradient)"
                  strokeWidth={isMobile ? 7 : 10}
                  strokeDasharray={circumference}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  strokeLinecap="round"
                  filter="url(#glow)"
                />
              </svg>
              {/* Center text */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={Math.floor(timeLeft / 60)}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.05, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      fontFamily: 'Syne, sans-serif',
                      fontSize: 'clamp(2.5rem, 4vw + 1rem, 4.5rem)',
                      fontWeight: 800,
                      letterSpacing: -3,
                      lineHeight: 1,
                      background: modeInfo.gradient,
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}
                  >
                    {formatTime(timeLeft)}
                  </motion.div>
                </AnimatePresence>
                <div style={{ fontSize: isMobile ? 10 : 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 3, fontWeight: 700, marginTop: 6 }}>
                  {modeInfo.label}
                </div>
                {running && (
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    style={{ width: 6, height: 6, borderRadius: '50%', background: modeInfo.color, marginTop: 8 }}
                  />
                )}
              </div>
            </div>

            {/* Session dots */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: isMobile ? 24 : 36 }}>
              {[0, 1, 2, 3].map(i => (
                <motion.div
                  key={i}
                  animate={{
                    scale: i === (sessions % 4) && running ? [1, 1.3, 1] : 1,
                    background: i < (sessions % 4) ? modeInfo.color : 'var(--border)'
                  }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  style={{
                    width: 10, height: 10, borderRadius: 4,
                    boxShadow: i < (sessions % 4) ? `0 0 8px ${modeInfo.color}88` : 'none',
                  }}
                />
              ))}
              {sessions > 0 && sessions % 4 === 0 && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  style={{ marginLeft: 8, fontSize: 12, fontWeight: 800, color: 'var(--accent)' }}
                >
                  ⚡ LEVEL UP!
                </motion.span>
              )}
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', alignItems: 'center' }}>
              <motion.button
                whileTap={{ scale: 0.96 }}
                whileHover={{ scale: 1.02 }}
                className="btn btn-primary"
                onClick={handleStart}
                style={{
                  padding: isMobile ? '14px 36px' : '16px 52px',
                  fontSize: isMobile ? 16 : 18,
                  fontWeight: 700,
                  background: modeInfo.gradient,
                  border: 'none',
                  boxShadow: `0 8px 28px ${modeInfo.color}55`,
                  flex: isMobile ? 1 : 'none',
                  minWidth: isMobile ? 'auto' : 180,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
                }}
              >
                {running ? <><Pause size={20} /> Pause</> : startedAt ? <><Play size={20} /> Resume</> : <><Play size={20} /> Start</>}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                className="btn btn-ghost haptic-tap"
                onClick={handleReset}
                style={{ width: isMobile ? 52 : 56, height: isMobile ? 52 : 56, padding: 0, borderRadius: '50%', border: '1px solid var(--border)', flexShrink: 0 }}
              >
                <RotateCcw size={18} />
              </motion.button>
            </div>

            {/* Today's focus */}
            <div style={{ marginTop: isMobile ? 20 : 28, fontSize: 13, color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Zap size={13} style={{ color: 'var(--accent)' }} />
              Sessions this week: <strong style={{ color: 'var(--text)', marginLeft: 4 }}>{statsData?.periodPomos || 0}</strong>
            </div>
          </div>

          {/* Chart */}
          <div className="card glass-card">
            <div className="card-title" style={{ marginBottom: 20 }}>
              <Award size={16} className="text-accent" /> 7-Day Focus Trend
            </div>
            <div style={{ height: isMobile ? 180 : 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statsData?.daily || []} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent)" stopOpacity={1} />
                      <stop offset="100%" stopColor="var(--accent2)" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.4} />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--muted)', fontSize: 10 }}
                    tickFormatter={d => format(new Date(d), 'EEE')}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--muted)', fontSize: 10 }}
                    width={35}
                    tickFormatter={v => `${v}m`}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(130,114,255,0.05)' }}
                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }}
                    formatter={(value) => [`${value} minutes`, 'Focus Time']}
                    labelFormatter={(label) => format(new Date(label), 'MMMM do, yyyy')}
                  />
                  <Bar dataKey="minutes" radius={[6, 6, 0, 0]} barSize={isMobile ? 18 : 24}>
                    {statsData?.daily?.map((_, i) => <Cell key={i} fill="url(#barGrad)" />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* On mobile/tablet: show sidebar cards inline below chart */}
          {(isMobile || isTablet) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 14 : 20 }}>
              {sidebarContent}
            </div>
          )}
        </div>

        {/* RIGHT: side panel — only on desktop */}
        {!isMobile && !isTablet && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {sidebarContent}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.action === 'reset' ? 'Reset Session?' : 'Switch Mode?'}
        message={confirmState.message}
        confirmText={confirmState.action === 'reset' ? 'Reset' : 'Switch'}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmState({ open: false, action: null, message: '' })}
      />

      <style>{`
        .glass-card { background: rgba(255,255,255,0.02); backdrop-filter: blur(12px); }
        .text-accent { color: var(--accent); }
      `}</style>
    </div>
  );
}
