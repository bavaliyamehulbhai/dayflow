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

export default function HabitsPage() {
  const qc = useQueryClient();
  const feedback = useFeedback();
  const [modal, setModal] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false });
  const today = format(new Date(), 'yyyy-MM-dd');
  const width = useWindowWidth();
  const isMobile = width <= 768;

  // On mobile show only last 3 days to avoid overflow, on desktop show 7
  const daysToShow = isMobile ? 3 : 7;
  const last7 = eachDayOfInterval({ start: subDays(new Date(), daysToShow - 1), end: new Date() });

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
    onSuccess: (_, variables) => {
      feedback('success');
      invalidate();
    }
  });

  const habits = data || [];
  const completedToday = habits.filter(h => h.completions?.some(c => c.date === today)).length;

  const isCompleted = (habit, date) => habit.completions?.some(c => c.date === date);

  const handleSave = (formData) => {
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
        <div>
          <div className="page-title flex items-center gap-4" style={{ fontFamily: 'Syne, sans-serif', fontSize: 'var(--fs-2xl)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.2 }}>
            <div className="auth-logo-icon aura-float" style={{ width: 48, height: 48, marginBottom: 0 }}>
              <RefreshCcw size={24} color="white" strokeWidth={2.5} />
            </div>
            Ritual Engine
          </div>
          <p className="page-subtitle" style={{ fontSize: 'var(--fs-sm)', opacity: 0.7, fontWeight: 600 }}>Neural consistency for peak biological evolution</p>
        </div>
        <button className="auth-button hide-mobile glow-on-hover" onClick={() => setModal({})} style={{ width: 'auto', padding: '0 24px', height: 54, borderRadius: 16 }}>
          <div className="btn-glint" />
          <Plus size={20} style={{ marginRight: 8 }} /> Forge Ritual
        </button>
      </div>

      {/* Floating Action Button for Mobile */}
      <div className="fab-container">
        <motion.button
          whileTap={{ scale: 0.9 }}
          className="btn-fab"
          onClick={() => setModal('create')}
        >
          <Plus size={28} />
        </motion.button>
      </div>

      {/* Summary */}
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
            <SensitivityShield><div className="stat-value" style={{ color: 'var(--green)' }}>{completedToday}</div></SensitivityShield>
          </div>
        </div>
        <div className="stat-card-premium">
          <div className="stat-card-glow" style={{ background: 'var(--yellow)' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="stat-label">Synchronization</div>
            <SensitivityShield><div className="stat-value" style={{ color: 'var(--yellow)' }}>
              {habits.length ? Math.round((completedToday / habits.length) * 100) : 0}%
            </div></SensitivityShield>
          </div>
        </div>
        <div className="stat-card-premium hide-mobile">
          <div className="stat-card-glow" style={{ background: 'var(--red)' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="stat-label">Top Streak</div>
            <SensitivityShield><div className="stat-value" style={{ color: 'var(--red)' }}>
              {Math.max(...habits.map(h => h.streak?.current || 0), 0)}
            </div></SensitivityShield>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-page"><div className="loading-spinner" style={{ width: 32, height: 32 }} /></div>
      ) : habits.length === 0 ? (
        <div className="card" style={{ padding: '80px 40px', textAlign: 'center' }}>
          <div className="empty-icon" style={{ fontSize: 48 }}>🎭</div>
          <div className="empty-title" style={{ fontSize: 24, fontWeight: 700, marginTop: 16 }}>The stage is set</div>
          <div className="empty-desc" style={{ marginTop: 8, fontSize: 13 }}>Begin your journey by defining your first daily ritual.</div>
          <button className="btn btn-primary" style={{ marginTop: 24 }} onClick={() => setModal('create')}>
            <Plus size={18} /> Define First Ritual
          </button>
        </div>
      ) : (
        <div className="premium-card aura-iridescent" style={{ padding: 0, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 24 }}>
          {/* List Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', padding: isMobile ? '16px 20px' : '24px 32px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 900, opacity: 0.7 }}>Active Rituals ({habits.length})</span>
            <div style={{ display: 'flex', gap: isMobile ? 10 : 16, paddingRight: isMobile ? 0 : 88 }}>
              {last7.map(d => (
                <div key={d.toISOString()} style={{ width: isMobile ? 32 : 44, textAlign: 'center', fontSize: 10, color: format(d, 'yyyy-MM-dd') === today ? 'var(--accent)' : 'var(--muted)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1 }}>
                  {format(d, 'EEE').charAt(0)}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {habits.map((habit, idx) => (
              <div key={habit._id} className="habit-row-swipe-wrapper" style={{ position: 'relative', overflow: 'hidden', background: 'var(--surface)' }}>
                {/* Swipe Backgrounds */}
                <div className="swipe-bg swipe-bg-complete" style={{ position: 'absolute', inset: 0, background: 'var(--green)', display: 'flex', alignItems: 'center', padding: '0 24px', color: 'white' }}>
                  <Check size={24} />
                </div>
                <div className="swipe-bg swipe-bg-delete" style={{ position: 'absolute', inset: 0, background: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 24px', color: 'white' }}>
                  <Trash2 size={24} />
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="habit-row haptic-tap"
                  style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    alignItems: isMobile ? 'flex-start' : 'center',
                    justifyContent: 'space-between',
                    padding: isMobile ? '16px' : '20px 32px',
                    borderBottom: idx < habits.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    position: 'relative',
                    zIndex: 2,
                    background: 'transparent',
                    transition: 'background 0.3s ease'
                  }}
                  onClick={() => !isMobile && setModal(habit)}
                >
                  <div className="btn-glint" style={{ opacity: 0.02 }} />
                  {/* Habit info */}
                  <div className="habit-row-info" style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 16 : 24 }}>
                    <div style={{ fontSize: isMobile ? 'var(--fs-xl)' : 'var(--fs-2xl)', filter: `drop-shadow(0 0 10px ${habit.color}44)` }}>{habit.icon}</div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: isMobile ? 'var(--fs-sm)' : 'var(--fs-base)', color: 'var(--text)', letterSpacing: '-0.01em' }}>{habit.name}</div>
                      <div style={{ display: 'flex', gap: 12, marginTop: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                        {habit.streak?.current > 0 && (
                          <span style={{ fontSize: 11, color: habit.color, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Flame size={12} fill={habit.color} /> {habit.streak.current}d Streak
                          </span>
                        )}
                        <span style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>
                          <Zap size={11} /> {habit.frequency}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: 16,
                    alignItems: 'center',
                    justifyContent: isMobile ? 'space-between' : 'flex-end',
                    marginTop: isMobile ? 16 : 0,
                    width: isMobile ? '100%' : 'auto',
                    position: 'relative'
                  }}>
                    <div style={{ display: 'flex', gap: isMobile ? 10 : 16, flex: isMobile ? 1 : 'none', justifyContent: isMobile ? 'flex-start' : 'flex-end', position: 'relative', zIndex: 1 }}>
                      {last7.map(d => {
                        const dateStr = format(d, 'yyyy-MM-dd');
                        const done = isCompleted(habit, dateStr);
                        const isToday = dateStr === today;
                        return (
                          <motion.button
                            key={dateStr}
                            whileHover={isToday ? { scale: 1.1 } : {}}
                            whileTap={isToday ? { scale: 0.9 } : {}}
                            onClick={(e) => { e.stopPropagation(); if (isToday) completeMutation.mutate({ id: habit._id, date: dateStr }); }}
                            disabled={!isToday && !done}
                            className={`habit-check ${done ? 'done' : ''}`}
                            style={{
                              width: isMobile ? 32 : 44, height: isMobile ? 32 : 44, borderRadius: 12,
                              border: `2px solid ${done ? habit.color : isToday ? 'var(--accent)' : 'rgba(255,255,255,0.08)'}`,
                              background: done ? habit.color : 'rgba(255,255,255,0.02)',
                              cursor: isToday ? 'pointer' : 'default',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: 'white',
                              boxShadow: done ? `0 8px 16px ${habit.color}44` : 'none',
                              transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                              opacity: !isToday && !done ? 0.2 : 1
                            }}
                          >
                            <AnimatePresence mode="wait">
                              {done ? (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                                  <Check size={20} strokeWidth={4} />
                                </motion.div>
                              ) : isToday ? (
                                <motion.div animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ repeat: Infinity, duration: 2 }}>
                                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 10px var(--accent)' }} />
                                </motion.div>
                              ) : null}
                            </AnimatePresence>
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 6, marginLeft: isMobile ? 8 : 16 }}>
                      <button className="btn btn-icon glass btn-sm haptic-tap" onClick={(e) => { e.stopPropagation(); setModal(habit); }} title="Refine" style={{ width: 36, height: 36, borderRadius: 10 }}><Pencil size={18} /></button>
                      <button className="btn btn-icon glass btn-sm haptic-tap" onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDialog({
                          open: true,
                          title: 'Banish Ritual?',
                          confirmText: 'Banish',
                          onConfirm: () => { deleteMutation.mutate(habit._id); setConfirmDialog({ open: false }); }
                        });
                      }} style={{ color: 'var(--red)', width: 36, height: 36, borderRadius: 10 }} title="Banish"><Trash2 size={18} /></button>
                    </div>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      )
      }

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

      <style>{`
        .habit-row:hover { background: var(--surface2) !important; }
        .habit-check:hover:not(:disabled) { transform: scale(1.1); border-color: var(--accent); }
        .text-accent { color: var(--accent); }
        .badge { font-weight: 700 !important; }
      `}</style>
    </div >
  );
}
