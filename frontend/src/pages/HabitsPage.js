import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { habitsAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import {
  Plus, Flame, Target, Trophy, Check, X, Pencil, Trash2,
  Sparkles, Calendar, Activity, Award, ChevronLeft, ChevronRight,
  RefreshCcw, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useZenTheme } from '../hooks/useZenTheme';
import { useNavigate } from 'react-router-dom';
import ConfirmDialog from '../components/ConfirmDialog';
import useFeedback from '../hooks/useFeedback';
import SensitivityShield from '../components/layout/SensitivityShield';
import Celebration from '../components/Celebration';

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

function HabitModal({ habit, onClose, onSave }) {
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
        <div className="modal-header" style={{ padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'Syne', fontWeight: 800, fontSize: 22 }}>
            <div className="auth-logo-icon" style={{ width: 32, height: 32, marginBottom: 0 }}>
              <RefreshCcw size={18} color="white" />
            </div>
            {habit ? 'Refine Ritual' : 'Forge New Ritual'}
          </div>
          <button className="modal-close haptic-tap" onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 8 }}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body" style={{ 
          padding: '32px',
          maxHeight: isMobile ? '80vh' : 'auto', 
          overflowY: 'auto',
          paddingBottom: isMobile ? 'calc(32px + env(safe-area-inset-bottom))' : 32
        }}>
          <div className="form-group mb-6">
            <label className="form-label" style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Ritual Name</label>
            <input className="auth-input haptic-feedback" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Morning meditation" style={{ height: 56, fontSize: 16 }} autoFocus />
          </div>
          <div className="form-group mb-6">
            <label className="form-label" style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Intent & Description</label>
            <textarea className="auth-input haptic-feedback" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Why is this important?" rows={2} style={{ height: 'auto', minHeight: 80, padding: '16px 20px' }} />
          </div>

          <div className="form-group mb-6">
            <label className="form-label" style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12, display: 'block' }}>Icon Ritual</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {ICONS.map(icon => (
                <button key={icon} type="button" onClick={() => setForm(f => ({ ...f, icon }))}
                  className="glass haptic-tap"
                  style={{ width: 44, height: 44, borderRadius: 12, border: `2px solid ${form.icon === icon ? form.color : 'rgba(255,255,255,0.05)'}`, background: form.icon === icon ? `${form.color}22` : 'rgba(255,255,255,0.02)', fontSize: 20, cursor: 'pointer', transition: 'all 0.2s' }}>
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group mb-6">
            <label className="form-label" style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12, display: 'block' }}>Signature Glow</label>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                  className="haptic-tap"
                  style={{ width: 32, height: 32, borderRadius: '50%', background: c, border: `2.5px solid ${form.color === c ? 'white' : 'transparent'}`, cursor: 'pointer', boxShadow: form.color === c ? `0 0 15px ${c}` : 'none', transition: 'all 0.2s', padding: 0 }} />
              ))}
            </div>
          </div>

          <div className="grid-2 mb-6">
            <div className="form-group" style={{ gridColumn: isMobile ? 'span 2' : 'span 1' }}>
              <label className="form-label" style={{ fontSize: 10, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>Frequency</label>
              <select className="select premium-select" style={{ height: 48, borderRadius: 14 }} value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}>
                {FREQ.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 10, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>Target</label>
                <input type="number" className="auth-input haptic-feedback" style={{ height: 48, fontSize: 14 }} value={form.targetCount} onChange={e => setForm(f => ({ ...f, targetCount: parseInt(e.target.value) || 1 }))} min={1} />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 10, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>Unit</label>
                <input className="auth-input haptic-feedback" style={{ height: 48, fontSize: 14 }} value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="times" />
              </div>
            </div>
          </div>

          <div className="glass-card aura-iridescent" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: 20, borderRadius: 16 }}>
            <div style={{ fontSize: '32px', filter: `drop-shadow(0 0 10px ${form.color}44)` }}>{form.icon}</div>
            <div style={{ flex: 1 }}>
              <SensitivityShield>
                <div style={{ fontWeight: 800, fontSize: 18, fontFamily: 'Syne, sans-serif', color: 'var(--text)', lineHeight: 1.2 }}>{form.name || 'Your new ritual'}</div>
              </SensitivityShield>
              <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700, marginTop: 4, letterSpacing: 0.5 }}>{form.targetCount} {form.unit} • {form.frequency}</div>
            </div>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: form.color, boxShadow: `0 0 15px ${form.color}` }} />
          </div>
        </div>
        <div className="modal-footer" style={{ padding: '20px 32px', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 12 }}>
          {habit && (
            <button 
              className="btn btn-icon glass" 
              style={{ width: 52, height: 52, borderRadius: 14, color: 'var(--red)' }}
              onClick={() => {
                if (window.confirm('Banish this ritual forever?')) {
                  onSave({ ...habit, _delete: true });
                }
              }}
            >
              <Trash2 size={20} />
            </button>
          )}
          <button className="btn btn-ghost" onClick={onClose} style={{ flex: 1, height: 52, borderRadius: 14 }}>Abort</button>
          <button className="auth-button" style={{ flex: 2, height: 52, borderRadius: 14, fontSize: 16 }} onClick={() => { if (!form.name.trim()) return toast.error('Name required'); onSave(form); }}>
            <div className="btn-glint" />
            {habit ? 'Refine' : 'Manifest'}
          </button>
        </div>
      </motion.div>

      <style>{`
        @media (max-width: 768px) {
          .modal.bottom-sheet {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            width: 100%;
            max-width: none;
            border-radius: 24px 24px 0 0;
            max-height: 92vh;
            margin: 0;
          }
          .modal-overlay {
            align-items: flex-end;
          }
        }
      `}</style>
    </div>
  );
}

// ─── Ritual Card Component (Premium Grid Item) ──────────────────────────────
const RitualCard = ({ habit, today, isCompleted, onComplete, onEdit, onDelete }) => {
  const daysToShow = 7;
  const last7 = eachDayOfInterval({ start: subDays(new Date(), daysToShow - 1), end: new Date() });
  
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
            <div className="ritual-streak-badge">
              <Flame size={14} fill="#ff7c6d" /> {habit.streak.current}d
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
        {last7.map(d => {
          const dateStr = format(d, 'yyyy-MM-dd');
          const done = isCompleted(habit, dateStr);
          const isToday = dateStr === today;
          
          return (
            <div 
              key={dateStr}
              className={`ritual-dot ${done ? 'completed' : ''} ${isToday ? 'today' : ''}`}
              style={{ 
                backgroundColor: done ? habit.color : '',
                boxShadow: done ? `0 0 10px ${habit.color}aa` : '',
                borderColor: isToday ? habit.color : ''
              }}
              title={format(d, 'MMM d')}
            />
          );
        })}
        
        <div style={{ marginLeft: 'auto' }}>
           <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { 
              e.stopPropagation(); 
              onComplete({ id: habit._id, date: today }); 
            }}
            className={`haptic-tap ${isCompleted(habit, today) ? 'done' : ''}`}
            style={{
              width: 32, height: 32, borderRadius: 10,
              background: isCompleted(habit, today) ? habit.color : 'rgba(255,255,255,0.05)',
              border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: isCompleted(habit, today) ? `0 5px 15px ${habit.color}44` : 'none'
            }}
          >
            <Check size={18} strokeWidth={3} />
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
    onSuccess: () => { toast.success('Ritual established!'); setModal(null); invalidate(); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => habitsAPI.update(id, data),
    onSuccess: () => { toast.success('Ritual refined!'); setModal(null); invalidate(); }
  });

  const deleteMutation = useMutation({
    mutationFn: habitsAPI.delete,
    onSuccess: () => { toast.success('Ritual banished'); invalidate(); }
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
    }
  });

  const habits = data || [];
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
    <div className="responsive-container">
      <div className="page-header mb-10" style={{ alignItems: 'flex-start', position: 'relative' }}>
        <div className="aura-pulse" style={{ 
          position: 'absolute', top: -50, left: -50, 
          width: 200, height: 200, 
          background: 'var(--grad-mesh-vibrant)', 
          opacity: 0.1, zIndex: -1 
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="page-title flex items-center gap-4" style={{ fontFamily: 'Syne, sans-serif', fontSize: 'var(--fs-2xl)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.2 }}>
            <div className="auth-logo-icon aura-float" style={{ width: 48, height: 48, marginBottom: 0 }}>
              <RefreshCcw size={24} color="white" strokeWidth={2.5} />
            </div>
            Ritual Engine
          </div>
          <p className="page-subtitle" style={{ fontSize: 'var(--fs-sm)', opacity: 0.7, fontWeight: 600 }}>Consistent biological evolution via neural maintenance</p>
        </div>
        <button className="auth-button hide-mobile glow-on-hover" onClick={() => setModal('create')} style={{ width: 'auto', padding: '0 24px', height: 54, borderRadius: 16 }}>
          <div className="btn-glint" />
          <Plus size={20} style={{ marginRight: 8 }} /> Forge Ritual
        </button>
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
        <div className="premium-card" style={{ padding: '80px 40px', textAlign: 'center', borderRadius: 24 }}>
          <div className="empty-icon" style={{ fontSize: 64, marginBottom: 20 }}>🎭</div>
          <h2 className="empty-title" style={{ fontSize: 28, fontWeight: 800, fontFamily: 'Syne' }}>The stage is set</h2>
          <p className="empty-desc" style={{ marginTop: 12, fontSize: 16, opacity: 0.6 }}>Begin your journey by defining your first high-performance ritual.</p>
          <button className="auth-button" style={{ marginTop: 32, width: 'auto', padding: '0 32px' }} onClick={() => setModal('create')}>
            Forge Your First Ritual
          </button>
        </div>
      ) : isMobile ? (
        /* Mobile List View */
        <div className="premium-card" style={{ padding: 0, overflow: 'hidden', borderRadius: 24, border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
             <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 900 }}>Daily Objectives</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {habits.map((habit, idx) => (
              <div key={habit._id} className="habit-row-swipe-wrapper" style={{ borderBottom: idx < habits.length -1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 20 }} onClick={() => setModal(habit)}>
                  <div style={{ fontSize: 24 }}>{habit.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>{habit.name}</div>
                    <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>{habit.streak?.current}d Streak • {habit.frequency}</div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      completeMutation.mutate({ id: habit._id, date: today }); 
                    }}
                    style={{ 
                      width: 40, height: 40, borderRadius: 12, 
                      background: isCompleted(habit, today) ? habit.color : 'rgba(255,255,255,0.05)',
                      border: 'none', color: 'white'
                    }}
                  >
                    {isCompleted(habit, today) ? <Check size={20} /> : <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', margin: '0 auto' }} />}
                  </motion.button>
                </div>
              </div>
            ))}
          </div>
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
      {isMobile && (
        <div style={{ position: 'fixed', bottom: 100, right: 24, zIndex: 100 }}>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="auth-logo-icon"
            style={{ width: 64, height: 64, borderRadius: '50%', boxShadow: '0 20px 40px rgba(130, 114, 255, 0.4)' }}
            onClick={() => setModal('create')}
          >
            <Plus size={32} color="white" />
          </motion.button>
        </div>
      )}

      <AnimatePresence>
        {modal && (
          <HabitModal
            habit={modal === 'create' ? null : modal}
            onClose={() => setModal(null)}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>

      <ConfirmDialog {...confirmDialog} onCancel={() => setConfirmDialog({ open: false })} />
      
      <Celebration 
        open={celebration.open} 
        onClose={() => setCelebration({ ...celebration, open: false })}
        title={celebration.title}
        subtitle={celebration.subtitle}
      />
    </div>
  );
}
