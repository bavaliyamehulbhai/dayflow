import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notesAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  FileText,
  Search,
  Plus,
  Grid,
  List,
  Pin,
  Trash2,
  X,
  Save,
  Tag,
  Sparkles,
  Maximize2,
  ChevronRight,
  MoreVertical,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import SensitivityShield from '../components/layout/SensitivityShield';

const NOTE_COLORS = [
  { value: '#7c6dfa', label: 'Indigo' },
  { value: '#ff4d7d', label: 'Rose' },
  { value: '#00f2fe', label: 'Cyan' },
  { value: '#4facfe', label: 'Royal' },
  { value: '#f97316', label: 'Amber' },
  { value: '#22c55e', label: 'Emerald' }
];

function NoteEditor({ note, onClose, onSave, isMobile }) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [color, setColor] = useState(note?.color || '#7c6dfa');
  const [tags, setTags] = useState(note?.tags?.join(', ') || '');
  const saveTimer = useRef(null);

  const autoSave = () => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      onSave({ title, content, color, tags: tags.split(',').map(t => t.trim()).filter(Boolean) }, true);
    }, 2000);
  };

  useEffect(() => {
    if (title !== note?.title || content !== note?.content) {
      autoSave();
    }
    return () => clearTimeout(saveTimer.current);
  }, [title, content, color, tags]);

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.98, y: 10 }}
        animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
        exit={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.98, y: 10 }}
        transition={{ type: 'spring', damping: 30, stiffness: 400 }}
        className={`modal premium-card ${isMobile ? 'bottom-sheet' : ''}`}
        style={{
          maxWidth: 900,
          background: `rgba(13, 13, 22, 0.65)`,
          backdropFilter: 'blur(50px) saturate(200%)',
          WebkitBackdropFilter: 'blur(50px) saturate(200%)',
          border: `1px solid ${color}44`,
          width: '100%',
          margin: isMobile ? 0 : 'var(--space-2) auto',
          display: 'flex',
          flexDirection: 'column',
          height: isMobile ? 'calc(100% - 40px)' : 'calc(100vh - 80px)',
          borderRadius: isMobile ? '32px 32px 0 0' : 'var(--radius-xl)',
          boxShadow: `0 40px 100px rgba(0,0,0,0.6), 0 0 40px ${color}11`,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Accent Glow */}
        <div style={{ position: 'absolute', top: '-20%', right: '-20%', width: '50%', height: '50%', background: color, filter: 'blur(100px)', opacity: 0.15, pointerEvents: 'none' }} />
        <div className="modal-header" style={{ border: 'none', padding: isMobile ? '12px 16px' : '32px 40px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
            <div style={{ color: 'var(--accent)', background: 'rgba(255,255,255,0.05)', padding: 10, borderRadius: 12 }}><FileText size={window.innerWidth <= 768 ? 16 : 20} /></div>
            <input
              style={{ 
                flex: 1, background: 'none', border: 'none', 
                fontFamily: 'Syne, sans-serif', 
                fontSize: 'clamp(20px, 4vw, 32px)', 
                fontWeight: 800, color: 'var(--text)', 
                outline: 'none', letterSpacing: '-0.02em' 
              }}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Title of this Essence..."
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <motion.button
              whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.1)' }}
              whileTap={{ scale: 0.9 }}
              style={{ background: 'none', border: 'none', color: note.isPinned ? 'var(--accent)' : 'var(--muted)', cursor: 'pointer', padding: 8, borderRadius: '50%' }}
              onClick={() => pinMutation.mutate(note._id)}
            >
              <Pin size={20} style={{ fill: note.isPinned ? 'var(--accent)' : 'none' }} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1, color: 'var(--red)' }}
              whileTap={{ scale: 0.9 }}
              style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 8, borderRadius: '50%' }}
              onClick={() => {
                setConfirmDialog({
                  open: true,
                  title: 'Vanish Note',
                  message: 'Are you sure you want to permanently delete this manifestation?',
                  onConfirm: () => { deleteMutation.mutate(note._id); setConfirmDialog({ open: false }); }
                });
              }}
            >
              <Trash2 size={20} />
            </motion.button>
            <button className="modal-close" onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '50%', width: isMobile ? 32 : 40, height: isMobile ? 32 : 40, border: 'none', color: 'var(--text)', cursor: 'pointer' }}><X size={isMobile ? 18 : 20} /></button>
          </div>
        </div>
        
        <div className="modal-body" style={{ 
          paddingTop: 0, flex: 1, overflowY: 'auto', 
          padding: isMobile ? '0 20px calc(24px + env(safe-area-inset-bottom))' : '0 40px 40px' 
        }}>
          <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12, opacity: 0.6 }}>
            <Tag size={14} />
            <input
              style={{ fontSize: 13, background: 'none', border: 'none', color: 'var(--text)', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', flex: 1, fontWeight: 600 }}
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="Add labels manually..."
            />
          </div>

          <textarea
            style={{
              width: '100%', background: 'none', border: 'none', outline: 'none',
              color: 'var(--text2)', 
              fontSize: 'clamp(16px, 2.5vw, 18px)',
              fontFamily: 'Inter, sans-serif',
              resize: 'none', lineHeight: 1.8, minHeight: '50vh',
              fontWeight: 400
            }}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Let the stream of consciousness flow here..."
            autoFocus
          />

          <div style={{ display: 'flex', gap: 12, marginTop: 40, alignItems: 'center' }}>
            {NOTE_COLORS.map(c => (
              <motion.button
                key={c.value}
                whileHover={{ scale: 1.2, y: -2 }}
                onClick={() => setColor(c.value)}
                style={{
                  width: 24, height: 24, borderRadius: '50%', background: c.value,
                  border: `2px solid ${color === c.value ? 'white' : 'rgba(255,255,255,0.1)'}`,
                  cursor: 'pointer', boxShadow: color === c.value ? `0 0 15px ${c.value}` : 'none'
                }}
              />
            ))}
            <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)', fontWeight: 800, letterSpacing: 1 }}>
              {wordCount} WORDS
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ border: 'none', gap: 16, padding: isMobile ? '20px' : '24px 40px', background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: 'var(--green)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            <div className="pulse-dot" style={{ background: 'var(--green)', width: 8, height: 8 }} /> Cloud Synchronized
          </div>
          <button className="btn btn-ghost" onClick={onClose} style={{ fontWeight: 800 }}>Dismiss</button>
          <button className="btn btn-primary" onClick={() => onSave({ title, content, color, tags: tags.split(',').map(t => t.trim()).filter(Boolean) }, false)} style={{ gap: 10, padding: '0 24px', borderRadius: 14 }}>
            <Save size={18} /> Preserve Note
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function NotesPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('grid');
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false });
  const width = window.innerWidth;
  const isDesktopSplit = width > 1024;
  const isMobile = width <= 768;

  const { data, isLoading } = useQuery({
    queryKey: ['notes'],
    queryFn: () => notesAPI.getAll({ limit: 1000 }).then(r => r.data.notes)
  });

  const invalidate = () => qc.invalidateQueries(['notes']);

  const createMutation = useMutation({
    mutationFn: notesAPI.create,
    onSuccess: (r) => { setModal(r.data.note); invalidate(); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => notesAPI.update(id, data),
    onSuccess: (r, { silent }) => {
      if (!silent) { toast.success('Wisdom preserved'); setModal(null); }
      invalidate();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: notesAPI.delete,
    onSuccess: () => { toast.success('Note vanished'); setModal(null); invalidate(); }
  });

  const pinMutation = useMutation({
    mutationFn: notesAPI.pin,
    onSuccess: () => invalidate()
  });

  const allNotes = data || [];
  const searchLower = search.toLowerCase();
  const notes = allNotes.filter(n => 
    (n.title?.toLowerCase().includes(searchLower)) || 
    (n.content?.toLowerCase().includes(searchLower)) ||
    (n.tags?.some(t => t.toLowerCase().includes(searchLower)))
  );
  const pinned = notes.filter(n => n.isPinned);
  const unpinned = notes.filter(n => !n.isPinned);
  const selectedNote = notes.find(n => n._id === selectedNoteId);

  useEffect(() => {
    // Auto-select first note on desktop if none selected
    if (isDesktopSplit && !selectedNoteId && notes.length > 0) {
      setSelectedNoteId(notes[0]._id);
    }
  }, [isDesktopSplit, notes, selectedNoteId]);

  const handleNewNote = () => {
    createMutation.mutate({ title: '', content: '' });
  };

  const handleSave = (formData, silent = false) => {
    const id = modal?._id || selectedNoteId;
    if (id) {
      updateMutation.mutate({ id, data: formData, silent });
    }
  };

  const NoteCard = ({ note, index }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="premium-card hover-lift aura-iridescent note-card"
      style={{
        background: 'var(--surface)',
        backdropFilter: 'var(--glass-premium)',
        WebkitBackdropFilter: 'var(--glass-premium)',
        border: `1px solid ${note.color ? note.color + '44' : 'var(--border)'}`,
        padding: isMobile ? '20px' : '32px',
        cursor: 'pointer',
        position: 'relative',
        minHeight: view === 'grid' ? 240 : 'auto',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 'var(--radius)',
        boxShadow: note.color ? `0 20px 40px ${note.color}11` : 'var(--shadow-lg)',
        overflow: 'hidden'
      }}
      onClick={() => setModal(note)}
    >
      <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 6, zIndex: 20 }} className="note-actions">
        <motion.button
          whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.15)' }}
          whileTap={{ scale: 0.9 }}
          className="btn-icon"
          style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          onClick={e => { e.stopPropagation(); pinMutation.mutate(note._id); }}
        >
          <Pin size={18} style={{ fill: note.isPinned ? 'var(--accent)' : 'none', color: note.isPinned ? 'var(--accent)' : 'inherit' }} />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1, color: 'var(--red)', background: 'rgba(248, 113, 113, 0.2)' }}
          whileTap={{ scale: 0.9 }}
          className="btn-icon"
          style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          onClick={e => {
            e.stopPropagation();
            setConfirmDialog({
              open: true,
              title: 'Vanish Note',
              message: 'Are you sure you want to permanently delete this manifestation?',
              onConfirm: () => { deleteMutation.mutate(note._id); setConfirmDialog({ open: false }); }
            });
          }}
        >
          <Trash2 size={18} />
        </motion.button>
      </div>

      <SensitivityShield>
        <h3 style={{ fontWeight: 800, fontSize: isMobile ? 15 : 18, marginBottom: 6, color: 'var(--text)', fontFamily: 'Syne, sans-serif', paddingRight: 80 }}>{note.title || 'Untitled Fragment'}</h3>
      </SensitivityShield>
      <SensitivityShield>
          <p style={{ fontSize: isMobile ? 13 : 14, color: 'var(--text2)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: view === 'grid' ? 4 : 2, WebkitBoxOrient: 'vertical' }}>
            {note.content}
          </p>
      </SensitivityShield>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: isMobile ? 16 : 24, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {note.tags?.slice(0, 2).map(t => (
            <span key={t} style={{ fontSize: 10, background: 'rgba(255,255,255,0.1)', color: 'var(--accent)', padding: '3px 10px', borderRadius: 8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t}</span>
          ))}
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>{format(new Date(note.updatedAt), 'MMM d')}</div>
      </div>
    </motion.div>
  );

  const DesktopSplitView = () => (
    <div className="notes-split-container">
      {/* Scrollable Sidebar List */}
      <div className="notes-split-sidebar">
        <div className="notes-sidebar-header" style={{ padding: '24px 20px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em' }}>Repository</h2>
            <button className="btn btn-primary magnetic-btn" onClick={handleNewNote} style={{ borderRadius: 10, height: 32, padding: '0 10px', fontSize: 11 }}>
              <Plus size={14} /> Capture
            </button>
          </div>
          <div className="search-wrap-minimal">
            <Search size={14} className="text-muted" />
            <input 
              placeholder="Filter essences..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="notes-sidebar-list">
          {[...pinned, ...unpinned].map((n, i) => (
            <div
              key={n._id}
              className={`notes-sidebar-item ${selectedNoteId === n._id ? 'active' : ''}`}
              onClick={() => setSelectedNoteId(n._id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="item-title">{n.title || 'Untitled'}</div>
                <div className="sidebar-item-actions" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                   {n.isPinned && <Pin size={14} style={{ fill: 'var(--accent)', color: 'var(--accent)' }} />}
                   <motion.button
                     whileHover={{ scale: 1.2, color: 'var(--red)' }}
                     style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', padding: 4 }}
                     onClick={(e) => {
                       e.stopPropagation();
                       setConfirmDialog({
                         open: true,
                         title: 'Vanish Note',
                         message: 'Permanently delete this manifestation?',
                         onConfirm: () => { deleteMutation.mutate(n._id); setConfirmDialog({ open: false }); }
                       });
                     }}
                   >
                     <Trash2 size={14} />
                   </motion.button>
                </div>
              </div>
              <div className="item-preview">{n.content.slice(0, 60)}</div>
              <div className="item-meta">
                <span>{format(new Date(n.updatedAt), 'MMM d')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Editor Surface */}
      <div className="notes-split-main">
        {selectedNote ? (
          <div className="split-editor-wrap">
            <div className="split-editor-toolbar" style={{ display: 'flex', justifyContent: 'flex-start', gap: 16, marginBottom: 12, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <motion.button
                whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.1)' }}
                whileTap={{ scale: 0.9 }}
                className="toolbar-btn"
                style={{ background: 'none', border: 'none', color: selectedNote.isPinned ? 'var(--accent)' : 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700 }}
                onClick={() => pinMutation.mutate(selectedNote._id)}
              >
                <Pin size={18} style={{ fill: selectedNote.isPinned ? 'var(--accent)' : 'none' }} />
                <span>{selectedNote.isPinned ? 'Pinned' : 'Pin Note'}</span>
              </motion.button>
              <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)' }} />
              <motion.button
                whileHover={{ scale: 1.1, color: 'var(--red)' }}
                whileTap={{ scale: 0.9 }}
                className="toolbar-btn"
                style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700 }}
                onClick={() => {
                  setConfirmDialog({
                    open: true,
                    title: 'Vanish Note',
                    message: 'Are you sure you want to permanently delete this manifestation?',
                    onConfirm: () => { deleteMutation.mutate(selectedNote._id); setConfirmDialog({ open: false }); }
                  });
                }}
              >
                <Trash2 size={18} />
                <span>Delete</span>
              </motion.button>
            </div>
            <div className="split-editor-header" style={{ marginBottom: 24 }}>
              <input
                className="split-title-input"
                style={{ width: '100%', fontSize: '48px' }}
                value={selectedNote.title}
                onChange={e => handleSave({ ...selectedNote, title: e.target.value }, true)}
                placeholder="Title"
              />
            </div>
            <textarea
              className="split-content-textarea"
              value={selectedNote.content}
              onChange={e => handleSave({ ...selectedNote, content: e.target.value }, true)}
              placeholder="Start writing..."
            />
          </div>
        ) : (
          <div className="notes-empty-state">
            <Sparkles size={48} className="text-muted" style={{ opacity: 0.2 }} />
            <p>Select a manifestation to refine</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={isDesktopSplit ? "notes-page-root-split" : "responsive-container"}>
      {!isDesktopSplit && (
        <>
          <div className="page-header mb-12">
            <div>
              <div className="page-title flex items-center gap-4" style={{ 
                fontFamily: 'Syne, sans-serif', 
                fontSize: 'clamp(2rem, 8vw, 4rem)', 
                fontWeight: 800,
                letterSpacing: '-0.05em',
                lineHeight: 1
              }}>
                <Sparkles size={isMobile ? 32 : 56} className="text-accent" style={{ filter: 'drop-shadow(0 0 15px var(--accent-glow))' }} />
                Thought Sanctum
              </div>
              <p className="page-subtitle" style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--muted)', marginTop: 12, letterSpacing: '0.02em' }}>
                Preserve your intellectual manifestations
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12, width: isMobile ? '100%' : 'auto' }}>
              <button className="btn glass-card haptic-tap" onClick={() => setView(v => v === 'grid' ? 'list' : 'grid')} style={{ fontWeight: 800, flex: isMobile ? 1 : 'none', border: '1px solid var(--border)', borderRadius: 14 }}>
                {view === 'grid' ? <List size={18} /> : <Grid size={18} />}
                <span style={{ marginLeft: 10 }} className="hide-mobile">{view === 'grid' ? 'Chronicle' : 'Matrix'}</span>
              </button>
              <button className="btn btn-primary hide-mobile magnetic-btn" onClick={handleNewNote} disabled={createMutation.isPending} style={{ borderRadius: 14, padding: '0 24px' }}>
                {createMutation.isPending ? <div className="loading-spinner" style={{ width: 18, height: 18 }} /> : <Plus size={18} />}
                <span style={{ marginLeft: 8 }}>{createMutation.isPending ? 'Manifesting...' : 'Manifest'}</span>
              </button>
            </div>
          </div>

          {/* Floating Action Button for Mobile */}
          <div className="fab-container">
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="btn-fab"
              onClick={handleNewNote}
              disabled={createMutation.isPending}
            >
              <Plus size={28} />
            </motion.button>
          </div>

          <div className="premium-card" style={{ marginBottom: 48, padding: '8px 24px', display: 'flex', alignItems: 'center', gap: 16, background: 'var(--surface2)', border: '1px solid var(--border-premium)' }}>
            <Search size={22} className="text-muted" style={{ opacity: 0.6 }} />
            <input
              className="input"
              placeholder="Summon your thoughts..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ background: 'none', border: 'none', fontSize: '18px', fontWeight: 600, fontFamily: 'Syne', height: 60, flex: 1 }}
            />
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 900, color: 'var(--muted)', border: '1px solid var(--border)' }}>SEARCH</div>
          </div>

          {isLoading ? (
            <div className="loading-page"><div className="loading-spinner" /></div>
          ) : notes.length === 0 ? (
            <div className="card glass-card" style={{ padding: '80px 40px', textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 20 }}>🌌</div>
              <div className="empty-title">The Void is Perfect</div>
              <div className="empty-desc" style={{ maxWidth: 400, margin: '12px auto' }}>Capture your first manifestation before it escapes into the eternal recurrence.</div>
              {!search && <button className="btn btn-primary" style={{ marginTop: 24 }} onClick={handleNewNote}>Manifest Now</button>}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
              <AnimatePresence>
                {pinned.length > 0 && (
                  <motion.div layout>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                      <Pin size={16} className="text-accent" />
                      <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2 }}>Essential Wisdom</div>
                    </div>
                    <div style={{
                      display: view === 'grid' ? 'grid' : 'flex',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                      flexDirection: 'column',
                      gap: 20
                    }}>
                      {pinned.map((n, i) => <NoteCard key={n._id} note={n} index={i} />)}
                    </div>
                  </motion.div>
                )}

                {unpinned.length > 0 && (
                  <motion.div layout>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                      <FileText size={16} className="text-muted" />
                      <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2 }}>All Manifestations</div>
                    </div>
                    <div style={{
                      display: view === 'grid' ? 'grid' : 'flex',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                      flexDirection: 'column',
                      gap: 20
                    }}>
                      {unpinned.map((n, i) => <NoteCard key={n._id} note={n} index={i + pinned.length} />)}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </>
      )}

      {isDesktopSplit && <DesktopSplitView />}

      <AnimatePresence>
        {modal && (
          <NoteEditor
            note={modal}
            onClose={() => { setModal(null); invalidate(); }}
            onSave={handleSave}
            isMobile={isMobile}
          />
        )}
      </AnimatePresence>

      <ConfirmDialog {...confirmDialog} onCancel={() => setConfirmDialog({ open: false })} />

      <style>{`
        .glass-card { background: var(--glass-bg); backdrop-filter: blur(12px); }
        .note-card .card-action-btn { background: rgba(0,0,0,0.2); backdrop-filter: blur(4px); }
        .note-actions { opacity: 1; transform: translateY(0); transition: all 0.2s; }
        .note-card:hover { border-color: var(--accent) !important; background: rgba(255,255,255,0.02) !important; }
        .note-card:hover .note-actions { opacity: 1; transform: scale(1.02); }
        
        .notes-page-root-split {
          height: calc(100vh - 40px);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .notes-split-container {
          display: grid;
          grid-template-columns: 360px 1fr;
          height: 100%;
          border: 1px solid var(--border-premium);
          border-radius: var(--radius);
          background: var(--surface);
          backdrop-filter: var(--glass-premium);
          overflow: hidden;
          box-shadow: var(--shadow-lg);
        }

        .notes-split-sidebar {
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          background: rgba(255,255,255,0.02);
        }

        .notes-sidebar-header {
          padding: 16px;
          display: flex;
          gap: 12px;
          border-bottom: 1px solid var(--border);
        }

        .search-wrap-minimal {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--surface2);
          padding: 0 12px;
          border-radius: 10px;
          border: 1px solid var(--border);
        }

        .search-wrap-minimal input {
          background: none;
          border: none;
          color: var(--text);
          font-size: 13px;
          width: 100%;
          outline: none;
        }

        .notes-sidebar-list {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
        }

        .notes-sidebar-item {
          padding: 18px 20px;
          border-radius: 16px;
          cursor: pointer;
          transition: var(--transition);
          margin-bottom: 8px;
          border: 1px solid transparent;
          background: rgba(255,255,255,0.01);
        }

        .notes-sidebar-item:hover {
          background: var(--surface2);
          transform: translateX(4px);
        }

        .notes-sidebar-item.active {
          background: var(--accent-glow);
          border-color: var(--accent);
          box-shadow: 0 10px 30px rgba(124, 109, 250, 0.1);
        }

        .item-title {
          font-weight: 800;
          font-size: 15px;
          color: var(--text);
          margin-bottom: 6px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-family: 'Syne', sans-serif;
          letter-spacing: -0.02em;
        }

        .item-preview {
          font-size: 12px;
          color: var(--text2);
          line-height: 1.6;
          height: 38px;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          opacity: 0.7;
        }

        .item-meta {
          margin-top: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 10px;
          color: var(--muted);
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .notes-split-main {
          background: rgba(0,0,0,0.1);
          display: flex;
          flex-direction: column;
        }

        .split-editor-wrap {
          height: 100%;
          display: flex;
          flex-direction: column;
          padding: 40px 60px;
        }

        .split-editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }

        .split-title-input {
          background: none;
          border: none;
          font-size: 40px;
          font-weight: 800;
          font-family: 'Syne', sans-serif;
          color: var(--text);
          outline: none;
          flex: 1;
          letter-spacing: -0.04em;
        }

        .split-header-actions {
          display: flex;
          gap: 12px;
        }

        .split-content-textarea {
          flex: 1;
          background: none;
          border: none;
          font-size: 18px;
          color: var(--text2);
          font-family: 'Inter', sans-serif;
          line-height: 2;
          resize: none;
          outline: none;
          font-weight: 400;
        }

        .notes-empty-state {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 24px;
          color: var(--muted);
          font-weight: 600;
          opacity: 0.8;
        }

        @media (max-width: 768px) {
          .note-actions { opacity: 1 !important; transform: translateY(0) !important; }
          .modal.bottom-sheet {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            width: 100%;
            max-width: none;
            border-radius: 32px 32px 0 0;
            max-height: 92vh;
            margin: 0 !important;
          }
        }
      `}</style>
    </div >
  );
}
