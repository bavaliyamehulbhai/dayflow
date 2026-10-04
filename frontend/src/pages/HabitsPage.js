import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { habitsAPI } from "../utils/api";
import { useNotifications } from "../context/NotificationContext";
import { safeFormat, safeToLocalISO } from "../utils/dateUtils";

const localSubDays = (date, amount) => {
  const d = new Date(date);
  d.setDate(d.getDate() - amount);
  return d;
};

const localEachDayOfInterval = ({ start, end }) => {
  const dates = [];
  let d = new Date(start);
  d.setHours(0, 0, 0, 0);
  const e = new Date(end);
  e.setHours(0, 0, 0, 0);
  while (d <= e) {
    dates.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return dates;
};
import { getSafeId } from "../utils/idUtils";
import {
  Plus,
  Flame,
  Target,
  Trophy,
  Check,
  X,
  Pencil,
  Trash2,
  Sparkles,
  Calendar,
  Activity,
  Award,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  Zap,
  Search,
} from "lucide-react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { useZenTheme } from "../hooks/useZenTheme";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog";
import useFeedback from "../hooks/useFeedback";
import SensitivityShield from "../components/layout/SensitivityShield";
import Celebration from "../components/Celebration";
import ShortcutsHelp from "../components/layout/ShortcutsHelp";
import MobileBottomSheet from "../components/common/MobileBottomSheet";

const ICONS = [
  "⭐",
  "💪",
  "🏃",
  "📚",
  "💧",
  "🧘",
  "🍎",
  "😴",
  "✍️",
  "🎯",
  "💊",
  "🌿",
  "🎨",
  "🎵",
  "🧹",
  "💻",
];
const COLORS = [
  "#7c6dfa",
  "#fa6d8a",
  "#6dfacc",
  "#fad96d",
  "#fa9a6d",
  "#6daafa",
  "#e96dfa",
  "#6dfaed",
];
const FREQ = [
  { value: "daily", label: "Every day" },
  { value: "weekdays", label: "Weekdays only" },
  { value: "weekends", label: "Weekends only" },
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

function HabitModal({ habit, onClose, onSave, onDelete }) {
  const { addToast } = useNotifications();
  const width = useWindowWidth();
  const isMobile = width <= 768;
  const [form, setForm] = useState({
    name: habit?.name || "",
    description: habit?.description || "",
    icon: habit?.icon || "⭐",
    color: habit?.color || "#7c6dfa",
    frequency: habit?.frequency || "daily",
    targetCount: habit?.targetCount || 1,
    unit: habit?.unit || "times",
  });

  const modalContent = (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!form.name.trim()) return addToast("Ritual name required", "error");
        onSave(form);
      }}
      style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}
    >
      <div
        style={{
          padding: "24px",
          flex: 1,
          overflowY: "auto",
        }}
      >
        <div className="form-group mb-8">
          <label
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: "var(--muted)",
              letterSpacing: 0.5,
              textTransform: "uppercase",
              marginBottom: 12,
              display: "block",
            }}
          >
            Title
          </label>
          <input
            style={{
              height: 44,
              fontSize: 14,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: "0 16px",
              width: "100%",
              color: "var(--text)",
              outline: "none"
            }}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Read 10 pages"
            autoFocus
          />
        </div>

        <div className="form-group mb-8">
          <label
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: "var(--muted)",
              letterSpacing: 0.5,
              textTransform: "uppercase",
              marginBottom: 12,
              display: "block",
            }}
          >
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            placeholder="Add context..."
            rows={3}
              style={{
                height: "auto",
                minHeight: 80,
                padding: "12px 16px",
                borderRadius: 6,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--border)",
                fontSize: 14,
                width: "100%",
                color: "var(--text)",
                outline: "none",
                resize: "vertical"
              }}
          />
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="form-group">
            <label
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "var(--muted)",
                letterSpacing: 0.5,
                textTransform: "uppercase",
                marginBottom: 10,
                display: "block",
              }}
            >
              Frequency
            </label>
            <select
              style={{
                height: 44,
                borderRadius: 6,
                width: "100%",
                fontSize: 14,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--border)",
                padding: "0 12px",
                color: "var(--text)",
                outline: "none"
              }}
              value={form.frequency}
              onChange={(e) =>
                setForm((f) => ({ ...f, frequency: e.target.value }))
              }
            >
              {FREQ.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "var(--muted)",
                letterSpacing: 0.5,
                textTransform: "uppercase",
                marginBottom: 10,
                display: "block",
              }}
            >
              Daily Target
            </label>
            <div className="flex gap-4 items-center">
              <input
                type="number"
                style={{
                  height: 44,
                  borderRadius: 6,
                  width: "100%",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--border)",
                  fontSize: 14,
                  textAlign: "center",
                  color: "var(--text)",
                  outline: "none"
                }}
                value={form.targetCount}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    targetCount: parseInt(e.target.value) || 1,
                  }))
                }
              />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--text2)",
                }}
              >
                {form.unit}
              </span>
            </div>
          </div>
        </div>

        <div className="form-group mb-10">
          <label
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "var(--text2)",
              marginBottom: 12,
              display: "block",
            }}
          >
            Atmosphere (Color)
          </label>
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {COLORS.map((c) => (
              <motion.button
                key={c}
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={() => setForm((f) => ({ ...f, color: c }))}
                className="flex-shrink-0"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: c,
                  border:
                    form.color === c
                      ? "2px solid white"
                      : "2px solid transparent",
                  outline: form.color === c ? "2px solid rgba(255,255,255,0.2)" : "none",
                  position: "relative",
                  cursor: "pointer"
                }}
              >

              </motion.button>
            ))}
          </div>
        </div>

        <div
          style={{
            padding: "20px 24px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            gap: 12,
            justifyContent: "flex-end",
            alignItems: "center"
          }}
        >
          {habit && (
            <button
              type="button"
              onClick={() => onDelete(habit)}
              style={{
                marginRight: "auto",
                padding: "8px 16px",
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 600,
                color: "var(--red)",
                background: "transparent",
                border: "1px solid rgba(239, 68, 68, 0.2)"
              }}
            >
              Delete
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            style={{ padding: "8px 16px", borderRadius: 6, fontWeight: 600, background: "transparent", border: "1px solid var(--border)", color: "var(--text)" }}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              background: "var(--text)",
              color: "var(--bg)",
              border: "none"
            }}
          >
            {habit ? "Save changes" : "Create habit"}
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
        title={habit ? "Refine Ritual" : "Forge Ritual"}
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
            {habit ? "Edit Habit" : "New Habit"}
          </div>
          <button
            className="haptic-tap"
            onClick={onClose}
            style={{
              background: "transparent",
              borderRadius: 6,
              padding: 6,
              border: "none",
              color: "var(--text2)",
              cursor: "pointer"
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

// ─── Ritual Card Component (Premium Grid Item) ──────────────────────────────
const RitualCard = ({
  habit,
  today,
  isCompleted,
  onComplete,
  onEdit,
  onDelete,
}) => {
  const daysToShow = 7;
  const last7 = React.useMemo(
    () =>
      localEachDayOfInterval({
        start: localSubDays(new Date(), daysToShow - 1),
        end: new Date(),
      }),
    [],
  );

  const completionStatus = React.useMemo(
    () =>
      last7.map((d) => {
        const dateStr = safeFormat(d, "yyyy-MM-dd");
        const todayStr = safeFormat(new Date(), "yyyy-MM-dd");
        return {
          dateStr,
          done: isCompleted(habit, dateStr),
          isToday: dateStr === todayStr,
          label: safeFormat(d, "MMM d"),
        };
      }),
    [habit.completions, today, last7],
  );

  const isTodayCompleted = React.useMemo(
    () => isCompleted(habit, today),
    [habit.completions, today],
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -5 }}
      className="ritual-card-premium"
      onClick={() => onEdit(habit)}
      style={{ cursor: "pointer" }}
    >
      <div className="btn-glint" style={{ opacity: 0.05 }} />
      <div className="ritual-card-header">
        <div className="ritual-icon-container" style={{ color: habit.color }}>
          {habit.icon}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {habit.streak?.current > 0 && (
            <div
              className={`ritual-streak-badge ${habit.streak?.current >= 7 ? "streak-active-glow" : ""}`}
            >
              <Flame
                size={14}
                fill={habit.streak?.current >= 7 ? "#ff7c6d" : "none"}
                className="streak-fire-anim"
              />{" "}
              {habit.streak.current}d
            </div>
          )}
          <motion.button
            whileHover={{ scale: 1.1, color: "var(--red)" }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(habit);
            }}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.2)",
              cursor: "pointer",
              padding: 4,
            }}
          >
            <Trash2 size={16} />
          </motion.button>
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <SensitivityShield>
          <h3
            style={{
              fontSize: 16,
              fontWeight: 700,
              fontFamily: "'Inter', sans-serif",
              marginBottom: 4,
              letterSpacing: 0,
            }}
          >
            {habit.name}
          </h3>
        </SensitivityShield>
        <p
          style={{
            fontSize: 12,
            color: "var(--muted)",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Zap size={12} /> {habit.targetCount} {habit.unit} • {habit.frequency}
        </p>
      </div>

      <div className="ritual-consistency-dots" onClick={(e) => e.stopPropagation()}>
        {completionStatus.map((s) => {
          return (
            <button
              key={s.dateStr}
              type="button"
              className={`ritual-dot ${s.done ? "completed" : ""} ${s.isToday ? "today" : ""}`}
              style={{
                cursor: "pointer",
                backgroundColor: s.done ? habit.color : "transparent",
                boxShadow: s.done ? `inset 0 1px 0 rgba(255,255,255,0.2)` : "none",
                borderColor: s.isToday ? habit.color : "rgba(255, 255, 255, 0.15)",
                width: 14,
                height: 14,
                borderRadius: "50%",
                border: "2px solid",
                padding: 0,
                display: "inline-block"
              }}
              title={s.label}
              onClick={() => onComplete({ id: getSafeId(habit), date: s.dateStr })}
            />
          );
        })}

        <div style={{ marginLeft: "auto" }}>
          <motion.button
            whileHover={{
              scale: 1.05
            }}
            whileTap={{ scale: 0.85 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            onClick={(e) => {
              e.stopPropagation();
              onComplete({ id: getSafeId(habit), date: today });
            }}
            className={`haptic-tap ${isTodayCompleted ? "done" : ""}`}
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              background: isTodayCompleted
                ? habit.color
                : "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.05)",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: isTodayCompleted
                ? `inset 0 1px 0 rgba(255,255,255,0.2)`
                : "none",
              transition: "background 0.3s ease, border-color 0.3s ease",
            }}
          >
            <AnimatePresence mode="wait">
              {isTodayCompleted ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 45 }}
                >
                  <Check size={20} strokeWidth={3.5} />
                </motion.div>
              ) : (
                <motion.div
                  key="plus"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Plus size={18} strokeWidth={2.5} opacity={0.4} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Mobile Ritual Card Component ──────────────────────────────────────────
const MobileRitualCard = ({
  habit,
  today,
  completed,
  onComplete,
  onEdit,
  onDelete,
}) => {
  const x = useMotionValue(0);
  const background = useTransform(
    x,
    [-100, 0, 100],
    [
      "rgba(239, 68, 68, 0.2)",
      "rgba(255, 255, 255, 0.03)",
      "rgba(34, 197, 94, 0.2)",
    ],
  );

  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: 24 }}>
      {/* Swipe Background Logic */}
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          background,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          zIndex: 0,
        }}
      >
        <div style={{ opacity: 0.5 }}>
          <Trash2 size={24} color="#ef4444" />
        </div>
        <div style={{ opacity: 0.5 }}>
          <Check size={24} color="#22c55e" />
        </div>
      </motion.div>

      <motion.div
        drag="x"
        dragConstraints={{ left: -100, right: 100 }}
        dragDirectionLock
        dragMomentum={false}
        style={{
          x,
          touchAction: "pan-y",
          position: "relative",
          zIndex: 1,
          borderRadius: 12,
          border: `1px solid ${completed ? habit.color : "var(--border)"}`,
          borderLeft: `4px solid ${habit.color}`,
          overflow: "hidden",
          background: completed ? `color-mix(in srgb, ${habit.color} 15%, var(--surface-solid))` : "var(--surface-solid)",
        }}
        onDragEnd={(e, info) => {
          if (info.offset.x > 80) {
            onComplete({ id: getSafeId(habit), date: today });
          } else if (info.offset.x < -80) {
            onDelete(habit);
          }
        }}
        className="haptic-tap"
        onClick={() => onEdit(habit)}
      >
        <div className="btn-glint" style={{ opacity: 0.05 }} />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "22px 24px",
          }}
        >
          <div
            style={{
              fontSize: 24,
              filter: "none",
              background: completed
                ? `${habit.color}15`
                : "rgba(255,255,255,0.03)",
              width: 54,
              height: 54,
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {habit.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontWeight: 600,
                fontSize: 16,
                letterSpacing: "-0.01em",
                color: "var(--text)",
              }}
            >
              {habit.name}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--muted)",
                fontWeight: 700,
                marginTop: 4,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Flame
                size={12}
                style={{
                  color: habit.streak?.current > 0 ? "#ff7c6d" : "var(--muted)",
                }}
                fill={habit.streak?.current > 0 ? "#ff7c6d" : "none"}
              />
              {habit.streak?.current}d Streak • {habit.frequency}
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={(e) => {
              e.stopPropagation();
              onComplete({ id: getSafeId(habit), date: today });
            }}
            className="haptic-tap"
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              background: completed ? habit.color : "rgba(255,255,255,0.05)",
              boxShadow: completed ? `inset 0 1px 0 rgba(255,255,255,0.2)` : "none",
              border: completed ? "none" : "1.5px solid rgba(255,255,255,0.05)",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            {completed ? (
              <Check size={24} strokeWidth={3} />
            ) : (
              <div
                className="shimmer-pulse"
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "var(--accent)",
                }}
              />
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default function HabitsPage() {
  const qc = useQueryClient();
  const feedback = useFeedback();
  const { addToast } = useNotifications();
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState("");
  const [celebration, setCelebration] = useState({
    open: false,
    title: "",
    subtitle: "",
  });
  const [confirmDialog, setConfirmDialog] = useState({ open: false });
  const today = safeToLocalISO(new Date());
  const width = useWindowWidth();
  const isMobile = width <= 768;

  const { data, isLoading } = useQuery({
    queryKey: ["habits"],
    queryFn: () => habitsAPI.getAll().then((r) => r.data?.habits || []),
  });

  const invalidate = () => {
    qc.invalidateQueries(["habits"]);
    qc.invalidateQueries(["dashboard"]);
  };

  const createMutation = useMutation({
    mutationFn: habitsAPI.create,
    onSuccess: () => {
      addToast("Ritual established!", "success");
      setModal(null);
      invalidate();
    },
    onError: (err) =>
      addToast(
        err.response?.data?.error || "Failed to establish ritual.",
        "error",
      ),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => habitsAPI.update(id, data),
    onSuccess: () => {
      addToast("Ritual refined!", "success");
      setModal(null);
      invalidate();
    },
    onError: (err) =>
      addToast(
        err.response?.data?.error || "Failed to refine ritual.",
        "error",
      ),
  });

  const deleteMutation = useMutation({
    mutationFn: habitsAPI.delete,
    onSuccess: () => {
      addToast("Ritual banished", "info");
      invalidate();
    },
    onError: (err) =>
      addToast(
        err.response?.data?.error || "Failed to banish ritual.",
        "error",
      ),
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, date }) => habitsAPI.complete(id, { date }),
    onMutate: async ({ id, date }) => {
      await qc.cancelQueries({ queryKey: ["habits"] });
      const previousState = qc.getQueryData(["habits"]);
      if (previousState) {
        qc.setQueryData(["habits"], previousState.map(h => {
          if ((h._id === id) || (h.id === id)) {
            const hasDate = h.completions?.some(c => c.date === date);
            let newCompletions = h.completions || [];
            if (hasDate) {
              newCompletions = newCompletions.filter(c => c.date !== date);
            } else {
              newCompletions = [...newCompletions, { date }];
            }
            return { ...h, completions: newCompletions };
          }
          return h;
        }));
      }
      return { previousState };
    },
    onError: (err, variables, context) => {
      if (context?.previousState) {
        qc.setQueryData(["habits"], context.previousState);
      }
      addToast(err.response?.data?.error || "Synchronization failed.", "error");
    },
    onSettled: () => {
      invalidate();
    },
    onSuccess: (res) => {
      feedback("success");

      const habit = res.data.habit;
      if (
        habit &&
        habit.streak?.current > 0 &&
        habit.streak.current % 7 === 0
      ) {
        addToast(
          `Magnificent! ${habit.streak.current} day streak achieved.`,
          "success",
        );
        setCelebration({
          open: true,
          title: `${habit.streak.current} DAY STREAK`,
          subtitle: "Ritual Synchronization Complete",
        });
      } else {
        addToast(`Ritual synchronized: ${habit?.name || ""}`, "success");
      }
    },
  });

  const habits = React.useMemo(() => {
    return (data || []).filter(
      (h) =>
        h.name?.toLowerCase().includes(search.toLowerCase()) ||
        h.description?.toLowerCase().includes(search.toLowerCase()),
    );
  }, [data, search]);
  const completedTodayCount = habits.filter((h) =>
    h.completions?.some((c) => c.date === today),
  ).length;
  const syncRate = habits.length
    ? Math.round((completedTodayCount / habits.length) * 100)
    : 0;

  const isCompleted = (habit, date) =>
    habit.completions?.some((c) => c.date === date);

  const handleSave = (formData) => {
    if (formData._delete) {
      setModal(null);
      return;
    }
    if (modal && getSafeId(modal))
      updateMutation.mutate({ id: getSafeId(modal), data: formData });
    else createMutation.mutate(formData);
  };

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
            <RefreshCcw size={24} style={{ color: "var(--accent)" }} />
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
              Habits
            </h1>
            <p style={{ fontSize: "0.95rem", color: "var(--muted)", margin: "4px 0 0", fontWeight: 500, letterSpacing: "0.2px" }}>
              Build consistency through daily rituals
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center", zIndex: 1 }}>
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
            <span style={{ letterSpacing: "0.5px" }}>New Habit</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          width: "100%",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            padding: "4px",
            borderRadius: 12,
            background: "var(--surface-solid)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              borderRadius: 8,
              padding: "0 16px",
              height: 42,
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <Search size={18} color="var(--muted)" />
            <input
              placeholder="Find rituals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="no-ring"
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                boxShadow: "none",
                color: "var(--text)",
                fontWeight: 500,
                width: "100%",
                fontSize: 14,
              }}
            />
          </div>
        </div>
      </motion.div>

      <div
        className="stats-grid-auto mb-10"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 12,
          marginBottom: 32,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="app-module-entrance"
          style={{
            padding: "20px",
            borderRadius: 16,
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px dashed rgba(255, 255, 255, 0.08)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: "var(--muted)",
              letterSpacing: 0.5,
              marginBottom: 4,
              textTransform: "uppercase",
            }}
          >
            Active
          </div>
          <div
            style={{
              fontSize: "24px",
              fontWeight: 700,
              fontFamily: "'Inter', sans-serif",
              color: "white",
            }}
          >
            {habits.length}
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="app-module-entrance"
          style={{
            padding: "20px",
            borderRadius: 16,
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px dashed rgba(255, 255, 255, 0.08)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: "var(--muted)",
              letterSpacing: 0.5,
              marginBottom: 4,
              textTransform: "uppercase",
            }}
          >
            Sync Rate
          </div>
          <div
            style={{
              fontSize: "24px",
              fontWeight: 700,
              fontFamily: "'Inter', sans-serif",
              color: syncRate > 80 ? "var(--green)" : "var(--yellow)",
            }}
          >
            {syncRate}%
          </div>
        </motion.div>
      </div>

      {isLoading ? (
        <div className="loading-page">
          <div className="loading-spinner" style={{ width: 32, height: 32 }} />
        </div>
      ) : habits.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="empty-state-premium"
          style={{
            padding: "60px 40px",
            textAlign: "center",
            borderRadius: 16,
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px dashed rgba(255, 255, 255, 0.08)",
          }}
        >
          <div
            className="empty-icon aura-float"
            style={{
              fontSize: 64,
              marginBottom: 24,
              filter: "none",
            }}
          >
            🎭
          </div>
          <h2
            className="empty-title"
            style={{
              fontSize: 24,
              fontWeight: 700,
              fontFamily: "'Inter', sans-serif",
              letterSpacing: "-0.02em",
            }}
          >
            The Stage is Set
          </h2>
          <p
            className="empty-desc"
            style={{
              marginTop: 16,
              fontSize: 18,
              opacity: 0.6,
              maxWidth: 450,
              marginInline: "auto",
            }}
          >
            Begin your biological evolution by defining your first
            high-performance ritual.
          </p>
          <button
            className="auth-button magnetic-btn haptic-tap"
            style={{
              marginTop: 40,
              width: "auto",
              padding: "0 40px",
              height: 56,
              borderRadius: 18,
            }}
            onClick={() => setModal("create")}
          >
            Forge Your First Ritual
          </button>
        </motion.div>
      ) : isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ padding: "0 8px", marginBottom: -4 }}>
            <span
              style={{
                fontSize: 11,
                color: "var(--muted)",
                textTransform: "uppercase",
                letterSpacing: 3,
                fontWeight: 900,
              }}
            >
              Daily Objectives
            </span>
          </div>
          {habits.map((habit, idx) => {
            const hid = getSafeId(habit, `habit-${idx}`);
            return (
              <MobileRitualCard
                key={`mobile-${hid}`}
                habit={habit}
                today={today}
                completed={isCompleted(habit, today)}
                onComplete={completeMutation.mutate}
                onEdit={setModal}
                onDelete={(h) =>
                  setConfirmDialog({
                    open: true,
                    title: "Banish Ritual?",
                    confirmText: "Banish",
                    onConfirm: () => {
                      deleteMutation.mutate(getSafeId(h));
                      setConfirmDialog({ open: false });
                    },
                  })
                }
              />
            );
          })}
        </div>
      ) : (
        <div className="rituals-grid">
          <AnimatePresence>
            {habits.map((habit, idx) => {
              const hid = getSafeId(habit, `habit-${idx}`);
              return (
                <RitualCard
                  key={`desktop-${hid}`}
                  habit={habit}
                  today={today}
                  isCompleted={isCompleted}
                  onComplete={completeMutation.mutate}
                  onEdit={setModal}
                  onDelete={(h) =>
                    setConfirmDialog({
                      open: true,
                      title: "Banish Ritual?",
                      confirmText: "Banish",
                      onConfirm: () => {
                        deleteMutation.mutate(getSafeId(h));
                        setConfirmDialog({ open: false });
                      },
                    })
                  }
                />
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {modal && (
          <HabitModal
            habit={modal === "create" ? null : modal}
            onClose={() => setModal(null)}
            onSave={handleSave}
            onDelete={(h) => {
              setConfirmDialog({
                open: true,
                title: "Banish Ritual?",
                confirmText: "Banish",
                onConfirm: () => {
                  deleteMutation.mutate(getSafeId(h));
                  setConfirmDialog({ open: false });
                  setModal(null);
                },
              });
            }}
          />
        )}
      </AnimatePresence>

      <ConfirmDialog
        {...confirmDialog}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ open: false })}
      />

      <Celebration
        open={celebration.open}
        onClose={() => setCelebration({ ...celebration, open: false })}
        title={celebration.title}
        subtitle={celebration.subtitle}
      />
    </div>
  );
}
