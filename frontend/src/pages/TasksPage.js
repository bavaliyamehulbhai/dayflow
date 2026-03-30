import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  Plus, Search, Pencil, Trash2, AlertCircle, Check, CheckCircle2,
  X, ClipboardList, Clock, Tag, Calendar, Layers, Zap, Trophy, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useFeedback from '../hooks/useFeedback';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import SensitivityShield from '../components/layout/SensitivityShield';
import { useNavigate } from 'react-router-dom';
import MagneticButton from '../components/common/MagneticButton';



const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const STATUSES = ['pending', 'in-progress', 'completed', 'cancelled'];
const CATEGORIES = ['General', 'Work', 'Personal', 'Health', 'Learning', 'Finance', 'Other'];

function useWindowWidth() {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return w;
}

// ─── Memoized Task Item Component ──────────────────────────────────────────
const TaskItem = React.memo(({ task, selected, toggleSelect, toggleComplete, setModal, setConfirmState, isMobile }) => {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
  const priorityAura = {
    urgent: '0 0 20px rgba(248, 113, 113, 0.15)',
    high: '0 0 15px rgba(251, 146, 60, 0.1)',
    medium: 'none',
    low: 'none'
  }[task.priority];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.005, y: -2 }}
      className={`task-row-container premium-card ${selected ? 'selected-aura' : ''}`}
      style={{ 
        opacity: task.status === 'cancelled' ? 0.4 : 1, 
        marginBottom: 12, 
        padding: 0, 
        overflow: 'hidden',
        boxShadow: selected ? `0 0 30px var(--accent-glow)` : priorityAura,
        border: selected ? '1.5px solid var(--accent)' : '1.5px solid var(--border)'
      }}
      onClick={() => setModal(task)}
    >
      <div className="task-row-main" style={{ 
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? 12 : 20,
        padding: isMobile ? '12px 16px' : '16px 24px',
        background: 'transparent'
      }}>
        <div className="task-row-check" onClick={e => e.stopPropagation()}>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => toggleComplete(task)}
            className="status-checkbox haptic-tap"
            style={{
              width: 28, height: 28, borderRadius: 10, 
              border: `2.5px solid ${task.status === 'completed' ? 'var(--green)' : 'var(--border)'}`,
              background: task.status === 'completed' ? 'var(--green)' : 'rgba(255,255,255,0.03)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: task.status === 'completed' ? '0 0 20px rgba(74, 222, 128, 0.3)' : 'none'
            }}
          >
            <AnimatePresence>
              {task.status === 'completed' && (
                <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}>
                  <Check size={16} color="white" strokeWidth={4} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        <div className="task-row-content" style={{ flex: 1, minWidth: 0 }}>
          <div style={{ 
            fontSize: isMobile ? 15 : 16, fontWeight: 700,
            textDecoration: task.status === 'completed' ? 'line-through' : 'none',
            color: task.status === 'completed' ? 'var(--muted)' : 'var(--text)',
            marginBottom: 4,
            transition: 'color 0.3s ease',
            fontFamily: 'Syne, sans-serif'
          }}>
            <SensitivityShield>
              {task.title}
            </SensitivityShield>
          </div>
          <div className="task-row-meta" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 10, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {task.category && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.04)' }}>
                <Tag size={10} /> {task.category}
              </span>
            )}
            {task.dueDate && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: isOverdue ? 'var(--red)' : 'inherit' }}>
                <Calendar size={10} /> {format(new Date(task.dueDate), 'MMM d')}
              </span>
            )}
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: `var(--${task.priority})` }}>
              <Layers size={10} /> {task.priority}
            </span>
          </div>
        </div>

        <div className="task-row-actions" style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
          <button 
            className={`btn btn-icon btn-sm haptic-tap ${selected ? 'text-accent' : 'text-muted'}`} 
            onClick={() => toggleSelect(task._id)}
            style={{ background: selected ? 'rgba(124, 109, 250, 0.1)' : 'transparent' }}
          >
            <CheckCircle2 size={18} />
          </button>
          <button className="btn btn-icon btn-ghost btn-sm text-red haptic-tap" onClick={() => setConfirmState({ open: true, task })}><Trash2 size={18} /></button>
        </div>
      </div>
    </motion.div>
  );
}, (prev, next) => {
  return prev.task._id === next.task._id && 
         prev.task.status === next.task.status && 
         prev.task.title === next.task.title &&
         prev.task.priority === next.task.priority &&
         prev.selected === next.selected &&
         prev.isMobile === next.isMobile;
});

// ─── Skeleton loader rows ─────────────────────────────────────────────────────
function TasksSkeleton() {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 24px', borderBottom: '1px solid var(--border)' }}>
          <div className="skeleton" style={{ width: 16, height: 16, borderRadius: 4 }} />
          <div className="skeleton" style={{ width: 24, height: 24, borderRadius: 7 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="skeleton skeleton-text" style={{ height: 14, width: '60%' }} />
            <div className="skeleton skeleton-text" style={{ height: 10, width: '30%' }} />
          </div>
          <div className="skeleton" style={{ width: 72, height: 24, borderRadius: 20 }} />
          <div style={{ display: 'flex', gap: 4 }}>
            <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 8 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Task modal ───────────────────────────────────────────────────────────────
function TaskModal({ task, onClose, onSave }) {
  const isMobile = window.innerWidth <= 768;
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'medium',
    status: task?.status || 'pending',
    category: task?.category || 'General',
    dueDate: task?.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
    estimatedMinutes: task?.estimatedMinutes || '',
    tags: task?.tags?.join(', ') || '',
    subtasks: task?.subtasks || []
  });
  const [newSubtask, setNewSubtask] = useState('');

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    setForm(f => ({ ...f, subtasks: [...f.subtasks, { title: newSubtask.trim(), completed: false }] }));
    setNewSubtask('');
  };

  const removeSubtask = (i) => setForm(f => ({ ...f, subtasks: f.subtasks.filter((_, idx) => idx !== i) }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title is required');
    onSave({
      ...form,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      dueDate: form.dueDate || null,
      estimatedMinutes: form.estimatedMinutes ? parseInt(form.estimatedMinutes) : null
    });
  };

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
          <div className="modal-title" style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: isMobile ? 18 : 22 }}>
            {task ? 'Refine Mission' : 'New Objective'}
          </div>
          <button className="modal-close haptic-tap" onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: isMobile ? 6 : 8 }}>
            <X size={isMobile ? 18 : 20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ padding: isMobile ? '20px' : '32px', paddingBottom: isMobile ? 'calc(20px + env(safe-area-inset-bottom))' : 32 }}>
            <div className="form-group mb-4">
              <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--muted)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Objective Title</label>
              <input 
                className="auth-input haptic-feedback" 
                style={{ height: isMobile ? 48 : 56, fontSize: isMobile ? 15 : 16 }}
                value={form.title} 
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} 
                placeholder="Declare your intent..." 
                autoFocus 
              />
            </div>
            <div className="grid-2" style={{ gap: isMobile ? 12 : 20 }}>
              <div className="form-group">
                <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>Priority</label>
                <select className="select" style={{ height: isMobile ? 44 : 52, borderRadius: 12 }} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>Status</label>
                <select className="select" style={{ height: isMobile ? 44 : 52, borderRadius: 12 }} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="modal-footer" style={{ padding: isMobile ? '16px 20px' : '20px 32px', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 10 }}>
            <button type="button" className="btn btn-ghost" style={{ flex: 1, height: isMobile ? 48 : 52, borderRadius: 14 }} onClick={onClose}>Abort</button>
            <button type="submit" className="auth-button" style={{ flex: 2, height: isMobile ? 48 : 52, borderRadius: 14, fontSize: isMobile ? 15 : 16 }}>
              <div className="btn-glint" />
              Manifest
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function TasksPage() {
  const qc = useQueryClient();
  const feedback = useFeedback();
  const navigate = useNavigate();
  const width = useWindowWidth();
  const isMobile = width <= 768;
  const [modal, setModal] = useState(null);
  const [filters, setFilters] = useState({ status: '', priority: '', search: '', sortBy: 'createdAt' });
  const [selected, setSelected] = useState([]);
  const [confirmState, setConfirmState] = useState({ open: false, task: null });

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => tasksAPI.getAll(filters).then(r => r.data)
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const action = params.get('action');
    const status = params.get('status');
    const priority = params.get('priority');

    if (action === 'create') {
      setModal('create');
    }
    
    if (status || priority) {
      setFilters(f => ({ 
        ...f, 
        status: status || f.status, 
        priority: priority || f.priority 
      }));
    }

    if (action || status || priority) {
      // Clear URL params to avoid persistent filtering on refresh
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  const { data: statsData } = useQuery({
    queryKey: ['task-stats'],
    queryFn: () => tasksAPI.stats().then(r => r.data.stats)
  });

  const invalidate = () => {
    qc.invalidateQueries(['tasks']);
    qc.invalidateQueries(['task-stats']);
  };

  const createMutation = useMutation({
    mutationFn: (d) => tasksAPI.create(d),
    onSuccess: () => { toast.success('Objective Secured'); setModal(null); invalidate(); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => tasksAPI.update(id, data),
    onSuccess: () => { invalidate(); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => tasksAPI.delete(id),
    onSuccess: () => { toast.success('Objective Removed'); setConfirmState({ open: false, task: null }); invalidate(); }
  });

  const tasks = data?.tasks || [];

  const handleSave = (formData) => {
    if (modal && modal._id) {
      updateMutation.mutate({ id: modal._id, data: formData });
      setModal(null);
    } else {
      createMutation.mutate(formData);
    }
  };

  const toggleComplete = (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    if (newStatus === 'completed') feedback('success');
    updateMutation.mutate({ id: task._id, data: { status: newStatus } });
  };

  const toggleSelect = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const handleDelete = (task) => {
    deleteMutation.mutate(task._id);
  };

  const handleBulkComplete = () => {
    selected.forEach(id => {
      const task = tasks.find(t => t._id === id);
      if (task && task.status !== 'completed') {
        updateMutation.mutate({ id, data: { status: 'completed' } });
      }
    });
    setSelected([]);
    toast.success('Objectives Secured');
    feedback('success');
  };

  const handleBulkDelete = () => {
    setConfirmState({
      open: true,
      title: `Remove ${selected.length} Objectives?`,
      message: 'This action cannot be undone. Are you sure you want to proceed?',
      onConfirm: () => {
        selected.forEach(id => deleteMutation.mutate(id));
        setSelected([]);
        setConfirmState({ open: false, task: null });
      }
    });
  };

  return (
    <div className="responsive-container">
      <div className="page-header" style={{ 
        flexDirection: isMobile ? 'row' : 'row', 
        justifyContent: 'space-between',
        alignItems: 'center', 
        marginBottom: isMobile ? 16 : 40,
        position: 'relative' 
      }}>
        <div className="aura-pulse" style={{ 
          position: 'absolute', top: -50, left: -50, 
          width: 200, height: 200, 
          background: 'var(--grad-mesh-vibrant)', 
          opacity: 0.1, zIndex: -1 
        }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 16 }}>
          <div className="auth-logo-icon aura-float" style={{ width: isMobile ? 36 : 48, height: isMobile ? 36 : 48, marginBottom: 0, flexShrink: 0 }}>
            <ClipboardList size={isMobile ? 18 : 24} color="white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="page-title" style={{ fontFamily: 'Syne, sans-serif', fontSize: isMobile ? 'var(--fs-lg)' : 'var(--fs-2xl)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1 }}>
              Mission Control
            </div>
            {!isMobile && <p className="page-subtitle" style={{ fontSize: 'var(--fs-sm)', opacity: 0.7, fontWeight: 600, marginTop: 4 }}>Track and conquer tactical objectives</p>}
          </div>
        </div>
      </div>

      {statsData && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: isMobile ? 8 : 16, marginBottom: isMobile ? 16 : 32 }}>
          <div className="glass" style={{ padding: isMobile ? '12px 16px' : '20px 24px', borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: 'none' }}>
            <div style={{ fontSize: 9, fontWeight: 900, color: 'var(--muted)', letterSpacing: 1, marginBottom: 4, textTransform: 'uppercase' }}>Total</div>
            <div style={{ fontSize: isMobile ? 18 : 24, fontWeight: 900, fontFamily: 'Syne', color: 'white' }}>{statsData.total}</div>
          </div>
          <div className="glass" style={{ padding: isMobile ? '12px 16px' : '20px 24px', borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: 'none' }}>
            <div style={{ fontSize: 9, fontWeight: 900, color: 'var(--muted)', letterSpacing: 1, marginBottom: 4, textTransform: 'uppercase' }}>Secured</div>
            <div style={{ fontSize: isMobile ? 18 : 24, fontWeight: 900, fontFamily: 'Syne', color: 'var(--green)' }}>{statsData.completed}</div>
          </div>
        </div>
      )}

      {/* Compact High-Performance Filter Bar */}
      <div className="glass-holographic aura-iridescent" style={{ padding: isMobile ? '12px' : '16px', borderRadius: 20, border: 'none', marginBottom: isMobile ? 16 : 24 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: isMobile ? 12 : 16 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
            <input
              className="auth-input"
              style={{ paddingLeft: 40, height: isMobile ? 42 : 48, fontSize: 13, borderRadius: 12, width: '100%' }}
              placeholder="Search missions..."
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            />
          </div>
          <MagneticButton 
            className="auth-button haptic-tap" 
            onClick={() => setModal('create')} 
            style={{ width: isMobile ? 42 : 140, height: isMobile ? 42 : 48, padding: 0, borderRadius: 12, flexShrink: 0 }}
          >
            <div className="btn-glint" />
            <Plus size={20} /> {!isMobile && <span style={{ marginLeft: 8, fontWeight: 800 }}>OBJECTIVE</span>}
          </MagneticButton>
        </div>

        <div style={{ 
          display: 'flex', 
          gap: 6, 
          overflowX: 'auto', 
          paddingBottom: 2,
          msOverflowStyle: 'none',
          scrollbarWidth: 'none'
        }} className="no-scrollbar">
          <select className="select premium-select" style={{ height: 34, borderRadius: 8, minWidth: isMobile ? 100 : 130, flexShrink: 0, fontSize: 11, padding: '0 8px' }} value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
            <option value="">{isMobile ? 'All Status' : 'Status: All'}</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}</option>)}
          </select>
          <select className="select premium-select" style={{ height: 34, borderRadius: 8, minWidth: isMobile ? 100 : 130, flexShrink: 0, fontSize: 11, padding: '0 8px' }} value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}>
            <option value="">{isMobile ? 'All Levels' : 'Priority: All'}</option>
            {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </select>
          <select className="select premium-select" style={{ height: 34, borderRadius: 8, minWidth: isMobile ? 100 : 130, flexShrink: 0, fontSize: 11, padding: '0 8px' }} value={filters.sortBy} onChange={e => setFilters(f => ({ ...f, sortBy: e.target.value }))}>
            <option value="createdAt">{isMobile ? 'Recent' : 'Sort: Recent'}</option>
            <option value="dueDate">{isMobile ? 'Temporal' : 'Sort: Temporal'}</option>
            <option value="priority">{isMobile ? 'Severity' : 'Sort: Severity'}</option>
            <option value="title">{isMobile ? 'Lexical' : 'Sort: Lexical'}</option>
          </select>
        </div>
      </div>

      {isLoading ? <TasksSkeleton /> : (
        <div className="tasks-list">
          {tasks.map((task, index) => (
            <TaskItem 
              key={task._id}
              task={task}
              isMobile={isMobile}
              selected={selected.includes(task._id)}
              toggleSelect={toggleSelect}
              toggleComplete={toggleComplete}
              setModal={setModal}
              setConfirmState={setConfirmState}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {selected.length > 0 && (
          <motion.div
            initial={{ y: 100, x: '-50%', opacity: 0 }}
            animate={{ y: 0, x: '-50%', opacity: 1 }}
            exit={{ y: 100, x: '-50%', opacity: 0 }}
            className="floating-bulk-actions"
            style={{
              position: 'fixed', bottom: isMobile ? 90 : 40, left: '50%',
              zIndex: 900, background: 'rgba(13, 13, 22, 0.9)', padding: '10px 20px',
              borderRadius: 24, backdropFilter: 'blur(30px) saturate(180%)',
              border: '1.5px solid var(--accent)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
              display: 'flex', alignItems: 'center', gap: 20
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ background: 'var(--accent)', color: 'white', fontWeight: 900, borderRadius: 8, px: 8, height: 26, minWidth: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                {selected.length}
              </div>
              <span style={{ fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap', opacity: 0.8, letterSpacing: 1, textTransform: 'uppercase' }}>Targets Selected</span>
            </div>
            
            <div style={{ height: 20, width: 1, background: 'rgba(255,255,255,0.1)' }} />
            
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-sm btn-primary haptic-tap" onClick={handleBulkComplete} style={{ height: 38, borderRadius: 10, padding: '0 16px' }}>
                <CheckCircle2 size={16} /> <span className="hide-mobile" style={{ marginLeft: 6 }}>Secure</span>
              </button>
              <button className="btn btn-icon btn-sm glass haptic-tap text-red" onClick={handleBulkDelete} style={{ width: 38, height: 38, borderRadius: 10 }}>
                <Trash2 size={16} />
              </button>
              <button className="btn btn-icon btn-sm glass haptic-tap" onClick={() => setSelected([])} style={{ width: 38, height: 38, borderRadius: 10 }}>
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modal && <TaskModal task={modal === 'create' ? null : modal} onClose={() => setModal(null)} onSave={handleSave} />}
      </AnimatePresence>

      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title || "Remove Objective?"}
        message={confirmState.message || "Are you sure you want to proceed? This action cannot be undone."}
        confirmText="Remove"
        onConfirm={confirmState.onConfirm || (() => handleDelete(confirmState.task))}
        onCancel={() => setConfirmState({ open: false, task: null, onConfirm: null, title: null, message: null })}
      />
    </div>
  );
}
