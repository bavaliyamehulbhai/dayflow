import React, { useState, useEffect, useRef, useMemo, useDeferredValue } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksAPI } from "../utils/api";
import { useNotifications } from "../context/NotificationContext";
import {
  format,
  startOfDay,
  addDays,
  isPast,
  differenceInDays,
} from "date-fns";
import { safeFormat } from "../utils/dateUtils";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  AlertCircle,
  Check,
  CheckCircle2,
  X,
  ClipboardList,
  Clock,
  Tag,
  Calendar,
  Layers,
  Zap,
  Trophy,
  ChevronRight,
  FileText,
  FileSpreadsheet,
} from "lucide-react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
} from "framer-motion";
import useFeedback from "../hooks/useFeedback";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";
import SensitivityShield from "../components/layout/SensitivityShield";
import { useNavigate, useLocation } from "react-router-dom";
import MagneticButton from "../components/common/MagneticButton";
import { exportToCSV, exportToPDF } from "../utils/exportUtils";
import MobileBottomSheet from "../components/common/MobileBottomSheet";
import AuraOrb from "../components/common/AuraOrb";
import { getSafeId } from "../utils/idUtils";
import { FixedSizeList as List } from "react-window";

const PRIORITIES = ["low", "medium", "high", "urgent"];
const STATUSES = ["pending", "in-progress", "completed", "cancelled"];
const CATEGORIES = [
  "General",
  "Work",
  "Personal",
  "Health",
  "Learning",
  "Finance",
  "Other",
];

function useWindowWidth() {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return w;
}

function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  useEffect(() => {
    const h = () =>
      setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return size;
}

// ─── Memoized Task Item Component ──────────────────────────────────────────
const TaskItem = React.memo(
  React.forwardRef(
    (
      {
        task,
        selected,
        toggleSelect,
        toggleComplete,
        setModal,
        setConfirmState,
        isMobile,
        deleteMutation,
      },
      ref,
    ) => {
      const x = useMotionValue(0);
      const background = useTransform(
        x,
        [-100, 0, 100],
        ["rgba(239, 68, 68, 0.4)", "transparent", "rgba(34, 197, 94, 0.4)"],
      );
      const opacity = useTransform(x, [-100, -50, 0, 50, 100], [1, 0, 0, 0, 1]);
      const scale = useTransform(x, [-100, 0, 100], [1.1, 1, 1.1]);

      const handleDragEnd = (event, info) => {
        if (info.offset.x > 100) {
          toggleComplete(task);
        } else if (info.offset.x < -100) {
          setConfirmState({
            open: true,
            title: "Remove Objective?",
            message: `Delete "${task.title}"?`,
            onConfirm: () => deleteMutation.mutate(getSafeId(task)),
          });
        }
      };

      const isOverdue =
        task.dueDate &&
        new Date(task.dueDate) < new Date() &&
        task.status !== "completed";
      const priorityAura = {
        urgent: "0 0 30px rgba(248, 113, 113, 0.12)",
        high: "0 0 20px rgba(251, 146, 60, 0.08)",
        medium: "none",
        low: "none",
      }[task.priority];

      return (
        <motion.div
          ref={ref}
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative overflow-hidden mb-2"
          style={{ borderRadius: 12 }}
        >
          {/* Swipe Actions Background */}
          <motion.div
            className="absolute inset-0 flex items-center justify-between px-6 z-0"
            style={{ background, borderRadius: 12 }}
          >
            <motion.div
              style={{ opacity, scale }}
              className="text-white font-bold flex items-center gap-2"
            >
              <Trash2 size={24} strokeWidth={2.5} />
              <span
                style={{
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                }}
              >
                Delete
              </span>
            </motion.div>
            <motion.div
              style={{ opacity, scale }}
              className="text-white font-bold flex items-center gap-2"
            >
              <CheckCircle2 size={24} strokeWidth={2.5} />
              <span
                style={{
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                }}
              >
                Complete
              </span>
            </motion.div>
          </motion.div>

          <motion.div
            drag={isMobile ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.5}
            dragDirectionLock
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            whileTap={{ scale: 0.98 }}
            className={`card ${selected ? "selected-task" : ""}`}
            style={{
              x,
              touchAction: "pan-y",
              zIndex: 1,
              position: "relative",
              padding: 0,
              overflow: "hidden",
              boxShadow: selected
                ? `inset 0 1px 0 rgba(255,255,255,0.05), 0 0 0 1px var(--accent)`
                : "inset 0 1px 0 rgba(255,255,255,0.05)",
              border: "1px solid var(--border)",
              background: selected ? "rgba(255,255,255,0.03)" : "var(--surface-solid)",
              borderRadius: 12,
            }}
            onClick={() => setModal(task)}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                background: "transparent",
              }}
            >
              <div
                className="task-row-check"
                onClick={(e) => e.stopPropagation()}
              >
                <motion.button
                  whileTap={{ scale: 0.8 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleComplete(task);
                  }}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    border: `2px solid ${task.status === "completed" ? "#22c55e" : "rgba(255,255,255,0.15)"}`,
                    background:
                      task.status === "completed" ? "#22c55e" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "none",
                  }}
                >
                  <AnimatePresence>
                    {task.status === "completed" && (
                      <motion.div
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0 }}
                      >
                        <Check size={18} color="white" strokeWidth={4} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 500,
                    textDecoration:
                      task.status === "completed" ? "line-through" : "none",
                    color:
                      task.status === "completed"
                        ? "var(--muted)"
                        : "var(--text)",
                    marginBottom: 4,
                  }}
                >
                  <SensitivityShield>{task.title}</SensitivityShield>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                    fontSize: 9,
                    fontWeight: 900,
                    color: "var(--muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  {task.category && (
                    <span
                      className="glass"
                      style={{
                        padding: "2px 8px",
                        borderRadius: 6,
                        border: "none",
                      }}
                    >
                      {task.category}
                    </span>
                  )}
                  {task.priority !== "medium" && (
                    <span style={{ color: `var(--${task.priority})` }}>
                      {task.priority}
                    </span>
                  )}
                  {task.dueDate && (
                    <span
                      style={{
                        color: isOverdue ? "var(--red)" : "inherit",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Clock size={10} />{" "}
                      {safeFormat(task.dueDate, "MMM d", "PENDING")}
                    </span>
                  )}
                </div>
              </div>

              <div
                className="task-row-actions"
                style={{ display: "flex", gap: 4 }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className={`btn btn-icon btn-sm haptic-tap ${selected ? "text-accent" : "text-muted"}`}
                  onClick={() => toggleSelect(getSafeId(task))}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      );
    },
  ),
  (prev, next) => {
    return (
      JSON.stringify(prev.task) === JSON.stringify(next.task) &&
      prev.selected === next.selected &&
      prev.isMobile === next.isMobile
    );
  },
);

// ─── Kanban Card Component ──────────────────────────────────────────
const KanbanCard = React.memo(({ task, toggleComplete, setModal, deleteMutation, updateMutation, setConfirmState }) => {
  const tid = getSafeId(task);
  const priorityColor = {
    urgent: "var(--red)",
    high: "var(--orange)",
    medium: "var(--yellow)",
    low: "var(--green)"
  }[task.priority] || "var(--muted)";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      onClick={() => setModal(task)}
      style={{
        padding: "12px 16px",
        background: "rgba(255, 255, 255, 0.02)",
        borderRadius: 8,
        border: "1px solid rgba(255, 255, 255, 0.05)",
        borderLeft: `3px solid ${priorityColor}`,
        cursor: "pointer",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.02)",
        backdropFilter: "blur(10px)",
        transition: "border-color 0.2s ease, background 0.2s ease"
      }}
      className="hover-lift"
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ 
          fontSize: 14, 
          fontWeight: 600, 
          color: task.status === "completed" ? "var(--muted)" : "white",
          textDecoration: task.status === "completed" ? "line-through" : "none",
          lineHeight: 1.4,
          wordBreak: "break-word"
        }}>
          {task.title}
        </div>
      </div>

      {task.description && (
        <div style={{ fontSize: 12, color: "var(--text2)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.5 }}>
          {task.description}
        </div>
      )}

      {/* Subtasks Progress if any exist */}
      {task.subtasks && task.subtasks.length > 0 && (() => {
        const completedCount = task.subtasks.filter(s => s.completed).length;
        const pct = Math.round((completedCount / task.subtasks.length) * 100);
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--muted)", fontWeight: 700 }}>
              <span>CHECKLIST</span>
              <span>{completedCount}/{task.subtasks.length}</span>
            </div>
            <div style={{ height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: "var(--accent)", borderRadius: 2 }} />
            </div>
          </div>
        );
      })()}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6, paddingTop: 4, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {task.category && (
            <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "rgba(255,255,255,0.05)", color: "var(--text2)", fontWeight: 700, letterSpacing: 0.5 }}>
              {task.category.toUpperCase()}
            </span>
          )}
          {task.dueDate && (
            <span style={{ fontSize: 9, color: "var(--muted)", display: "flex", alignItems: "center", gap: 3, fontWeight: 600 }}>
              <Clock size={10} />
              {safeFormat(task.dueDate, "MMM d", "")}
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: 4, alignItems: "center" }} onClick={e => e.stopPropagation()}>
          {/* Quick status transition actions */}
          {task.status === "pending" && (
            <button
              onClick={() => updateMutation.mutate({ id: tid, data: { status: "in-progress" }, suppressToast: true })}
              style={{ padding: "4px 8px", fontSize: 10, fontWeight: 700, color: "var(--accent)", background: "rgba(99,102,241,0.1)", borderRadius: 6 }}
              className="haptic-tap"
            >
              START
            </button>
          )}
          {task.status === "in-progress" && (
            <button
              onClick={() => updateMutation.mutate({ id: tid, data: { status: "completed" }, suppressToast: true })}
              style={{ padding: "4px 8px", fontSize: 10, fontWeight: 700, color: "var(--green)", background: "rgba(34,197,94,0.1)", borderRadius: 6 }}
              className="haptic-tap"
            >
              COMPLETE
            </button>
          )}
          {task.status === "completed" && (
            <button
              onClick={() => updateMutation.mutate({ id: tid, data: { status: "pending" }, suppressToast: true })}
              style={{ padding: "4px 8px", fontSize: 10, fontWeight: 700, color: "var(--muted)", background: "rgba(255,255,255,0.05)", borderRadius: 6 }}
              className="haptic-tap"
            >
              REOPEN
            </button>
          )}

          <button
            onClick={() => setConfirmState({
              open: true,
              title: "Remove Objective?",
              message: `Delete "${task.title}"?`,
              onConfirm: () => deleteMutation.mutate(tid)
            })}
            style={{ padding: 6, color: "var(--red)", opacity: 0.5, borderRadius: 6 }}
            className="haptic-tap hover-lift"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </motion.div>
  );
});

// ─── Skeleton loader rows ─────────────────────────────────────────────────────
function TasksSkeleton() {
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "18px 24px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div
            className="skeleton"
            style={{ width: 16, height: 16, borderRadius: 4 }}
          />
          <div
            className="skeleton"
            style={{ width: 24, height: 24, borderRadius: 7 }}
          />
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div
              className="skeleton skeleton-text"
              style={{ height: 14, width: "60%" }}
            />
            <div
              className="skeleton skeleton-text"
              style={{ height: 10, width: "30%" }}
            />
          </div>
          <div
            className="skeleton"
            style={{ width: 72, height: 24, borderRadius: 20 }}
          />
          <div style={{ display: "flex", gap: 4 }}>
            <div
              className="skeleton"
              style={{ width: 32, height: 32, borderRadius: 8 }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Task modal ───────────────────────────────────────────────────────────────
function TaskModal({ task, onClose, onSave }) {
  const { addToast } = useNotifications();
  const isMobile = window.innerWidth <= 768;
  const [form, setForm] = useState({
    title: task?.title || "",
    description: task?.description || "",
    priority: task?.priority || "medium",
    status: task?.status || "pending",
    category: task?.category || "General",
    dueDate: task?.dueDate ? safeFormat(task.dueDate, "yyyy-MM-dd", "") : "",
    estimatedMinutes: task?.estimatedMinutes || "",
    tags: task?.tags?.join(", ") || "",
    subtasks: task?.subtasks || [],
  });
  const [newSubtask, setNewSubtask] = useState("");

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    setForm((f) => ({
      ...f,
      subtasks: [...f.subtasks, { title: newSubtask.trim(), completed: false }],
    }));
    setNewSubtask("");
  };

  const removeSubtask = (i) =>
    setForm((f) => ({
      ...f,
      subtasks: f.subtasks.filter((_, idx) => idx !== i),
    }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim())
      return addToast("Objective title is required", "error");
    onSave({
      ...form,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      dueDate: form.dueDate || null,
      estimatedMinutes: form.estimatedMinutes
        ? parseInt(form.estimatedMinutes)
        : null,
    });
  };

  const modalContent = (
    <form onSubmit={handleSubmit} style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
      <div
        className="modal-body custom-scrollbar"
        style={{
          padding: isMobile ? "0" : "32px",
          paddingBottom: isMobile
            ? "calc(20px + env(safe-area-inset-bottom))"
            : 32,
          flex: 1,
          overflowY: "auto",
        }}
      >
        <div className="form-group mb-6">
          <label
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: "var(--muted)",
              letterSpacing: 1.5,
              textTransform: "uppercase",
              marginBottom: 8,
              display: "block",
            }}
          >
            Objective Title
          </label>
          <input
            className="auth-input"
            style={{
              height: 48,
              fontSize: 15,
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "0 16px"
            }}
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="E.g., Complete the Q4 report"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="form-group">
            <label
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: "var(--muted)",
                textTransform: "uppercase",
                marginBottom: 8,
                display: "block",
              }}
            >
              Priority
            </label>
            <select
              className="select"
              style={{ height: 42, borderRadius: 6, width: "100%", background: "var(--bg)", border: "1px solid var(--border)", padding: "0 12px" }}
              value={form.priority}
              onChange={(e) =>
                setForm((f) => ({ ...f, priority: e.target.value }))
              }
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: "var(--muted)",
                textTransform: "uppercase",
                marginBottom: 8,
                display: "block",
              }}
            >
              Status
            </label>
            <select
              className="select"
              style={{ height: 42, borderRadius: 6, width: "100%", background: "var(--bg)", border: "1px solid var(--border)", padding: "0 12px" }}
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value }))
              }
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace("-", " ").toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group mb-6">
          <label
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: "var(--muted)",
              textTransform: "uppercase",
              marginBottom: 8,
              display: "block",
            }}
          >
            Category
          </label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setForm((f) => ({ ...f, category: cat }))}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: form.category === cat ? "1px solid var(--text)" : "1px solid var(--border)",
                  background: form.category === cat ? "var(--text)" : "var(--surface-solid)",
                  color: form.category === cat ? "var(--bg)" : "var(--text2)",
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group mb-8">
          <label
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: "var(--muted)",
              textTransform: "uppercase",
              marginBottom: 8,
              display: "block",
            }}
          >
            Timeline
          </label>
          <input
            type="date"
            className="auth-input"
            style={{
              height: 42,
              borderRadius: 6,
              background: "var(--bg)",
              border: "1px solid var(--border)",
              padding: "0 12px"
            }}
            value={form.dueDate}
            onChange={(e) =>
              setForm((f) => ({ ...f, dueDate: e.target.value }))
            }
          />
        </div>

        <button
          type="submit"
          style={{
            height: 48,
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            background: "var(--text)",
            color: "var(--bg)",
            border: "none",
            cursor: "pointer",
          }}
        >
          {task ? "Save changes" : "Create task"}
        </button>
      </div>
    </form>
  );

  if (isMobile) {
    return (
      <MobileBottomSheet
        isOpen={true}
        onClose={onClose}
        title={task ? "Refine Mission" : "New Objective"}
      >
        {modalContent}
      </MobileBottomSheet>
    );
  }

  return (
    <div
      className="modal-overlay"
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        transition={{ type: "spring", damping: 25, stiffness: 400 }}
        style={{ 
          width: "100%", 
          maxWidth: 480, 
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          padding: 0, 
          overflow: "hidden", 
          background: "var(--surface-solid)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          boxShadow: "0 10px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)"
        }}
      >
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div
            style={{ fontWeight: 600, fontSize: 18, color: "var(--text)" }}
          >
            {task ? "Edit Task" : "New Task"}
          </div>
          <button
            className="modal-close haptic-tap"
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.05)",
              borderRadius: 12,
              padding: 8,
            }}
          >
            <X size={20} />
          </button>
        </div>
        {modalContent}
      </motion.div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function TasksPage() {
  const qc = useQueryClient();
  const feedback = useFeedback();
  const { addToast } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const width = useWindowWidth();
  const isMobile = width <= 768;
  const { width: windowWidth, height: windowHeight } = useWindowSize();
  const [modal, setModal] = useState(null);
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    search: "",
    sortBy: "createdAt",
  });
  const [selected, setSelected] = useState([]);
  const [confirmState, setConfirmState] = useState({ open: false, task: null });
  const [viewMode, setViewMode] = useState("list");

  const deferredSearch = useDeferredValue(filters.search);
  const activeFilters = useMemo(() => ({
    ...filters,
    search: deferredSearch,
  }), [filters.status, filters.priority, filters.sortBy, deferredSearch]);

  const { data, isLoading } = useQuery({
    queryKey: ["tasks", activeFilters],
    queryFn: () => tasksAPI.getAll(activeFilters).then((r) => r.data),
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const action = params.get("action");
    const status = params.get("status");
    const priority = params.get("priority");

    if (action === "create") {
      setModal("create");
    }

    if (status || priority) {
      setFilters((f) => ({
        ...f,
        status: status || f.status,
        priority: priority || f.priority,
      }));
    }

    if (action || status || priority) {
      // Clear URL params to avoid persistent filtering on refresh
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  const { data: statsData } = useQuery({
    queryKey: ["task-stats"],
    queryFn: () => tasksAPI.stats().then((r) => r.data.stats),
  });

  const invalidate = () => {
    qc.invalidateQueries(["tasks"]);
    qc.invalidateQueries(["task-stats"]);
  };

  const createMutation = useMutation({
    mutationFn: (d) => tasksAPI.create(d),
    onSuccess: () => {
      addToast("Objective manifested successfully", "success");
      setModal(null);
      invalidate();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => tasksAPI.update(id, data),
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const previousState = qc.getQueryData(["tasks", filters]);
      if (previousState) {
        qc.setQueryData(["tasks", filters], {
          ...previousState,
          tasks: previousState.tasks.map(t => t._id === id || (t.id && t.id === id) ? { ...t, ...data } : t)
        });
      }
      return { previousState };
    },
    onError: (err, variables, context) => {
      if (context?.previousState) {
        qc.setQueryData(["tasks", filters], context.previousState);
      }
      addToast(err.response?.data?.error || "Failed to update objective", "error");
    },
    onSettled: () => {
      invalidate();
    },
    onSuccess: (res, variables) => {
      if (!variables?.suppressToast) {
        addToast("Objective refined", "success");
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => tasksAPI.delete(id),
    onSuccess: () => {
      addToast("Objective liquidated", "info");
      setConfirmState({ open: false, task: null });
      invalidate();
    },
  });

  const tasks = data?.tasks || [];

  const kanbanColumns = useMemo(() => {
    return [
      { id: "pending", title: "To Do", tasks: tasks.filter(t => t.status === "pending" || t.status === "cancelled"), color: "var(--accent)" },
      { id: "in-progress", title: "In Progress", tasks: tasks.filter(t => t.status === "in-progress"), color: "var(--orange)" },
      { id: "completed", title: "Done", tasks: tasks.filter(t => t.status === "completed"), color: "var(--green)" }
    ];
  }, [tasks]);

  useEffect(() => {
    const handler = () => setModal("create");
    window.addEventListener("df_open_create_modal", handler);
    return () => window.removeEventListener("df_open_create_modal", handler);
  }, []);

  const handleSave = (formData) => {
    const tid = getSafeId(modal);
    if (modal && tid && modal !== "create") {
      updateMutation.mutate({ id: tid, data: formData });
      setModal(null);
    } else {
      createMutation.mutate(formData);
    }
  };

  const toggleInFlight = useRef(new Set());

  const toggleComplete = (task) => {
    const taskId = getSafeId(task);
    if (toggleInFlight.current.has(taskId)) return;

    const newStatus = task.status === "completed" ? "pending" : "completed";
    if (newStatus === "completed") {
      feedback("success");
      addToast(`Objective secured: ${task.title}`, "success");
    } else {
      addToast(`Objective reopened: ${task.title}`, "info");
    }

    toggleInFlight.current.add(taskId);
    updateMutation.mutate(
      { id: taskId, data: { status: newStatus }, suppressToast: true },
      {
        onSettled: () => {
          toggleInFlight.current.delete(taskId);
        },
      },
    );
  };

  const toggleSelect = (id) =>
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    );

  const handleDelete = (task) => {
    deleteMutation.mutate(getSafeId(task));
  };

  const handleBulkComplete = () => {
    selected.forEach((id) => {
      const task = tasks.find((t) => getSafeId(t) === id);
      if (task && task.status !== "completed") {
        updateMutation.mutate({ id, data: { status: "completed" } });
      }
    });
    setSelected([]);
    addToast(`${selected.length} objectives secured in bulk`, "success");
    feedback("success");
  };

  const handleBulkDelete = () => {
    setConfirmState({
      open: true,
      title: `Remove ${selected.length} Objectives?`,
      message:
        "This action cannot be undone. Are you sure you want to proceed?",
      onConfirm: () => {
        selected.forEach((id) => deleteMutation.mutate(id));
        setSelected([]);
        setConfirmState({ open: false, task: null });
      },
    });
  };

  return (
    <div
      className="responsive-container page-shell"
      style={{
        position: "relative",
        minHeight: "100vh",
        paddingBottom: 120,
      }}
    >
      {/* Immersive Background Layer */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: -1 }}>
        <AuraOrb
          color="rgba(124, 109, 250, 0.15)"
          size="400px"
          top="-10%"
          left="-10%"
          delay={0}
        />
        <AuraOrb
          color="rgba(244, 63, 94, 0.1)"
          size="350px"
          top="30%"
          left="60%"
          delay={2}
        />
        <AuraOrb
          color="rgba(6, 182, 212, 0.1)"
          size="300px"
          top="70%"
          left="10%"
          delay={4}
        />
      </div>

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
        {/* Subtle background glow */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          left: '-10%',
          width: '50%',
          height: '200%',
          background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)',
          opacity: 0.05,
          filter: 'blur(40px)',
          pointerEvents: 'none'
        }} />

        <div style={{ display: "flex", alignItems: "center", gap: "20px", zIndex: 1 }}>
          <div style={{
            width: "48px",
            height: "48px",
            borderRadius: "16px",
            background: "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02))",
            border: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 16px rgba(0,0,0,0.2)"
          }}>
            <ClipboardList size={24} style={{ color: "var(--accent)" }} />
          </div>
          <div>
            <h1
              style={{
                fontSize: isMobile ? "1.6rem" : "2.1rem",
                fontWeight: 800,
                margin: 0,
                background: "linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.7) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "-0.04em"
              }}
            >
              Tasks
            </h1>
            <p style={{ fontSize: "0.95rem", color: "var(--muted)", margin: "4px 0 0", fontWeight: 500, letterSpacing: "0.2px" }}>
              Manage and track your objectives
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "16px", alignItems: "center", zIndex: 1 }}>
          <div style={{
            display: "flex",
            background: "rgba(0, 0, 0, 0.3)",
            borderRadius: "12px",
            padding: "4px",
            border: "1px solid rgba(255,255,255,0.05)",
            boxShadow: "inset 0 2px 4px rgba(0,0,0,0.5)"
          }}>
            <button
              onClick={() => setViewMode("list")}
              style={{
                padding: "8px 16px",
                fontSize: "11px",
                fontWeight: 800,
                borderRadius: "10px",
                background: viewMode === "list" ? "var(--accent)" : "transparent",
                color: viewMode === "list" ? "white" : "var(--muted)",
                transition: "all 0.2s ease",
                letterSpacing: "0.5px"
              }}
              type="button"
            >
              LIST
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              style={{
                padding: "8px 16px",
                fontSize: "11px",
                fontWeight: 800,
                borderRadius: "10px",
                background: viewMode === "kanban" ? "var(--accent)" : "transparent",
                color: viewMode === "kanban" ? "white" : "var(--muted)",
                transition: "all 0.2s ease",
                letterSpacing: "0.5px"
              }}
              type="button"
            >
              BOARD
            </button>
          </div>
          <button
            onClick={() => setModal("create")}
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.03))",
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
              boxShadow: "0 4px 12px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.1)",
              backdropFilter: "blur(10px)",
              transition: "all 0.2s ease"
            }}
            className="haptic-tap hover-lift"
          >
            <Plus size={16} style={{ color: "var(--accent)" }} />
            <span style={{ letterSpacing: "0.5px" }}>New Task</span>
          </button>
        </div>
      </div>

      {statsData && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 12,
            marginBottom: 24,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="app-module-entrance"
            style={{
              padding: "16px 20px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)",
              backdropFilter: "blur(20px)",
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 900,
                color: "var(--muted)",
                letterSpacing: 1.5,
                marginBottom: 4,
                textTransform: "uppercase",
              }}
            >
              Active Tasks
            </div>
            <div
              style={{
                fontSize: "24px",
                fontWeight: 700,
                fontFamily: "Inter, sans-serif",
                color: "white",
              }}
            >
              {statsData.total}
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="app-module-entrance"
            style={{
              padding: "16px 20px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)",
              backdropFilter: "blur(20px)",
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 900,
                color: "var(--muted)",
                letterSpacing: 1.5,
                marginBottom: 4,
                textTransform: "uppercase",
              }}
            >
              Secured
            </div>
            <div
              style={{
                fontSize: "24px",
                fontWeight: 700,
                fontFamily: "Inter, sans-serif",
                color: "var(--green)",
              }}
            >
              {statsData.completed}
            </div>
          </motion.div>
        </div>
      )}

      {/* Filter and Action Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{ marginBottom: 24 }}
      >
        <div
          style={{
            padding: "8px",
            borderRadius: 8,
            background: "var(--surface-solid)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div style={{
              position: "relative",
              flex: "1 1 280px",
              display: "flex",
              alignItems: "center",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10,
              height: 42,
              padding: "0 14px",
              gap: 10
            }}>
              <Search
                size={16}
                color="var(--muted)"
                style={{ flexShrink: 0 }}
              />
              <input
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#ffffff",
                  fontSize: 13,
                  width: "100%",
                  fontWeight: 500,
                  padding: 0
                }}
                placeholder="Search objectives..."
                value={filters.search}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, search: e.target.value }))
                }
              />
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <select
                style={{
                  height: 42,
                  borderRadius: 10,
                  minWidth: 130,
                  fontSize: 12,
                  fontWeight: 600,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#e4e4e7",
                  padding: "0 12px",
                  cursor: "pointer",
                  outline: "none"
                }}
                value={filters.status}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, status: e.target.value }))
                }
              >
                <option value="">STATUS: ALL</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace("-", " ").toUpperCase()}
                  </option>
                ))}
              </select>
              <select
                style={{
                  height: 42,
                  borderRadius: 10,
                  minWidth: 130,
                  fontSize: 12,
                  fontWeight: 600,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#e4e4e7",
                  padding: "0 12px",
                  cursor: "pointer",
                  outline: "none"
                }}
                value={filters.priority}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, priority: e.target.value }))
                }
              >
                <option value="">PRIORITY: ALL</option>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </motion.div>

      {isLoading ? (
        <TasksSkeleton />
      ) : (
        <div className="tasks-list" style={{ paddingBottom: 20 }}>
          {tasks.length > 0 ? (
            viewMode === "list" ? (
              <div className="tasks-container">
                <List
                  height={isMobile ? Math.max(300, windowHeight - 300) : 700}
                  itemCount={tasks.length}
                  itemSize={isMobile ? 80 : 72}
                  width="100%"
                  itemData={tasks}
                  itemKey={(index, data) => getSafeId(data[index]) || index}
                >
                  {({ index, style }) => {
                    const task = tasks[index];
                    return (
                      <div style={{ ...style, paddingTop: 4 }}>
                        <TaskItem
                          task={task}
                          isMobile={isMobile}
                          selected={selected.includes(getSafeId(task))}
                          toggleSelect={toggleSelect}
                          toggleComplete={toggleComplete}
                          setModal={setModal}
                          setConfirmState={setConfirmState}
                          deleteMutation={deleteMutation}
                        />
                      </div>
                    );
                  }}
                </List>
              </div>
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
                gap: 20,
                alignItems: "start",
                marginTop: 8
              }}>
                {kanbanColumns.map(col => (
                  <div key={col.id} style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    padding: 16,
                    minHeight: 300
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: col.color }} />
                        <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", textTransform: "uppercase", letterSpacing: 1 }}>{col.title}</span>
                      </div>
                      <span style={{ fontSize: 10, padding: "2px 8px", background: "rgba(255,255,255,0.04)", borderRadius: 10, fontWeight: 700, color: "var(--text2)" }}>{col.tasks.length}</span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {col.tasks.map(task => (
                        <KanbanCard
                          key={getSafeId(task)}
                          task={task}
                          toggleComplete={toggleComplete}
                          setModal={setModal}
                          deleteMutation={deleteMutation}
                          updateMutation={updateMutation}
                          setConfirmState={setConfirmState}
                        />
                      ))}
                      {col.tasks.length === 0 && (
                        <div style={{ textAlign: "center", padding: "40px 10px", color: "var(--muted)", fontSize: 12, border: "1px dashed rgba(255,255,255,0.04)", borderRadius: 12 }}>
                          No tasks in this board
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <EmptyState
              key="tasks-empty"
              icon={ClipboardList}
              title="No Missions Found"
              description="Adjust filters or manifest a new objective."
            />
          )}
        </div>
      )}

      {/* Floating Bulk Actions - Adjusted for App Dock */}
      <AnimatePresence>
        {selected.length > 0 && (
          <motion.div
            initial={{ y: 100, x: "-50%", opacity: 0 }}
            animate={{ y: -20, x: "-50%", opacity: 1 }}
            exit={{ y: 100, x: "-50%", opacity: 0 }}
            className="floating-bulk-actions"
            style={{
              position: "fixed",
              bottom: 100,
              left: "50%",
              zIndex: 900,
              background: "rgba(10, 10, 12, 0.85)",
              padding: "12px 24px",
              borderRadius: 20,
              backdropFilter: "blur(40px) saturate(200%)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 25px 50px rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              gap: 20,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 900, color: "white" }}>
              {selected.length} SELECTED
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn btn-sm btn-primary haptic-tap"
                onClick={handleBulkComplete}
                style={{ height: 40, borderRadius: 12 }}
              >
                <CheckCircle2 size={16} /> <span>Secure</span>
              </button>
              <button
                className="btn btn-icon btn-sm glass haptic-tap text-red"
                onClick={handleBulkDelete}
                style={{ width: 40, height: 40, borderRadius: 12 }}
              >
                <Trash2 size={16} />
              </button>
              <button
                className="btn btn-icon btn-sm glass haptic-tap"
                onClick={() => setSelected([])}
                style={{ width: 40, height: 40, borderRadius: 12 }}
              >
                <X size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modal && (
          <TaskModal
            task={modal === "create" ? null : modal}
            onClose={() => setModal(null)}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title || "Remove Objective?"}
        message={
          confirmState.message ||
          "Are you sure you want to proceed? This mission will be lost forever."
        }
        confirmText="Remove"
        onConfirm={
          confirmState.onConfirm || (() => handleDelete(confirmState.task))
        }
        onCancel={() =>
          setConfirmState({
            open: false,
            task: null,
            onConfirm: null,
            title: null,
            message: null,
          })
        }
      />
    </div>
  );
}
