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

function NoteEditor({ note, onClose, onSave, isMobile }) {
  const { addToast } = useNotifications();
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [color, setColor] = useState(note?.color || "#7c6dfa");
  const [tags, setTags] = useState(note?.tags?.join(", ") || "");
  const [showPicker, setShowPicker] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const saveTimer = useRef(null);

  useEffect(() => {
    if (
      title !== note?.title ||
      content !== note?.content ||
      color !== note?.color
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
  }, [title, content, color, tags]);

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div
      className="modal-overlay note-editor-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        zIndex: 1000,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(10px)",
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
      <motion.div
        initial={isMobile ? { x: "100%" } : { opacity: 0, scale: 0.9, y: 30 }}
        animate={{ x: 0, opacity: 1, scale: 1 }}
        exit={isMobile ? { x: "100%" } : { opacity: 0, scale: 0.9, y: 30 }}
        className={`auth-card elite-editor-plate ${isMobile ? "full-screen-immersion" : ""}`}
        style={{
          maxWidth: isMobile ? 420 : 950,
          width: isMobile ? "92%" : "95%",
          padding: 0,
          display: "flex",
          flexDirection: "column",
          height: isMobile ? "78dvh" : "85vh",
          borderRadius: isMobile ? 24 : 44,
          background: "rgba(12, 12, 22, 1)",
          backdropFilter: "blur(40px)",
          border: isMobile ? `1px solid ${color}33` : `1px solid ${color}44`,
          boxShadow: isMobile
            ? `0 24px 80px rgba(0,0,0,0.7), 0 0 30px ${color}22`
            : `0 30px 100px rgba(0,0,0,0.8), 0 0 40px ${color}11`,
          position: isMobile ? "relative" : "fixed",
          bottom: isMobile ? "auto" : 0,
          top: isMobile ? "auto" : 0,
          left: isMobile ? "auto" : "50%",
          transform: isMobile ? "none" : "translate(-50%, -50%)",
          zIndex: 1001,
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
            padding: "0 16px",
            display: "flex",
            alignItems: "center",
            height: 64,
            gap: 12,
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
              fontSize: "clamp(15px, 4vw, 22px)",
              fontWeight: 900,
              color: "white",
              outline: "none",
              letterSpacing: "0.02em",
              textTransform: "uppercase",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="FRAGMENT TITLE..."
          />
        </div>

        {/* Main Neural Text Area */}
        <div
          className="liquid-glass-input"
          style={{ padding: "20px", flex: 1 }}
        >
          <textarea
            className="no-border aura-scrollbar"
            style={{
              width: "100%",
              background: "none",
              border: "none",
              outline: "none",
              color: "rgba(255,255,255,0.9)",
              fontSize: 16,
              lineHeight: 1.8,
              minHeight: isMobile ? "35vh" : "45vh",
              resize: "none",
              fontFamily: "Inter",
              fontWeight: 400,
            }}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Capture the stream of consciousness..."
          />
        </div>

        {/* Elite Status Bar */}
        <div
          style={{
            marginTop: 10,
            padding: "12px 20px",
            borderRadius: 16,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
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
              SELECT FREQUENCY:
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {NOTE_COLORS.map((c) => (
                <motion.button
                  key={c.value}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setColor(c.value)}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: c.value,
                    border:
                      color === c.value
                        ? "2px solid white"
                        : "1px solid rgba(255,255,255,0.2)",
                    boxShadow:
                      color === c.value ? `0 0 10px ${c.value}` : "none",
                    padding: 0,
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
    onSuccess: (r, { silent }) => {
      if (!silent) addToast("Neural archive updated", "success");
      invalidate();
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

  const handleSave = (formData, silent = false, isDeletion = false) => {
    const id = getSafeId(modal);
    if (isDeletion) {
      if (id) {
        setConfirmDialog({
          open: true,
          title: "Banish Manifestation?",
          message:
            "Are you sure you want to erase this memory from the neural archive? This cannot be undone.",
          confirmText: "Banish",
          id: id,
        });
      } else {
        setModal(null);
      }
      return;
    }
    if (id && formData) updateMutation.mutate({ id, data: formData, silent });
  };

  const notes = (data || [])
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

  const NoteCard = React.memo(({ note }) => (
    <motion.div
      layout
      whileHover={{ scale: isMobile ? 1 : 1.02, y: isMobile ? 0 : -5 }}
      whileTap={{ scale: 0.98 }}
      className="note-card-elite holographic-shimmer aura-iridescent haptic-tap"
      style={{
        background: "rgba(20, 20, 35, 0.4)",
        border: `1px solid ${note.color}33`,
        borderLeft: `5px solid ${note.color}`,
        padding: isMobile ? "20px" : "28px 36px",
        borderRadius: 32,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: isMobile ? 16 : 28,
        boxShadow: `0 30px 60px rgba(0,0,0,0.5), 0 0 30px ${note.color}11`,
        position: "relative",
        breakInside: "avoid",
        marginBottom: isMobile ? 14 : 24,
        "--card-glow": `${note.color}33`,
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
          gap: isMobile ? 16 : 28,
          minWidth: 0,
        }}
      >
        <div
          style={{
            width: isMobile ? 48 : 64,
            height: isMobile ? 48 : 64,
            borderRadius: 22,
            background: `${note.color}15`,
            border: `1px solid ${note.color}44`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            position: "relative",
          }}
        >
          <FileText
            size={isMobile ? 18 : 26}
            style={{
              color: note.color,
              filter: `drop-shadow(0 0 12px ${note.color})`,
            }}
          />
          <div
            className="aura-pulse"
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 22,
              background: note.color,
              opacity: 0.1,
            }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <SensitivityShield>
            <h3
              style={{
                fontFamily: "Syne",
                fontSize: isMobile ? 16 : 22,
                fontWeight: 900,
                color: "white",
                margin: 0,
                textTransform: "uppercase",
                letterSpacing: "-0.02em",
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
              gap: 12,
              marginTop: 8,
            }}
          >
            <span
              style={{
                fontSize: 10,
                color: "var(--muted)",
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: 2,
              }}
            >
              {safeFormat(note.updatedAt, "MMM d, yyyy", "RECENTLY")}
            </span>
            <div
              style={{
                width: 4,
                height: 4,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.1)",
              }}
            />
            <div
              style={{
                fontSize: 10,
                color: note.color,
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              {note.content?.length || 0} NODES
            </div>
          </div>
        </div>
        {note.isPinned && (
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 12,
              background: "var(--accent)22",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Pin
              size={14}
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
          width: 36,
          height: 36,
          borderRadius: 12,
          background: "rgba(255,107,107,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginLeft: 12,
          flexShrink: 0,
          zIndex: 10,
          border: "none",
          cursor: "pointer",
        }}
      >
        <Trash2 size={16} style={{ color: "var(--red)" }} />
      </button>
    </motion.div>
  ));

  return (
    <div
      className="responsive-container"
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
          className="page-header mb-10"
          style={{
            alignItems: "flex-start",
            position: "relative",
            border: "none",
            padding: isMobile ? "12px 0" : "40px 0",
          }}
        >
          <div>
            <div className="page-title flex items-center gap-4">
              <div
                className="auth-logo-icon aura-float"
                style={{
                  width: isMobile ? 40 : 54,
                  height: isMobile ? 40 : 54,
                  marginBottom: 0,
                  background: "var(--grad-premium)",
                }}
              >
                <FileText
                  size={isMobile ? 20 : 28}
                  color="white"
                  strokeWidth={2.5}
                  fill="white"
                />
              </div>
              <h1
                style={{
                  fontSize: "clamp(28px, 5vw, 42px)",
                  fontWeight: 900,
                  fontFamily: "Syne, sans-serif",
                  letterSpacing: "-0.05em",
                  lineHeight: 1,
                  background:
                    "linear-gradient(to right, #fff, rgba(255,255,255,0.7))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Cognitive Archive
              </h1>
            </div>
            <p
              className="page-subtitle"
              style={{
                fontSize: "var(--fs-sm)",
                opacity: 0.8,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                marginTop: 12,
              }}
            >
              Neural snapshots & memory nodes
            </p>
          </div>
          <MagneticButton
            className="auth-button hide-mobile glow-on-hover"
            onClick={() => createMutation.mutate({ title: "", content: "" })}
            style={{
              width: "auto",
              padding: "0 32px",
              height: 60,
              borderRadius: 24,
              fontSize: 14,
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            <div className="btn-glint" />
            <Plus size={22} style={{ marginRight: 10 }} strokeWidth={3} />{" "}
            MANIFEST ESSENCE
          </MagneticButton>
        </div>

        <div
          className="glass-holographic mb-8"
          style={{
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            gap: 20,
            flexWrap: "wrap",
            borderRadius: 24,
            border: "none",
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", gap: 16, flex: 1 }}
          >
            <Search size={20} className="text-muted" style={{ opacity: 0.5 }} />
            <input
              className="auth-input no-border"
              style={{
                height: isMobile ? 40 : 44,
                background: "none",
                fontSize: 14,
                fontWeight: 700,
                padding: 0,
                fontFamily: "Syne",
              }}
              placeholder="Quantum search fragments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div
            className="hide-mobile"
            style={{
              height: 24,
              width: 1,
              background: "rgba(255,255,255,0.1)",
              margin: "0 8px",
            }}
          />
          <div
            className="hide-mobile"
            style={{
              fontSize: 10,
              fontWeight: 900,
              color: "var(--muted)",
              letterSpacing: 1.5,
            }}
          >
            {notes.length} FRAGMENTS CATALOGED
          </div>
          <button
            onClick={() => createMutation.mutate({ title: "", content: "" })}
            className="auth-button show-mobile-only haptic-tap"
            style={{
              height: isMobile ? 40 : 44,
              width: isMobile ? 40 : 44,
              padding: 0,
              borderRadius: 12,
              display: isMobile ? "flex" : "none",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Plus size={18} />
          </button>
        </div>

        {isLoading ? (
          <div className="loading-page">
            <div className="loading-spinner" />
          </div>
        ) : notes.length === 0 ? (
          <div
            className="card glass-card aura-iridescent notes-empty-card"
            style={{
              padding: "64px 24px",
              textAlign: "center",
              borderRadius: 32,
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{
                repeat: Infinity,
                duration: 4,
                repeatType: "reverse",
              }}
              style={{ fontSize: 64, marginBottom: 24 }}
            >
              🧠
            </motion.div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 900,
                fontFamily: "Syne",
                marginBottom: 12,
              }}
            >
              Archive Is Clear
            </div>
            <div
              style={{
                color: "var(--muted)",
                fontSize: 14,
                maxWidth: 300,
                margin: "0 auto",
                lineHeight: 1.6,
              }}
            >
              Your neural network has no active fragments. Manifest a new
              essence to begin cataloging.
            </div>
            <MagneticButton
              className="auth-button glow-on-hover"
              style={{
                marginTop: 32,
                width: "auto",
                marginInline: "auto",
                padding: "0 32px",
              }}
              onClick={() => createMutation.mutate({ title: "", content: "" })}
            >
              Forge New Fragment
            </MagneticButton>
          </div>
        ) : (
          <div
            className="notes-output"
            style={{
              columnCount: isMobile ? 1 : 2,
              columnGap: 24,
              paddingBottom: 160,
            }}
          >
            <AnimatePresence>
              {notes.map((n) => (
                <NoteCard key={n._id} note={n} />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Floating Action Button (Mobile) */}
        <AnimatePresence>
          {isMobile && !modal && (
            <motion.button
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 45 }}
              onClick={() => createMutation.mutate({ title: "", content: "" })}
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

        <AnimatePresence>
          {modal && (
            <NoteEditor
              note={modal}
              onClose={() => {
                setModal(null);
                invalidate();
              }}
              onSave={handleSave}
              isMobile={isMobile}
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
