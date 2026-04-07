import React, { useState, useEffect, useRef, useMemo } from "react";
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
import { FixedSizeList as List } from "react-window";
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
          layout
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative overflow-hidden mb-4"
          style={{ borderRadius: 24 }}
        >
          {/* Swipe Actions Background */}
          <motion.div
            className="absolute inset-0 flex items-center justify-between px-8 z-0"
            style={{ background, borderRadius: 24 }}
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
            className={`app-module-entrance premium-card ${selected ? "selected-aura" : ""}`}
            style={{
              x,
              touchAction: "pan-y",
              zIndex: 1,
              position: "relative",
              padding: 0,
              overflow: "hidden",
              boxShadow: selected
                ? `0 0 40px var(--accent-glow)`
                : priorityAura,
              border: selected
                ? "2px solid var(--accent)"
                : "1px solid rgba(255, 255, 255, 0.08)",
              background: "rgba(255, 255, 255, 0.03)",
              backdropFilter: "blur(30px) saturate(210%)",
              borderRadius: 24,
            }}
            onClick={() => setModal(task)}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "18px 20px",
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
                    width: 32,
                    height: 32,
                    borderRadius: 12,
                    border: `3px solid ${task.status === "completed" ? "#22c55e" : "rgba(255,255,255,0.15)"}`,
                    background:
                      task.status === "completed" ? "#22c55e" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow:
                      task.status === "completed"
                        ? "0 0 25px rgba(34, 197, 94, 0.4)"
                        : "none",
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
                    fontSize: 16,
                    fontWeight: 700,
                    textDecoration:
                      task.status === "completed" ? "line-through" : "none",
                    color:
                      task.status === "completed"
                        ? "var(--muted)"
                        : "var(--text)",
                    marginBottom: 4,
                    fontFamily: "Plus Jakarta Sans, sans-serif",
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
      prev.task._id === next.task._id &&
      prev.task.status === next.task.status &&
      prev.task.title === next.task.title &&
      prev.task.priority === next.task.priority &&
      prev.selected === next.selected &&
      prev.isMobile === next.isMobile
    );
  },
);

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
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
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
            className="auth-input haptic-feedback"
            style={{
              height: isMobile ? 52 : 56,
              fontSize: isMobile ? 16 : 16,
              background: "rgba(255,255,255,0.03)",
              borderRadius: 14,
            }}
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Declare your intent..."
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
              className="select premium-select"
              style={{ height: 48, borderRadius: 14, width: "100%" }}
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
              className="select premium-select"
              style={{ height: 48, borderRadius: 14, width: "100%" }}
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
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setForm((f) => ({ ...f, category: cat }))}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${form.category === cat ? "bg-accent text-white shadow-lg shadow-accent/20" : "bg-white/5 text-muted hover:bg-white/10"}`}
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
              height: 48,
              borderRadius: 14,
              background: "rgba(255,255,255,0.03)",
            }}
            value={form.dueDate}
            onChange={(e) =>
              setForm((f) => ({ ...f, dueDate: e.target.value }))
            }
          />
        </div>

        <button
          type="submit"
          className="auth-button w-full haptic-tap"
          style={{
            height: 56,
            borderRadius: 16,
            fontSize: 16,
            fontWeight: 800,
          }}
        >
          {task ? "REFINE OBJECTIVE" : "MANIFEST OBJECTIVE"}
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
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="auth-card aura-iridescent"
        style={{ width: "100%", maxWidth: 540, padding: 0, overflow: "hidden" }}
      >
        <div
          className="modal-header"
          style={{
            padding: "24px 32px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div
            className="modal-title"
            style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 22 }}
          >
            {task ? "Refine Mission" : "New Objective"}
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

  const { data, isLoading } = useQuery({
    queryKey: ["tasks", filters],
    queryFn: () => tasksAPI.getAll(filters).then((r) => r.data),
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
    onSuccess: (res, variables) => {
      if (!variables?.suppressToast) {
        addToast("Objective refined", "success");
      }
      invalidate();
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

  const listHeight = Math.max(360, windowHeight - (isMobile ? 340 : 380));
  const listWidth = Math.max(320, windowWidth - (isMobile ? 32 : 320));

  return (
    <div
      className="responsive-container page-shell"
      style={{
        position: "relative",
        overflow: "hidden",
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
        className="page-header"
        style={{
          marginBottom: isMobile ? 24 : 40,
          paddingTop: isMobile ? 12 : 24,
          position: "relative",
        }}
      >
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ display: "flex", alignItems: "center", gap: 16 }}
        >
          <div
            className="auth-logo-icon aura-float"
            style={{
              width: isMobile ? 48 : 64,
              height: isMobile ? 48 : 64,
              background: "var(--grad-premium)",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 12px 30px rgba(124, 109, 250, 0.4)",
            }}
          >
            <ClipboardList
              size={isMobile ? 24 : 32}
              color="white"
              strokeWidth={2.5}
            />
          </div>
          <div>
            <div
              style={{
                fontFamily: "Syne, sans-serif",
                fontSize: isMobile ? "32px" : "48px",
                fontWeight: 800,
                letterSpacing: "-0.05em",
                lineHeight: 1,
                background:
                  "linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Mission Control
            </div>
            <p
              style={{
                fontSize: "12px",
                fontWeight: 800,
                color: "var(--muted)",
                textTransform: "uppercase",
                letterSpacing: 2,
                marginTop: 4,
              }}
            >
              Tactical Dashboard
            </p>
          </div>
        </motion.div>
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
              padding: "20px",
              borderRadius: 24,
              background: "rgba(255,255,255,0.03)",
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
                fontSize: "28px",
                fontWeight: 900,
                fontFamily: "Syne",
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
              padding: "20px",
              borderRadius: 24,
              background: "rgba(255,255,255,0.03)",
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
                fontSize: "28px",
                fontWeight: 900,
                fontFamily: "Syne",
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
          className="glass-holographic"
          style={{
            padding: "12px",
            borderRadius: 24,
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.05)",
            backdropFilter: "blur(40px)",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <div style={{ position: "relative", flex: 1 }}>
              <Search
                size={18}
                style={{
                  position: "absolute",
                  left: 16,
                  top: "50%",
                  transform: "translateY(-50%)",
                  opacity: 0.4,
                }}
              />
              <input
                className="auth-input"
                style={{
                  paddingLeft: 46,
                  height: 52,
                  fontSize: 14,
                  borderRadius: 16,
                  width: "100%",
                  background: "rgba(0,0,0,0.2)",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
                placeholder="Search objectives..."
                value={filters.search}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, search: e.target.value }))
                }
              />
            </div>
            <MagneticButton
              className="auth-button haptic-tap"
              onClick={() => setModal("create")}
              style={{
                width: 52,
                height: 52,
                padding: 0,
                borderRadius: 16,
                flexShrink: 0,
              }}
            >
              <Plus size={24} strokeWidth={2.5} />
            </MagneticButton>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              overflowX: "auto",
              paddingBottom: 4,
            }}
            className="no-scrollbar"
          >
            <select
              className="select premium-select"
              style={{
                height: 38,
                borderRadius: 12,
                minWidth: 120,
                fontSize: 11,
                background: "rgba(255,255,255,0.03)",
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
              className="select premium-select"
              style={{
                height: 38,
                borderRadius: 12,
                minWidth: 120,
                fontSize: 11,
                background: "rgba(255,255,255,0.03)",
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
      </motion.div>

      {isLoading ? (
        <TasksSkeleton />
      ) : (
        <div className="tasks-list">
          {tasks.length > 0 ? (
            <List
              height={listHeight}
              itemCount={tasks.length}
              itemSize={isMobile ? 128 : 118}
              width={listWidth}
              overscanCount={6}
            >
              {({ index, style }) => {
                const task = tasks[index];
                if (!task) return null;
                return (
                  <div style={{ ...style, paddingBottom: 12 }}>
                    <TaskItem
                      key={getSafeId(task, `task-${index}`)}
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
              background: "rgba(20, 20, 30, 0.85)",
              padding: "12px 24px",
              borderRadius: 30,
              backdropFilter: "blur(40px) saturate(200%)",
              border: "2px solid var(--accent)",
              boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
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
