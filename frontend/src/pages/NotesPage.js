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
  const [isSyncing, setIsSyncing] = useState(false);
  const saveTimer = useRef(null);

  const autoSave = () => {
    clearTimeout(saveTimer.current);
    setIsSyncing(true);
    saveTimer.current = setTimeout(() => {
      onSave({ title, content, color, tags: tags.split(',').map(t => t.trim()).filter(Boolean) }, true);
      setTimeout(() => setIsSyncing(false), 800);
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
        initial={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.9, y: 30 }}
        animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
        exit={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.9, y: 30 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={`auth-card aura-iridescent ${isMobile ? 'bottom-sheet' : ''}`}
        style={{
          maxWidth: 900,
          width: '100%',
          padding: 0,
          margin: isMobile ? 0 : '20px',
          display: 'flex',
          flexDirection: 'column',
          height: isMobile ? 'calc(100% - 40px)' : 'calc(100vh - 80px)',
          borderRadius: isMobile ? '24px 24px 0 0' : 32,
          overflow: 'hidden',
          border: `1px solid ${color}44`
        }}
      >
        <div className="modal-header" style={{ padding: isMobile ? '20px' : '32px 40px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
            <div className="auth-logo-icon" style={{ width: 40, height: 40, marginBottom: 0, background: color }}>
              <FileText size={20} color="white" />
            </div>
            <input
              className="no-border"
              style={{ 
                flex: 1, background: 'none', border: 'none', 
                fontFamily: 'Syne, sans-serif', 
                fontSize: isMobile ? '24px' : '32px', 
                fontWeight: 800, color: 'var(--text)', 
                outline: 'none', letterSpacing: '-0.02em',
                padding: 0
              }}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Title of this Essence..."
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <motion.button
              whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.05)' }}
              whileTap={{ scale: 0.9 }}
              className="btn-icon glass haptic-tap"
              style={{ width: 40, height: 40, borderRadius: 12, color: note.isPinned ? 'var(--accent)' : 'var(--muted)' }}
              onClick={() => pinMutation.mutate(note._id)}
            >
              <Pin size={20} style={{ fill: note.isPinned ? 'var(--accent)' : 'none' }} />
            </motion.button>
            <button className="modal-close haptic-tap" onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 8 }}>
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div className="modal-body" style={{ 
          padding: isMobile ? '20px' : '32px 40px',
          flex: 1, overflowY: 'auto'
        }}>
          <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="glass-badge" style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.03)', color: 'var(--muted)', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
              <Tag size={12} />
              <input
                style={{ background: 'none', border: 'none', color: 'var(--text)', outline: 'none', width: 'auto', minWidth: 200, fontWeight: 700 }}
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="Add labels..."
              />
            </div>
          </div>

          <textarea
            className="no-border"
            style={{
              width: '100%', background: 'none', border: 'none', outline: 'none',
              color: 'var(--text)', 
              fontSize: '18px',
              fontFamily: 'Inter, sans-serif',
              resize: 'none', lineHeight: 1.8, minHeight: '40vh',
              fontWeight: 500, padding: 0
            }}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Let the stream of consciousness flow here..."
          />

          <div style={{ display: 'flex', gap: 12, marginTop: 40, alignItems: 'center' }}>
            {NOTE_COLORS.map(c => (
              <motion.button
                key={c.value}
                whileHover={{ scale: 1.2, y: -2 }}
                onClick={() => setColor(c.value)}
                className="haptic-tap"
                style={{
                  width: 24, height: 24, borderRadius: '50%', background: c.value,
                  border: `2.5px solid ${color === c.value ? 'white' : 'transparent'}`,
                  cursor: 'pointer', boxShadow: color === c.value ? `0 0 15px ${c.value}` : 'none',
                  padding: 0
                }}
              />
            ))}
            <div style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--muted)', fontWeight: 900, letterSpacing: 1.5, textTransform: 'uppercase' }}>
              {wordCount} WORDS CAPTURED
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ padding: '24px 40px', background: 'rgba(255,255,255,0.01)', borderTop: '10px solid transparent', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: isSyncing ? 'var(--accent)' : 'var(--green)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1.5, transition: 'all 0.3s ease' }}>
            <div className={isSyncing ? "pulse-dot" : ""} style={{ background: isSyncing ? 'var(--accent)' : 'var(--green)', width: 8, height: 8, borderRadius: '50%', boxShadow: `0 0 10px ${isSyncing ? 'var(--accent)' : 'var(--green)'}` }} /> 
            {isSyncing ? 'Spirit Syncing...' : 'Optimized Synchrony'}
          </div>
          <button className="btn btn-ghost haptic-tap" onClick={onClose} style={{ borderRadius: 14, height: 52, padding: '0 24px', fontWeight: 800 }}>Dismiss</button>
          <button className="auth-button" onClick={() => onSave({ title, content, color, tags: tags.split(',').map(t => t.trim()).filter(Boolean) }, false)} style={{ width: 'auto', height: 52, padding: '0 32px', borderRadius: 16, fontSize: 16 }}>
            <div className="btn-glint" />
            <Save size={20} style={{ marginRight: 10 }} /> Preserve
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'create') {
      handleNewNote();
      // Clear URL params
      const newUrl = window.location.pathname;
      window.history.replaceState({ path: newUrl }, '', newUrl);
    }
  }, []);

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
        background: 'transparent',
        border: `1px solid ${note.color ? note.color + '44' : 'rgba(255,255,255,0.05)'}`,
        padding: isMobile ? '20px' : '28px',
        cursor: 'pointer',
        position: 'relative',
        minHeight: view === 'grid' ? 220 : 'auto',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 24,
        overflow: 'hidden',
        transition: 'all 0.3s ease'
      }}
      onClick={() => setModal(note)}
    >
      <div className="btn-glint" style={{ opacity: 0.02 }} />
      <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 8, zIndex: 20 }}>
        <motion.button
          whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.1)' }}
          whileTap={{ scale: 0.9 }}
          className="btn-icon glass haptic-tap"
          style={{ width: 36, height: 36, borderRadius: 10, color: note.isPinned ? 'var(--accent)' : 'var(--text)' }}
          onClick={e => { e.stopPropagation(); pinMutation.mutate(note._id); }}
        >
          <Pin size={18} style={{ fill: note.isPinned ? 'var(--accent)' : 'none' }} />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1, color: 'var(--red)', background: 'rgba(248, 113, 113, 0.1)' }}
          whileTap={{ scale: 0.9 }}
          className="btn-icon glass haptic-tap"
          style={{ width: 36, height: 36, borderRadius: 10, color: 'var(--text)' }}
          onClick={e => {
            e.stopPropagation();
            setConfirmDialog({
              open: true,
              title: 'Vanish Note',
              message: 'Are you sure you want to permanently delete this manifestation?',
              confirmText: 'Banish',
              onConfirm: () => { deleteMutation.mutate(note._id); setConfirmDialog({ open: false }); }
            });
          }}
        >
          <Trash2 size={18} />
        </motion.button>
      </div>

      <SensitivityShield>
        <h3 style={{ fontWeight: 800, fontSize: isMobile ? 18 : 20, marginBottom: 8, color: 'var(--text)', fontFamily: 'Syne, sans-serif', paddingRight: 80, letterSpacing: '-0.02em' }}>{note.title || 'Untitled Fragment'}</h3>
      </SensitivityShield>
      <div style={{ flex: 1 }}>
        <SensitivityShield>
            <p style={{ fontSize: isMobile ? 13 : 14, color: 'var(--muted)', lineHeight: 1.6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: view === 'grid' ? 4 : 2, WebkitBoxOrient: 'vertical', fontWeight: 500 }}>
              {note.content || <span style={{ fontStyle: 'italic', opacity: 0.4 }}>No essence captured yet...</span>}
            </p>
        </SensitivityShield>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {note.tags?.slice(0, 2).map(t => (
            <span key={t} className="glass-badge" style={{ fontSize: 10, color: 'var(--accent)', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: 8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t}</span>
          ))}
          {note.tags?.length > 2 && <span className="glass-badge" style={{ fontSize: 10, color: 'var(--muted)', padding: '4px 8px' }}>+{note.tags.length - 2}</span>}
        </div>
        <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1 }}>{format(new Date(note.updatedAt), 'MMM d')}</div>
      </div>
      {note.color && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: note.color, opacity: 0.5 }} />}
    </motion.div>
  );

  const DesktopSplitView = () => (
    <div className="notes-split-container" style={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: 24, background: 'rgba(0,0,0,0.1)', overflow: 'hidden' }}>
      {/* Sidebar List */}
      <div className="notes-split-sidebar" style={{ borderRight: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
        <div className="notes-sidebar-header" style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em' }}>Repository</h2>
            <button className="btn btn-sm glass haptic-tap" onClick={handleNewNote} style={{ borderRadius: 10, padding: '0 12px', height: 32, fontSize: 11, fontWeight: 800 }}>
              <Plus size={14} style={{ marginRight: 6 }} /> Capture
            </button>
          </div>
          <div className="auth-input no-border" style={{ height: 42, padding: '0 16px', display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.03)' }}>
            <Search size={14} className="text-muted" />
            <input 
              placeholder="Search essences..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: 13, outline: 'none', width: '100%', padding: 0 }}
            />
          </div>
        </div>
        <div className="notes-sidebar-list" style={{ padding: '0 16px 24px' }}>
          {[...pinned, ...unpinned].map((n, i) => (
            <motion.div
              layout
              key={n._id}
              className={`notes-sidebar-item ${selectedNoteId === n._id ? 'active' : ''}`}
              style={{
                padding: '20px',
                borderRadius: 16,
                cursor: 'pointer',
                marginBottom: 8,
                background: selectedNoteId === n._id ? 'rgba(255,255,255,0.05)' : 'transparent',
                border: `1px solid ${selectedNoteId === n._id ? 'rgba(255,255,255,0.1)' : 'transparent'}`,
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
              onClick={() => setSelectedNoteId(n._id)}
            >
              {selectedNoteId === n._id && <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 4, background: n.color || 'var(--accent)' }} />}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'Syne' }}>{n.title || 'Untitled Fragment'}</div>
                {n.isPinned && <Pin size={14} style={{ fill: 'var(--accent)', color: 'var(--accent)' }} />}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', opacity: 0.7, lineHeight: 1.5, height: 36, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {n.content?.slice(0, 100) || 'No essence...'}
              </div>
              <div style={{ marginTop: 12, fontSize: 10, color: 'var(--muted)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1 }}>{format(new Date(n.updatedAt), 'MMM d')}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Main Area */}
      <div className="notes-split-main" style={{ background: 'rgba(255,255,255,0.01)', overflowY: 'auto' }}>
        {selectedNote ? (
          <div className="split-editor-wrap" style={{ padding: '60px 80px', maxWidth: 900, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
              <div className="auth-logo-icon" style={{ width: 40, height: 40, marginBottom: 0, background: selectedNote.color || 'var(--accent)' }}>
                <FileText size={20} color="white" />
              </div>
              <input
                className="no-border"
                style={{ flex: 1, fontSize: '48px', fontWeight: 800, background: 'none', border: 'none', color: 'var(--text)', outline: 'none', fontFamily: 'Syne', letterSpacing: '-0.04em' }}
                value={selectedNote.title}
                onChange={e => handleSave({ ...selectedNote, title: e.target.value }, true)}
                placeholder="Essence Title"
              />
            </div>
            <textarea
              className="no-border"
              style={{ width: '100%', flex: 1, minHeight: '50vh', background: 'none', border: 'none', outline: 'none', fontSize: '20px', color: 'var(--text)', lineHeight: 1.8, resize: 'none', fontWeight: 500 }}
              value={selectedNote.content}
              onChange={e => handleSave({ ...selectedNote, content: e.target.value }, true)}
              placeholder="Manifest your thoughts..."
            />
            <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 12 }}>
                {NOTE_COLORS.map(c => (
                  <button key={c.value} onClick={() => handleSave({ ...selectedNote, color: c.value }, true)} style={{ width: 24, height: 24, borderRadius: '50%', background: c.value, border: `2.5px solid ${selectedNote.color === c.value ? 'white' : 'transparent'}`, cursor: 'pointer' }} />
                ))}
              </div>
              <div style={{ color: 'var(--muted)', fontSize: 11, fontWeight: 900, letterSpacing: 1.5 }}>
                 {selectedNote.content?.trim().split(/\s+/).filter(Boolean).length} WORDS
              </div>
            </div>
          </div>
        ) : (
          <div className="notes-empty-state" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
            <Sparkles size={80} />
            <p style={{ marginTop: 24, fontSize: 18, fontWeight: 800, fontFamily: 'Syne' }}>Select a manifestation</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={isDesktopSplit ? "notes-page-root-split" : "responsive-container"}>
      {!isDesktopSplit && (
        <>
          <div className="page-header mb-10" style={{ alignItems: 'flex-start' }}>
            <div>
              <div className="page-title flex items-center gap-4" style={{ 
                fontFamily: 'Syne, sans-serif', 
                fontSize: 'var(--fs-display)', 
                fontWeight: 800,
                letterSpacing: '-0.05em',
                lineHeight: 1
              }}>
                <div className="auth-logo-icon" style={{ width: 48, height: 48, marginBottom: 0 }}>
                  <Sparkles size={24} color="white" strokeWidth={2.5} fill="white" />
                </div>
                Cognitive Archive
              </div>
              <p className="page-subtitle" style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--muted)', marginTop: 8, letterSpacing: '0.02em', opacity: 0.7 }}>
                Preserve your intellectual manifestations in the digital sanctum
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12, width: isMobile ? '100%' : 'auto' }}>
              <button className="btn glass haptic-tap" onClick={() => setView(v => v === 'grid' ? 'list' : 'grid')} style={{ fontWeight: 800, flex: isMobile ? 1 : 'none', borderRadius: 14, height: 54, padding: '0 20px' }}>
                {view === 'grid' ? <List size={18} /> : <Grid size={18} />}
                <span style={{ marginLeft: 10 }} className="hide-mobile">{view === 'grid' ? 'Sequential' : 'Matrix'}</span>
              </button>
              <button className="auth-button hide-mobile magnetic-btn" onClick={handleNewNote} disabled={createMutation.isPending} style={{ borderRadius: 16, height: 54, width: 'auto', padding: '0 24px' }}>
                <div className="btn-glint" />
                {createMutation.isPending ? <div className="loading-spinner" style={{ width: 18, height: 18 }} /> : <Plus size={20} />}
                <span style={{ marginLeft: 8 }}>Manifest Essence</span>
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

          <div className="premium-card mb-12" style={{ padding: '4px 20px', display: 'flex', alignItems: 'center', gap: 16, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20 }}>
            <Search size={22} className="text-muted" style={{ opacity: 0.6 }} />
            <input
              className="auth-input no-border"
              placeholder="Summon your captured thoughts..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ background: 'none', border: 'none', fontSize: '18px', fontWeight: 600, fontFamily: 'Syne', height: 64, flex: 1, boxShadow: 'none' }}
            />
            <div className="hide-mobile" style={{ background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: 10, fontSize: 10, fontWeight: 900, color: 'var(--muted)', border: '1px solid rgba(255,255,255,0.1)', letterSpacing: 1 }}>SEARCH</div>
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
