import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notesAPI } from "../utils/api";
import { useNotifications } from "../context/NotificationContext";
import { safeFormat } from "../utils/dateUtils";
import { getSafeId } from "../utils/idUtils";
import {
  FileText,
  Search,
  Plus,
  Pin,
  Trash2,
  Sparkles,
  Clock,
  Zap,
  Activity,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ConfirmDialog from "../components/ConfirmDialog";
import SensitivityShield from "../components/layout/SensitivityShield";
import MagneticButton from "../components/common/MagneticButton";
import AuraOrb from "../components/common/AuraOrb";
import MobileBottomSheet from "../components/common/MobileBottomSheet";

const NOTE_COLORS = [
  { label: "Indigo", value: "#7c6dfa" },
  { label: "Rose", value: "#ff4d7d" },
  { label: "Cyan", value: "#00f2fe" },
  { label: "Amber", value: "#fbbf24" },
  { label: "Emerald", value: "#4ade80" },
  { label: "Crimson", value: "#f87171" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

function NoteEditor({ note, onClose, onSave, isMobile, isEmbedded = false }) {
  const { addToast } = useNotifications();
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [color, setColor] = useState(note?.color || "#7c6dfa");
  const [tags, setTags] = useState(note?.tags?.join(", ") || "");
  const [isSyncing, setIsSyncing] = useState(false);
  const saveTimer = useRef(null);
  const isDraft = note?._isDraft;
  const canCreate =
    title.trim() ||
    content.trim() ||
    tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean).length > 0;

  useEffect(() => {
    setTitle(note?.title || "");
    setContent(note?.content || "");
    setColor(note?.color || "#7c6dfa");
    setTags(note?.tags?.join(", ") || "");
  }, [note]);

  useEffect(() => {
    if (isDraft) return undefined;
    if (
      title !== note?.title ||
      content !== note?.content ||
      color !== note?.color ||
      tags !== note?.tags?.join(", ")
    ) {
      clearTimeout(saveTimer.current);
      setIsSyncing(true);
      saveTimer.current = setTimeout(() => {
        onSave(
          {
            title,
            content,
            color,
            tags: tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean),
          },
          true,
        );
        setTimeout(() => setIsSyncing(false), 800);
      }, 2000);
    }
    return () => clearTimeout(saveTimer.current);
  }, [title, content, color, tags, note]);

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  const editorContent = (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="elite-editor-plate"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 0,
        height: "100%",
        width: "100%",
        borderRadius: isEmbedded ? 24 : (isMobile ? 24 : 36),
        background: "rgba(12, 12, 22, 0.6)",
        backdropFilter: "blur(40px)",
        border: `1px solid ${color}33`,
        boxShadow: isEmbedded ? "none" : `0 30px 100px rgba(0,0,0,0.8), 0 0 40px ${color}11`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "-20px",
          background: `radial-gradient(circle at 50% 30%, ${color}11 0%, transparent 70%)`,
          filter: "blur(40px)",
          zIndex: -1,
          pointerEvents: "none",
        }}
      />

      <div
        className="liquid-glass-input"
        style={{
          padding: "0 18px",
          display: "flex",
          alignItems: "center",
          height: 68,
          gap: 12,
          borderBottom: "1px solid rgba(255,255,255,0.04)"
        }}
      >
        <div
          style={{
            padding: "6px",
            background: `${color}22`,
            borderRadius: 8,
            display: "flex",
            flexShrink: 0,
          }}
        >
          <Zap size={14} style={{ color: color }} />
        </div>
        <input
          className="no-border"
          style={{
            flex: 1,
            minWidth: 0,
            background: "none",
            border: "none",
            fontFamily: "Syne",
            fontSize: "18px",
            fontWeight: 900,
            color: "white",
            outline: "none",
            letterSpacing: "0.02em",
            textTransform: "uppercase",
          }}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="FRAGMENT TITLE..."
        />
        
        {isDraft ? (
          <button
            type="button"
            className="haptic-tap"
            onClick={() =>
              onSave(
                {
                  title,
                  content,
                  color,
                  tags: tags
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                },
                false,
              )
            }
            disabled={!canCreate}
            style={{
              height: 40,
              padding: "0 16px",
              borderRadius: 12,
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: 1,
              textTransform: "uppercase",
              background: canCreate
                ? "var(--grad-premium)"
                : "var(--surface2)",
              color: canCreate ? "white" : "var(--muted)",
              border: "1px solid rgba(255,255,255,0.1)",
              cursor: canCreate ? "pointer" : "not-allowed",
            }}
          >
            Create
          </button>
        ) : (
          isEmbedded && (
            <button
              type="button"
              className="haptic-tap text-red"
              onClick={() => onClose(true)}
              style={{
                height: 40,
                width: 40,
                borderRadius: 12,
                background: "rgba(255,107,107,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "none",
                cursor: "pointer"
              }}
              title="Delete fragment"
            >
              <Trash2 size={16} />
            </button>
          )
        )}
        
        {!isEmbedded && (
          <button
            type="button"
            className="modal-close haptic-tap"
            onClick={() => onClose()}
            style={{
              background: "rgba(255,255,255,0.04)",
              borderRadius: 12,
              padding: 8,
              border: "none",
            }}
          >
            <X size={20} />
          </button>
        )}
      </div>

      <div
        className="liquid-glass-input"
        style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column" }}
      >
        <textarea
          className="no-border aura-scrollbar"
          style={{
            width: "100%",
            flex: 1,
            background: "none",
            border: "none",
            outline: "none",
            color: "rgba(255,255,255,0.9)",
            fontSize: 16,
            lineHeight: 1.75,
            resize: "none",
            fontFamily: "Inter",
            fontWeight: 400,
          }}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Capture the stream of consciousness..."
        />
      </div>

      <div
        style={{
          padding: "12px 20px",
          borderTop: "1px solid rgba(255,255,255,0.04)",
          display: "flex",
          alignItems: "center",
          gap: 12
        }}
      >
        <span style={{ fontSize: 10, fontWeight: 900, color: "var(--muted)", letterSpacing: 1 }}>TAGS:</span>
        <input
          style={{
            flex: 1,
            background: "none",
            border: "none",
            outline: "none",
            color: "white",
            fontSize: 13,
            fontFamily: "Inter"
          }}
          placeholder="comma separated tags..."
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
      </div>

      <div
        style={{
          padding: "12px 20px",
          borderTop: "1px solid rgba(255,255,255,0.04)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(255,255,255,0.01)",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div
            style={{
              fontSize: 9,
              fontWeight: 900,
              color: "var(--muted)",
              letterSpacing: 1,
            }}
          >
            COLOR:
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {NOTE_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: c.value,
                  border:
                    color === c.value
                      ? "2px solid white"
                      : "1px solid rgba(255,255,255,0.2)",
                  boxShadow:
                    color === c.value ? `0 0 10px ${c.value}` : "none",
                  padding: 0,
                  cursor: "pointer"
                }}
              />
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isSyncing ? (
            <Activity
              size={12}
              className="aura-float"
              style={{ color: color }}
            />
          ) : (
            <Clock size={12} style={{ color: "var(--muted)" }} />
          )}
          <div
            style={{
              fontSize: 9,
              fontWeight: 900,
              color: isSyncing ? color : "var(--muted)",
              letterSpacing: 1.5,
              textTransform: "uppercase",
            }}
          >
            {wordCount} NODES // {isSyncing ? "SYNCING..." : "SAVED"}
          </div>
        </div>
      </div>
    </motion.div>
  );

  if (isEmbedded) {
    return editorContent;
  }

  return (
    <div
      className="modal-overlay note-editor-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        zIndex: 1000,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        paddingLeft: isMobile ? 0 : "var(--sidebar-w)",
      }}
    >
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 8, repeat: Infinity }}
        style={{
          position: "fixed",
          inset: 0,
          background: `radial-gradient(circle at center, ${color} 0%, transparent 75%)`,
          filter: "blur(120px)",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          maxWidth: isMobile ? 420 : 980,
          width: isMobile ? "92%" : "90%",
          height: isMobile ? "90dvh" : "82vh",
          position: "relative",
          zIndex: 1001,
        }}
      >
        {editorContent}
      </div>
    </div>
  );
}

export default function NotesPage() {
  const qc = useQueryClient();
  const { addToast } = useNotifications();
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    message: "",
    id: null,
  });
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

  const { data, isLoading } = useQuery({
    queryKey: ["notes"],
    queryFn: () => notesAPI.getAll({ limit: 100 }).then((r) => r.data.notes),
  });

  const invalidate = () => qc.invalidateQueries(["notes"]);

  const createMutation = useMutation({
    mutationFn: notesAPI.create,
    onSuccess: (r) => {
      addToast("Essence manifested", "success");
      setModal(r.data.note);
      invalidate();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => notesAPI.update(id, data),
    onMutate: async ({ id, data: newData }) => {
      await qc.cancelQueries(["notes"]);
      const previous = qc.getQueryData(["notes"]);
      qc.setQueryData(["notes"], (old) =>
        (old || []).map((n) => (n._id === id ? { ...n, ...newData } : n)),
      );
      return { previous };
    },
    onError: (err, variables, context) => {
      if (context?.previous) qc.setQueryData(["notes"], context.previous);
    },
    onSuccess: (r, { silent }) => {
      if (!silent) {
        addToast("Neural archive updated", "success");
        invalidate();
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: notesAPI.delete,
    onSuccess: () => {
      addToast("Memory archived", "info");
      setModal(null);
      setConfirmDialog({ open: false, title: "", message: "", id: null });
      invalidate();
    },
  });

  const openDraft = () =>
    setModal({
      title: "",
      content: "",
      color: "#7c6dfa",
      tags: [],
      _isDraft: true,
    });

  const handleSave = (formData, silent = false, isDeletion = false) => {
    const noteId = modal?._id;
    if (isDeletion) {
      if (noteId) {
        setConfirmDialog({
          open: true,
          title: "Banish Manifestation?",
          message:
            "Are you sure you want to erase this memory from the neural archive? This cannot be undone.",
          confirmText: "Banish",
          id: noteId,
        });
      } else {
        setModal(null);
      }
      return;
    }
    if (!formData) return;
    if (noteId) {
      updateMutation.mutate({ id: noteId, data: formData, silent });
      return;
    }
    if (silent) return;
    const hasContent =
      formData.title?.trim() ||
      formData.content?.trim() ||
      (Array.isArray(formData.tags) && formData.tags.length > 0);
    const isCreating = createMutation.isPending || createMutation.isLoading;
    if (hasContent && !isCreating) createMutation.mutate(formData);
  };

  const notes = React.useMemo(() => {
    return (data || [])
      .filter(
        (n) =>
          n.title?.toLowerCase().includes(search.toLowerCase()) ||
          n.content?.toLowerCase().includes(search.toLowerCase()),
      )
      .sort(
        (a, b) =>
          (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) ||
          new Date(b.updatedAt) - new Date(a.updatedAt),
      );
  }, [data, search]);

  const NoteCard = React.memo(({ note }) => (
    <motion.div
      layout
      whileHover={{ scale: isMobile ? 1 : 1.02, y: isMobile ? 0 : -3 }}
      whileTap={{ scale: 0.98 }}
      className="note-card-elite holographic-shimmer aura-iridescent haptic-tap"
      style={{
        background: "rgba(20, 20, 35, 0.4)",
        border: `1px solid ${note.color}22`,
        borderLeft: `4px solid ${note.color}`,
        padding: isMobile ? "14px 16px" : "18px 24px",
        borderRadius: 16,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: isMobile ? 12 : 16,
        boxShadow: `0 15px 35px rgba(0,0,0,0.3), 0 0 15px ${note.color}08`,
        position: "relative",
        breakInside: "avoid",
        marginBottom: isMobile ? 12 : 16,
        "--card-glow": `${note.color}22`,
        willChange: "transform, opacity",
      }}
    >
      <div className="btn-glint" style={{ opacity: 0.03 }} />
      <div
        onClick={() => setModal(note)}
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          gap: isMobile ? 12 : 16,
          minWidth: 0,
        }}
      >
        <div
          style={{
            width: isMobile ? 38 : 42,
            height: isMobile ? 38 : 42,
            borderRadius: 10,
            background: `${note.color}15`,
            border: `1px solid ${note.color}33`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            position: "relative",
          }}
        >
          <FileText
            size={isMobile ? 16 : 18}
            style={{
              color: note.color,
              filter: `drop-shadow(0 0 8px ${note.color})`,
            }}
          />
          <div
            className="aura-pulse"
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 10,
              background: note.color,
              opacity: 0.08,
            }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <SensitivityShield>
            <h3
              style={{
                fontFamily: "Plus Jakarta Sans, Inter, sans-serif",
                fontSize: isMobile ? 14 : 16,
                fontWeight: 700,
                color: "white",
                margin: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {note.title || "Untitled Essence"}
            </h3>
          </SensitivityShield>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 4,
            }}
          >
            <span
              style={{
                fontSize: 10,
                color: "var(--muted)",
                fontWeight: 600,
                letterSpacing: 0.5,
              }}
            >
              {safeFormat(note.updatedAt, "MMM d, yyyy", "RECENTLY")}
            </span>
            <div
              style={{
                width: 3,
                height: 3,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.1)",
              }}
            />
            <div
              style={{
                fontSize: 10,
                color: note.color,
                fontWeight: 600,
                letterSpacing: 0.5,
              }}
            >
              {note.content?.length || 0} NODES
            </div>
          </div>
        </div>
        {note.isPinned && (
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "var(--accent)22",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Pin
              size={12}
              style={{ color: "var(--accent)", fill: "var(--accent)" }}
            />
          </div>
        )}
      </div>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setConfirmDialog({
            open: true,
            title: "Banish Manifestation?",
            message: "Erase this memory from the neural archive?",
            confirmText: "Banish",
            id: getSafeId(note),
          });
        }}
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: "rgba(255,107,107,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginLeft: 8,
          flexShrink: 0,
          zIndex: 10,
          border: "none",
          cursor: "pointer",
        }}
      >
        <Trash2 size={14} style={{ color: "var(--red)" }} />
      </button>
    </motion.div>
  ));

  return (
    <div
      className="responsive-container page-shell"
      style={{ position: "relative", minHeight: "100vh", overflow: "hidden" }}
    >
      <AuraOrb
        color="rgba(124, 109, 250, 0.15)"
        size="600px"
        top="-10%"
        left="-10%"
        delay={0}
      />
      <AuraOrb
        color="rgba(0, 242, 254, 0.12)"
        size="500px"
        top="60%"
        left="60%"
        delay={4}
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ position: "relative", zIndex: 1 }}
      >
        <div
          className="dashboard-header-premium"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            padding: isMobile ? "16px" : "20px 24px",
            background: "var(--surface2)",
            border: "1px solid var(--border)",
            borderRadius: "16px",
            marginBottom: "24px",
            position: "relative",
            overflow: "hidden"
          }}
        >
          <AuraOrb
            color="var(--accent)"
            size={isMobile ? 120 : 200}
            top="-60px"
            left="-30px"
            delay={0}
            duration={isMobile ? 20 : 15}
          />
          <div style={{ display: "flex", alignItems: "center", gap: "12px", zIndex: 1 }}>
            <FileText
              className="text-accent aura-float"
              size={isMobile ? 22 : 28}
            />
            <div>
              <h1
                className="dashboard-title"
                style={{
                  fontSize: isMobile ? "1.25rem" : "1.6rem",
                  fontWeight: 800,
                  fontFamily: "Syne, sans-serif",
                  margin: 0,
                  color: "var(--text)"
                }}
              >
                Notes
              </h1>
              <p style={{ fontSize: "0.8rem", color: "var(--text2)", margin: "4px 0 0" }}>
                Capture ideas and documentation
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center", zIndex: 1 }}>
            <MagneticButton
              className="auth-button magnetic-btn haptic-tap"
              onClick={openDraft}
              style={{
                height: 42,
                padding: "0 16px",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>New Note</span>
            </MagneticButton>
          </div>
        </div>

        {isLoading ? (
          <div className="loading-page">
            <div className="loading-spinner" />
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "360px 1fr",
              gap: 24,
              alignItems: "stretch",
              minHeight: "calc(100vh - 240px)",
              paddingBottom: 40,
            }}
          >
            {/* Left Navigator Pane */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Search & Statistics */}
              <div
                className="glass-holographic"
                style={{
                  padding: "12px",
                  borderRadius: 16,
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                  backdropFilter: "blur(40px)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12
                }}
              >
                <div
                  style={{
                    borderRadius: 12,
                    padding: "0 16px",
                    height: 42,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    background: "rgba(0,0,0,0.2)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <Search size={18} color="var(--muted)" style={{ opacity: 0.5 }} />
                  <input
                    className="auth-input no-border"
                    style={{
                      height: 42,
                      background: "none",
                      fontSize: 13,
                      fontWeight: 700,
                      padding: 0,
                      width: "100%",
                      border: "none",
                      outline: "none",
                      color: "white",
                    }}
                    placeholder="Search fragments..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 900,
                    color: "var(--muted)",
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                    display: "flex",
                    justifyContent: "space-between"
                  }}
                >
                  <span>Navigator</span>
                  <span>{notes.length} Fragments</span>
                </div>
              </div>

              {/* Note Cards List */}
              {notes.length === 0 ? (
                <div
                  className="card glass-card notes-empty-card"
                  style={{
                    padding: "32px 16px",
                    textAlign: "center",
                    borderRadius: 20,
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <div style={{ fontSize: 36, marginBottom: 12 }}>🧠</div>
                  <div style={{ fontSize: 16, fontWeight: 900, fontFamily: "Syne", marginBottom: 6 }}>No Notes Found</div>
                  <div style={{ color: "var(--muted)", fontSize: 12, lineHeight: 1.4 }}>Forge a new fragment to begin.</div>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    maxHeight: isMobile ? "none" : "calc(100vh - 360px)",
                    overflowY: isMobile ? "visible" : "auto",
                    paddingRight: 4,
                  }}
                  className="custom-scrollbar"
                >
                  <AnimatePresence>
                    {notes.map((n) => {
                      const isActive = modal && modal._id === n._id;
                      return (
                        <motion.div
                          key={n._id}
                          onClick={() => setModal(n)}
                          style={{
                            borderRadius: 16,
                            border: isActive ? `2px solid ${n.color}` : "2px solid transparent",
                            transition: "border-color 0.2s ease"
                          }}
                        >
                          <NoteCard note={n} />
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Right Editor Workspace Pane (Desktop only) */}
            {!isMobile && (
              <div
                style={{
                  flex: 1,
                  minHeight: 500,
                  display: "flex",
                  flexDirection: "column"
                }}
              >
                {modal ? (
                  <NoteEditor
                    note={modal}
                    isEmbedded={true}
                    onClose={(shouldDelete = false) => {
                      if (shouldDelete) {
                        handleSave(null, false, true);
                      } else {
                        setModal(null);
                        invalidate();
                      }
                    }}
                    onSave={handleSave}
                    isMobile={false}
                  />
                ) : (
                  <div
                    className="premium-card"
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 40,
                      textAlign: "center",
                      borderRadius: 24,
                      background: "rgba(255,255,255,0.01)",
                      border: "1px solid rgba(255,255,255,0.04)"
                    }}
                  >
                    <div style={{ fontSize: 56, marginBottom: 20, opacity: 0.8 }} className="aura-float">🧠</div>
                    <h3 style={{ fontFamily: "Syne", fontSize: 18, fontWeight: 900, marginBottom: 8, color: "var(--text)" }}>NO FRAGMENT ACTIVE</h3>
                    <p style={{ fontSize: 13, color: "var(--muted)", maxWidth: 280, lineHeight: 1.6 }}>
                      Select an existing note from the navigator or forge a new fragment to begin editing in real-time.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Floating Action Button (Mobile) */}
        <AnimatePresence>
          {isMobile && !modal && (
            <motion.button
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 45 }}
              onClick={openDraft}
              className="fab-premium haptic-tap"
              style={{
                position: "fixed",
                bottom: "calc(85px + 24px)",
                right: 24,
                width: 64,
                height: 64,
                borderRadius: 24,
                background: "var(--grad-premium)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow:
                  "0 15px 40px rgba(124, 109, 250, 0.4), 0 0 20px rgba(124, 109, 250, 0.2)",
                zIndex: 100,
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              <Plus size={32} strokeWidth={2.5} />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Note Editor Modal (Mobile fallback only) */}
        <AnimatePresence>
          {isMobile && modal && (
            <NoteEditor
              note={modal}
              onClose={() => {
                setModal(null);
                invalidate();
              }}
              onSave={handleSave}
              isMobile={true}
              isEmbedded={false}
            />
          )}
        </AnimatePresence>
        
        <ConfirmDialog
          {...confirmDialog}
          onConfirm={() =>
            confirmDialog.id && deleteMutation.mutate(confirmDialog.id)
          }
          onCancel={() => setConfirmDialog({ open: false, id: null })}
        />
      </motion.div>

      <style>{`
        .no-border { border: none !important; }
        .aura-scrollbar::-webkit-scrollbar { width: 4px; }
        .aura-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }

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
      `}</style>
    </div>
  );
}
