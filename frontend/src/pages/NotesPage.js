import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notesAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  FileText,
  Search,
  Plus,
  Pin,
  Trash2,
  X,
  Sparkles,
  Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmDialog from '../components/ConfirmDialog';

const NOTE_COLORS = [
  { value: '#7c6dfa', label: 'Indigo' },
  { value: '#ff4d7d', label: 'Rose' },
  { value: '#00f2fe', label: 'Cyan' },
  { value: '#4facfe', label: 'Royal' },
  { value: '#f97316', label: 'Amber' },
  { value: '#22c55e', label: 'Emerald' },
  { value: '#c084fc', label: 'Lavender' },
  { value: '#fb7185', label: 'Pink' }
];

const BackgroundParticles = () => (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.05 }}>
            <pattern id="neural-mesh" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="var(--accent)" />
                <path d="M 2 2 L 100 100 M 2 2 L 0 100" stroke="var(--accent)" strokeWidth="0.5" fill="none" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#neural-mesh)" />
        </svg>
        {[...Array(30)].map((_, i) => (
            <motion.div
                key={i}
                initial={{ x: Math.random() * 100 + '%', y: Math.random() * 100 + '%', opacity: 0 }}
                animate={{ y: [null, '-20%'], opacity: [0, 0.4, 0], scale: [0, 1.5, 0] }}
                transition={{ duration: Math.random() * 15 + 15, repeat: Infinity, delay: Math.random() * 20 }}
                style={{ position: 'absolute', width: 2, height: 2, background: 'white', borderRadius: '50%', boxShadow: '0 0 15px white' }}
            />
        ))}
    </div>
);

function NoteEditor({ note, onClose, onSave, isMobile }) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [color, setColor] = useState(note?.color || '#7c6dfa');
  const [tags, setTags] = useState(note?.tags?.join(', ') || '');
  const [showPicker, setShowPicker] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const saveTimer = useRef(null);

  useEffect(() => {
    if (title !== note?.title || content !== note?.content || color !== note?.color) {
      clearTimeout(saveTimer.current);
      setIsSyncing(true);
      saveTimer.current = setTimeout(() => {
        onSave({ title, content, color, tags: tags.split(',').map(t => t.trim()).filter(Boolean) }, true);
        setTimeout(() => setIsSyncing(false), 800);
      }, 2000);
    }
    return () => clearTimeout(saveTimer.current);
  }, [title, content, color, tags]);

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()} style={{ zIndex: 1000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}>
      <motion.div 
        animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 8, repeat: Infinity }}
        style={{ position: 'fixed', inset: 0, background: `radial-gradient(circle at center, ${color} 0%, transparent 75%)`, filter: 'blur(120px)', zIndex: 0, pointerEvents: 'none' }} 
      />
      <motion.div
        initial={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.9, y: 30 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.9, y: 30 }}
        className={`auth-card elite-editor-plate ${isMobile ? 'bottom-sheet' : ''}`}
        style={{
          maxWidth: 950, width: '95%', padding: 0, display: 'flex', flexDirection: 'column',
          height: isMobile ? '95%' : '85vh', borderRadius: isMobile ? '24px 24px 0 0' : 44,
          background: 'rgba(12, 12, 22, 0.95)', backdropFilter: 'blur(40px)', 
          border: `1px solid ${color}44`,
          boxShadow: `0 30px 100px rgba(0,0,0,0.8), 0 0 40px ${color}11`,
          position: 'relative', zIndex: 1
        }}
      >
        <div style={{ padding: isMobile ? '16px 20px' : 40, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <input
            className="no-border"
            style={{ flex: 1, minWidth: 0, background: 'none', border: 'none', fontFamily: 'Syne', fontSize: isMobile ? 22 : 36, fontWeight: 900, color: 'white', outline: 'none' }}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder=""
          />
          <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
             <button 
               onClick={() => {
                 if (isDeleting) {
                   onSave(null, false, true);
                 } else {
                   setIsDeleting(true);
                   setTimeout(() => setIsDeleting(false), 3000);
                 }
               }} 
               style={{ 
                 background: isDeleting ? 'var(--red)' : 'rgba(255,255,255,0.05)', 
                 borderRadius: 14, padding: isMobile ? 10 : 12, border: 'none', 
                 color: isDeleting ? 'white' : 'var(--red)',
                 transition: 'all 0.3s ease',
                 display: 'flex', alignItems: 'center', gap: 6
               }}
             >
               <Trash2 size={isMobile ? 18 : 20} />
               {isDeleting && <span style={{ fontSize: 10, fontWeight: 900 }}>CONFIRM?</span>}
             </button>
             <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: isMobile ? 10 : 12, border: 'none', color: 'white' }}><X size={isMobile ? 18 : 20} /></button>
          </div>
        </div>
        
        <div className="aura-scrollbar" style={{ flex: 1, padding: isMobile ? 20 : 40, overflowY: 'auto', paddingBottom: 100 }}>
           <textarea
             className="no-border"
             style={{ width: '100%', background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: isMobile ? 16 : 18, lineHeight: 1.6, minHeight: '40vh', resize: 'none' }}
             value={content}
             onChange={e => setContent(e.target.value)}
             placeholder=""
           />
        </div>

        <div style={{ padding: isMobile ? 24 : 32, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
           <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
             <button onClick={() => setShowPicker(!showPicker)} style={{ width: 28, height: 28, borderRadius: '50%', background: color, border: '2px solid white' }} />
             <AnimatePresence>
               {showPicker && (
                 <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} style={{ display: 'flex', gap: 8 }}>
                    {NOTE_COLORS.map(c => (
                      <button key={c.value} onClick={() => { setColor(c.value); setShowPicker(false); }} style={{ width: 20, height: 20, borderRadius: '50%', background: c.value, border: 'none' }} />
                    ))}
                 </motion.div>
               )}
             </AnimatePresence>
           </div>
           <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--muted)', letterSpacing: 2 }}>{wordCount} NODES // {isSyncing ? 'SYNCING...' : 'ARCHIVED'}</div>
        </div>
      </motion.div>
    </div>
  );
}

export default function NotesPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', id: null });
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

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
    onSuccess: (r, { silent }) => { if (!silent) toast.success('Preserved'); invalidate(); }
  });

  const deleteMutation = useMutation({
    mutationFn: notesAPI.delete,
    onSuccess: () => { 
      toast.success('Vanished'); 
      setModal(null); 
      setConfirmDialog({ open: false, title: '', message: '', id: null });
      invalidate(); 
    }
  });

  const handleSave = (formData, silent = false, isDeletion = false) => {
    const id = modal?._id;
    if (isDeletion) {
      if (id) {
        setConfirmDialog({
          open: true, 
          title: 'Banish Manifestation?', 
          message: 'Are you sure you want to erase this memory from the neural archive? This cannot be undone.', 
          confirmText: 'Banish',
          id: id
        });
      } else {
        setModal(null);
      }
      return;
    }
    if (id && formData) updateMutation.mutate({ id, data: formData, silent });
  };

  const notes = (data || []).filter(n => 
    n.title?.toLowerCase().includes(search.toLowerCase()) || 
    n.content?.toLowerCase().includes(search.toLowerCase())
  ).sort((a,b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || new Date(b.updatedAt) - new Date(a.updatedAt));

  const NoteCard = ({ note }) => (
    <motion.div
      layout
      whileHover={{ scale: 1.02, y: -5 }}
      className="note-card-elite holographic-shimmer"
      style={{ 
        background: 'rgba(20, 20, 35, 0.6)', 
        border: `1px solid ${note.color}33`,
        padding: isMobile ? '16px 20px' : '24px 32px', borderRadius: 28, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 24, 
        boxShadow: `0 10px 40px rgba(0,0,0,0.3), 0 0 20px ${note.color}11`,
        position: 'relative',
        breakInside: 'avoid',
        marginBottom: isMobile ? 16 : 20
      }}
    >
      <div 
        onClick={() => setModal(note)} 
        style={{ flex: 1, display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 24, minWidth: 0 }}
      >
        <div style={{ width: 54, height: 54, borderRadius: 18, background: `${note.color}15`, border: `1px solid ${note.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <FileText size={22} style={{ color: note.color, filter: `drop-shadow(0 0 8px ${note.color})` }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontFamily: 'Syne', fontSize: 19, fontWeight: 900, color: 'white', margin: 0, textTransform: 'uppercase', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{note.title || 'Untitled Essence'}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
              <span style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1.5 }}>{format(new Date(note.updatedAt), 'MMM d, yyyy')}</span>
              <div style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
              <div style={{ fontSize: 9, color: note.color, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1 }}>{note.content?.length || 0} NODES</div>
          </div>
        </div>
        {note.isPinned && (
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--accent)22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Pin size={14} style={{ color: 'var(--accent)', fill: 'var(--accent)' }} />
          </div>
        )}
      </div>
      <button 
        onClick={(e) => { 
            e.preventDefault();
            e.stopPropagation(); 
            setConfirmDialog({ open: true, title: 'Banish Manifestation?', message: 'Erase this memory from the neural archive?', confirmText: 'Banish', id: note._id }); 
        }}
        onMouseDown={(e) => e.stopPropagation()}
        style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,107,107,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 8, flexShrink: 0, zIndex: 10 }}
      >
        <Trash2 size={14} style={{ color: 'var(--red)' }} />
      </button>
    </motion.div>
  );

  return (
    <div className="responsive-container" style={{ padding: isMobile ? '0 16px' : undefined }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: -1, background: '#020204' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '100px 100px', opacity: 0.02 }} />
        <BackgroundParticles />
      </div>

      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        gap: isMobile ? 12 : 32,
        padding: isMobile ? '16px 0' : '40px 0', 
        borderBottom: '1px solid rgba(255,255,255,0.05)', 
        marginBottom: isMobile ? 20 : 40 
      }}>
        <div style={{ width: '100%' }}>
          <div style={{ fontSize: isMobile ? 8 : 9, color: 'var(--accent)', fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 }}>Neural Archive</div>
          <h1 style={{ fontFamily: 'Syne', fontSize: 'clamp(26px, 9vw, 48px)', fontWeight: 900, color: 'white', margin: 0, lineHeight: 1.05 }}>Cognitive <span className="text-grad-vibrant">Archive</span></h1>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', width: '100%' }}>
          <div style={{ 
            background: 'rgba(255,255,255,0.03)', borderRadius: 16, 
            padding: '0 14px', height: 48, flex: 1, 
            display: 'flex', alignItems: 'center', gap: 10, border: '1px solid rgba(255,255,255,0.05)' 
          }}>
            <Search size={14} color="var(--muted)" />
            <input 
              placeholder="Search..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              style={{ background: 'none', border: 'none', outline: 'none', color: 'white', fontWeight: 600, width: '100%', fontSize: 13 }} 
            />
          </div>
          <button 
            onClick={() => createMutation.mutate({ title: '', content: '' })} 
            className="auth-button magnetic-btn" 
            style={{ height: 48, padding: '0 18px', borderRadius: 14, width: 'auto', flexShrink: 0 }}
          >
            <Plus size={18} /> {!isMobile && <span style={{ marginLeft: 8 }}>MANIFEST</span>}
          </button>
        </div>
      </div>

      {isLoading ? <div className="loading-page"><div className="loading-spinner" /></div> : (
        <div style={{ columnCount: isMobile ? 1 : 2, columnGap: 24, paddingBottom: 100 }}>
          <AnimatePresence>
            {notes.map(n => <NoteCard key={n._id} note={n} />)}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {modal && <NoteEditor note={modal} onClose={() => { setModal(null); invalidate(); }} onSave={handleSave} isMobile={isMobile} />}
      </AnimatePresence>
      <ConfirmDialog 
        {...confirmDialog} 
        onConfirm={() => confirmDialog.id && deleteMutation.mutate(confirmDialog.id)}
        onCancel={() => setConfirmDialog({ open: false, id: null })} 
      />
      
      <style>{`
        .no-border { border: none !important; }
        .aura-scrollbar::-webkit-scrollbar { width: 4px; }
        .aura-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .bottom-sheet { position: fixed; bottom: 0; left: 0; right: 0; width: 100% !important; border-radius: 32px 32px 0 0 !important; }
        
        .note-card-elite {
          transition: border-color 0.4s ease, background 0.4s ease, transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        
        .holographic-shimmer::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            120deg,
            transparent 0%,
            transparent 40%,
            rgba(255, 255, 255, 0.05) 50%,
            transparent 60%,
            transparent 100%
          );
          background-size: 200% 100%;
          transition: background-position 0.6s ease;
          pointer-events: none;
          z-index: 1;
        }
        
        .holographic-shimmer:hover::before {
          background-position: -200% 0;
        }

        .text-grad-vibrant {
            background: linear-gradient(135deg, var(--accent) 0%, #ff4d7d 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
      `}</style>
    </div>
  );
}
