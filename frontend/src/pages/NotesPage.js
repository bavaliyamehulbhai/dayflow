import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notesAPI, tasksAPI } from "../utils/api";
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
  Archive,
  ArchiveRestore,
  CheckSquare,
  Copy,
  Tag,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ConfirmDialog from "../components/ConfirmDialog";
import SensitivityShield from "../components/layout/SensitivityShield";

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

function NoteEditor({
  note,
  onClose,
  onSave,
  onPin,
  onArchive,
  isMobile,
  isEmbedded = false,
}) {
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [color, setColor] = useState(note?.color || "#7c6dfa");
  const [tags, setTags] = useState(note?.tags?.join(", ") || "");
  const [linkedTask, setLinkedTask] = useState(
    note?.linkedTask?._id || note?.linkedTask || ""
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const saveTimer = useRef(null);
  const isDirtyRef = useRef(false);
  const isDraft = note?._isDraft;
  const { addToast } = useNotifications();

  // Fetch available tasks to allow linking notes to tasks
  const { data: tasksList = [] } = useQuery({
    queryKey: ["tasks-minimal"],
    queryFn: () => tasksAPI.getAll({ limit: 100 }).then((r) => r.data.tasks || []),
  });

  const canCreate =
    title.trim() ||
    content.trim() ||
    tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean).length > 0;

  const currentPayload = {
    title,
    content,
    color,
    tags: tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    linkedTask: linkedTask || null,
  };

  const payloadRef = useRef(currentPayload);
  payloadRef.current = currentPayload;

  useEffect(() => {
    setTitle(note?.title || "");
    setContent(note?.content || "");
    setColor(note?.color || "#7c6dfa");
    setTags(note?.tags?.join(", ") || "");
    setLinkedTask(note?.linkedTask?._id || note?.linkedTask || "");
    isDirtyRef.current = false;
  }, [note]);

  useEffect(() => {
    if (isDraft) return undefined;
    const initialLinked = note?.linkedTask?._id || note?.linkedTask || "";
    if (
      title !== (note?.title || "") ||
      content !== (note?.content || "") ||
      color !== (note?.color || "#7c6dfa") ||
      tags !== (note?.tags?.join(", ") || "") ||
      linkedTask !== initialLinked
    ) {
      isDirtyRef.current = true;
      clearTimeout(saveTimer.current);
      setIsSyncing(true);
      saveTimer.current = setTimeout(() => {
        onSave(payloadRef.current, true);
        isDirtyRef.current = false;
        setTimeout(() => setIsSyncing(false), 800);
      }, 2000);
    }
    return () => clearTimeout(saveTimer.current);
  }, [title, content, color, tags, linkedTask, note, isDraft, onSave]);

  // Flush any pending unsaved changes immediately before closing or unmounting
  const handleClose = (shouldDelete = false) => {
    if (shouldDelete) {
      onClose(true);
      return;
    }
    if (isDirtyRef.current && !isDraft) {
      clearTimeout(saveTimer.current);
      onSave(payloadRef.current, true);
      isDirtyRef.current = false;
    }
    onClose(false);
  };

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
        borderRadius: isEmbedded ? 12 : isMobile ? 16 : 12,
        background: "var(--surface-solid)",
        border: "1px solid var(--border)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        className="liquid-glass-input"
        style={{
          padding: "0 18px",
          display: "flex",
          alignItems: "center",
          height: 68,
          gap: 12,
          borderBottom: "1px solid rgba(255,255,255,0.04)",
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
          maxLength={200}
        />

        {isDraft ? (
          <button
            type="button"
            className="haptic-tap"
            onClick={() => onSave(payloadRef.current, false)}
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
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Quick Pin Toggle in Editor */}
            <button
              type="button"
              className="haptic-tap"
              onClick={() => onPin && onPin(note._id)}
              style={{
                height: 38,
                width: 38,
                borderRadius: 10,
                background: note?.isPinned
                  ? "var(--accent)22"
                  : "rgba(255,255,255,0.04)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(255,255,255,0.08)",
                cursor: "pointer",
              }}
              title={note?.isPinned ? "Unpin note" : "Pin note"}
            >
              <Pin
                size={15}
                style={{
                  color: note?.isPinned ? "var(--accent)" : "var(--muted)",
                  fill: note?.isPinned ? "var(--accent)" : "none",
                }}
              />
            </button>

            {/* Quick Archive Toggle in Editor */}
            <button
              type="button"
              className="haptic-tap"
              onClick={() => onArchive && onArchive(note._id)}
              style={{
                height: 38,
                width: 38,
                borderRadius: 10,
                background: "#18181b", colorScheme: "dark", cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(255,255,255,0.08)",
                cursor: "pointer",
              }}
              title={note?.isArchived ? "Restore to active" : "Archive note"}
            >
              {note?.isArchived ? (
                <ArchiveRestore size={15} style={{ color: "var(--accent)" }} />
              ) : (
                <Archive size={15} style={{ color: "var(--muted)" }} />
              )}
            </button>

            {/* Quick Copy in Editor */}
            <button
              type="button"
              className="haptic-tap"
              onClick={() => {
                const textToCopy = `${title ? title + "\n\n" : ""}${content}`;
                if (textToCopy.trim()) {
                  navigator.clipboard?.writeText(textToCopy);
                  addToast("Fragment copied to clipboard", "success");
                } else {
                  addToast("Nothing to copy", "info");
                }
              }}
              style={{
                height: 38,
                width: 38,
                borderRadius: 10,
                background: "#18181b", colorScheme: "dark", cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(255,255,255,0.08)",
                cursor: "pointer",
              }}
              title="Copy note to clipboard"
            >
              <Copy size={15} style={{ color: "var(--muted)" }} />
            </button>

            {/* Delete button (embedded) */}
            {isEmbedded && (
              <button
                type="button"
                className="haptic-tap text-red"
                onClick={() => handleClose(true)}
                style={{
                  height: 38,
                  width: 38,
                  borderRadius: 10,
                  background: "rgba(255,107,107,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "none",
                  cursor: "pointer",
                }}
                title="Delete note"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        )}

        {!isEmbedded && (
          <button
            type="button"
            className="modal-close haptic-tap"
            onClick={() => handleClose(false)}
            style={{
              background: "#18181b", colorScheme: "dark", cursor: "pointer",
              borderRadius: 12,
              padding: 8,
              border: "none",
              cursor: "pointer",
            }}
          >
            <X size={20} />
          </button>
        )}
      </div>

      <div
        className="liquid-glass-input"
        style={{
          padding: "20px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
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
            fontSize: 15,
            lineHeight: 1.6,
            resize: "none",
            fontFamily: "Inter, sans-serif",
            fontWeight: 400,
            wordBreak: "break-word",
            whiteSpace: "pre-wrap",
          }}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Capture the stream of consciousness..."
        />
      </div>

      {/* Tags & Linked Task Row */}
      <div
        style={{
          padding: "10px 20px",
          borderTop: "1px solid rgba(255,255,255,0.04)",
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 180 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 900,
              color: "var(--muted)",
              letterSpacing: 1,
            }}
          >
            TAGS:
          </span>
          <input
            style={{
              flex: 1,
              background: "none",
              border: "none",
              outline: "none",
              color: "white",
              fontSize: 13,
              fontFamily: "Inter",
            }}
            placeholder="comma separated tags..."
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>

        {/* Task Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 200 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 900,
              color: "var(--muted)",
              letterSpacing: 1,
            }}
          >
            TASK:
          </span>
          <select
            value={linkedTask}
            onChange={(e) => setLinkedTask(e.target.value)}
            style={{
              background: "#18181b", colorScheme: "dark", cursor: "pointer",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              padding: "4px 8px",
              color: linkedTask ? "white" : "var(--muted)",
              fontSize: 12,
              fontFamily: "Inter",
              outline: "none",
              maxWidth: 180,
            }}
          >
            <option value="" style={{ background: "#18181b", color: "#a1a1aa" }}>
              None (Unlinked)
            </option>
            {tasksList.map((t) => (
              <option
                key={t._id}
                value={t._id}
                style={{ background: "#18181b", color: "#f4f4f5" }}
              >
                {t.title} ({t.status || "todo"})
              </option>
            ))}
          </select>
        </div>
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
                  cursor: "pointer",
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
            {content.length} CHARS · {wordCount} WORDS // {isSyncing ? "SYNCING..." : "SAVED"}
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
      onClick={(e) => e.target === e.currentTarget && handleClose(false)}
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
  const [viewMode, setViewMode] = useState("active"); // 'active' | 'archived'
  const [selectedTag, setSelectedTag] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    message: "",
    id: null,
  });
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

  const { data, isLoading } = useQuery({
    queryKey: ["notes", viewMode],
    queryFn: () =>
      notesAPI
        .getAll({ archived: viewMode === "archived", limit: 100 })
        .then((r) => r.data.notes || []),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["notes"] });

  const createMutation = useMutation({
    mutationFn: notesAPI.create,
    onSuccess: (r) => {
      addToast("Essence manifested", "success");
      setModal(r.data.note);
      invalidate();
    },
    onError: (err) => {
      addToast(err?.response?.data?.error || "Error creating note", "error");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => notesAPI.update(id, data),
    onMutate: async ({ id, data: newData }) => {
      await qc.cancelQueries({ queryKey: ["notes"] });
      const previous = qc.getQueryData(["notes", viewMode]);
      qc.setQueryData(["notes", viewMode], (old) =>
        (old || []).map((n) => (n._id === id ? { ...n, ...newData } : n))
      );
      return { previous };
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        qc.setQueryData(["notes", viewMode], context.previous);
      }
      addToast(err?.response?.data?.error || "Error updating note", "error");
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
      addToast("Memory erased from neural archive", "info");
      setModal(null);
      setConfirmDialog({ open: false, title: "", message: "", id: null });
      invalidate();
    },
    onError: (err) => {
      addToast(err?.response?.data?.error || "Error deleting note", "error");
    },
  });

  const pinMutation = useMutation({
    mutationFn: notesAPI.pin,
    onSuccess: (r) => {
      const isPinned = r.data?.note?.isPinned;
      addToast(
        isPinned ? "Fragment pinned to crown" : "Fragment unpinned",
        "success"
      );
      if (modal && getSafeId(modal) === getSafeId(r.data?.note)) {
        setModal((prev) => (prev ? { ...prev, isPinned } : prev));
      }
      invalidate();
    },
    onError: (err) => {
      addToast(err?.response?.data?.error || "Error toggling pin", "error");
    },
  });

  const archiveMutation = useMutation({
    mutationFn: notesAPI.archive,
    onSuccess: (r) => {
      const isArchived = r.data?.note?.isArchived;
      addToast(
        isArchived
          ? "Fragment moved to archive"
          : "Fragment restored to active notes",
        "success"
      );
      if (modal && getSafeId(modal) === getSafeId(r.data?.note)) {
        setModal(null);
      }
      invalidate();
    },
    onError: (err) => {
      addToast(err?.response?.data?.error || "Error updating archive state", "error");
    },
  });

  const openDraft = () =>
    setModal({
      title: "",
      content: "",
      color: "#7c6dfa",
      tags: [],
      linkedTask: null,
      _isDraft: true,
    });

  const handleSave = (formData, silent = false, isDeletion = false) => {
    const noteId = modal?._id || modal?.id;
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

  const allTags = React.useMemo(() => {
    const tagSet = new Set();
    (data || []).forEach((n) => {
      if (Array.isArray(n.tags)) {
        n.tags.forEach((t) => {
          if (t && typeof t === "string" && t.trim()) tagSet.add(t.trim());
        });
      }
    });
    return Array.from(tagSet).slice(0, 10);
  }, [data]);

  const notes = React.useMemo(() => {
    const q = (search || "").trim().toLowerCase();
    return (data || [])
      .filter((n) => {
        if (selectedTag && (!Array.isArray(n.tags) || !n.tags.includes(selectedTag))) {
          return false;
        }
        if (!q) return true;
        const matchTitle = (n.title || "").toLowerCase().includes(q);
        const matchContent = (n.content || "").toLowerCase().includes(q);
        const matchTags =
          Array.isArray(n.tags) &&
          n.tags.some((t) => (t || "").toLowerCase().includes(q));
        return Boolean(matchTitle || matchContent || matchTags);
      })
      .sort((a, b) => {
        const pinDiff = (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0);
        if (pinDiff !== 0) return pinDiff;
        const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        return timeB - timeA;
      });
  }, [data, search, selectedTag]);

  const NoteCard = React.memo(({ note }) => {
    const isPinned = Boolean(note.isPinned);
    const isArchived = Boolean(note.isArchived);

    return (
      <motion.div
        layout
        whileHover={{ scale: isMobile ? 1 : 1.02, y: isMobile ? 0 : -3 }}
        whileTap={{ scale: 0.98 }}
        className="haptic-tap"
        style={{
          background: "var(--surface-solid)",
          border: `1px solid var(--border)`,
          borderLeft: `4px solid ${note.color}`,
          padding: "16px",
          borderRadius: 12,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 12,
          position: "relative",
          breakInside: "avoid",
          marginBottom: 12,
          willChange: "transform, opacity",
        }}
      >
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
              width: 36,
              height: 36,
              borderRadius: 8,
              background: `${note.color}15`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <FileText
              size={16}
              style={{
                color: note.color,
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
                flexWrap: "wrap",
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
                {note.content?.length || 0} chars
              </div>

              {Array.isArray(note.tags) && note.tags.length > 0 && (
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
                  {note.tags.slice(0, 2).map((tg) => (
                    <span
                      key={tg}
                      style={{
                        fontSize: 9,
                        padding: "1px 5px",
                        borderRadius: 4,
                        background: `${note.color}18`,
                        color: note.color,
                        fontWeight: 700,
                      }}
                    >
                      #{tg}
                    </span>
                  ))}
                  {note.tags.length > 2 && (
                    <span style={{ fontSize: 9, color: "var(--muted)", fontWeight: 600 }}>
                      +{note.tags.length - 2}
                    </span>
                  )}
                </div>
              )}

              {note.linkedTask && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "2px 6px",
                    borderRadius: 4,
                    background: "rgba(255,255,255,0.06)",
                    fontSize: 9,
                    color: "var(--muted)",
                    maxWidth: 140,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={
                    typeof note.linkedTask === "object"
                      ? note.linkedTask.title
                      : "Linked Task"
                  }
                >
                  <CheckSquare size={10} style={{ color: "var(--accent)" }} />
                  <span>
                    {typeof note.linkedTask === "object"
                      ? note.linkedTask.title
                      : "Task"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card Action Buttons: Pin, Archive, Delete */}
        <div
          style={{ display: "flex", alignItems: "center", gap: 6 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Pin Button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              pinMutation.mutate(note._id);
            }}
            title={isPinned ? "Unpin note" : "Pin note"}
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: isPinned ? "var(--accent)22" : "rgba(255,255,255,0.04)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: isPinned
                ? "1px solid var(--accent)44"
                : "1px solid rgba(255,255,255,0.06)",
              cursor: "pointer",
            }}
          >
            <Pin
              size={13}
              style={{
                color: isPinned ? "var(--accent)" : "var(--muted)",
                fill: isPinned ? "var(--accent)" : "none",
              }}
            />
          </button>

          {/* Quick Copy Button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const textToCopy = `${note.title ? note.title + "\n\n" : ""}${note.content || ""}`;
              if (textToCopy.trim()) {
                navigator.clipboard?.writeText(textToCopy);
                addToast("Fragment copied to clipboard", "success");
              } else {
                addToast("Note is empty", "info");
              }
            }}
            title="Copy note"
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: "rgba(255,255,255,0.04)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(255,255,255,0.06)",
              cursor: "pointer",
            }}
          >
            <Copy size={13} style={{ color: "var(--muted)" }} />
          </button>

          {/* Archive / Restore Button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              archiveMutation.mutate(note._id);
            }}
            title={isArchived ? "Restore to active" : "Archive note"}
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: "#18181b", colorScheme: "dark", cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(255,255,255,0.06)",
              cursor: "pointer",
            }}
          >
            {isArchived ? (
              <ArchiveRestore size={13} style={{ color: "var(--accent)" }} />
            ) : (
              <Archive size={13} style={{ color: "var(--muted)" }} />
            )}
          </button>

          {/* Delete Button */}
          <button
            type="button"
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
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: "rgba(255,107,107,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              cursor: "pointer",
            }}
            title="Delete note"
          >
            <Trash2 size={13} style={{ color: "var(--red)" }} />
          </button>
        </div>
      </motion.div>
    );
  });

  return (
    <div
      className="responsive-container page-shell"
      style={{ position: "relative", minHeight: "100vh", overflow: "hidden" }}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ position: "relative", zIndex: 1 }}
      >
        <div
          className="premium-card"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            padding: isMobile ? "20px" : "28px 32px",
            marginBottom: "32px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Background glow */}
          <div
            style={{
              position: "absolute",
              top: "-50%",
              left: "-10%",
              width: "50%",
              height: "200%",
              background:
                "radial-gradient(circle, var(--accent) 0%, transparent 70%)",
              opacity: 0.05,
              filter: "blur(40px)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              zIndex: 1,
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "16px",
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02))",
                border: "1px solid rgba(255,255,255,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
              }}
            >
              <FileText size={24} style={{ color: "var(--accent)" }} />
            </div>
            <div>
              <h1
                style={{
                  fontSize: isMobile ? "1.6rem" : "2.1rem",
                  fontWeight: 800,
                  margin: 0,
                  background:
                    "linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.7) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  letterSpacing: "-0.04em",
                }}
              >
                Notes & Fragments
              </h1>
              <p
                style={{
                  fontSize: "0.95rem",
                  color: "var(--muted)",
                  margin: "4px 0 0",
                  fontWeight: 500,
                  letterSpacing: "0.2px",
                }}
              >
                Capture ideas and documentation with end-to-end privacy
              </p>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "center",
              zIndex: 1,
            }}
          >
            <button
              onClick={openDraft}
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.03))",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#fff",
                padding: "10px 20px",
                borderRadius: "12px",
                fontSize: "13px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
                boxShadow:
                  "0 4px 12px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.1)",
                backdropFilter: "blur(10px)",
                transition: "all 0.2s ease",
              }}
              className="haptic-tap hover-lift"
            >
              <Plus size={16} style={{ color: "var(--accent)" }} />
              <span style={{ letterSpacing: "0.5px" }}>New Note</span>
            </button>
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
              {/* Search, Filter Tabs & Statistics */}
              <div
                className="premium-card"
                style={{
                  padding: "16px",
                  borderRadius: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* View Mode Tabs: Active vs Archive */}
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    background: "rgba(0,0,0,0.25)",
                    padding: 4,
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode("active");
                      setSelectedTag(null);
                      setModal(null);
                    }}
                    style={{
                      flex: 1,
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: "none",
                      background:
                        viewMode === "active"
                          ? "rgba(255,255,255,0.12)"
                          : "transparent",
                      color: viewMode === "active" ? "#fff" : "var(--muted)",
                      fontWeight: 700,
                      fontSize: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    <FileText size={13} />
                    <span>Active Notes</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode("archived");
                      setSelectedTag(null);
                      setModal(null);
                    }}
                    style={{
                      flex: 1,
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: "none",
                      background:
                        viewMode === "archived"
                          ? "rgba(255,255,255,0.12)"
                          : "transparent",
                      color: viewMode === "archived" ? "#fff" : "var(--muted)",
                      fontWeight: 700,
                      fontSize: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    <Archive size={13} />
                    <span>Archive</span>
                  </button>
                </div>

                {/* Search Bar */}
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
                    boxShadow: "inset 0 2px 4px rgba(0,0,0,0.2)",
                  }}
                >
                  <Search size={15} color="var(--accent)" />
                  <input
                    className="no-ring"
                    style={{
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      boxShadow: "none",
                      color: "var(--text)",
                      fontWeight: 500,
                      width: "100%",
                      fontSize: 13,
                    }}
                    placeholder={`Find in ${viewMode === "archived" ? "archive" : "notes"}...`}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--muted)",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 900,
                    color: "var(--muted)",
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>{viewMode === "archived" ? "ARCHIVED MEMORIES" : "ACTIVE FRAGMENTS"}</span>
                  <span>{notes.length} Fragments</span>
                </div>

                {/* Tag Filter Chips */}
                {allTags.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      flexWrap: "wrap",
                      alignItems: "center",
                      paddingTop: 4,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 900,
                        color: "var(--muted)",
                        letterSpacing: 1,
                        textTransform: "uppercase",
                      }}
                    >
                      TAGS:
                    </span>
                    {allTags.map((tag) => {
                      const isSelected = selectedTag === tag;
                      return (
                        <button
                          key={tag}
                          type="button"
                          className="haptic-tap"
                          onClick={() => setSelectedTag(isSelected ? null : tag)}
                          style={{
                            padding: "3px 8px",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            background: isSelected
                              ? "var(--accent)"
                              : "rgba(255,255,255,0.04)",
                            color: isSelected ? "#fff" : "var(--muted)",
                            border: isSelected
                              ? "1px solid var(--accent)"
                              : "1px solid rgba(255,255,255,0.08)",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                        >
                          #{tag}
                        </button>
                      );
                    })}
                    {selectedTag && (
                      <button
                        type="button"
                        onClick={() => setSelectedTag(null)}
                        style={{
                          background: "none",
                          border: "none",
                          fontSize: 10,
                          color: "var(--muted)",
                          cursor: "pointer",
                          textDecoration: "underline",
                        }}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Note Cards List */}
              {notes.length === 0 ? (
                <div
                  className="premium-card notes-empty-card"
                  style={{
                    padding: "40px 24px",
                    textAlign: "center",
                    borderRadius: 20,
                  }}
                >
                  <div style={{ fontSize: 36, marginBottom: 16 }}>
                    {viewMode === "archived" ? "📦" : "🧠"}
                  </div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 900,
                      fontFamily: "Syne",
                      marginBottom: 6,
                    }}
                  >
                    {viewMode === "archived"
                      ? "Archive is Empty"
                      : "No Notes Found"}
                  </div>
                  <div
                    style={{
                      color: "var(--muted)",
                      fontSize: 12,
                      lineHeight: 1.4,
                    }}
                  >
                    {viewMode === "archived"
                      ? "Completed or stashed notes will appear here."
                      : "Manifest a new fragment to begin."}
                  </div>
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
                            border: isActive
                              ? `2px solid ${n.color}`
                              : "2px solid transparent",
                            transition: "border-color 0.2s ease",
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
                  flexDirection: "column",
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
                    onPin={(id) => pinMutation.mutate(id)}
                    onArchive={(id) => archiveMutation.mutate(id)}
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
                      borderRadius: 16,
                    }}
                  >
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 20,
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.05)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 20,
                      }}
                    >
                      <FileText size={32} color="var(--accent)" />
                    </div>
                    <h3
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        marginBottom: 8,
                        color: "var(--text)",
                      }}
                    >
                      No Note Selected
                    </h3>
                    <p
                      style={{
                        fontSize: 14,
                        color: "var(--muted)",
                        maxWidth: 300,
                        lineHeight: 1.5,
                        fontWeight: 500,
                      }}
                    >
                      Select an existing fragment from the list or manifest a
                      new one to begin editing.
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
              onClose={(shouldDelete = false) => {
                if (shouldDelete) {
                  handleSave(null, false, true);
                } else {
                  setModal(null);
                  invalidate();
                }
              }}
              onSave={handleSave}
              onPin={(id) => pinMutation.mutate(id)}
              onArchive={(id) => archiveMutation.mutate(id)}
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
      `}</style>
    </div>
  );
}
