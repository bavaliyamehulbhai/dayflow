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
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="modal"
      >
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="text-accent"><RefreshCcw size={20} /></div>
            {habit ? 'Refine Habit' : 'Forge New Habit'}
          </div>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Objective Name</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Morning meditation" autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="textarea" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Why is this important?" rows={2} />
          </div>

          <div className="form-group">
            <label className="form-label">Icon Ritual</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {ICONS.map(icon => (
                <button key={icon} type="button" onClick={() => setForm(f => ({ ...f, icon }))}
                  style={{ width: 40, height: 40, borderRadius: 10, border: `2px solid ${form.icon === icon ? form.color : 'var(--border)'}`, background: form.icon === icon ? `${form.color}22` : 'var(--surface2)', fontSize: 20, cursor: 'pointer', transition: 'all 0.2s' }}>
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Signature Color</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                  style={{ width: 32, height: 32, borderRadius: '50%', background: c, border: `2px solid ${form.color === c ? 'white' : 'transparent'}`, cursor: 'pointer', boxShadow: form.color === c ? `0 0 12px ${c}` : 'none', transition: 'all 0.2s' }} />
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
            <div className="form-group" style={{ gridColumn: '1 / 3' }}>
              <label className="form-label">Frequency</label>
              <select className="select" value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}>
                {FREQ.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Target</label>
              <input type="number" className="input" value={form.targetCount} onChange={e => setForm(f => ({ ...f, targetCount: parseInt(e.target.value) || 1 }))} min={1} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Unit of Progress</label>
            <input className="input" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="times, minutes, pages..." />
          </div>

          <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: '16px', display: 'flex', alignItems: 'center', gap: 16, marginTop: 8, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 'var(--fs-2xl)' }}>{form.icon}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 'var(--fs-base)' }}>{form.name || 'Your new ritual'}</div>
              <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', fontWeight: 500 }}>{form.targetCount} {form.unit} • {form.frequency}</div>
            </div>
            <div style={{ marginLeft: 'auto', width: 32, height: 32, borderRadius: '50%', background: form.color, boxShadow: `0 0 15px ${form.color}66` }} />
          </div>
        </div>
        <div className="modal-footer" style={{ gap: 12, padding: isMobile ? '16px' : '20px 24px' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" style={{ minWidth: 140, flex: isMobile ? 1 : 'none' }} onClick={() => { if (!form.name.trim()) return toast.error('Name required'); onSave(form); }}>
            {habit ? 'Save' : 'Create'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function HabitsPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);
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
    onSuccess: () => { invalidate(); }
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
      <div className="page-header mb-6">
        <div>
          <div className="page-title flex items-center gap-3">
            <div className="text-accent"><Sparkles size={isMobile ? 24 : 32} /></div>
            Ritual Chamber
          </div>
          <p className="page-subtitle">Transmute actions into character</p>
        </div>
        <button className="btn btn-primary hide-mobile magnetic-btn" onClick={() => setModal('create')}>
          <Plus size={18} /> New Ritual
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
      <div className="stats-grid stats-carousel mb-6">
        <div className="stat-card flex flex-col items-center gap-2">
          <Activity size={16} style={{ color: 'var(--accent)', opacity: 0.7 }} />
          <div className="stat-value">{habits.length}</div>
          <div className="stat-label" style={{ fontWeight: 600 }}>Active</div>
        </div>
        <div className="stat-card flex flex-col items-center gap-2">
          <Check size={16} style={{ color: 'var(--green)', opacity: 0.7 }} />
          <div className="stat-value" style={{ color: 'var(--green)' }}>{completedToday}</div>
          <div className="stat-label" style={{ fontWeight: 600 }}>Done Today</div>
        </div>
        <div className="stat-card flex flex-col items-center gap-2">
          <Target size={16} style={{ color: 'var(--yellow)', opacity: 0.7 }} />
          <div className="stat-value" style={{ color: 'var(--yellow)' }}>
            {habits.length ? Math.round((completedToday / habits.length) * 100) : 0}%
          </div>
          <div className="stat-label" style={{ fontWeight: 600 }}>Success</div>
        </div>
        <div className="stat-card flex flex-col items-center gap-2">
          <Flame size={16} style={{ color: 'var(--red)', opacity: 0.7 }} />
          <div className="stat-value" style={{ color: 'var(--accent2)' }}>
            {Math.max(...habits.map(h => h.streak?.current || 0), 0)}
          </div>
          <div className="stat-label" style={{ fontWeight: 600 }}>Top Streak</div>
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
        <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)' }}>
          {/* List Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', padding: '16px 24px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700 }}>Ritual Objectives</span>
            <div style={{ display: 'flex', gap: 8, paddingRight: 72 }}>
              {last7.map(d => (
                <div key={d.toISOString()} style={{ width: 36, textAlign: 'center', fontSize: 11, color: format(d, 'yyyy-MM-dd') === today ? 'var(--accent)' : 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                  {format(d, 'EE').charAt(0)}
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
                  drag={isMobile ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  onDragEnd={(_, info) => {
                    if (info.offset.x > 100) completeMutation.mutate({ id: habit._id, date: today });
                    else if (info.offset.x < -100) { if (window.confirm('Vanish this ritual?')) deleteMutation.mutate(habit._id); }
                  }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="habit-row hover-lift haptic-tap"
                  style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    alignItems: isMobile ? 'flex-start' : 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--space-4) var(--space-6)',
                    borderBottom: idx < habits.length - 1 ? '1px solid var(--border)' : 'none',
                    position: 'relative',
                    zIndex: 2,
                    background: 'var(--surface)'
                  }}
                  onClick={() => !isMobile && setModal(habit)}
                >
                  {/* Habit info */}
                  <div className="habit-row-info" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ fontSize: 'var(--fs-2xl)', filter: 'drop-shadow(0 0 8px rgba(0,0,0,0.1))' }}>{habit.icon}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 'var(--fs-base)', color: 'var(--text)' }}>{habit.name}</div>
                      <div style={{ display: 'flex', gap: 12, marginTop: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                        {habit.streak?.current > 0 && (
                          <span style={{ fontSize: 11, color: 'var(--orange)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Flame size={12} /> {habit.streak.current}d
                          </span>
                        )}
                        <span style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Zap size={12} /> {habit.frequency}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Day tracking + actions */}
                  <div style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                    justifyContent: isMobile ? 'space-between' : 'flex-end',
                    marginTop: isMobile ? 12 : 0,
                    width: isMobile ? '100%' : 'auto'
                  }}>
                    <div style={{ display: 'flex', gap: 8, flex: isMobile ? 1 : 'none', justifyContent: isMobile ? 'flex-start' : 'flex-end' }}>
                      {last7.map(d => {
                        const dateStr = format(d, 'yyyy-MM-dd');
                        const done = isCompleted(habit, dateStr);
                        const isToday = dateStr === today;
                        return (
                          <button
                            key={dateStr}
                            onClick={(e) => { e.stopPropagation(); if (isToday) completeMutation.mutate({ id: habit._id, date: dateStr }); }}
                            disabled={!isToday && !done}
                            className={`habit-check ${done ? 'done' : ''}`}
                            style={{
                              width: 36, height: 36, borderRadius: 10,
                              border: `2px solid ${done ? habit.color : isToday ? 'var(--border2)' : 'var(--border)'}`,
                              background: done ? habit.color : 'transparent',
                              cursor: isToday ? 'pointer' : 'default',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: 'white',
                              boxShadow: done ? `0 4px 12px ${habit.color}55` : 'none',
                              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                              opacity: !isToday && !done ? 0.2 : 1
                            }}
                          >
                            {done && <Check size={18} strokeWidth={3} />}
                          </button>
                        );
                      })}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 4, marginLeft: isMobile ? 8 : 16, borderLeft: '1px solid var(--border)', paddingLeft: isMobile ? 8 : 16 }}>
                      <button className="btn btn-icon btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); setModal(habit); }} title="Refine"><Pencil size={16} /></button>
                      <button className="btn btn-icon btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); if (window.confirm('Vanish this ritual?')) deleteMutation.mutate(habit._id); }} style={{ color: 'var(--red)' }} title="Banish"><Trash2 size={16} /></button>
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

      <style>{`
        .habit-row:hover { background: var(--surface2) !important; }
        .habit-check:hover:not(:disabled) { transform: scale(1.1); border-color: var(--accent); }
        .text-accent { color: var(--accent); }
        .badge { font-weight: 700 !important; }
      `}</style>
    </div >
  );
}
