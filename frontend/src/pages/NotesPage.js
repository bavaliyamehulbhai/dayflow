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

const NOTE_COLORS = [
  { value: '#1a1a26', label: 'Basalt' },
  { value: '#241a33', label: 'Nebula' },
  { value: '#1a2b26', label: 'Forest' },
  { value: '#331a1a', label: 'Ember' },
  { value: '#2b261a', label: 'Sand' },
  { value: '#1a2433', label: 'Ocean' }
];

function NoteEditor({ note, onClose, onSave }) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [color, setColor] = useState(note?.color || '#1a1a26');
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
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        className="modal glass-modal"
        style={{
          maxWidth: 720,
          background: `linear-gradient(180deg, ${color}, #0f1115)`,
          border: `1px solid ${color}44`,
          width: '100%',
          margin: 'var(--space-4) auto'
        }}
      >
        <div className="modal-header" style={{ border: 'none', padding: window.innerWidth <= 768 ? '16px' : '20px 24px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
            <div style={{ color: 'var(--accent)' }}><FileText size={window.innerWidth <= 768 ? 18 : 20} /></div>
            <input
              style={{ flex: 1, background: 'none', border: 'none', fontFamily: 'Plus Jakarta Sans', fontSize: 'var(--fs-xl)', fontWeight: 800, color: 'var(--text)', outline: 'none' }}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Echo your thoughts..."
            />
          </div>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body" style={{ paddingTop: 0 }}>
          <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Tag size={14} className="text-muted" />
            <input
              style={{ fontSize: 13, background: 'rgba(255,255,255,0.03)', border: 'none', color: 'var(--text)', padding: '8px 12px', borderRadius: 8, flex: 1 }}
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="Tag (e.g. strategy, personal)"
            />
          </div>

          <textarea
            style={{
              width: '100%', background: 'none', border: 'none', outline: 'none',
              color: 'var(--text)', fontFamily: 'Inter', fontSize: 'var(--fs-base)',
              resize: 'none', lineHeight: 1.8, minHeight: 380
            }}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Let the thoughts flow..."
            autoFocus
          />

          <div style={{ display: 'flex', gap: 10, marginTop: 24, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {NOTE_COLORS.map(c => (
                <motion.button
                  key={c.value}
                  whileHover={{ scale: 1.2 }}
                  onClick={() => setColor(c.value)}
                  style={{
                    width: 20, height: 20, borderRadius: '50%', background: c.value,
                    border: `2px solid ${color === c.value ? 'var(--accent)' : 'transparent'}`,
                    cursor: 'pointer', transition: 'border 0.2s'
                  }}
                />
              ))}
            </div>
            <div style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>
              {wordCount} words
            </div>
          </div>
        </div>
        <div className="modal-footer" style={{ border: 'none', gap: 12 }}>
          <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--green)', fontWeight: 700 }}>
            <div className="pulse-dot" style={{ background: 'var(--green)' }} /> Synchronized
          </div>
          <button className="btn btn-ghost" onClick={onClose}>Dismiss</button>
          <button className="btn btn-primary" onClick={() => onSave({ title, content, color, tags: tags.split(',').map(t => t.trim()).filter(Boolean) }, false)}>
            <Save size={16} /> Preserve Note
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
  const width = window.innerWidth;
  const isDesktopSplit = width > 1024;
  const isMobile = width <= 768;

  const { data, isLoading } = useQuery({
    queryKey: ['notes', search],
    queryFn: () => notesAPI.getAll({ search, limit: 100 }).then(r => r.data.notes)
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

  const notes = data || [];
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
    if (modal?._id) {
      updateMutation.mutate({ id: modal._id, data: formData, silent });
    }
  };

  const NoteCard = ({ note, index }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="card hover-lift glass-card note-card"
      style={{
        background: note.color ? `linear-gradient(135deg, ${note.color}, rgba(15,17,21,0.9))` : 'var(--glass-bg)',
        border: `1.5px solid ${note.color ? note.color + '66' : 'var(--border)'}`,
        padding: '24px',
        cursor: 'pointer',
        position: 'relative',
        minHeight: view === 'grid' ? 180 : 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
      onClick={() => setModal(note)}
    >
      <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 6 }} className="note-actions">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="btn btn-icon btn-ghost btn-sm card-action-btn"
          onClick={e => { e.stopPropagation(); pinMutation.mutate(note._id); }}
        >
          <Pin size={14} style={{ fill: note.isPinned ? 'var(--accent)' : 'none', color: note.isPinned ? 'var(--accent)' : 'inherit' }} />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1, color: 'var(--red)' }}
          whileTap={{ scale: 0.9 }}
          className="btn btn-icon btn-ghost btn-sm card-action-btn"
          onClick={e => { e.stopPropagation(); if (window.confirm('Vanish note?')) deleteMutation.mutate(note._id); }}
        >
          <Trash2 size={14} />
        </motion.button>
      </div>

      <div style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: 'var(--fs-base)', marginBottom: 12, paddingRight: 60, color: 'var(--text)' }}>
        {note.title || <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>Untitled Essence</span>}
      </div>

      <div style={{
        fontSize: 'var(--fs-sm)', color: 'var(--text2)', overflow: 'hidden', flex: 1,
        display: '-webkit-box', WebkitLineClamp: view === 'grid' ? 4 : 2,
        WebkitBoxOrient: 'vertical', lineHeight: 1.6, fontWeight: 500
      }}>
        {note.content}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {note.tags?.slice(0, 2).map(t => (
            <span key={t} style={{ fontSize: 11, background: 'rgba(255,255,255,0.06)', color: 'var(--accent)', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>#{t}</span>
          ))}
          {note.tags?.length > 2 && <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700 }}>+{note.tags.length - 2}</span>}
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>{format(new Date(note.updatedAt), 'MMM d')}</div>
      </div>
    </motion.div>
  );

  const DesktopSplitView = () => (
    <div className="notes-split-container">
      {/* Scrollable Sidebar List */}
      <div className="notes-split-sidebar">
        <div className="notes-sidebar-header">
          <div className="search-wrap-minimal">
            <Search size={16} />
            <input
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn-icon btn-primary btn-sm" onClick={handleNewNote}>
            <Plus size={18} />
          </button>
        </div>
        <div className="notes-sidebar-list">
          {[...pinned, ...unpinned].map((n, i) => (
            <div
              key={n._id}
              className={`notes-sidebar-item ${selectedNoteId === n._id ? 'active' : ''}`}
              onClick={() => setSelectedNoteId(n._id)}
            >
              <div className="item-title">{n.title || 'Untitled'}</div>
              <div className="item-preview">{n.content.slice(0, 60)}</div>
              <div className="item-meta">
                {n.isPinned && <Pin size={10} style={{ fill: 'var(--accent)', color: 'var(--accent)' }} />}
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
            <div className="split-editor-header">
              <input
                className="split-title-input"
                value={selectedNote.title}
                onChange={e => handleSave({ ...selectedNote, title: e.target.value }, true)}
                placeholder="Title"
              />
              <div className="split-header-actions">
                <button
                  className="btn btn-icon btn-ghost"
                  onClick={() => pinMutation.mutate(selectedNote._id)}
                >
                  <Pin size={18} style={{ fill: selectedNote.isPinned ? 'var(--accent)' : 'none', color: selectedNote.isPinned ? 'var(--accent)' : 'inherit' }} />
                </button>
                <button
                  className="btn btn-icon btn-ghost text-red"
                  onClick={() => { if (window.confirm('Vanish note?')) deleteMutation.mutate(selectedNote._id); }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
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
          <div className="page-header mb-8">
            <div>
              <div className="page-title flex items-center gap-3">
                <Sparkles size={isMobile ? 24 : 32} className="text-accent" />
                Thought Sanctum
              </div>
              <p className="page-subtitle">Preserve your intellectual manifestations</p>
            </div>
            <div style={{ display: 'flex', gap: 8, width: isMobile ? '100%' : 'auto' }}>
              <button className="btn btn-ghost haptic-tap" onClick={() => setView(v => v === 'grid' ? 'list' : 'grid')} style={{ fontWeight: 700, flex: isMobile ? 1 : 'none' }}>
                {view === 'grid' ? <List size={18} /> : <Grid size={18} />}
                <span style={{ marginLeft: 8 }} className="hide-mobile">{view === 'grid' ? 'Chronicle' : 'Matrix'}</span>
              </button>
              <button className="btn btn-primary hide-mobile magnetic-btn" onClick={handleNewNote} disabled={createMutation.isPending}>
                <Plus size={18} /> Manifest Note
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

          <div className="card glass-card" style={{ marginBottom: 32, padding: '8px 20px', display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--border)' }}>
            <Search size={20} className="text-muted" />
            <input
              className="input"
              placeholder="Summon your thoughts..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ background: 'none', border: 'none', fontSize: 'var(--fs-base)', height: 48 }}
            />
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
          />
        )}
      </AnimatePresence>

      <style>{`
        .glass-card { background: var(--glass-bg); backdrop-filter: blur(12px); }
        .note-card .card-action-btn { background: rgba(0,0,0,0.2); backdrop-filter: blur(4px); }
        .note-actions { opacity: 0; transform: translateY(-5px); transition: all 0.2s; }
        .note-card:hover { border-color: var(--accent) !important; }
        .note-card:hover .note-actions { opacity: 1; transform: translateY(0); }
        
        .notes-page-root-split {
          height: calc(100vh - 40px);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .notes-split-container {
          display: grid;
          grid-template-columns: 320px 1fr;
          height: 100%;
          border: 1px solid var(--border);
          border-radius: 20px;
          background: var(--surface);
          overflow: hidden;
        }

        .notes-split-sidebar {
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          background: rgba(255,255,255,0.01);
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
          padding: 8px;
        }

        .notes-sidebar-item {
          padding: 14px 16px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 4px;
          border: 1px solid transparent;
        }

        .notes-sidebar-item:hover {
          background: var(--surface2);
        }

        .notes-sidebar-item.active {
          background: rgba(130, 114, 255, 0.1);
          border-color: rgba(130, 114, 255, 0.2);
        }

        .item-title {
          font-weight: 700;
          font-size: 14px;
          color: var(--text);
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .item-preview {
          font-size: 12px;
          color: var(--muted);
          line-height: 1.5;
          height: 36px;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .item-meta {
          margin-top: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 10px;
          color: var(--muted);
          font-weight: 600;
          text-transform: uppercase;
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
          padding: 32px 40px;
        }

        .split-editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .split-title-input {
          background: none;
          border: none;
          font-size: 32px;
          font-weight: 800;
          font-family: 'Syne', sans-serif;
          color: var(--text);
          outline: none;
          flex: 1;
        }

        .split-header-actions {
          display: flex;
          gap: 8px;
        }

        .split-content-textarea {
          flex: 1;
          background: none;
          border: none;
          font-size: 16px;
          color: var(--text2);
          font-family: 'Inter', sans-serif;
          line-height: 1.8;
          resize: none;
          outline: none;
        }

        .notes-empty-state {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          color: var(--muted);
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .note-actions { opacity: 1 !important; transform: translateY(0) !important; }
        }
      `}</style>
    </div >
  );
}
