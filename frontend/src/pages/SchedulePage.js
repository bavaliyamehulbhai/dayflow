import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scheduleAPI, tasksAPI } from '../utils/api';
import { useNotifications } from '../context/NotificationContext';
import { format, addDays, subDays, isValid, parseISO } from 'date-fns';
import { safeFormat, safeNewDate, safeToLocalISO } from '../utils/dateUtils';
import { getSafeId } from '../utils/idUtils';
import {
  Calendar as CalendarIcon, Clock, Layers, Plus, ChevronLeft, ChevronRight,
  CheckCircle2, Trash2, Sparkles, MapPin, X, Pencil, Activity, Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmDialog from '../components/ConfirmDialog';
import SensitivityShield from '../components/layout/SensitivityShield';
import MagneticButton from '../components/common/MagneticButton';
import AuraOrb from '../components/common/AuraOrb';

const CATEGORIES = ['work', 'personal', 'health', 'learning', 'social', 'other'];
const CAT_COLORS = { work: '#7c6dfa', personal: '#fa6d8a', health: '#6dfacc', learning: '#fad96d', social: '#fa9a6d', other: '#a3a3a3' };

function EventModal({ event, date, onClose, onSave, tasks, isMobile }) {
  const { addToast } = useNotifications();
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
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()} style={{ zIndex: 1000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)' }}>
      <motion.div
        initial={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.95, y: 20 }}
        animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
        exit={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={`premium-card aura-iridescent ${isMobile ? 'bottom-sheet' : ''}`}
        style={{ width: '100%', maxWidth: 640, padding: 0, overflow: 'hidden', border: isMobile ? 'none' : '1px solid rgba(255,255,255,0.05)', background: 'rgba(15, 15, 25, 0.95)' }}
      >
        <div className="modal-header" style={{ padding: isMobile ? '20px' : '32px 40px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'Syne', fontWeight: 900, fontSize: isMobile ? 18 : 24, letterSpacing: '-0.02em' }}>
            <div className="auth-logo-icon aura-float" style={{ width: isMobile ? 32 : 40, height: isMobile ? 32 : 40, marginBottom: 0, background: 'var(--grad-premium)' }}>
              <CalendarIcon size={isMobile ? 16 : 20} color="white" strokeWidth={2.5} />
            </div>
            {event ? 'REFINE ALIGNMENT' : 'TEMPORAL OBJECTIVE'}
          </div>
          <button className="modal-close haptic-tap" onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 10, border: 'none', color: 'white' }}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body aura-scrollbar" style={{ padding: isMobile ? '24px' : '40px', maxHeight: '70vh', overflowY: 'auto' }}>
          <div className="form-group mb-6">
            <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10, display: 'block' }}>Objective Title</label>
            <input className="auth-input haptic-feedback" style={{ height: 60, fontSize: 18, fontWeight: 700, borderRadius: 16 }} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. CORE STRATEGY" autoFocus />
          </div>
          <div className="form-group mb-6">
            <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10, display: 'block' }}>Context</label>
            <textarea className="auth-input haptic-feedback" style={{ padding: '16px 20px', minHeight: 100, fontSize: 15, borderRadius: 16 }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Define the focus..." />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
            <div className="form-group">
              <label style={{ fontSize: 9, fontWeight: 900, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, display: 'block' }}>DATE</label>
              <input type="date" className="auth-input" style={{ height: 48, fontSize: 13, borderRadius: 12 }} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label style={{ fontSize: 9, fontWeight: 900, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, display: 'block' }}>START</label>
              <input type="time" className="auth-input" style={{ height: 48, fontSize: 13, borderRadius: 12 }} value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
            </div>
            <div className="form-group">
              <label style={{ fontSize: 9, fontWeight: 900, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, display: 'block' }}>END</label>
              <input type="time" className="auth-input" style={{ height: 48, fontSize: 13, borderRadius: 12 }} value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, display: 'block' }}>DOMAIN</label>
              <select className="auth-input" style={{ height: 52, borderRadius: 14, fontSize: 14 }} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map((c, cIdx) => <option key={`cat-${cIdx}`} value={c}>{c.toUpperCase()}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, display: 'block' }}>LINK OBJECTIVE</label>
              <select className="auth-input" style={{ height: 52, borderRadius: 14, fontSize: 14 }} value={form.linkedTask} onChange={e => setForm(f => ({ ...f, linkedTask: e.target.value }))}>
                <option value="">NO LINK</option>
                {tasks?.map((t, tIdx) => {
                  const tid = getSafeId(t, `task-${tIdx}`);
                  return (
                    <option key={tid} value={tid}>
                      {t.title} ({t.priority?.toUpperCase() || 'NORMAL'})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>
        <div className="modal-footer" style={{ padding: isMobile ? '20px' : '32px 40px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 12 }}>
          <button className="btn glass haptic-tap" onClick={onClose} style={{ flex: 1, height: 56, borderRadius: 18, fontWeight: 800 }}>ABORT</button>
          <button className="auth-button haptic-tap" style={{ flex: 2, height: 56, borderRadius: 18, fontSize: 16, fontWeight: 900, letterSpacing: 1 }} onClick={() => { if (!form.title.trim() || !form.startTime || !form.date) return addToast('Required data missing', 'error'); onSave({ ...form, linkedTask: form.linkedTask || null }); }}>
            <div className="btn-glint" />
            COMMIT ALIGNMENT
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function useWindowWidth() {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return w;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
};

export default function SchedulePage() {
  const qc = useQueryClient();
  const { addToast } = useNotifications();
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

  const createMutation = useMutation({ mutationFn: scheduleAPI.create, onSuccess: () => { addToast('Objective manifested', 'success'); setModal(null); invalidate(); } });
  const updateMutation = useMutation({ mutationFn: ({ id, data }) => scheduleAPI.update(id, data), onSuccess: () => { addToast('Alignment refined', 'success'); setModal(null); invalidate(); } });
  const deleteMutation = useMutation({ mutationFn: scheduleAPI.delete, onSuccess: () => { addToast('Alignment banished', 'info'); invalidate(); } });
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
    const mid = getSafeId(modal);
    if (modal && mid) updateMutation.mutate({ id: mid, data });
    else createMutation.mutate(data);
  };

  const prevDay = () => {
    const d = safeNewDate(currentDate + 'T00:00:00') || new Date();
    setCurrentDate(safeFormat(subDays(d, 1), 'yyyy-MM-dd'));
  };
  const nextDay = () => {
    const d = safeNewDate(currentDate + 'T00:00:00') || new Date();
    setCurrentDate(safeFormat(addDays(d, 1), 'yyyy-MM-dd'));
  };

  const hours = Array.from({ length: 18 }, (_, i) => i + 6);

  const getEventTop = (time) => {
    const [h, m] = time.split(':').map(Number);
    const rowHeight = isMobile ? 48 : 64;
    return ((h - 6) * 60 + m) * (rowHeight / 60);
  };

  const getEventHeight = (start, end) => {
    if (!end) return 48;
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const mins = (eh * 60 + em) - (sh * 60 + sm);
    const rowHeight = isMobile ? 48 : 64;
    return Math.max(40, mins * (rowHeight / 60));
  };

  return (
    <div className="responsive-container" style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      <AuraOrb color="rgba(124, 109, 250, 0.15)" size="600px" top="-10%" left="-10%" delay={0} />
      <AuraOrb color="rgba(250, 109, 138, 0.12)" size="500px" top="60%" left="60%" delay={5} />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ position: 'relative', zIndex: 1 }}
      >
        <div className="page-header mb-10" style={{ alignItems: 'flex-start', position: 'relative', padding: isMobile ? '12px 0' : '40px 0' }}>
          <div>
            <div className="page-title flex items-center gap-4">
              <div className="auth-logo-icon aura-float" style={{ width: isMobile ? 40 : 54, height: isMobile ? 40 : 54, marginBottom: 0, background: 'var(--grad-premium)' }}>
                <Sparkles size={isMobile ? 20 : 28} color="white" strokeWidth={2.5} fill="white" />
              </div>
              <h1 style={{ 
                fontSize: 'clamp(28px, 5vw, 42px)', 
                fontWeight: 900, 
                fontFamily: 'Syne, sans-serif', 
                letterSpacing: '-0.05em', 
                lineHeight: 1,
                background: 'linear-gradient(to right, #fff, rgba(255,255,255,0.7))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>Temporal Nexus</h1>
            </div>
            <p className="page-subtitle" style={{ fontSize: 'var(--fs-sm)', opacity: 0.8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: 12 }}>Architecture of flow & alignment</p>
          </div>
          <MagneticButton className="auth-button hide-mobile glow-on-hover" onClick={() => setModal('create')} style={{ width: 'auto', padding: '0 32px', height: 60, borderRadius: 24, fontSize: 14, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1 }}>
            <div className="btn-glint" />
            <Plus size={22} style={{ marginRight: 10 }} strokeWidth={3} /> SCHEDULE ALIGNMENT
          </MagneticButton>
        </div>

        {/* Date navigation */}
        <div className="glass-holographic mb-8" style={{ padding: isMobile ? '16px' : '24px 32px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', borderRadius: 28, border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: isMobile ? '1 1 100%' : '1', justifyContent: isMobile ? 'space-between' : 'flex-start' }}>
            <motion.button whileTap={{ scale: 0.9 }} className="btn btn-icon glass haptic-tap" onClick={prevDay} style={{ borderRadius: 14, width: 44, height: 44 }}><ChevronLeft size={24} /></motion.button>
            <div style={{ textAlign: 'center', minWidth: isMobile ? 'auto' : 220 }}>
              <div style={{ fontSize: 24, fontWeight: 900, fontFamily: 'Syne, sans-serif', color: 'white', lineHeight: 1, letterSpacing: '-0.02em' }}>
                  {safeFormat(currentDate + 'T00:00:00', 'EEEE')}
                </div>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent)', marginTop: 6, letterSpacing: 2, textTransform: 'uppercase' }}>
                  {safeFormat(currentDate + 'T00:00:00', 'MMMM d, yyyy')}
                </div>
            </div>
            <motion.button whileTap={{ scale: 0.9 }} className="btn btn-icon glass haptic-tap" onClick={nextDay} style={{ borderRadius: 14, width: 44, height: 44 }}><ChevronRight size={24} /></motion.button>
          </div>

          <div style={{ display: 'flex', gap: 12, flex: isMobile ? '1 1 100%' : 'none', width: isMobile ? '100%' : 'auto', alignItems: 'center' }}>
            <button className="btn glass haptic-tap" style={{ fontWeight: 900, height: 44, padding: '0 24px', borderRadius: 14, fontSize: 13, letterSpacing: 1 }} onClick={() => setCurrentDate(safeFormat(new Date(), 'yyyy-MM-dd'))}>TODAY</button>
            <div style={{ height: 32, width: 1, background: 'rgba(255,255,255,0.1)', margin: '0 8px' }} className="hide-mobile" />
            <input type="date" className="auth-input" style={{ flex: isMobile ? 1 : 'none', width: isMobile ? 'auto' : 180, height: 44, borderRadius: 14, fontSize: 13, fontWeight: 800, padding: '0 16px' }} value={currentDate} onChange={e => setCurrentDate(e.target.value)} />
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 340px',
          gap: 24,
          alignItems: 'start'
        }}>
          {/* Timeline */}
          <div className="premium-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 32, background: 'rgba(255,255,255,0.01)' }}>
            <div style={{ position: 'relative', paddingLeft: isMobile ? 60 : 100, paddingRight: 16, paddingTop: 60, paddingBottom: 60 }}>
              {hours.map(h => (
                <div key={h} style={{ position: 'relative', height: isMobile ? 48 : 64, borderBottom: '1px solid rgba(255,255,255,0.02)', zIndex: 1 }}>
                  <div style={{ position: 'absolute', left: isMobile ? -54 : -84, top: -11, fontSize: 10, color: 'var(--muted)', fontWeight: 900, width: isMobile ? 44 : 70, textAlign: 'right', fontFamily: 'Syne', opacity: 0.5 }}>
                    {h === 12 ? '12 PM' : h < 12 ? `${h} AM` : `${h - 12} PM`}
                  </div>
                </div>
              ))}

              {/* Indicator */}
              {currentDate === safeFormat(new Date(), 'yyyy-MM-dd') && now.getHours() >= 6 && now.getHours() <= 23 && (
                <div style={{
                  position: 'absolute',
                  top: getEventTop(`${now.getHours()}:${now.getMinutes()}`) + 62,
                  left: 0, right: 0,
                  height: 2,
                  background: 'linear-gradient(90deg, var(--accent), transparent)',
                  zIndex: 20
                }}>
                  <div className="aura-pulse" style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--accent)', marginTop: -5, marginLeft: -6, boxShadow: '0 0 15px var(--accent)' }} />
                </div>
              )}

              {/* Rendered Events */}
              <AnimatePresence>
                {events.length > 0 ? events.map((ev, idx) => {
                  const status = currentDate === safeFormat(new Date(), 'yyyy-MM-dd') ? getStatus(ev) : 'future';
                  const top = getEventTop(ev.startTime);
                  const height = getEventHeight(ev.startTime, ev.endTime);
                  const color = CAT_COLORS[ev.category] || 'var(--accent)';

                  const eventKey = getSafeId(ev, `ev-${idx}`);
                  return (
                    <motion.div
                      key={eventKey}
                      layoutId={eventKey}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      style={{
                        position: 'absolute',
                        top: top + 64,
                        left: 14, right: 14,
                        height: height - 6,
                        background: status === 'current' ? `linear-gradient(135deg, ${color}33, ${color}11)` : `rgba(255,255,255,0.03)`,
                        backdropFilter: 'blur(10px)',
                        border: `1px solid ${color}${status === 'current' ? '88' : '22'}`,
                        borderLeft: `5px solid ${color}`,
                        borderRadius: 20,
                        padding: isMobile ? '12px' : '18px 24px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        opacity: ev.isCompleted ? 0.4 : status === 'past' ? 0.7 : 1,
                        zIndex: 10,
                        boxShadow: status === 'current' ? `0 15px 40px ${color}22` : 'none'
                      }}
                      whileHover={{ scale: 1.01, zIndex: 11 }}
                      onClick={() => setModal(ev)}
                    >
                      <div className="btn-glint" style={{ opacity: status === 'current' ? 0.1 : 0 }} />
                      <div style={{ fontWeight: 900, fontSize: isMobile ? 15 : 17, color: 'white', display: 'flex', alignItems: 'center', gap: 10, letterSpacing: '-0.02em', fontFamily: 'Syne' }}>
                        {ev.isCompleted && <CheckCircle2 size={18} style={{ color: 'var(--green)' }} />}
                        {ev.title}
                      </div>
                      {height > 60 && (
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800 }}>
                          <Clock size={14} />
                          {ev.startTime} — {ev.endTime || '∞'}
                        </div>
                      )}
                    </motion.div>
                  );
                }) : null}
              </AnimatePresence>
            </div>
          </div>

          {/* List/Summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 8 }}>
              <Activity size={20} className="text-accent" />
              <div style={{ fontWeight: 900, fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 2.5 }}>Chronology</div>
            </div>

            {isLoading ? (
              <div className="loading-spinner" />
            ) : events.length === 0 ? (
              <div className="premium-card aura-iridescent" style={{ padding: 40, textAlign: 'center', borderRadius: 28 }}>
                <div style={{ fontSize: 44, marginBottom: 20 }}>🌌</div>
                <div style={{ fontWeight: 900, fontFamily: 'Syne', fontSize: 18, marginBottom: 10 }}>VACUUM DETECTED</div>
                <div style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.6 }}>Manifest a temporal objective to fill this cycle.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {events.map((ev, i) => {
                  const color = CAT_COLORS[ev.category] || 'var(--accent)';
                  const status = currentDate === safeFormat(new Date(), 'yyyy-MM-dd') ? getStatus(ev) : 'future';
                  const evListKey = getSafeId(ev, `ev-side-${i}`);
                  return (
                    <motion.div
                      key={getSafeId(ev, `ev-list-${i}`)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="premium-card hover-lift"
                      style={{
                        padding: 16,
                        borderLeft: `4px solid ${color}`,
                        background: status === 'current' ? `${color}08` : 'rgba(255,255,255,0.01)',
                        opacity: ev.isCompleted ? 0.4 : 1
                      }}
                      onClick={() => setModal(ev)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: 'white', textDecoration: ev.isCompleted ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</h4>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, fontSize: 11, color: 'var(--muted)', fontWeight: 800 }}>
                            <Clock size={12} /> {ev.startTime}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }} onClick={e => e.stopPropagation()}>
                          <button 
                            className="btn glass btn-sm haptic-tap" 
                            style={{ width: 34, height: 34, borderRadius: 10, color: ev.isCompleted ? 'var(--green)' : 'var(--muted)' }}
                            onClick={() => toggleMutation.mutate(getSafeId(ev))}
                          >
                            <CheckCircle2 size={18} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
            
            {isMobile && (
               <motion.button
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                onClick={() => setModal('create')}
                className="fab-premium haptic-tap"
                style={{
                  position: 'fixed',
                  bottom: 'calc(85px + 24px)',
                  right: 24,
                  width: 64,
                  height: 64,
                  borderRadius: 24,
                  background: 'var(--grad-premium)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 15px 40px rgba(124, 109, 250, 0.4)',
                  zIndex: 100,
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
              >
                <Plus size={32} strokeWidth={2.5} />
              </motion.button>
            )}
          </div>
        </div>

      </motion.div>

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

      <ConfirmDialog {...confirmDialog} onConfirm={confirmDialog.onConfirm} onCancel={() => setConfirmDialog({ open: false })} />
    </div>
  );
}
