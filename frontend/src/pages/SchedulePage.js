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
        initial={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.95, y: 20 }}
        animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
        exit={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={`modal glass-modal glass-card ${isMobile ? 'bottom-sheet' : ''}`}
        style={{ display: 'flex', flexDirection: 'column', height: isMobile ? 'calc(100% - 60px)' : 'auto' }}
      >
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="text-accent"><CalendarIcon size={20} /></div>
            {event ? 'Refine Event' : 'Schedule New Event'}
          </div>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Objective Title</label>
            <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Strategic Planning" autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Context & Details</label>
            <textarea className="textarea" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Optional details..." />
          </div>

          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">Date</label>
              <input type="date" className="input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Start</label>
              <input type="time" className="input" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">End</label>
              <input type="time" className="input" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Domain</label>
              <select className="select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Connect Objective</label>
              <select className="select" value={form.linkedTask} onChange={e => setForm(f => ({ ...f, linkedTask: e.target.value }))}>
                <option value="">No link</option>
                {tasks?.map(t => <option key={t._id} value={t._id}>{t.title}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="modal-footer" style={{ gap: 12, padding: isMobile ? '16px 20px 32px' : '20px 24px', borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-ghost" onClick={onClose} style={{ flex: isMobile ? 1 : 'none' }}>Cancel</button>
          <button className="btn btn-primary" style={{ flex: isMobile ? 2 : 'none' }} onClick={() => { if (!form.title.trim() || !form.startTime || !form.date) return toast.error('Title, date and start time required'); onSave({ ...form, linkedTask: form.linkedTask || null }); }}>
            {event ? 'Update Chronology' : 'Commit to Schedule'}
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
      <div className="page-header mb-6">
        <div>
          <div className="page-title flex items-center gap-4">
            <motion.div 
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ repeat: Infinity, duration: 5 }}
              className="text-accent"
              style={{ flexShrink: 0 }}
            >
              <Sparkles size={isMobile ? 24 : 36} />
            </motion.div>
            <h1 style={{ fontSize: isMobile ? 'var(--fs-xl)' : 'var(--fs-2xl)', fontWeight: 800, fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em' }}>Temporal Nexus</h1>
          </div>
          <p className="page-subtitle" style={{ fontSize: 'var(--fs-sm)', opacity: 0.8 }}>Architect your temporal alignment & flow</p>
        </div>
        <button className="btn btn-primary btn-premium magnetic-btn" onClick={() => setModal('create')} style={{ borderRadius: 14, boxShadow: 'var(--shadow-lg)' }}>
          <Plus size={18} /> Schedule Alignment
        </button>
      </div>

      {/* Date navigation */}
      <div className="card glass-card mb-6" style={{ padding: isMobile ? '8px 10px' : '12px 20px', display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 16, flexWrap: 'wrap', borderRadius: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: isMobile ? '1 1 100%' : '1', justifyContent: isMobile ? 'space-between' : 'flex-start' }}>
          <motion.button whileHover={{ x: -4 }} className="btn btn-icon btn-ghost" onClick={prevDay}><ChevronLeft size={20} /></motion.button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: isMobile ? 18 : 24, fontWeight: 800, fontFamily: 'Syne, sans-serif', color: 'var(--text)', whiteSpace: 'nowrap' }}>
                {format(new Date(currentDate + 'T00:00:00'), 'EEEE,')}
              </div>
              <div style={{ fontSize: isMobile ? 18 : 24, fontWeight: 800, fontFamily: 'Syne, sans-serif', color: 'var(--accent)', whiteSpace: 'nowrap' }}>
                {format(new Date(currentDate + 'T00:00:00'), 'MMMM d')}
              </div>
          </div>
          <motion.button whileHover={{ x: 4 }} className="btn btn-icon btn-ghost" onClick={nextDay}><ChevronRight size={20} /></motion.button>
        </div>

        <div style={{ display: 'flex', gap: 10, flex: isMobile ? '1 1 100%' : 'none', width: isMobile ? '100%' : 'auto', alignItems: 'center' }}>
          <button className="btn btn-ghost btn-sm" style={{ fontWeight: 800, flex: isMobile ? 1 : 'none', borderRadius: 10 }} onClick={() => setCurrentDate(format(new Date(), 'yyyy-MM-dd'))}>Today</button>
          <div style={{ height: 24, width: 1, background: 'var(--border)', margin: '0 4px' }} className="hide-mobile" />
          <input type="date" className="input" style={{ flex: isMobile ? 2 : 'none', maxWidth: isMobile ? 'none' : 160, borderRadius: 12, border: '1px solid var(--border)', fontSize: 13, fontWeight: 700 }} value={currentDate} onChange={e => setCurrentDate(e.target.value)} />
        </div>
      </div>

      {/* Main layout: timeline + list side by side on desktop, stacked on mobile */}
      <div className="schedule-main-grid mt-8">

        {/* Timeline view */}
        <div className="card glass-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)' }}>
          <div style={{ position: 'relative', paddingLeft: isMobile ? 48 : 84, paddingRight: isMobile ? 8 : 24, paddingTop: 32, paddingBottom: 32 }}>
            {hours.map(h => (
              <div key={h} style={{ position: 'relative', height: 64, borderBottom: '1px solid var(--border)', zIndex: 1 }}>
                <div style={{ position: 'absolute', left: isMobile ? -50 : -70, top: -10, fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, width: isMobile ? 40 : 60, textAlign: 'right', fontFamily: 'Syne' }}>
                  {h === 12 ? '12 PM' : h < 12 ? `${h} AM` : `${h - 12} PM`}
                </div>
              </div>
            ))}

            {/* Current time indicator */}
            {currentDate === format(new Date(), 'yyyy-MM-dd') && now.getHours() >= 6 && now.getHours() <= 23 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  position: 'absolute',
                  top: getEventTop(`${now.getHours()}:${now.getMinutes()}`) + 32,
                  left: 0, right: 0,
                  height: 2,
                  background: 'var(--accent)',
                  zIndex: 20,
                  boxShadow: '0 0 15px var(--accent)'
                }}>
                <motion.div 
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--accent)', marginTop: -5, marginLeft: -6, boxShadow: '0 0 15px var(--accent)' }} 
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
                    initial={{ opacity: 0, scale: 0.95, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    style={{
                      position: 'absolute',
                      top: top + 33,
                      left: 12, right: 12,
                      height: height - 2,
                      background: status === 'current' ? `linear-gradient(135deg, ${color}44, ${color}22)` : `linear-gradient(135deg, ${color}22, ${color}08)`,
                      backdropFilter: 'blur(8px)',
                      border: `1.5px solid ${color}${status === 'current' ? '99' : '44'}`,
                      borderLeft: `6px solid ${color}`,
                      borderRadius: 14,
                      padding: isMobile ? '6px 10px' : '12px 16px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      opacity: ev.isCompleted ? 0.3 : status === 'past' ? 0.5 : 1,
                      zIndex: status === 'current' ? 15 : 5,
                      boxShadow: status === 'current' ? `0 12px 32px ${color}33, inset 0 0 20px rgba(255,255,255,0.05)` : 'none',
                    }}
                    whileHover={{ scale: 1.02, zIndex: 16, boxShadow: `0 12px 24px ${color}44` }}
                    onClick={() => setModal(ev)}
                  >
                    <div style={{ fontWeight: 800, fontSize: 'var(--fs-sm)', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8, letterSpacing: '-0.01em' }}>
                      {ev.isCompleted && <CheckCircle2 size={16} className="text-green" style={{ filter: `drop-shadow(0 0 5px ${color})` }} />}
                      {ev.title}
                    </div>
                    {height > 50 && (
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 5, fontWeight: 700, opacity: 0.8 }}>
                        <Clock size={12} />
                        {ev.startTime} — {ev.endTime || '∞'}
                      </div>
                    )}
                    {status === 'current' && (
                        <motion.div 
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          style={{ position: 'absolute', top: 12, right: 12, fontSize: 9, fontWeight: 800, color: color, background: `${color}22`, padding: '2px 8px', borderRadius: 4, letterSpacing: 1 }}
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
                  className="card glass-card hover-lift"
                  style={{
                    padding: isMobile ? '12px' : '16px',
                    borderLeft: `3px solid ${color}`,
                    opacity: status === 'past' || ev.isCompleted ? 0.6 : 1,
                    cursor: 'pointer',
                  }}
                  onClick={() => setModal(ev)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 'var(--fs-base)', color: ev.isCompleted ? 'var(--muted)' : 'var(--text)', textDecoration: ev.isCompleted ? 'line-through' : 'none' }}>
                        {ev.title}
                      </div>
                      <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                        <Clock size={12} />
                        {ev.startTime} {ev.endTime && ` — ${ev.endTime}`}
                      </div>
                      {ev.linkedTask && (
                        <div style={{ fontSize: 'var(--fs-xs)', color: color, marginTop: 8, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Target size={12} /> {ev.linkedTask.title}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                      <button
                        className="btn btn-icon btn-ghost btn-sm"
                        onClick={() => toggleMutation.mutate(ev._id)}
                        style={{ color: ev.isCompleted ? 'var(--green)' : 'var(--muted)', width: 32, height: 32 }}
                      >
                        {ev.isCompleted ? <CheckCircle2 size={18} /> : <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid' }} />}
                      </button>
                      <button
                        className="btn btn-icon btn-ghost btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDialog({
                            open: true,
                            title: 'Vanish Event',
                            message: 'Are you sure you want to completely banish this event from your timeline?',
                            onConfirm: () => { deleteMutation.mutate(ev._id); setConfirmDialog({ open: false }); }
                          });
                        }}
                        style={{ color: 'var(--red)', width: 32, height: 32 }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {status === 'current' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: color, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}
                    >
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, animation: 'pulse 2s ease infinite' }} />
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
