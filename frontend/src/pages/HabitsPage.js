import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { habitsAPI } from '../utils/api';
import { useNotifications } from '../context/NotificationContext';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import {
  Plus, Flame, Target, Trophy, Check, X, Pencil, Trash2,
  Sparkles, Calendar, Activity, Award, ChevronLeft, ChevronRight,
  RefreshCcw, Zap, Search
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useZenTheme } from '../hooks/useZenTheme';
import { useNavigate } from 'react-router-dom';
import ConfirmDialog from '../components/ConfirmDialog';
import useFeedback from '../hooks/useFeedback';
import SensitivityShield from '../components/layout/SensitivityShield';
import Celebration from '../components/Celebration';
import ShortcutsHelp from '../components/layout/ShortcutsHelp';
import MobileBottomSheet from '../components/common/MobileBottomSheet';

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
  const { addToast } = useNotifications();
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

  const modalContent = (
    <form onSubmit={(e) => { e.preventDefault(); if (!form.name.trim()) return addToast('Ritual name required', 'error'); onSave(form); }} className="flex flex-col h-full">
      <div className="modal-body custom-scrollbar" style={{ 
        padding: isMobile ? '0' : '32px', 
        paddingBottom: isMobile ? 'calc(20px + env(safe-area-inset-bottom))' : 32,
        flex: 1,
        overflowY: 'auto'
      }}>
        <div className="form-group mb-6">
          <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Ritual Title</label>
          <input 
            className="auth-input haptic-feedback" 
            style={{ 
              height: isMobile ? 52 : 56, 
              fontSize: isMobile ? 16 : 16,
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 14
            }}
            value={form.name} 
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} 
            placeholder="e.g. Morning meditation" 
            autoFocus 
          />
        </div>

        <div className="form-group mb-6">
          <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Identity & Intent</label>
          <textarea 
            className="auth-input haptic-feedback" 
            value={form.description} 
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))} 
            placeholder="Why is this ritual essential to your biological evolution?" 
            rows={isMobile ? 2 : 3} 
            style={{ height: 'auto', minHeight: 80, padding: '16px 20px', borderRadius: 14, background: 'rgba(255,255,255,0.03)' }} 
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="form-group">
            <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Frequency</label>
            <select className="select premium-select" style={{ height: 48, borderRadius: 14, width: '100%' }} value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}>
              {FREQ.map(f => <option key={f.value} value={f.value}>{f.label.toUpperCase()}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Daily Target</label>
            <div className="flex gap-2">
              <input 
                type="number" 
                className="auth-input" 
                style={{ height: 48, borderRadius: 14, width: '60%', background: 'rgba(255,255,255,0.03)' }}
                value={form.targetCount} 
                onChange={e => setForm(f => ({ ...f, targetCount: parseInt(e.target.value) || 1 }))} 
              />
              <span style={{ fontSize: 10, fontWeight: 900, opacity: 0.5, alignSelf: 'center' }}>{form.unit.toUpperCase()}</span>
            </div>
          </div>
        </div>

        <div className="form-group mb-8">
          <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 12, display: 'block' }}>Atmosphere (Color)</label>
          <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
            {COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setForm(f => ({ ...f, color: c }))}
                className="haptic-tap flex-shrink-0"
                style={{ 
                  width: 36, height: 36, borderRadius: '50%', background: c, 
                  border: form.color === c ? '3px solid white' : 'none',
                  boxShadow: form.color === c ? `0 0 15px ${c}` : 'none'
                }}
              />
            ))}
          </div>
        </div>

        <button 
          type="submit" 
          className="auth-button w-full haptic-tap" 
          style={{ height: 56, borderRadius: 16, fontSize: 16, fontWeight: 800, background: form.color }}
        >
          {habit ? 'REFINE RITUAL' : 'FORGE RITUAL'}
        </button>

        {habit && (
          <button 
            type="button"
            className="btn btn-ghost text-red w-full mt-4 haptic-tap" 
            style={{ height: 48, borderRadius: 14, fontSize: 14, fontWeight: 700, border: '1px solid rgba(239, 68, 68, 0.2)' }}
            onClick={() => onDelete(habit)}
          >
            Banish Ritual
          </button>
        )}
      </div>
    </form>
  );

  if (isMobile) {
    return (
      <MobileBottomSheet
        isOpen={true}
        onClose={onClose}
        title={habit ? 'Refine Ritual' : 'Forge Ritual'}
      >
        {modalContent}
      </MobileBottomSheet>
    );
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="auth-card aura-iridescent"
        style={{ width: '100%', maxWidth: 540, padding: 0, overflow: 'hidden' }}
      >
        <div className="modal-header" style={{ padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="modal-title" style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 22 }}>
            {habit ? 'Refine Ritual' : 'Forge Ritual'}
          </div>
          <button className="modal-close haptic-tap" onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 8 }}>
            <X size={20} />
          </button>
        </div>
        {modalContent}
      </motion.div>
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
  const { addToast } = useNotifications();
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
    onSuccess: () => { addToast('Ritual established!', 'success'); setModal(null); invalidate(); },
    onError: (err) => addToast(err.response?.data?.error || 'Failed to establish ritual.', 'error')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => habitsAPI.update(id, data),
    onSuccess: () => { addToast('Ritual refined!', 'success'); setModal(null); invalidate(); },
    onError: (err) => addToast(err.response?.data?.error || 'Failed to refine ritual.', 'error')
  });

  const deleteMutation = useMutation({
    mutationFn: habitsAPI.delete,
    onSuccess: () => { addToast('Ritual banished', 'info'); invalidate(); },
    onError: (err) => addToast(err.response?.data?.error || 'Failed to banish ritual.', 'error')
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, date }) => habitsAPI.complete(id, { date }),
    onSuccess: (res) => {
      feedback('success');
      invalidate();
      
      const habit = res.data.habit;
      if (habit && habit.streak?.current > 0 && habit.streak.current % 7 === 0) {
        addToast(`Magnificent! ${habit.streak.current} day streak achieved.`, 'success');
        setCelebration({
          open: true,
          title: `${habit.streak.current} DAY STREAK`,
          subtitle: "Ritual Synchronization Complete"
        });
      } else {
        addToast(`Ritual synchronized: ${habit?.name || ''}`, 'success');
      }
    },
    onError: (err) => addToast(err.response?.data?.error || 'Synchronization failed.', 'error')
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
      </div>

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ padding: '0 8px', marginBottom: -4 }}>
             <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 3, fontWeight: 900 }}>Daily Objectives</span>
          </div>
          {habits.map((habit, idx) => {
            const completed = isCompleted(habit, today);
            
            // Swipe Actions logic
            const x = useMotionValue(0);
            const background = useTransform(
              x,
              [-100, 0, 100],
              ["rgba(239, 68, 68, 0.2)", "rgba(255, 255, 255, 0.03)", "rgba(34, 197, 94, 0.2)"]
            );

            return (
              <div key={habit._id} style={{ position: 'relative', overflow: 'hidden', borderRadius: 24 }}>
                 {/* Swipe Background Logic */}
                 <motion.div 
                   style={{ 
                     position: 'absolute', inset: 0, background, 
                     display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                     padding: '0 24px', zIndex: 0
                   }}
                 >
                   <div style={{ opacity: 0.5 }}><Trash2 size={24} color="#ef4444" /></div>
                   <div style={{ opacity: 0.5 }}><Check size={24} color="#22c55e" /></div>
                 </motion.div>

                 <motion.div 
                  drag="x"
                  dragConstraints={{ left: -100, right: 100 }}
                  style={{ 
                    x, 
                    position: 'relative', 
                    zIndex: 1,
                    borderRadius: 24, 
                    border: `1.5px solid ${completed ? `${habit.color}33` : 'rgba(255,255,255,0.08)'}`,
                    overflow: 'hidden',
                    background: 'rgba(20, 20, 25, 0.95)'
                  }}
                  onDragEnd={(e, info) => {
                    if (info.offset.x > 80) {
                      completeMutation.mutate({ id: habit._id, date: today });
                    } else if (info.offset.x < -80) {
                      setConfirmDialog({
                        open: true,
                        title: 'Banish Ritual?',
                        confirmText: 'Banish',
                        onConfirm: () => { deleteMutation.mutate(habit._id); setConfirmDialog({ open: false }); }
                      });
                    }
                  }}
                  className="glass-holographic aura-iridescent haptic-tap" 
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
                </motion.div>
              </div>
            );
          })}
        </div>
      ) : (
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
