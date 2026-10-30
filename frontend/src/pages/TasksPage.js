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
  ChevronLeft,
  ChevronRight,
  FileText,
  FileSpreadsheet,
  ArrowRight,
  RotateCcw,
  Lock,
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
    let tid = null;
    const h = () => {
      clearTimeout(tid);
      tid = setTimeout(() => setW(window.innerWidth), 150);
    };
    window.addEventListener("resize", h, { passive: true });
    return () => {
      window.removeEventListener("resize", h);
      clearTimeout(tid);
    };
  }, []);
  return w;
}

function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  useEffect(() => {
    let tid = null; const h = () => { clearTimeout(tid); tid = setTimeout(() => {
      setSize({ width: window.innerWidth, height: window.innerHeight }); }, 150); };
    window.addEventListener("resize", h, { passive: true });
    return () => {
      window.removeEventListener("resize", h);
      clearTimeout(tid);
    };
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
        onMoveToToday,
        todayStr,
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

      const { addToast } = useNotifications();
      const taskDate = task.date || (task.dueDate ? safeFormat(task.dueDate, "yyyy-MM-dd", "") : "");
      const isToday = Boolean(taskDate && taskDate === todayStr);
      const isOverdue = Boolean(
        taskDate &&
        todayStr &&
        taskDate < todayStr &&
        task.status !== "completed"
      );

      const handleDragEnd = (event, info) => {
        if (info.offset.x > 100) {
          if (!isToday) {
            addToast(
              taskDate && taskDate < todayStr
                ? "Past tasks cannot be completed/uncompleted. Only today's tasks can be modified."
                : "Upcoming tasks cannot be completed early. Only today's tasks can be modified.",
              "warning"
            );
            return;
          }
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
              border: isOverdue
                ? "1px solid rgba(239, 68, 68, 0.3)"
                : "1px solid var(--border)",
              borderLeft: isOverdue ? "3px solid var(--red)" : "1px solid var(--border)",
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
                  whileTap={{ scale: isToday ? 0.8 : 1 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isToday) {
                      addToast(
                        taskDate && taskDate < todayStr
                          ? "Past tasks cannot be completed/uncompleted. Only today's tasks can be modified."
                          : "Upcoming tasks cannot be completed early. Only today's tasks can be modified.",
                        "warning"
                      );
                      return;
                    }
                    toggleComplete(task);
                  }}
                  title={
                    isToday
                      ? "Mark complete/uncomplete"
                      : "Locked: Only today's tasks can be completed or uncompleted"
                  }
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    border: `2px solid ${task.status === "completed" ? "#22c55e" : !isToday ? "rgba(255,255,255,0.1)" : isOverdue ? "rgba(239, 68, 68, 0.4)" : "rgba(255,255,255,0.15)"}`,
                    background:
                      task.status === "completed" ? (isToday ? "#22c55e" : "rgba(34, 197, 94, 0.7)") : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "none",
                    cursor: isToday ? "pointer" : "not-allowed",
                    opacity: isToday ? 1 : 0.8,
                  }}
                >
                  <AnimatePresence>
                    {task.status === "completed" ? (
                      <motion.div
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0 }}
                      >
                        <Check size={18} color="white" strokeWidth={4} />
                      </motion.div>
                    ) : !isToday ? (
                      <Lock size={11} style={{ color: "var(--muted)", opacity: 0.6 }} />
                    ) : null}
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
                    gap: 8,
                    flexWrap: "wrap",
                    alignItems: "center",
                    fontSize: 9,
                    fontWeight: 800,
                    color: "var(--muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
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
                  {taskDate && (
                    <span
                      style={{
                        color: isOverdue ? "var(--red)" : isToday ? "var(--accent)" : "inherit",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontWeight: isOverdue || isToday ? 900 : 600,
                        background: isOverdue ? "rgba(239, 68, 68, 0.1)" : isToday ? "rgba(124, 109, 250, 0.1)" : "transparent",
                        padding: isOverdue || isToday ? "1px 6px" : 0,
                        borderRadius: 4,
                      }}
                    >
                      <Clock size={10} />{" "}
                      {isToday ? "TODAY" : isOverdue ? `OVERDUE (${safeFormat(taskDate, "MMM d", "")})` : safeFormat(taskDate, "MMM d", "PENDING")}
                    </span>
                  )}
                </div>
              </div>

              <div
                className="task-row-actions"
                style={{ display: "flex", gap: 6, alignItems: "center" }}
                onClick={(e) => e.stopPropagation()}
              >
                {isOverdue && onMoveToToday && (
                  <button
                    className="btn btn-sm glass haptic-tap"
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "3px 8px",
                      borderRadius: 6,
                      color: "var(--accent)",
                      border: "1px solid rgba(124,109,250,0.3)",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveToToday(task);
                    }}
                    title="Reschedule to Today"
                  >
                    <Calendar size={11} /> Move to Today
                  </button>
                )}
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
      prev.isMobile === next.isMobile &&
      prev.todayStr === next.todayStr
    );
  },
);

// ─── Kanban Card Component ──────────────────────────────────────────
const KanbanCard = React.memo(({ task, toggleComplete, setModal, deleteMutation, updateMutation, setConfirmState, onMoveToToday, todayStr }) => {
  const tid = getSafeId(task);
  const priorityColor = {
    urgent: "var(--red)",
    high: "var(--orange)",
    medium: "var(--yellow)",
    low: "var(--green)",
  }[task.priority] || "var(--muted)";

  const taskDate = task.date || (task.dueDate ? safeFormat(task.dueDate, "yyyy-MM-dd", "") : "");
  const isOverdue = Boolean(taskDate && todayStr && taskDate < todayStr && task.status !== "completed");
  const isToday = taskDate === todayStr;

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
        border: isOverdue ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid rgba(255, 255, 255, 0.05)",
        borderLeft: `3px solid ${isOverdue ? "var(--red)" : priorityColor}`,
        cursor: "pointer",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.02)",
        backdropFilter: "blur(10px)",
        transition: "border-color 0.2s ease, background 0.2s ease",
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
          wordBreak: "break-word",
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
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          {task.category && (
            <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "rgba(255,255,255,0.05)", color: "var(--text2)", fontWeight: 700, letterSpacing: 0.5 }}>
              {task.category.toUpperCase()}
            </span>
          )}
          {taskDate && (
            <span style={{
              fontSize: 9,
              color: isOverdue ? "var(--red)" : isToday ? "var(--accent)" : "var(--muted)",
              display: "flex",
              alignItems: "center",
              gap: 3,
              fontWeight: 700,
            }}>
              <Clock size={10} />
              {isToday ? "TODAY" : isOverdue ? `OVERDUE (${safeFormat(taskDate, "MMM d", "")})` : safeFormat(taskDate, "MMM d", "")}
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: 4, alignItems: "center" }} onClick={e => e.stopPropagation()}>
          {isOverdue && onMoveToToday && (
            <button
              onClick={() => onMoveToToday(task)}
              style={{ padding: "3px 6px", fontSize: 9, fontWeight: 700, color: "var(--accent)", background: "rgba(124,109,250,0.1)", borderRadius: 4, border: "1px solid rgba(124,109,250,0.2)" }}
              className="haptic-tap"
              title="Reschedule to Today"
            >
              Today
            </button>
          )}
          {isToday && task.status === "pending" && (
            <button
              onClick={() => updateMutation.mutate({ id: tid, data: { status: "in-progress", clientDate: todayStr }, suppressToast: true })}
              style={{ padding: "4px 8px", fontSize: 10, fontWeight: 700, color: "var(--accent)", background: "rgba(99,102,241,0.1)", borderRadius: 6 }}
              className="haptic-tap"
            >
              START
            </button>
          )}
          {isToday && task.status === "in-progress" && (
            <button
              onClick={() => updateMutation.mutate({ id: tid, data: { status: "completed", clientDate: todayStr }, suppressToast: true })}
              style={{ padding: "4px 8px", fontSize: 10, fontWeight: 700, color: "var(--green)", background: "rgba(34,197,94,0.1)", borderRadius: 6 }}
              className="haptic-tap"
            >
              COMPLETE
            </button>
          )}
          {isToday && task.status === "completed" && (
            <button
              onClick={() => updateMutation.mutate({ id: tid, data: { status: "pending", clientDate: todayStr }, suppressToast: true })}
              style={{ padding: "4px 8px", fontSize: 10, fontWeight: 700, color: "var(--muted)", background: "rgba(255,255,255,0.05)", borderRadius: 6 }}
              className="haptic-tap"
            >
              REOPEN
            </button>
          )}
          {!isToday && (
            <span
              style={{
                padding: "3px 8px",
                fontSize: 10,
                fontWeight: 700,
                color: "var(--muted)",
                background: "rgba(255,255,255,0.03)",
                borderRadius: 6,
                border: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                gap: 4
              }}
              title="Locked: Status can only be modified for today's tasks"
            >
              <Lock size={10} /> {task.status.toUpperCase()}
            </span>
          )}

          <button
            onClick={() => setConfirmState({
              open: true,
              title: "Remove Objective?",
              message: `Delete "${task.title}"?`,
              onConfirm: () => deleteMutation.mutate(tid),
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
function TaskModal({ task, onClose, onSave, onDelete, defaultDate }) {
  const { addToast } = useNotifications();
  const isMobile = window.innerWidth <= 768;
  const todayStr = safeFormat(new Date(), "yyyy-MM-dd");
  const rawInitialDate = task?.dueDate
    ? safeFormat(task.dueDate, "yyyy-MM-dd", "")
    : task?.date || defaultDate || todayStr;
  const initialDate = (!task && rawInitialDate < todayStr) ? todayStr : rawInitialDate;

  const [form, setForm] = useState({
    title: task?.title || "",
    description: task?.description || "",
    priority: task?.priority || "medium",
    status: task?.status || "pending",
    category: task?.category || "General",
    dueDate: initialDate,
    estimatedMinutes: task?.estimatedMinutes || "",
    tags: task?.tags?.join(", ") || "",
    subtasks: task?.subtasks || [],
  });
  const [newSubtask, setNewSubtask] = useState("");

  const isFormToday = (form.dueDate || initialDate) === todayStr;
  const canModifyStatus = !task || isFormToday;

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
    const chosenDate = form.dueDate || defaultDate || todayStr;
    if (chosenDate < todayStr) {
      return addToast("Tasks cannot be created for past dates.", "error");
    }
    if (task && form.status !== task.status && chosenDate !== todayStr) {
      return addToast("Only tasks scheduled for today can have their status changed.", "warning");
    }
    onSave({
      ...form,
      title: form.title.trim(),
      description: form.description ? form.description.trim() : "",
      date: chosenDate,
      dueDate: chosenDate,
      clientDate: todayStr,
      tags: (typeof form.tags === 'string' ? form.tags : (Array.isArray(form.tags) ? form.tags.join(', ') : ''))
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
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
          padding: isMobile ? "16px 20px" : "28px 32px",
          paddingBottom: isMobile
            ? "calc(20px + env(safe-area-inset-bottom))"
            : 24,
          flex: 1,
          overflowY: "auto",
        }}
      >
        <div className="form-group mb-5">
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
              height: 46,
              fontSize: 14,
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "0 14px",
            }}
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="E.g., Complete project review"
            autoFocus
          />
        </div>

        <div className="form-group mb-5">
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
            Description / Context
          </label>
          <textarea
            className="auth-input custom-scrollbar"
            style={{
              minHeight: 70,
              padding: "10px 14px",
              fontSize: 13,
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              width: "100%",
              resize: "vertical",
            }}
            rows={3}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Add specific context, notes or deliverables..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-5">
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
              style={{
                height: 42,
                borderRadius: 6,
                width: "100%",
                background: "#18181b",
                border: "1px solid var(--border)",
                padding: "0 12px",
                color: "#f4f4f5",
                colorScheme: "dark",
              }}
              value={form.priority}
              onChange={(e) =>
                setForm((f) => ({ ...f, priority: e.target.value }))
              }
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p} style={{ background: "#18181b", color: "#f4f4f5" }}>
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
              Status {!canModifyStatus && <span style={{ color: "var(--orange)", textTransform: "none", fontSize: 10, marginLeft: 6 }}>(Locked: Not Today)</span>}
            </label>
            <select
              className="select"
              disabled={!canModifyStatus}
              style={{
                height: 42,
                borderRadius: 6,
                width: "100%",
                background: !canModifyStatus ? "rgba(255,255,255,0.03)" : "#18181b",
                border: "1px solid var(--border)",
                padding: "0 12px",
                cursor: !canModifyStatus ? "not-allowed" : "pointer",
                opacity: !canModifyStatus ? 0.6 : 1,
                color: "#f4f4f5",
                colorScheme: "dark",
              }}
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value }))
              }
              title={!canModifyStatus ? "Status can only be modified for today's tasks" : ""}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s} style={{ background: "#18181b", color: "#f4f4f5" }}>
                  {s.replace("-", " ").toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group mb-5">
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
                  padding: "5px 12px",
                  borderRadius: 6,
                  fontSize: 11,
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

        <div className="grid grid-cols-2 gap-4 mb-5">
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
              Scheduled Date
            </label>
            <input
              type="date"
              min={todayStr}
              className="auth-input"
              style={{
                height: 42,
                borderRadius: 6,
                background: "var(--bg)",
                border: "1px solid var(--border)",
                padding: "0 12px",
                width: "100%",
              }}
              value={form.dueDate}
              onChange={(e) => {
                const val = e.target.value;
                if (val && val < todayStr) {
                  addToast("Tasks cannot be created for past dates.", "warning");
                  return;
                }
                setForm((f) => ({ ...f, dueDate: val }));
              }}
            />
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
              Est. Minutes
            </label>
            <input
              type="number"
              min="1"
              className="auth-input"
              style={{
                height: 42,
                borderRadius: 6,
                background: "var(--bg)",
                border: "1px solid var(--border)",
                padding: "0 12px",
                width: "100%",
              }}
              value={form.estimatedMinutes}
              onChange={(e) =>
                setForm((f) => ({ ...f, estimatedMinutes: e.target.value }))
              }
              placeholder="e.g. 45"
            />
          </div>
        </div>

        {/* Checklist / Subtasks Section */}
        <div className="form-group mb-5">
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
            Checklist ({form.subtasks.filter((s) => s.completed).length}/{form.subtasks.length})
          </label>
          {form.subtasks.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
              {form.subtasks.map((st, sIdx) => (
                <div
                  key={sIdx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 12px",
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    borderRadius: 8,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={st.completed}
                    disabled={!canModifyStatus}
                    onChange={() => {
                      if (!canModifyStatus) {
                        addToast("Checklist items can only be completed/uncompleted on today's tasks.", "warning");
                        return;
                      }
                      setForm((f) => ({
                        ...f,
                        subtasks: f.subtasks.map((s, i) =>
                          i === sIdx ? { ...s, completed: !s.completed } : s
                        ),
                      }));
                    }}
                    style={{
                      width: 16,
                      height: 16,
                      accentColor: "var(--accent)",
                      cursor: canModifyStatus ? "pointer" : "not-allowed",
                      opacity: canModifyStatus ? 1 : 0.6,
                    }}
                  />
                  <span
                    style={{
                      flex: 1,
                      fontSize: 13,
                      color: st.completed ? "var(--muted)" : "var(--text)",
                      textDecoration: st.completed ? "line-through" : "none",
                    }}
                  >
                    {st.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeSubtask(sIdx)}
                    className="haptic-tap text-muted"
                    style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4 }}
                    title="Delete subtask"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              className="auth-input"
              style={{
                height: 38,
                borderRadius: 6,
                fontSize: 13,
                background: "var(--bg)",
                border: "1px solid var(--border)",
                padding: "0 12px",
                flex: 1,
              }}
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSubtask();
                }
              }}
              placeholder="Add checklist subtask..."
            />
            <button
              type="button"
              onClick={addSubtask}
              className="btn glass btn-sm haptic-tap"
              style={{ height: 38, padding: "0 14px", borderRadius: 6, fontSize: 12, fontWeight: 700 }}
            >
              <Plus size={14} /> Add
            </button>
          </div>
        </div>
      </div>

      <div
        style={{
          padding: "16px 24px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          justifyContent: task && onDelete ? "space-between" : "flex-end",
          alignItems: "center",
          gap: 12,
        }}
      >
        {task && onDelete && (
          <button
            type="button"
            className="haptic-tap"
            onClick={() => onDelete(task)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 13,
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.25)",
              color: "var(--red)",
              cursor: "pointer",
            }}
          >
            <Trash2 size={15} />
            <span>Delete</span>
          </button>
        )}
        <div style={{ display: "flex", gap: 12 }}>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600 }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {task ? "Save Changes" : "Create Objective"}
          </button>
        </div>
      </div>
    </form>
  );

  if (isMobile) {
    return (
      <MobileBottomSheet
        isOpen={true}
        onClose={onClose}
        title={task ? "Refine Objective" : "New Objective"}
      >
        {modalContent}
      </MobileBottomSheet>
    );
  }

  return (
    <div
      className="modal-overlay"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
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
          maxWidth: 500,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          padding: 0,
          overflow: "hidden",
          background: "var(--surface-solid)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          boxShadow:
            "0 10px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 18, color: "var(--text)" }}>
            {task ? "Edit Objective" : "New Objective"}
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

  const todayStr = safeFormat(new Date(), "yyyy-MM-dd");
  const [currentDate, setCurrentDate] = useState(todayStr);
  const [dayTab, setDayTab] = useState("today"); // "today" | "upcoming" | "overdue" | "completed" | "all"

  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    search: "",
    sortBy: "createdAt",
  });
  const [selected, setSelected] = useState([]);
  const [confirmState, setConfirmState] = useState({ open: false, task: null });
  const [viewMode, setViewMode] = useState("list");

  const prevDay = () => {
    const [y, m, d] = currentDate.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() - 1);
    setCurrentDate(safeFormat(dateObj, "yyyy-MM-dd"));
  };

  const nextDay = () => {
    const [y, m, d] = currentDate.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + 1);
    setCurrentDate(safeFormat(dateObj, "yyyy-MM-dd"));
  };

  const deferredSearch = useDeferredValue(filters.search);
  const activeFilters = useMemo(() => {
    const base = {
      ...filters,
      search: deferredSearch,
    };
    if (dayTab === "today") {
      base.date = currentDate;
    } else if (dayTab === "upcoming") {
      base.dayFilter = "upcoming";
    } else if (dayTab === "overdue") {
      base.dayFilter = "overdue";
    } else if (dayTab === "completed") {
      base.dayFilter = "completed";
    } else if (dayTab === "all") {
      base.dayFilter = "all";
    }
    return base;
  }, [filters, deferredSearch, dayTab, currentDate]);

  const { data, isLoading } = useQuery({
    queryKey: ["tasks", activeFilters],
    queryFn: () => tasksAPI.getAll(activeFilters).then((r) => r.data),
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const action = params.get("action");
    const status = params.get("status");
    const priority = params.get("priority");
    const tabParam = params.get("tab");

    if (action === "create") {
      setModal("create");
    }

    if (tabParam && ["today", "upcoming", "overdue", "completed", "all"].includes(tabParam)) {
      setDayTab(tabParam);
    }

    if (status || priority) {
      setFilters((f) => ({
        ...f,
        status: status || f.status,
        priority: priority || f.priority,
      }));
    }

    if (action || status || priority || tabParam) {
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  const { data: statsData } = useQuery({
    queryKey: ["task-stats"],
    queryFn: () => tasksAPI.stats().then((r) => r.data.stats),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["tasks"] });
    qc.invalidateQueries({ queryKey: ["task-stats"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
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
      const previousState = qc.getQueryData(["tasks", activeFilters]);
      if (previousState && Array.isArray(previousState.tasks)) {
        qc.setQueryData(["tasks", activeFilters], {
          ...previousState,
          tasks: previousState.tasks.map(t => (t._id === id || (t.id && t.id === id) ? { ...t, ...data } : t)),
        });
      }
      return { previousState };
    },
    onError: (err, variables, context) => {
      if (context?.previousState) {
        qc.setQueryData(["tasks", activeFilters], context.previousState);
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
    onError: () => {
      addToast("Failed to delete objective", "error");
    },
  });

  const bulkStatusMutation = useMutation({
    mutationFn: ({ ids, status, clientDate }) => tasksAPI.bulkStatus(ids, status, clientDate),
    onSuccess: (res, variables) => {
      addToast(`${variables.ids.length} objectives updated in bulk`, "success");
      setSelected([]);
      invalidate();
    },
    onError: (err) => {
      addToast(err?.response?.data?.error || "Failed to update objectives in bulk", "error");
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => tasksAPI.bulkDelete(ids),
    onSuccess: (res, variables) => {
      addToast(`${variables.length} objectives removed in bulk`, "info");
      setSelected([]);
      setConfirmState({ open: false, task: null });
      invalidate();
    },
    onError: () => {
      addToast("Failed to delete objectives in bulk", "error");
    },
  });

  const tasks = data?.tasks || [];

  const visibleTasks = useMemo(() => {
    if (!tasks || !Array.isArray(tasks)) return [];
    if (dayTab === "today") {
      // In Today tab: strictly show tasks belonging to currentDate.
      // Past overdue tasks MUST NOT appear in Today!
      return tasks.filter((t) => {
        const tDate = t.date || (t.dueDate ? safeFormat(t.dueDate, "yyyy-MM-dd", "") : "");
        return tDate === currentDate;
      });
    }
    if (dayTab === "upcoming") {
      return tasks.filter((t) => {
        const tDate = t.date || (t.dueDate ? safeFormat(t.dueDate, "yyyy-MM-dd", "") : "");
        return tDate && tDate > todayStr;
      });
    }
    if (dayTab === "overdue") {
      return tasks.filter((t) => {
        const tDate = t.date || (t.dueDate ? safeFormat(t.dueDate, "yyyy-MM-dd", "") : "");
        return tDate && tDate < todayStr && t.status !== "completed";
      });
    }
    if (dayTab === "completed") {
      return tasks.filter((t) => t.status === "completed");
    }
    return tasks;
  }, [tasks, dayTab, currentDate, todayStr]);

  const todayActiveCount = useMemo(() => {
    if (Array.isArray(tasks) && dayTab === "today") {
      return tasks.filter(t => {
        const tDate = t.date || (t.dueDate ? safeFormat(t.dueDate, "yyyy-MM-dd", "") : "");
        return tDate === todayStr && t.status !== "completed";
      }).length;
    }
    return statsData?.todayActive ?? 0;
  }, [tasks, dayTab, todayStr, statsData]);

  const todayCompletedCount = useMemo(() => {
    if (Array.isArray(tasks) && dayTab === "today") {
      return tasks.filter(t => {
        const tDate = t.date || (t.dueDate ? safeFormat(t.dueDate, "yyyy-MM-dd", "") : "");
        return tDate === todayStr && t.status === "completed";
      }).length;
    }
    return statsData?.todayCompleted ?? 0;
  }, [tasks, dayTab, todayStr, statsData]);

  const overdueCount = useMemo(() => {
    return statsData?.overdue ?? 0;
  }, [statsData]);

  const kanbanColumns = useMemo(() => {
    return [
      { id: "pending", title: "To Do", tasks: visibleTasks.filter(t => t.status === "pending" || t.status === "cancelled"), color: "var(--accent)" },
      { id: "in-progress", title: "In Progress", tasks: visibleTasks.filter(t => t.status === "in-progress"), color: "var(--orange)" },
      { id: "completed", title: "Done", tasks: visibleTasks.filter(t => t.status === "completed"), color: "var(--green)" },
    ];
  }, [visibleTasks]);

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

  const onMoveToToday = (task) => {
    const tid = getSafeId(task);
    if (!tid) return;
    updateMutation.mutate({
      id: tid,
      data: { date: todayStr, dueDate: todayStr },
      suppressToast: false,
    });
    addToast(`"${task.title}" rescheduled to Today`, "success");
  };

  const toggleInFlight = useRef(new Set());

  const toggleComplete = (task) => {
    const taskId = getSafeId(task);
    if (toggleInFlight.current.has(taskId)) return;

    const taskDate = task.date || (task.dueDate ? safeFormat(task.dueDate, "yyyy-MM-dd", "") : "");
    if (taskDate && taskDate !== todayStr) {
      addToast(
        taskDate < todayStr
          ? "Past tasks cannot be completed/uncompleted. Only today's tasks can be modified."
          : "Upcoming tasks cannot be completed early. Only today's tasks can be modified.",
        "warning"
      );
      feedback("error");
      return;
    }

    const newStatus = task.status === "completed" ? "pending" : "completed";
    if (newStatus === "completed") {
      feedback("success");
      addToast(`Objective secured: ${task.title}`, "success");
    } else {
      addToast(`Objective reopened: ${task.title}`, "info");
    }

    toggleInFlight.current.add(taskId);
    updateMutation.mutate(
      { id: taskId, data: { status: newStatus, clientDate: todayStr }, suppressToast: true },
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
    const tid = getSafeId(task);
    if (!tid) return;
    setConfirmState({
      open: true,
      title: `Remove "${task.title || 'Objective'}"?`,
      message: "This action cannot be undone. Are you sure you want to proceed?",
      danger: true,
      onConfirm: () => {
        deleteMutation.mutate(tid);
        setConfirmState({ open: false, task: null });
        if (modal && getSafeId(modal) === tid) {
          setModal(null);
        }
      },
    });
  };

  const handleBulkComplete = () => {
    if (selected.length === 0) return;
    const selectedTasks = tasks.filter(t => selected.includes(getSafeId(t)));
    const nonTodayTasks = selectedTasks.filter(t => {
      const tDate = t.date || (t.dueDate ? safeFormat(t.dueDate, "yyyy-MM-dd", "") : "");
      return tDate !== todayStr;
    });
    if (nonTodayTasks.length > 0) {
      addToast("Only today's tasks can be marked complete in bulk.", "warning");
      feedback("error");
      return;
    }
    bulkStatusMutation.mutate({ ids: selected, status: "completed", clientDate: todayStr });
    feedback("success");
  };

  const handleBulkDelete = () => {
    if (selected.length === 0) return;
    setConfirmState({
      open: true,
      title: `Remove ${selected.length} Objectives?`,
      message:
        "This action cannot be undone. Are you sure you want to proceed?",
      onConfirm: () => {
        bulkDeleteMutation.mutate(selected);
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

      {/* Header Banner */}
      <div
        className="premium-card"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          padding: isMobile ? "20px" : "28px 32px",
          marginBottom: "24px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-50%',
            left: '-10%',
            width: '50%',
            height: '200%',
            background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)',
            opacity: 0.05,
            filter: 'blur(40px)',
            pointerEvents: 'none',
          }}
        />

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
            boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
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
                letterSpacing: "-0.04em",
              }}
            >
              Tasks
            </h1>
            <p style={{ fontSize: "0.95rem", color: "var(--muted)", margin: "4px 0 0", fontWeight: 500, letterSpacing: "0.2px" }}>
              Day-wise daily execution & task planning
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center", zIndex: 1 }}>
          <div style={{
            display: "flex",
            background: "rgba(0, 0, 0, 0.3)",
            borderRadius: "12px",
            padding: "4px",
            border: "1px solid rgba(255,255,255,0.05)",
            boxShadow: "inset 0 2px 4px rgba(0,0,0,0.5)",
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
                letterSpacing: "0.5px",
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
                letterSpacing: "0.5px",
              }}
              type="button"
            >
              BOARD
            </button>
          </div>
          <button
            onClick={() => {
              if (currentDate < todayStr) {
                addToast("Viewing past date. New task will be created for Today.", "info");
              }
              setModal("create");
            }}
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
              transition: "all 0.2s ease",
            }}
            className="haptic-tap hover-lift"
          >
            <Plus size={16} style={{ color: "var(--accent)" }} />
            <span style={{ letterSpacing: "0.5px" }}>New Task</span>
          </button>
        </div>
      </div>

      {/* Day-wise Stat Cards */}
      {statsData && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="app-module-entrance"
            style={{
              padding: "14px 18px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)",
              backdropFilter: "blur(20px)",
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 900, color: "var(--muted)", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4 }}>
              Today's Active
            </div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "white" }}>
              {todayActiveCount}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="app-module-entrance"
            style={{
              padding: "14px 18px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)",
              backdropFilter: "blur(20px)",
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 900, color: "var(--muted)", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4 }}>
              Secured Today
            </div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--green)" }}>
              {todayCompletedCount}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="app-module-entrance hover-lift"
            style={{
              padding: "14px 18px",
              borderRadius: 12,
              background: overdueCount > 0 ? "rgba(239, 68, 68, 0.08)" : "rgba(255,255,255,0.02)",
              border: overdueCount > 0 ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid rgba(255,255,255,0.05)",
              backdropFilter: "blur(20px)",
              cursor: overdueCount > 0 ? "pointer" : "default",
            }}
            onClick={() => {
              if (overdueCount > 0) setDayTab("overdue");
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 900, color: overdueCount > 0 ? "var(--red)" : "var(--muted)", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4 }}>
              Overdue
            </div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: overdueCount > 0 ? "var(--red)" : "white" }}>
              {overdueCount}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="app-module-entrance"
            style={{
              padding: "14px 18px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)",
              backdropFilter: "blur(20px)",
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 900, color: "var(--muted)", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4 }}>
              All Time
            </div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--text2)" }}>
              {statsData.completed || 0} / {statsData.total || 0}
            </div>
          </motion.div>
        </div>
      )}

      {/* Day Filter Pills */}
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 16,
          alignItems: "center",
        }}
      >
        {[
          { id: "today", label: "Today" },
          { id: "upcoming", label: "Upcoming" },
          { id: "overdue", label: `Overdue ${overdueCount > 0 ? `(${overdueCount})` : ""}` },
          { id: "completed", label: "Done" },
          { id: "all", label: "All Tasks" },
        ].map((tab) => {
          const isActive = dayTab === tab.id;
          const isOverdueTab = tab.id === "overdue" && (statsData?.overdue || 0) > 0;
          return (
            <button
              key={tab.id}
              onClick={() => setDayTab(tab.id)}
              className="haptic-tap"
              style={{
                padding: "8px 16px",
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.4px",
                cursor: "pointer",
                border: isActive
                  ? "1px solid var(--accent)"
                  : isOverdueTab
                    ? "1px solid rgba(239, 68, 68, 0.4)"
                    : "1px solid rgba(255,255,255,0.07)",
                background: isActive
                  ? "rgba(124, 109, 250, 0.15)"
                  : isOverdueTab
                    ? "rgba(239, 68, 68, 0.1)"
                    : "rgba(255,255,255,0.02)",
                color: isActive
                  ? "var(--accent)"
                  : isOverdueTab
                    ? "var(--red)"
                    : "var(--muted)",
                transition: "all 0.2s ease",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Day Navigator Bar (shown in Today tab) */}
      {dayTab === "today" && (
        <div
          style={{
            padding: isMobile ? "12px 16px" : "14px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
            borderRadius: 12,
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px solid rgba(255,255,255,0.05)",
            backdropFilter: "blur(20px)",
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              className="btn btn-icon glass haptic-tap"
              onClick={prevDay}
              style={{ borderRadius: 8, width: 34, height: 34 }}
              title="Previous Day"
            >
              <ChevronLeft size={18} />
            </button>
            <div>
              <span style={{ fontSize: 16, fontWeight: 800, color: "white" }}>
                {currentDate === todayStr ? "Today" : safeFormat(new Date(currentDate + "T12:00:00"), "EEEE")}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", marginLeft: 8 }}>
                {safeFormat(new Date(currentDate + "T12:00:00"), "MMMM d, yyyy")}
              </span>
              {currentDate < todayStr && (
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: "rgba(255,255,255,0.04)", color: "var(--muted)", fontWeight: 700, border: "1px solid rgba(255,255,255,0.08)", display: "inline-flex", alignItems: "center", gap: 4, marginLeft: 10 }}>
                  <Lock size={10} /> PAST RECORD (READ-ONLY)
                </span>
              )}
            </div>
            <button
              className="btn btn-icon glass haptic-tap"
              onClick={nextDay}
              style={{ borderRadius: 8, width: 34, height: 34 }}
              title="Next Day"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {currentDate !== todayStr && (
              <button
                className="btn glass btn-sm haptic-tap"
                onClick={() => setCurrentDate(todayStr)}
                style={{ fontSize: 11, fontWeight: 700, height: 34, padding: "0 14px", borderRadius: 8 }}
              >
                TODAY
              </button>
            )}
            <input
              type="date"
              className="auth-input"
              style={{
                height: 34,
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                padding: "0 12px",
                width: 140,
              }}
              value={currentDate}
              onChange={(e) => setCurrentDate(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 20 }}
      >
        <div
          style={{
            padding: "8px",
            borderRadius: 10,
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
              flex: "1 1 240px",
              display: "flex",
              alignItems: "center",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8,
              height: 38,
              padding: "0 12px",
              gap: 8,
            }}>
              <Search
                size={15}
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
                  padding: 0,
                }}
                placeholder="Search objectives..."
                value={filters.search}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, search: e.target.value }))
                }
              />
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <select
                style={{
                  height: 38,
                  borderRadius: 8,
                  minWidth: 125,
                  fontSize: 12,
                  fontWeight: 600,
                  background: "#18181b",
                  border: "1px solid rgba(255,255,255,0.14)",
                  color: "#f4f4f5",
                  padding: "0 10px",
                  cursor: "pointer",
                  outline: "none",
                  colorScheme: "dark",
                }}
                value={filters.priority}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, priority: e.target.value }))
                }
              >
                <option value="" style={{ background: "#18181b", color: "#f4f4f5" }}>
                  PRIORITY: ALL
                </option>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p} style={{ background: "#18181b", color: "#f4f4f5" }}>
                    {p.toUpperCase()}
                  </option>
                ))}
              </select>
              {(dayTab === "all" || dayTab === "today") && (
                <select
                  style={{
                    height: 38,
                    borderRadius: 8,
                    minWidth: 125,
                    fontSize: 12,
                    fontWeight: 600,
                    background: "#18181b",
                    border: "1px solid rgba(255,255,255,0.14)",
                    color: "#f4f4f5",
                    padding: "0 10px",
                    cursor: "pointer",
                    outline: "none",
                    colorScheme: "dark",
                  }}
                  value={filters.status}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, status: e.target.value }))
                  }
                >
                  <option value="" style={{ background: "#18181b", color: "#f4f4f5" }}>
                    STATUS: ALL
                  </option>
                  {STATUSES.map((s) => (
                    <option key={s} value={s} style={{ background: "#18181b", color: "#f4f4f5" }}>
                      {s.replace("-", " ").toUpperCase()}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Task List / Board */}
      {isLoading ? (
        <TasksSkeleton />
      ) : (
        <div className="tasks-list" style={{ paddingBottom: 20 }}>
          {visibleTasks.length > 0 ? (
            viewMode === "list" ? (
              <div className="tasks-container">
                <List
                  height={isMobile ? Math.max(300, windowHeight - 340) : 680}
                  itemCount={visibleTasks.length}
                  itemSize={isMobile ? 86 : 76}
                  width="100%"
                  itemData={visibleTasks}
                  itemKey={(index, data) => getSafeId(data[index]) || index}
                >
                  {({ index, style }) => {
                    const task = visibleTasks[index];
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
                          onMoveToToday={onMoveToToday}
                          todayStr={todayStr}
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
                marginTop: 8,
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
                    minHeight: 300,
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
                          onMoveToToday={onMoveToToday}
                          todayStr={todayStr}
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
              title={
                dayTab === "today"
                  ? currentDate === todayStr
                    ? "All Clean For Today! ✨"
                    : currentDate < todayStr
                      ? `Past Record: ${safeFormat(new Date(currentDate + "T12:00:00"), "MMMM d, yyyy")}`
                      : `Upcoming: ${safeFormat(new Date(currentDate + "T12:00:00"), "MMMM d, yyyy")}`
                  : dayTab === "overdue"
                    ? "Zero Overdue Tasks! 🎯"
                    : "No Tasks Found"
              }
              description={
                dayTab === "today"
                  ? currentDate === todayStr
                    ? "Manifest a new objective to plan your day."
                    : currentDate < todayStr
                      ? "No tasks recorded for this past day. Tasks cannot be created for past dates."
                      : "Plan objectives ahead for this upcoming day."
                  : "Adjust filters or create a new objective."
              }
              action={
                dayTab === "today" && currentDate >= todayStr
                  ? {
                      label: "+ New Task",
                      onClick: () => setModal("create"),
                    }
                  : undefined
              }
            />
          )}
        </div>
      )}

      {/* Floating Bulk Actions */}
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
            onDelete={handleDelete}
            defaultDate={currentDate < todayStr ? todayStr : currentDate}
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
