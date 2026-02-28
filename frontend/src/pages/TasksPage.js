import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  Plus, Search, Pencil, Trash2, AlertCircle, Check, CheckCircle2,
  X, ChevronRight, ClipboardList, Clock, Tag, Calendar, Layers, Zap, Trophy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmDialog from '../components/ConfirmDialog';

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

// ─── Skeleton loader rows ─────────────────────────────────────────────────────
function TasksSkeleton() {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 16, padding: '16px 24px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
        <div className="skeleton skeleton-text" style={{ width: 16, height: 16 }} />
        <div className="skeleton skeleton-text" style={{ flex: 1, height: 14 }} />
        <div className="skeleton skeleton-text" style={{ width: 80, height: 14 }} />
        <div className="skeleton skeleton-text" style={{ width: 90, height: 14 }} />
        <div className="skeleton skeleton-text" style={{ width: 80, height: 14 }} />
      </div>
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 24px', borderBottom: '1px solid var(--border)' }}>
          <div className="skeleton" style={{ width: 16, height: 16, borderRadius: 4 }} />
          <div className="skeleton" style={{ width: 24, height: 24, borderRadius: 7 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="skeleton skeleton-text" style={{ height: 14, width: `${60 + Math.random() * 30}%` }} />
            <div className="skeleton skeleton-text" style={{ height: 10, width: '30%' }} />
          </div>
          <div className="skeleton" style={{ width: 72, height: 24, borderRadius: 20 }} />
          <div className="skeleton" style={{ width: 82, height: 24, borderRadius: 20 }} />
          <div className="skeleton skeleton-text" style={{ width: 64, height: 14 }} />
          <div style={{ display: 'flex', gap: 4 }}>
            <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 8 }} />
            <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 8 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Task modal ───────────────────────────────────────────────────────────────
function TaskModal({ task, onClose, onSave }) {
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
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="modal"
      >
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="text-accent"><Plus size={20} /></div>
            {task ? 'Edit Task' : 'New Task'}
          </div>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Title</label>
              <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="What needs to be done?" autoFocus required />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="textarea" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Add more details..." rows={3} />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="select" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {STATUSES.map(s => <option key={s} value={s}>{s.replace('-', ' ')}</option>)}
                </select>
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input type="date" className="input" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Est. Time (min)</label>
                <input type="number" className="input" value={form.estimatedMinutes} onChange={e => setForm(f => ({ ...f, estimatedMinutes: e.target.value }))} placeholder="e.g. 30" min={1} />
              </div>
              <div className="form-group">
                <label className="form-label">Tags</label>
                <input className="input" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="design, review, api" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Subtasks</label>
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <input className="input" value={newSubtask} onChange={e => setNewSubtask(e.target.value)} placeholder="Add subtask..." onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSubtask())} />
                <button type="button" className="btn btn-primary" onClick={addSubtask} style={{ padding: '0 16px' }}><Plus size={18} /></button>
              </div>
              <div style={{ maxHeight: 150, overflowY: 'auto', paddingRight: 4 }}>
                {form.subtasks.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--surface2)', borderRadius: 10, marginBottom: 8, border: '1px solid var(--border)' }}>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{s.title}</span>
                    <button type="button" className="btn btn-icon btn-ghost btn-sm" onClick={() => removeSubtask(i)} style={{ color: 'var(--red)', padding: 4 }}><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-footer" style={{ gap: 12, padding: '20px 24px' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ minWidth: 120 }}>
              {task ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function TasksPage() {
  const qc = useQueryClient();
  const width = useWindowWidth();
  const isMobile = width <= 768;
  const [modal, setModal] = useState(null);
  const [filters, setFilters] = useState({ status: '', priority: '', search: '', sortBy: 'createdAt' });
  const [selected, setSelected] = useState([]);
  const [confirmState, setConfirmState] = useState({ open: false, taskId: null, taskTitle: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => tasksAPI.getAll({ ...filters, limit: 100 }).then(r => r.data)
  });

  const { data: statsData } = useQuery({
    queryKey: ['task-stats'],
    queryFn: () => tasksAPI.stats().then(r => r.data.stats)
  });

  const invalidate = () => {
    qc.invalidateQueries(['tasks']);
    qc.invalidateQueries(['task-stats']);
    qc.invalidateQueries(['dashboard']);
  };

  const createMutation = useMutation({
    mutationFn: (d) => tasksAPI.create(d),
    onSuccess: () => { toast.success('Task created! 🎯'); setModal(null); invalidate(); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => tasksAPI.update(id, data),
    onSuccess: () => { toast.success('Task updated!'); setModal(null); invalidate(); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => tasksAPI.delete(id),
    onSuccess: (_, deletedId) => {
      invalidate();
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => tasksAPI.bulkDelete(ids),
    onSuccess: () => { toast.success(`${selected.length} tasks deleted`); setSelected([]); invalidate(); }
  });

  const tasks = data?.tasks || [];

  const handleSave = (formData) => {
    if (modal && modal._id) {
      updateMutation.mutate({ id: modal._id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const toggleComplete = (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    updateMutation.mutate({ id: task._id, data: { status: newStatus } });
  };

  const toggleSelect = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const selectAll = () => setSelected(tasks.length === selected.length ? [] : tasks.map(t => t._id));

  // ─── Undo-delete ─────────────────────────────────────────────────────────────
  const handleDelete = (task) => {
    setConfirmState({ open: false, taskId: null, taskTitle: '' });
    // Optimistically remove from cache for speed
    qc.setQueryData(['tasks', filters], (old) => old
      ? { ...old, tasks: old.tasks.filter(t => t._id !== task._id) }
      : old
    );

    // Show undo toast
    toast((t) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ flex: 1, fontSize: 13 }}>
          <strong style={{ color: 'var(--red)' }}>Deleted</strong> "{task.title.slice(0, 32)}{task.title.length > 32 ? '…' : ''}"
        </span>
        <button
          onClick={() => {
            toast.dismiss(t.id);
            createMutation.mutate({
              title: task.title,
              description: task.description,
              priority: task.priority,
              status: 'pending',
              category: task.category,
              dueDate: task.dueDate,
              estimatedMinutes: task.estimatedMinutes,
              tags: task.tags,
              subtasks: task.subtasks
            });
          }}
          style={{
            background: 'rgba(130,114,255,0.15)',
            border: '1px solid rgba(130,114,255,0.3)',
            color: 'var(--accent)',
            borderRadius: 6,
            padding: '4px 10px',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 700,
            flexShrink: 0
          }}
        >
          Undo
        </button>
      </div>
    ), { duration: 5000, style: { maxWidth: 380 } });

    // Actually delete
    deleteMutation.mutate(task._id);
  };

  const priorityColor = { urgent: 'var(--red)', high: 'var(--orange)', medium: 'var(--yellow)', low: 'var(--green)' };

  return (
    <div className="responsive-container">
      <div className="page-header mb-6">
        <div>
          <div className="page-title flex items-center gap-3">
            <div className="text-accent"><ClipboardList size={isMobile ? 24 : 32} /></div>
            Mission Control
          </div>
          <p className="page-subtitle">Track, manage and conquer your objectives</p>
        </div>
        <button className="btn btn-primary hide-mobile magnetic-btn" onClick={() => setModal('create')}>
          <Plus size={18} /> New Objective
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

      {/* Stats */}
      {statsData && (
        <div className="stats-grid stats-carousel mb-6">
          {[
            { label: 'Total', value: statsData.total, color: 'var(--text2)', icon: Layers },
            { label: 'Pending', value: statsData.pending, color: 'var(--yellow)', icon: Clock },
            { label: 'Active', value: statsData.inProgress, color: 'var(--accent)', icon: Zap },
            { label: 'Done', value: statsData.completed, color: 'var(--green)', icon: Check },
            { label: 'Past Due', value: statsData.overdue, color: 'var(--red)', icon: AlertCircle },
            { label: 'Today', value: statsData.todayCompleted, color: 'var(--accent3)', icon: Trophy },
          ].map((s, i) => (
            <div key={i} className="stat-card">
              <s.icon size={16} style={{ color: s.color, opacity: 0.7 }} />
              <div className="stat-value" style={{ background: `linear-gradient(135deg, ${s.color}, ${s.color}cc)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="card mb-6 p-4">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: isMobile ? '1 1 100%' : '1 1 240px' }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
            <input className="input" style={{ paddingLeft: 40 }} placeholder="Search objectives..." value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} />
          </div>

          <div style={{ display: 'flex', gap: 12, flex: isMobile ? '1 1 100%' : '0 1 auto', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
            <select className="select" style={{ flex: isMobile ? 1 : 'none', minWidth: isMobile ? 'calc(50% - 6px)' : 130 }} value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
              <option value="">All Status</option>
              {STATUSES.map(s => <option key={s} value={s}>{s.replace('-', ' ')}</option>)}
            </select>

            <select className="select" style={{ flex: isMobile ? 1 : 'none', minWidth: isMobile ? 'calc(50% - 6px)' : 130 }} value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}>
              <option value="">Priority</option>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            <select className="select" style={{ flex: isMobile ? 1 : 'none', minWidth: isMobile ? 180 : 180 }} value={filters.sortBy} onChange={e => setFilters(f => ({ ...f, sortBy: e.target.value }))}>
              <option value="createdAt">Created</option>
              <option value="dueDate">Due Date</option>
              <option value="priority">Priority</option>
              <option value="title">A-Z</option>
            </select>
          </div>

          {(filters.search || filters.status || filters.priority) && (
            <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ status: '', priority: '', search: '', sortBy: 'createdAt' })}>
              <X size={14} /> Clear
            </button>
          )}

          {selected.length > 0 && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} style={{ marginLeft: isMobile ? 0 : 'auto', display: 'flex', gap: 12, width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'space-between' : 'flex-end', marginTop: isMobile ? 8 : 0 }}>
              <span style={{ fontSize: 13, color: 'var(--text2)', alignSelf: 'center', fontWeight: 600 }}>{selected.length} selected</span>
              <button className="btn btn-danger btn-sm" onClick={() => bulkDeleteMutation.mutate(selected)}>
                <Trash2 size={14} /> Delete
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Task List */}
      {
        isLoading ? (
          <TasksSkeleton />
        ) : tasks.length === 0 ? (
          <div className="card" style={{ padding: '80px 40px', textAlign: 'center' }}>
            <div className="empty-icon" style={{ fontSize: 48, opacity: 0.6 }}>✨</div>
            <div className="empty-title" style={{ fontSize: 24, fontWeight: 700, marginTop: 16 }}>Clear skies ahead</div>
            <div className="empty-desc" style={{ marginTop: 8, fontSize: 15 }}>You don't have any tasks matching these filters.</div>
            <button className="btn btn-primary" style={{ marginTop: 24 }} onClick={() => setModal('create')}>
              <Plus size={18} /> Add Your First Task
            </button>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)' }}>
            <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700 }}>
              <input type="checkbox" checked={selected.length === tasks.length && tasks.length > 0} onChange={selectAll} style={{ cursor: 'pointer', width: 16, height: 16 }} />
              <span style={{ flex: 1 }}>Mission Description</span>
              <span style={{ minWidth: 100, textAlign: 'center' }}>Priority</span>
              <span style={{ minWidth: 110, textAlign: 'center' }}>Status</span>
              <span style={{ minWidth: 100 }}>Deadline</span>
              <span style={{ minWidth: 100 }}>Actions</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {tasks.map((task, i) => {
                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
                return (
                  <motion.div
                    key={task._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.018 }}
                    className={`task-row-container ${selected.includes(task._id) ? 'selected' : ''}`}
                    style={{ opacity: task.status === 'cancelled' ? 0.4 : 1 }}
                  >
                    <div
                      className="task-row-swipe-wrapper"
                      style={{ position: 'relative', overflow: 'hidden', background: 'var(--surface)' }}
                    >
                      {/* Swipe Backgrounds */}
                      <div className="swipe-bg swipe-bg-complete" style={{ position: 'absolute', inset: 0, background: 'var(--green)', display: 'flex', alignItems: 'center', padding: '0 20px', color: 'white' }}>
                        <Check size={24} />
                      </div>
                      <div className="swipe-bg swipe-bg-delete" style={{ position: 'absolute', inset: 0, background: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 20px', color: 'white' }}>
                        <Trash2 size={24} />
                      </div>

                      <motion.div
                        drag={isMobile ? "x" : false}
                        dragConstraints={{ left: 0, right: 0 }}
                        onDragEnd={(_, info) => {
                          if (info.offset.x > 100) toggleComplete(task);
                          else if (info.offset.x < -100) setConfirmState({ open: true, task });
                        }}
                        className="task-row-main"
                        style={{ position: 'relative', zIndex: 2, background: 'var(--surface)' }}
                      >
                        <div className="task-row-check">
                          <input type="checkbox" checked={selected.includes(task._id)} onChange={() => toggleSelect(task._id)} />
                          <button
                            onClick={() => toggleComplete(task)}
                            className="status-checkbox haptic-tap"
                            style={{
                              background: task.status === 'completed' ? 'var(--green)' : 'transparent',
                              borderColor: task.status === 'completed' ? 'var(--green)' : 'var(--border2)'
                            }}
                          >
                            {task.status === 'completed' && <Check size={16} strokeWidth={3} />}
                          </button>
                        </div>

                        <div className="task-row-content" onClick={() => setModal(task)}>
                          <div className={`task-row-title ${task.status === 'completed' ? 'completed' : ''}`}>
                            {task.title}
                          </div>
                          <div className="task-row-meta">
                            {task.category && (
                              <span><Tag size={12} /> {task.category}</span>
                            )}
                            {task.subtasks?.length > 0 && (
                              <span><CheckCircle2 size={12} /> {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}</span>
                            )}
                            {task.dueDate && (
                              <span className={isOverdue ? 'overdue' : ''}>
                                <Calendar size={12} /> {format(new Date(task.dueDate), 'MMM d')}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="task-row-badges hide-mobile">
                          <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                          <span className={`badge badge-${task.status}`}>{task.status.replace('-', ' ')}</span>
                        </div>

                        <div className="task-row-actions">
                          <button className="btn btn-icon btn-ghost btn-sm" onClick={() => setModal(task)}><Pencil size={16} /></button>
                          <button className="btn btn-icon btn-ghost btn-sm text-red" onClick={() => setConfirmState({ open: true, task })}><Trash2 size={16} /></button>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )
      }

      {/* Modals */}
      <AnimatePresence>
        {modal && (
          <TaskModal task={modal === 'create' ? null : modal} onClose={() => setModal(null)} onSave={handleSave} />
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={confirmState.open}
        title="Delete Task?"
        message={`"${confirmState.task?.title || ''}" will be removed. You can undo this action immediately after.`}
        confirmText="Delete"
        onConfirm={() => handleDelete(confirmState.task)}
        onCancel={() => setConfirmState({ open: false, task: null })}
      />

      <style>{`
        .task-row:hover { background: var(--surface2) !important; }
        .hover-lift:hover { transform: translateY(-1px); }
        .text-accent { color: var(--accent); }
        .status-checkbox:hover { border-color: var(--accent) !important; transform: scale(1.1); }
      `}</style>
    </div >
  );
}
