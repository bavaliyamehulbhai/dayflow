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

// ─── Magnetic Effect Component ──────────────────────────────────────────────
const MagneticButton = ({ children, className, onClick, style, whileHover }) => {
  const ref = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const x = clientX - (left + width / 2);
    const y = clientY - (top + height / 2);
    setPosition({ x, y });
  };

  const handleMouseLeave = () => setPosition({ x: 0, y: 0 });

  return (
    <motion.button
      ref={ref}
      className={className}
      onClick={onClick}
      style={{ ...style, position: 'relative' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x * 0.2, y: position.y * 0.2 }}
      whileHover={whileHover}
      transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }}
    >
      {children}
    </motion.button>
  );
};

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
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`task-row-container aura-iridescent gpu-accel ${selected ? 'selected' : ''}`}
      style={{ borderRadius: 20, opacity: task.status === 'cancelled' ? 0.4 : 1, marginBottom: 12 }}
    >
      <div className="task-row-swipe-wrapper" style={{ position: 'relative', overflow: 'hidden', borderRadius: 20 }}>
        <motion.div
          className="task-row-main"
          style={{ 
            position: 'relative', 
            zIndex: 2, 
            background: 'var(--surface)', 
            borderRadius: 20, 
            border: '1px solid var(--border)',
            padding: isMobile ? '12px 16px' : '16px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? 12 : 20
          }}
        >
          <div className="task-row-check" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input type="checkbox" checked={selected} onChange={() => toggleSelect(task._id)} />
            <button
              onClick={() => toggleComplete(task)}
              className="status-checkbox haptic-tap"
              style={{
                width: 24, height: 24, borderRadius: 8, border: '2px solid var(--border)',
                background: task.status === 'completed' ? 'var(--green)' : 'transparent',
                borderColor: task.status === 'completed' ? 'var(--green)' : 'var(--muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}
            >
              <AnimatePresence>
                {task.status === 'completed' && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <Check size={14} color="white" strokeWidth={3} />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>

          <div className="task-row-content" onClick={() => setModal(task)} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
            <div style={{ 
              fontSize: isMobile ? 15 : 17, fontWeight: 700,
              textDecoration: task.status === 'completed' ? 'line-through' : 'none',
              color: task.status === 'completed' ? 'var(--muted)' : 'var(--text)',
              marginBottom: 4
            }}>
              <SensitivityShield>
                {task.title}
              </SensitivityShield>
            </div>
            <div className="task-row-meta" style={{ display: 'flex', gap: 12, fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {task.category && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Tag size={12} /> {task.category}</span>
              )}
              {task.dueDate && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: isOverdue ? 'var(--red)' : 'inherit' }}>
                  <Calendar size={12} /> {format(new Date(task.dueDate), 'MMM d')}
                </span>
              )}
            </div>
          </div>

          <div className="task-row-actions" style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-icon btn-ghost btn-sm" onClick={() => setModal(task)}><Pencil size={18} /></button>
            <button className="btn btn-icon btn-ghost btn-sm text-red" onClick={() => setConfirmState({ open: true, task })}><Trash2 size={18} /></button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}, (prev, next) => {
  return prev.task._id === next.task._id && 
         prev.task.status === next.task.status && 
         prev.task.title === next.task.title &&
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
        initial={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.9, y: 20 }}
        animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
        exit={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.9, y: 20 }}
        className={`modal ${isMobile ? 'bottom-sheet' : ''}`}
      >
        <div className="modal-header">
          <div className="modal-title">{task ? 'Edit Mission' : 'New Objective'}</div>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Title</label>
              <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Objective name" autoFocus />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label>Priority</label>
                <select className="select" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select className="select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Proceed</button>
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

  return (
    <div className="responsive-container">
      <div className="page-header mb-6">
        <div>
          <div className="page-title flex items-center gap-3" style={{ fontFamily: 'Syne, sans-serif', fontSize: 'var(--fs-2xl)', fontWeight: 800 }}>
            <ClipboardList size={isMobile ? 24 : 32} className="text-accent" />
            Mission Control
          </div>
          <p className="page-subtitle">Track, manage and conquer your objectives</p>
        </div>
        <button className="btn btn-primary hide-mobile" onClick={() => setModal('create')}>
          <Plus size={18} /> New Objective
        </button>
      </div>

      {statsData && (
        <div className="stats-grid mb-6">
          <div className="stat-card">
            <SensitivityShield><div className="stat-value">{statsData.total}</div></SensitivityShield>
            <div className="stat-label">Total</div>
          </div>
          <div className="stat-card">
            <SensitivityShield><div className="stat-value">{statsData.completed}</div></SensitivityShield>
            <div className="stat-label">Done</div>
          </div>
        </div>
      )}

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
        {modal && <TaskModal task={modal === 'create' ? null : modal} onClose={() => setModal(null)} onSave={handleSave} />}
      </AnimatePresence>

      <ConfirmDialog
        open={confirmState.open}
        title="Remove Objective?"
        confirmText="Remove"
        onConfirm={() => handleDelete(confirmState.task)}
        onCancel={() => setConfirmState({ open: false, task: null })}
      />
    </div>
  );
}
