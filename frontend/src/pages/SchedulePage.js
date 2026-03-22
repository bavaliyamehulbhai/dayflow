import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scheduleAPI, tasksAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { format, addDays, subDays } from 'date-fns';
import {
  Calendar as CalendarIcon, Clock, Layers, Plus, ChevronLeft, ChevronRight,
  CheckCircle2, Trash2, Sparkles, MapPin, X, Pencil, Activity, Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmDialog from '../components/ConfirmDialog';
import SensitivityShield from '../components/layout/SensitivityShield';

const CATEGORIES = ['work', 'personal', 'health', 'learning', 'social', 'other'];
const CAT_COLORS = { work: '#7c6dfa', personal: '#fa6d8a', health: '#6dfacc', learning: '#fad96d', social: '#fa9a6d', other: '#a3a3a3' };

function useWindowWidth() {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return w;
}

function EventModal({ event, date, onClose, onSave, tasks, isMobile }) {
  const [form, setForm] = useState({
    title: event?.title || '',
    description: event?.description || '',
    date: event?.date || date,
    startTime: event?.startTime || '',
    endTime: event?.endTime || '',
    category: event?.category || 'other',
    color: event?.color || '#7c6dfa',
    linkedTask: event?.linkedTask?._id || ''
  });

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.9, y: 30 }}
        animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
        exit={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.9, y: 30 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={`auth-card aura-iridescent ${isMobile ? 'bottom-sheet' : ''}`}
        style={{ width: '100%', maxWidth: 600, padding: 0, overflow: 'hidden' }}
      >
        <div className="modal-header" style={{ padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'Syne', fontWeight: 800, fontSize: 22 }}>
            <div className="auth-logo-icon" style={{ width: 32, height: 32, marginBottom: 0 }}>
              <CalendarIcon size={18} color="white" />
            </div>
            {event ? 'Refine Alignment' : 'New Temporal Objective'}
          </div>
          <button className="modal-close haptic-tap" onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 8 }}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body" style={{ padding: '32px', paddingBottom: isMobile ? 'calc(32px + env(safe-area-inset-bottom))' : 32 }}>
          <div className="form-group mb-6">
            <label className="form-label" style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Objective Title</label>
            <input className="auth-input haptic-feedback" style={{ height: 56, fontSize: 16 }} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Strategic Planning" autoFocus />
          </div>
          <div className="form-group mb-6">
            <label className="form-label" style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Context & Details</label>
            <textarea className="auth-input haptic-feedback" style={{ padding: '16px 20px', height: 'auto', minHeight: 80 }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Optional details..." />
          </div>

          <div className="grid-3 mb-6">
            <div className="form-group">
              <label className="form-label" style={{ fontSize: 10, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>Date</label>
              <input type="date" className="auth-input haptic-feedback" style={{ height: 48, fontSize: 14 }} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: 10, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>Start</label>
              <input type="time" className="auth-input haptic-feedback" style={{ height: 48, fontSize: 14 }} value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: 10, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>End</label>
              <input type="time" className="auth-input haptic-feedback" style={{ height: 48, fontSize: 14 }} value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" style={{ fontSize: 10, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>Domain</label>
              <select className="select premium-select" style={{ height: 48, borderRadius: 14 }} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: 10, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>Connect Objective</label>
              <select className="select premium-select" style={{ height: 48, borderRadius: 14 }} value={form.linkedTask} onChange={e => setForm(f => ({ ...f, linkedTask: e.target.value }))}>
                <option value="">No link</option>
                {tasks?.map(t => <option key={t._id} value={t._id}>{t.title}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="modal-footer" style={{ padding: '20px 32px', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 12 }}>
          <button className="btn btn-ghost" onClick={onClose} style={{ flex: 1, height: 52, borderRadius: 14 }}>Abort</button>
          <button className="auth-button" style={{ flex: 2, height: 52, borderRadius: 14, fontSize: 16 }} onClick={() => { if (!form.title.trim() || !form.startTime || !form.date) return toast.error('Title, date and start time required'); onSave({ ...form, linkedTask: form.linkedTask || null }); }}>
            <div className="btn-glint" />
            Commit Alignment
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function SchedulePage() {
  const qc = useQueryClient();
  const [currentDate, setCurrentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [modal, setModal] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false });
  const width = useWindowWidth();
  const isMobile = width <= 768;

  const { data, isLoading } = useQuery({
    queryKey: ['schedule', currentDate],
    queryFn: () => scheduleAPI.getAll({ date: currentDate }).then(r => r.data.events)
  });

  const { data: tasks } = useQuery({
    queryKey: ['tasks-light'],
    queryFn: () => tasksAPI.getAll({ status: 'pending', limit: 30 }).then(r => r.data.tasks)
  });

  const invalidate = () => qc.invalidateQueries(['schedule']);

  const createMutation = useMutation({ mutationFn: scheduleAPI.create, onSuccess: () => { toast.success('Event manifested'); setModal(null); invalidate(); } });
  const updateMutation = useMutation({ mutationFn: ({ id, data }) => scheduleAPI.update(id, data), onSuccess: () => { toast.success('Event refined'); setModal(null); invalidate(); } });
  const deleteMutation = useMutation({ mutationFn: scheduleAPI.delete, onSuccess: () => { toast.success('Event vanished'); invalidate(); } });
  const toggleMutation = useMutation({ mutationFn: scheduleAPI.toggleComplete, onSuccess: () => invalidate() });

  const events = data || [];

  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const getStatus = (ev) => {
    const [sh, sm] = ev.startTime.split(':').map(Number);
    const startMin = sh * 60 + sm;
    if (!ev.endTime) return startMin <= nowMin ? 'past' : 'future';
    const [eh, em] = ev.endTime.split(':').map(Number);
    const endMin = eh * 60 + em;
    if (nowMin >= startMin && nowMin < endMin) return 'current';
    if (nowMin >= endMin) return 'past';
    return 'future';
  };

  const handleSave = (data) => {
    if (modal && modal._id) updateMutation.mutate({ id: modal._id, data });
    else createMutation.mutate(data);
  };

  const prevDay = () => setCurrentDate(format(subDays(new Date(currentDate), 1), 'yyyy-MM-dd'));
  const nextDay = () => setCurrentDate(format(addDays(new Date(currentDate), 1), 'yyyy-MM-dd'));

  const hours = Array.from({ length: 18 }, (_, i) => i + 6);

  const getEventTop = (time) => {
    const [h, m] = time.split(':').map(Number);
    return ((h - 6) * 60 + m) * (64 / 60);
  };

  const getEventHeight = (start, end) => {
    if (!end) return 48;
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const mins = (eh * 60 + em) - (sh * 60 + sm);
    return Math.max(36, mins * (64 / 60));
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
          <div className="page-title flex items-center gap-4">
            <div className="auth-logo-icon aura-float" style={{ width: 48, height: 48, marginBottom: 0 }}>
              <Sparkles size={24} color="white" strokeWidth={2.5} fill="white" />
            </div>
            <h1 style={{ fontSize: 'var(--fs-2xl)', fontWeight: 800, fontFamily: 'Syne, sans-serif', letterSpacing: '-0.04em', lineHeight: 1.2 }}>Temporal Nexus</h1>
          </div>
          <p className="page-subtitle" style={{ fontSize: 'var(--fs-sm)', opacity: 0.7, fontWeight: 600 }}>Architect your temporal alignment & cognitive flow</p>
        </div>
        <button className="auth-button hide-mobile glow-on-hover" onClick={() => setModal('create')} style={{ width: 'auto', padding: '0 24px', height: 54, borderRadius: 16 }}>
          <div className="btn-glint" />
          <Plus size={20} style={{ marginRight: 8 }} /> Schedule Alignment
        </button>
      </div>

      {/* Date navigation */}
      <div className="glass-holographic mb-8" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', borderRadius: 24, border: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: isMobile ? '1 1 100%' : '1', justifyContent: isMobile ? 'space-between' : 'flex-start' }}>
          <motion.button whileHover={{ x: -4, background: 'rgba(255,255,255,0.05)' }} className="btn btn-icon glass haptic-tap" onClick={prevDay} style={{ borderRadius: 12 }}><ChevronLeft size={22} /></motion.button>
          <div style={{ textAlign: 'center', minWidth: isMobile ? 'auto' : 200 }}>
            <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 800, fontFamily: 'Syne, sans-serif', color: 'var(--text)', lineHeight: 1 }}>
                {format(new Date(currentDate + 'T00:00:00'), 'EEEE')}
              </div>
              <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--accent)', marginTop: 4, letterSpacing: 1 }}>
                {format(new Date(currentDate + 'T00:00:00'), 'MMMM d, yyyy')}
              </div>
          </div>
          <motion.button whileHover={{ x: 4, background: 'rgba(255,255,255,0.05)' }} className="btn btn-icon glass haptic-tap" onClick={nextDay} style={{ borderRadius: 12 }}><ChevronRight size={22} /></motion.button>
        </div>

        <div style={{ display: 'flex', gap: 12, flex: isMobile ? '1 1 100%' : 'none', width: isMobile ? '100%' : 'auto', alignItems: 'center' }}>
          <button className="btn glass btn-sm haptic-tap" style={{ fontWeight: 800, height: 42, padding: '0 20px', borderRadius: 12 }} onClick={() => setCurrentDate(format(new Date(), 'yyyy-MM-dd'))}>Today</button>
          <div style={{ height: 32, width: 1, background: 'rgba(255,255,255,0.1)', margin: '0 8px' }} className="hide-mobile" />
          <input type="date" className="auth-input" style={{ flex: isMobile ? 1 : 'none', width: isMobile ? 'auto' : 160, height: 42, borderRadius: 12, fontSize: 13, fontWeight: 700, padding: '0 12px' }} value={currentDate} onChange={e => setCurrentDate(e.target.value)} />
        </div>
      </div>

      {/* Main layout: timeline + list side by side on desktop, stacked on mobile */}
      <div className="schedule-main-grid mt-8">

        {/* Timeline view */}
        <div className="glass-holographic aura-iridescent" style={{ padding: 0, overflow: 'hidden', border: 'none', borderRadius: 24 }}>
          <div style={{ position: 'relative', paddingLeft: isMobile ? 56 : 96, paddingRight: isMobile ? 12 : 32, paddingTop: 40, paddingBottom: 40 }}>
            {hours.map(h => (
              <div key={h} style={{ position: 'relative', height: 64, borderBottom: '1px solid rgba(255,255,255,0.03)', zIndex: 1 }}>
                <div style={{ position: 'absolute', left: isMobile ? -50 : -80, top: -10, fontSize: 11, color: 'var(--muted)', fontWeight: 800, width: isMobile ? 40 : 60, textAlign: 'right', fontFamily: 'Syne', opacity: 0.6 }}>
                  {h === 12 ? '12 PM' : h < 12 ? `${h} AM` : `${h - 12} PM`}
                </div>
              </div>
            ))}

            {/* Current time indicator */}
            {currentDate === format(new Date(), 'yyyy-MM-dd') && now.getHours() >= 6 && now.getHours() <= 23 && (
              <motion.div
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                style={{
                  position: 'absolute',
                  top: getEventTop(`${now.getHours()}:${now.getMinutes()}`) + 40,
                  left: 0, right: 0,
                  height: 2,
                  background: 'linear-gradient(90deg, var(--accent), transparent)',
                  zIndex: 20,
                  transformOrigin: 'left',
                  boxShadow: '0 0 20px var(--accent)'
                }}>
                <motion.div 
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  style={{ width: 14, height: 14, borderRadius: '50%', background: 'var(--accent)', marginTop: -6, marginLeft: -7, boxShadow: '0 0 20px var(--accent)' }} 
                />
              </motion.div>
            )}

            {/* Events */}
            <AnimatePresence>
              {events.map(ev => {
                const status = currentDate === format(new Date(), 'yyyy-MM-dd') ? getStatus(ev) : 'future';
                const top = getEventTop(ev.startTime);
                const height = getEventHeight(ev.startTime, ev.endTime);
                const color = CAT_COLORS[ev.category] || 'var(--accent)';

                return (
                  <motion.div
                    key={ev._id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    style={{
                      position: 'absolute',
                      top: top + 42,
                      left: 12, right: 12,
                      height: height - 4,
                      background: status === 'current' ? `linear-gradient(135deg, ${color}33, ${color}11)` : `rgba(255,255,255,0.03)`,
                      backdropFilter: 'blur(12px)',
                      border: `1px solid ${color}${status === 'current' ? '88' : '33'}`,
                      borderLeft: `4px solid ${color}`,
                      borderRadius: 16,
                      padding: isMobile ? '10px 14px' : '16px 20px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      opacity: ev.isCompleted ? 0.3 : status === 'past' ? 0.6 : 1,
                      zIndex: status === 'current' ? 15 : 5,
                      boxShadow: status === 'current' ? `0 12px 40px ${color}22` : 'none',
                    }}
                    whileHover={{ scale: 1.01, zIndex: 16, border: `1px solid ${color}88`, borderLeft: `4px solid ${color}` }}
                    onClick={() => setModal(ev)}
                  >
                    <div className="btn-glint" style={{ opacity: status === 'current' ? 0.1 : 0 }} />
                    <div style={{ fontWeight: 800, fontSize: isMobile ? 14 : 16, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8, letterSpacing: '-0.01em' }}>
                      {ev.isCompleted && <CheckCircle2 size={16} style={{ color: 'var(--green)' }} />}
                      {ev.title}
                    </div>
                    {height > 50 && (
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, opacity: 0.8 }}>
                        <Clock size={12} />
                        {ev.startTime} — {ev.endTime || '∞'}
                      </div>
                    )}
                    {status === 'current' && (
                        <motion.div 
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          style={{ position: 'absolute', top: 16, right: 16, fontSize: 9, fontWeight: 900, color: color, background: `${color}22`, padding: '3px 10px', borderRadius: 6, letterSpacing: 1.5 }}
                        >
                          ACTIVE
                        </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Events list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Activity size={18} className="text-accent" />
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 2 }}>
              Chronology ({events.length})
            </div>
          </div>

          {isLoading ? (
            <div className="loading-page"><div className="loading-spinner" /></div>
          ) : events.length === 0 ? (
            <div className="card glass-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div className="empty-icon" style={{ fontSize: 40 }}>🧘</div>
              <div className="empty-title" style={{ marginTop: 16 }}>Undisturbed Time</div>
              <div className="empty-desc" style={{ marginTop: 8, fontSize: 12 }}>No alignments registered.</div>
              <button className="btn btn-primary btn-sm" style={{ marginTop: 24 }} onClick={() => setModal('create')}>Manifest Alignment</button>
            </div>
          ) : (
            events.map((ev, i) => {
              const status = currentDate === format(new Date(), 'yyyy-MM-dd') ? getStatus(ev) : 'future';
              const color = CAT_COLORS[ev.category] || 'var(--accent)';
              return (
                <motion.div
                  key={ev._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="premium-card hover-lift"
                  style={{
                    padding: isMobile ? '16px' : '20px',
                    borderLeft: `4px solid ${color}`,
                    opacity: status === 'past' || ev.isCompleted ? 0.5 : 1,
                    cursor: 'pointer',
                    background: status === 'current' ? `linear-gradient(135deg, ${color}11, transparent)` : 'transparent'
                  }}
                  onClick={() => setModal(ev)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 'var(--fs-base)', color: ev.isCompleted ? 'var(--muted)' : 'var(--text)', textDecoration: ev.isCompleted ? 'line-through' : 'none', letterSpacing: '-0.01em' }}>
                        {ev.title}
                      </div>
                      <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                        <Clock size={12} />
                        {ev.startTime} {ev.endTime && ` — ${ev.endTime}`}
                      </div>
                      {ev.linkedTask && (
                        <div className="glass-badge" style={{ marginTop: 12, color: color, background: `${color}11`, padding: '4px 10px', border: `1px solid ${color}33` }}>
                          <Target size={12} /> {ev.linkedTask.title}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                      <button
                        className="btn btn-icon glass btn-sm haptic-tap"
                        onClick={() => toggleMutation.mutate(ev._id)}
                        style={{ color: ev.isCompleted ? 'var(--green)' : 'var(--muted)', width: 36, height: 36, borderRadius: 10 }}
                      >
                        {ev.isCompleted ? <CheckCircle2 size={20} /> : <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2.5px solid var(--border)' }} />}
                      </button>
                      <button
                        className="btn btn-icon glass btn-sm haptic-tap"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDialog({
                            open: true,
                            title: 'Banish Alignment?',
                            confirmText: 'Banish',
                            onConfirm: () => { deleteMutation.mutate(ev._id); setConfirmDialog({ open: false }); }
                          });
                        }}
                        style={{ color: 'var(--red)', width: 36, height: 36, borderRadius: 10 }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {status === 'current' && (
                    <motion.div
                      animate={{ opacity: [0.6, 1, 0.6] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: color, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1.5 }}
                    >
                      <div className="pulse-dot" style={{ background: color }} />
                      Active Alignment
                    </motion.div>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      <AnimatePresence>
        {modal && (
          <EventModal
            event={modal === 'create' ? null : modal}
            date={currentDate}
            onClose={() => setModal(null)}
            onSave={handleSave}
            tasks={tasks}
            isMobile={isMobile}
          />
        )}
      </AnimatePresence>

      <ConfirmDialog {...confirmDialog} onCancel={() => setConfirmDialog({ open: false })} />

      <style>{`
        .text-accent { color: var(--accent); }
        .text-green { color: var(--green); }
      `}</style>
    </div>
  );
}
