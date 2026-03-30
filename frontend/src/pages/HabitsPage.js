import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { habitsAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import {
  Plus, Flame, Target, Trophy, Check, X, Pencil, Trash2,
  Sparkles, Calendar, Activity, Award, ChevronLeft, ChevronRight,
  RefreshCcw, Zap, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useZenTheme } from '../hooks/useZenTheme';
import { useNavigate } from 'react-router-dom';
import ConfirmDialog from '../components/ConfirmDialog';
import useFeedback from '../hooks/useFeedback';
import SensitivityShield from '../components/layout/SensitivityShield';
import Celebration from '../components/Celebration';
import ShortcutsHelp from '../components/layout/ShortcutsHelp';

const AuraOrb = ({ color, size, top, left, delay }) => (
  <motion.div
    animate={{ 
      x: [0, 30, -30, 0], 
      y: [0, -30, 30, 0],
      scale: [1, 1.2, 0.8, 1],
      opacity: [0.08, 0.15, 0.08]
    }}
    transition={{ duration: 15 + delay, repeat: Infinity, ease: 'easeInOut' }}
    style={{ position: 'absolute', width: size, height: size, borderRadius: '50%', background: color, filter: 'blur(80px)', top, left, zIndex: 0, pointerEvents: 'none' }}
  />
);

const ICONS = ['⭐', '💪', '🏃', '📚', '💧', '🧘', '🍎', '😴', '✍️', '🎯', '💊', '🌿', '🎨', '🎵', '🧹', '💻'];
const COLORS = ['#7c6dfa', '#fa6d8a', '#6dfacc', '#fad96d', '#fa9a6d', '#6daafa', '#e96dfa', '#6dfaed'];
const FREQ = [
  { value: 'daily', label: 'Every day' },
  { value: 'weekdays', label: 'Weekdays only' },
  { value: 'weekends', label: 'Weekends only' },
];

function useWindowWidth() {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return w;
}

function HabitModal({ habit, onClose, onSave, onDelete }) {
  const width = useWindowWidth();
  const isMobile = width <= 768;
  const [form, setForm] = useState({
    name: habit?.name || '',
    description: habit?.description || '',
    icon: habit?.icon || '⭐',
    color: habit?.color || '#7c6dfa',
    frequency: habit?.frequency || 'daily',
    targetCount: habit?.targetCount || 1,
    unit: habit?.unit || 'times'
  });

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.9, y: 30 }}
        animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
        exit={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.9, y: 30 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={`auth-card aura-iridescent ${isMobile ? 'bottom-sheet' : ''}`}
        style={{ width: '100%', maxWidth: 540, padding: 0, overflow: 'hidden' }}
      >
        <div className="modal-header" style={{ padding: isMobile ? '16px 20px' : '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Syne', fontWeight: 800, fontSize: isMobile ? 18 : 22 }}>
            <div className="auth-logo-icon" style={{ width: isMobile ? 28 : 32, height: isMobile ? 28 : 32, marginBottom: 0 }}>
              <RefreshCcw size={isMobile ? 16 : 18} color="white" />
            </div>
            {habit ? 'Refine Ritual' : 'Forge New Ritual'}
          </div>
          <button className="modal-close haptic-tap" onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: isMobile ? 6 : 8 }}>
            <X size={isMobile ? 18 : 20} />
          </button>
        </div>
        <div className="modal-body" style={{ 
          padding: isMobile ? '20px' : '32px',
          maxHeight: isMobile ? '75vh' : 'auto', 
          overflowY: 'auto',
          paddingBottom: isMobile ? 'calc(20px + env(safe-area-inset-bottom))' : 32
        }}>
          <div className="form-group mb-4">
            <label className="form-label" style={{ fontSize: 10, fontWeight: 800, color: 'var(--muted)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Ritual Name</label>
            <input className="auth-input haptic-feedback" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Morning meditation" style={{ height: isMobile ? 48 : 56, fontSize: isMobile ? 15 : 16 }} autoFocus />
          </div>
          <div className="form-group mb-4">
            <label className="form-label" style={{ fontSize: 10, fontWeight: 800, color: 'var(--muted)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Intent & Description</label>
            <textarea className="auth-input haptic-feedback" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Why is this important?" rows={2} style={{ height: 'auto', minHeight: isMobile ? 60 : 80, padding: isMobile ? '12px 16px' : '16px 20px', fontSize: isMobile ? 14 : 15 }} />
          </div>

          <div className="form-group mb-4">
            <label className="form-label" style={{ fontSize: 10, fontWeight: 800, color: 'var(--muted)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Icon Ritual</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {ICONS.map(icon => (
                <button key={icon} type="button" onClick={() => setForm(f => ({ ...f, icon }))}
                  className="glass haptic-tap"
                  style={{ width: isMobile ? 38 : 44, height: isMobile ? 38 : 44, borderRadius: 10, border: `2px solid ${form.icon === icon ? form.color : 'rgba(255,255,255,0.05)'}`, background: form.icon === icon ? `${form.color}22` : 'rgba(255,255,255,0.02)', fontSize: isMobile ? 18 : 20, cursor: 'pointer', transition: 'all 0.2s' }}>
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group mb-4">
            <label className="form-label" style={{ fontSize: 10, fontWeight: 800, color: 'var(--muted)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Signature Glow</label>
            <div style={{ display: 'flex', gap: isMobile ? 8 : 12, flexWrap: 'wrap' }}>
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                  className="haptic-tap"
                  style={{ width: isMobile ? 28 : 32, height: isMobile ? 28 : 32, borderRadius: '50%', background: c, border: `2px solid ${form.color === c ? 'white' : 'transparent'}`, cursor: 'pointer', boxShadow: form.color === c ? `0 0 12px ${c}` : 'none', transition: 'all 0.2s', padding: 0 }} />
              ))}
            </div>
          </div>

          <div className="grid-2 mb-4" style={{ gap: isMobile ? 12 : 16 }}>
            <div className="form-group" style={{ gridColumn: isMobile ? 'span 2' : 'span 1' }}>
              <label className="form-label" style={{ fontSize: 9, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 4 }}>Frequency</label>
              <select className="select premium-select" style={{ height: isMobile ? 44 : 48, borderRadius: 12, fontSize: isMobile ? 13 : 14, width: '100%' }} value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}>
                {FREQ.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, gridColumn: isMobile ? 'span 2' : 'span 1' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 9, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 4 }}>Target</label>
                <input type="number" className="auth-input haptic-feedback" style={{ height: isMobile ? 44 : 48, fontSize: 13 }} value={form.targetCount} onChange={e => setForm(f => ({ ...f, targetCount: parseInt(e.target.value) || 1 }))} min={1} />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 9, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 4 }}>Unit</label>
                <input className="auth-input haptic-feedback" style={{ height: isMobile ? 44 : 48, fontSize: 13 }} value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="times" />
              </div>
            </div>
          </div>

          <div className="glass-card aura-iridescent" style={{ padding: isMobile ? '12px 16px' : '20px', display: 'flex', alignItems: 'center', gap: 16, borderRadius: 16 }}>
            <div style={{ fontSize: isMobile ? '24px' : '32px', filter: `drop-shadow(0 0 8px ${form.color}44)`, width: isMobile ? 32 : 44, textAlign: 'center' }}>{form.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <SensitivityShield>
                <div style={{ fontWeight: 800, fontSize: isMobile ? 15 : 18, fontFamily: 'Syne, sans-serif', color: 'var(--text)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{form.name || 'Your new ritual'}</div>
              </SensitivityShield>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, marginTop: 4, letterSpacing: 0.5 }}>{form.targetCount} {form.unit} • {form.frequency}</div>
            </div>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: form.color, boxShadow: `0 0 12px ${form.color}`, flexShrink: 0 }} />
          </div>
        </div>
        <div className="modal-footer" style={{ padding: isMobile ? '16px 20px' : '20px 32px', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 10 }}>
          {habit && (
            <button 
              className="btn btn-icon glass haptic-tap" 
              style={{ width: isMobile ? 48 : 52, height: isMobile ? 48 : 52, borderRadius: 14, color: 'var(--red)', flexShrink: 0 }}
              onClick={() => {
                onDelete(habit);
              }}
            >
              <Trash2 size={20} />
            </button>
          )}
          <button className="btn btn-ghost haptic-tap" onClick={onClose} style={{ flex: 1, height: isMobile ? 48 : 52, borderRadius: 14 }}>Abort</button>
          <button className="auth-button haptic-tap" style={{ flex: 2, height: isMobile ? 48 : 52, borderRadius: 14, fontSize: isMobile ? 15 : 16 }} onClick={() => { if (!form.name.trim()) return toast.error('Name required'); onSave(form); }}>
            <div className="btn-glint" />
            {habit ? 'Refine' : 'Manifest'}
          </button>
        </div>
      </motion.div>

      <style>{`
        @keyframes streakFire {
          0%, 100% { transform: scale(1) translateY(0); filter: drop-shadow(0 0 2px #ff7c6d); }
          50% { transform: scale(1.15) translateY(-2px); filter: drop-shadow(0 0 8px #ff7c6d); }
        }
        .streak-fire-anim {
          animation: streakFire 2s ease-in-out infinite;
        }
        .streak-active-glow {
          background: rgba(255, 124, 109, 0.15) !important;
          border-color: rgba(255, 124, 109, 0.3) !important;
          box-shadow: 0 0 20px rgba(255, 124, 109, 0.1);
        }
        @media (max-width: 768px) {
          .modal-overlay {
            align-items: flex-end;
            padding: 0;
          }
          .auth-card.bottom-sheet {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            width: 100%;
            max-width: none;
            border-radius: 28px 28px 0 0;
            max-height: 92vh;
            margin: 0;
            animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          }
          @keyframes slideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
        }
      `}</style>
    </div>
  );
}

// ─── Ritual Card Component (Premium Grid Item) ──────────────────────────────
const RitualCard = ({ habit, today, isCompleted, onComplete, onEdit, onDelete }) => {
  const daysToShow = 7;
  const last7 = React.useMemo(() => eachDayOfInterval({ 
    start: subDays(new Date(), daysToShow - 1), 
    end: new Date() 
  }), []);
  
  const completionStatus = React.useMemo(() => last7.map(d => {
    const dateStr = format(d, 'yyyy-MM-dd');
    return {
      dateStr,
      done: isCompleted(habit, dateStr),
      isToday: dateStr === today,
      label: format(d, 'MMM d')
    };
  }), [habit.completions, today, last7]);

  const isTodayCompleted = React.useMemo(() => isCompleted(habit, today), [habit.completions, today]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -5 }}
      className="ritual-card-premium"
      onClick={() => onEdit(habit)}
      style={{ cursor: 'pointer' }}
    >
      <div className="btn-glint" style={{ opacity: 0.05 }} />
      <div className="ritual-card-header">
        <div className="ritual-icon-container" style={{ color: habit.color }}>
          {habit.icon}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {habit.streak?.current > 0 && (
            <div className={`ritual-streak-badge ${habit.streak?.current >= 7 ? 'streak-active-glow' : ''}`}>
              <Flame size={14} fill={habit.streak?.current >= 7 ? '#ff7c6d' : 'none'} className="streak-fire-anim" /> {habit.streak.current}d
            </div>
          )}
          <motion.button
            whileHover={{ scale: 1.1, color: 'var(--red)' }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); onDelete(habit); }}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', padding: 4 }}
          >
            <Trash2 size={16} />
          </motion.button>
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <SensitivityShield>
          <h3 style={{ fontSize: 18, fontWeight: 800, fontFamily: 'Syne', marginBottom: 4, letterSpacing: '-0.02em' }}>{habit.name}</h3>
        </SensitivityShield>
        <p style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Zap size={12} /> {habit.targetCount} {habit.unit} • {habit.frequency}
        </p>
      </div>

      <div className="ritual-consistency-dots">
        {completionStatus.map(s => {
          return (
            <div 
              key={s.dateStr}
              className={`ritual-dot ${s.done ? 'completed' : ''} ${s.isToday ? 'today' : ''}`}
              style={{ 
                backgroundColor: s.done ? habit.color : '',
                boxShadow: s.done ? `0 0 10px ${habit.color}aa` : '',
                borderColor: s.isToday ? habit.color : ''
              }}
              title={s.label}
            />
          );
        })}
        
        <div style={{ marginLeft: 'auto' }}>
           <motion.button
            whileHover={{ scale: 1.1, boxShadow: isTodayCompleted ? `0 8px 25px ${habit.color}66` : '0 8px 20px rgba(255,255,255,0.1)' }}
            whileTap={{ scale: 0.85 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            onClick={(e) => { 
              e.stopPropagation(); 
              onComplete({ id: habit._id, date: today }); 
            }}
            className={`haptic-tap ${isTodayCompleted ? 'done' : ''}`}
            style={{
              width: 36, height: 36, borderRadius: 12,
              background: isTodayCompleted ? habit.color : 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.05)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: isTodayCompleted ? `0 8px 20px ${habit.color}44` : 'none',
              transition: 'background 0.3s ease, border-color 0.3s ease'
            }}
          >
            <AnimatePresence mode="wait">
              {isTodayCompleted ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 45 }}
                >
                  <Check size={20} strokeWidth={3.5} />
                </motion.div>
              ) : (
                <motion.div key="plus" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Plus size={18} strokeWidth={2.5} opacity={0.4} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default function HabitsPage() {
  const qc = useQueryClient();
  const feedback = useFeedback();
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState('');
  const [celebration, setCelebration] = useState({ open: false, title: '', subtitle: '' });
  const [confirmDialog, setConfirmDialog] = useState({ open: false });
  const today = format(new Date(), 'yyyy-MM-dd');
  const width = useWindowWidth();
  const isMobile = width <= 768;

  const { data, isLoading } = useQuery({
    queryKey: ['habits'],
    queryFn: () => habitsAPI.getAll().then(r => r.data.habits)
  });

  const invalidate = () => { qc.invalidateQueries(['habits']); qc.invalidateQueries(['dashboard']); };

  const createMutation = useMutation({
    mutationFn: habitsAPI.create,
    onSuccess: () => { toast.success('Ritual established!'); setModal(null); invalidate(); },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to establish ritual.')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => habitsAPI.update(id, data),
    onSuccess: () => { toast.success('Ritual refined!'); setModal(null); invalidate(); },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to refine ritual.')
  });

  const deleteMutation = useMutation({
    mutationFn: habitsAPI.delete,
    onSuccess: () => { toast.success('Ritual banished'); invalidate(); },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to banish ritual.')
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, date }) => habitsAPI.complete(id, { date }),
    onSuccess: (res) => {
      feedback('success');
      invalidate();
      
      // Check for milestone in response (if backend provides updated streak)
      // Otherwise, calculate from current data
      const habit = res.data.habit;
      if (habit && habit.streak?.current > 0 && habit.streak.current % 7 === 0) {
        setCelebration({
          open: true,
          title: `${habit.streak.current} DAY STREAK`,
          subtitle: "Ritual Synchronization Complete"
        });
      }
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Synchronization failed.')
  });

  const habits = (data || []).filter(h => 
    h.name?.toLowerCase().includes(search.toLowerCase()) || 
    h.description?.toLowerCase().includes(search.toLowerCase())
  );
  const completedTodayCount = habits.filter(h => h.completions?.some(c => c.date === today)).length;
  const syncRate = habits.length ? Math.round((completedTodayCount / habits.length) * 100) : 0;

  const isCompleted = (habit, date) => habit.completions?.some(c => c.date === date);

  const handleSave = (formData) => {
    if (formData._delete) {
      deleteMutation.mutate(formData._id);
      setModal(null);
      return;
    }
    if (modal && modal._id) updateMutation.mutate({ id: modal._id, data: formData });
    else createMutation.mutate(formData);
  };

  return (
    <div className="responsive-container pb-28">
      <div className="page-header mb-10" style={{ alignItems: 'flex-start', position: 'relative', overflow: 'hidden', borderRadius: 32, padding: isMobile ? '32px 20px' : '48px 40px' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.02)', zIndex: -1 }} />
        <AuraOrb color="var(--accent)" size={300} top="-100px" left="-50px" delay={0} />
        <AuraOrb color="var(--accent2)" size={250} top="20%" left="60%" delay={2} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="page-title flex items-center gap-4" style={{ fontFamily: 'Syne, sans-serif', fontSize: isMobile ? '32px' : 'var(--fs-2xl)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1 }}>
            <div className="auth-logo-icon aura-float" style={{ width: 52, height: 52, marginBottom: 0 }}>
              <RefreshCcw size={26} color="white" strokeWidth={2.5} />
            </div>
            Ritual Engine
          </div>
          <p className="page-subtitle" style={{ fontSize: 'var(--fs-sm)', opacity: 0.7, fontWeight: 700, marginTop: 12, maxWidth: 400 }}>Consistent biological evolution via neural maintenance</p>
          
          {/* Search & Add Row */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', width: '100%', marginTop: 24 }}>
            <div style={{ 
              background: 'rgba(255,255,255,0.03)', borderRadius: 16, 
              padding: '0 14px', height: 48, flex: 1, 
              display: 'flex', alignItems: 'center', gap: 10, border: '1px solid rgba(255,255,255,0.05)' 
            }}>
              <Search size={16} color="var(--muted)" />
              <input 
                placeholder="Find rituals..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                style={{ background: 'none', border: 'none', outline: 'none', color: 'white', fontWeight: 600, width: '100%', fontSize: 13 }} 
              />
            </div>
            <button 
              onClick={() => setModal('create')} 
              className="auth-button magnetic-btn haptic-tap" 
              style={{ height: 48, padding: '0 18px', borderRadius: 14, width: 'auto', flexShrink: 0 }}
            >
              <Plus size={20} /> {!isMobile && <span style={{ marginLeft: 8 }}>FORGE</span>}
            </button>
          </div>
        </div>
        {/* Removed old Forge Ritual button from here as it's now in the search row */}
      </div>

      {/* Synchronicity HUD */}
      <div className="stats-grid-auto mb-10">
        <div className="stat-card-premium">
          <div className="stat-card-glow" style={{ background: 'var(--accent)' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="stat-label">Active Rituals</div>
            <SensitivityShield><div className="stat-value">{habits.length}</div></SensitivityShield>
          </div>
        </div>
        <div className="stat-card-premium">
          <div className="stat-card-glow" style={{ background: 'var(--green)' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="stat-label">Done Today</div>
            <SensitivityShield><div className="stat-value" style={{ color: 'var(--green)' }}>{completedTodayCount}</div></SensitivityShield>
          </div>
        </div>
        <div className="stat-card-premium">
          <div className="stat-card-glow" style={{ background: syncRate > 80 ? 'var(--accent)' : 'var(--yellow)' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="stat-label">Synchronization</div>
            <SensitivityShield><div className="stat-value" style={{ color: syncRate > 80 ? 'var(--accent)' : 'var(--yellow)' }}>
              {syncRate}%
            </div></SensitivityShield>
          </div>
        </div>
        <div className="stat-card-premium hide-mobile">
          <div className="stat-card-glow" style={{ background: 'var(--red)' }} />
          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
            <div className="stat-label">System Streak</div>
            <SensitivityShield><div className="stat-value" style={{ color: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Flame size={24} fill="var(--red)" />
              {Math.max(...habits.map(h => h.streak?.current || 0), 0)}
            </div></SensitivityShield>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-page"><div className="loading-spinner" style={{ width: 32, height: 32 }} /></div>
      ) : habits.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card aura-iridescent" 
          style={{ padding: '100px 40px', textAlign: 'center', borderRadius: 40, border: 'none' }}
        >
          <div className="empty-icon aura-float" style={{ fontSize: 80, marginBottom: 24, filter: 'drop-shadow(0 0 30px var(--accent-glow))' }}>🎭</div>
          <h2 className="empty-title" style={{ fontSize: 32, fontWeight: 800, fontFamily: 'Syne', letterSpacing: '-0.04em' }}>The Stage is Set</h2>
          <p className="empty-desc" style={{ marginTop: 16, fontSize: 18, opacity: 0.6, maxWidth: 450, marginInline: 'auto' }}>Begin your biological evolution by defining your first high-performance ritual.</p>
          <button className="auth-button magnetic-btn haptic-tap" style={{ marginTop: 40, width: 'auto', padding: '0 40px', height: 56, borderRadius: 18 }} onClick={() => setModal('create')}>
            Forge Your First Ritual
          </button>
        </motion.div>
      ) : isMobile ? (
        /* Mobile List View - Premium Glassmorphism */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ padding: '0 8px', marginBottom: -4 }}>
             <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 3, fontWeight: 900 }}>Daily Objectives</span>
          </div>
          {habits.map((habit, idx) => {
            const completed = isCompleted(habit, today);
            return (
              <motion.div 
                key={habit._id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="glass-holographic aura-iridescent haptic-tap" 
                style={{ 
                  borderRadius: 24, 
                  border: `1.5px solid ${completed ? `${habit.color}33` : 'rgba(255,255,255,0.08)'}`,
                  overflow: 'hidden',
                  position: 'relative'
                }}
                onClick={() => setModal(habit)}
              >
                <div className="btn-glint" style={{ opacity: 0.05 }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '22px 24px' }}>
                  <div style={{ 
                    fontSize: 28, 
                    filter: completed ? `drop-shadow(0 0 12px ${habit.color})` : 'none',
                    background: completed ? `${habit.color}15` : 'rgba(255,255,255,0.03)',
                    width: 54, height: 54, borderRadius: 16,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {habit.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 17, fontFamily: 'Syne', letterSpacing: '-0.02em', color: completed ? 'white' : 'var(--text)' }}>
                      {habit.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Flame size={12} style={{ color: habit.streak?.current > 0 ? '#ff7c6d' : 'var(--muted)' }} fill={habit.streak?.current > 0 ? '#ff7c6d' : 'none'} />
                      {habit.streak?.current}d Streak • {habit.frequency}
                    </div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      completeMutation.mutate({ id: habit._id, date: today }); 
                    }}
                    className="haptic-tap"
                    style={{ 
                      width: 48, height: 48, borderRadius: 16, 
                      background: completed ? habit.color : 'rgba(255,255,255,0.05)',
                      boxShadow: completed ? `0 8px 20px ${habit.color}44` : 'none',
                      border: completed ? 'none' : '1.5px solid rgba(255,255,255,0.05)', 
                      color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    {completed ? <Check size={24} strokeWidth={3} /> : <div className="shimmer-pulse" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />}
                  </motion.button>
                </div>
                {completed && (
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    style={{ position: 'absolute', bottom: 0, left: 0, height: 2, background: habit.color, opacity: 0.5 }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* Desktop Grid View */
        <div className="rituals-grid">
           <AnimatePresence>
            {habits.map(habit => (
              <RitualCard 
                key={habit._id}
                habit={habit}
                today={today}
                isCompleted={isCompleted}
                onComplete={completeMutation.mutate}
                onEdit={setModal}
                onDelete={(h) => setConfirmDialog({
                  open: true,
                  title: 'Banish Ritual?',
                  confirmText: 'Banish',
                  onConfirm: () => { deleteMutation.mutate(h._id); setConfirmDialog({ open: false }); }
                })}
              />
            ))}
           </AnimatePresence>
        </div>
      )}

      {/* Floating Action Button for Mobile */}
      {/* Removed Floating Action Button - repositioned to search bar as per request */}

      <AnimatePresence>
        {modal && (
          <HabitModal
            habit={modal === 'create' ? null : modal}
            onClose={() => setModal(null)}
            onSave={handleSave}
            onDelete={(h) => {
              setConfirmDialog({
                open: true,
                title: 'Banish Ritual?',
                confirmText: 'Banish',
                onConfirm: () => { deleteMutation.mutate(h._id); setConfirmDialog({ open: false }); setModal(null); }
              });
            }}
          />
        )}
      </AnimatePresence>

      <ConfirmDialog {...confirmDialog} onConfirm={confirmDialog.onConfirm} onCancel={() => setConfirmDialog({ open: false })} />
      
      <Celebration 
        open={celebration.open} 
        onClose={() => setCelebration({ ...celebration, open: false })}
        title={celebration.title}
        subtitle={celebration.subtitle}
      />
    </div>
  );
}
