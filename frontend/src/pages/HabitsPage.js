import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { habitsAPI } from "../utils/api";
import { useNotifications } from "../context/NotificationContext";
import { subDays, eachDayOfInterval } from "date-fns";
import { safeFormat, safeToLocalISO } from "../utils/dateUtils";
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
import AuraOrb from "../components/common/AuraOrb";

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
      className="flex flex-col h-full"
    >
      <div
        className="modal-body custom-scrollbar"
        style={{
          padding: isMobile ? "24px" : "32px 40px",
          paddingBottom: isMobile ? "140px" : 40,
          flex: 1,
          overflowY: "auto",
        }}
      >
        <div className="form-group mb-8">
          <label
            style={{
              fontSize: 11,
              fontWeight: 900,
              color: "var(--muted)",
              letterSpacing: 2,
              textTransform: "uppercase",
              marginBottom: 12,
              display: "block",
            }}
          >
            Ritual Title
          </label>
          <input
            className="auth-input haptic-feedback custom-ritual-input"
            style={{
              height: 60,
              fontSize: 18,
              fontWeight: 700,
              background: "rgba(255,255,255,0.02)",
              borderRadius: 18,
              border: "1px solid rgba(255,255,255,0.05)",
              boxShadow: "inset 0 2px 10px rgba(0,0,0,0.2)",
              width: "100%",
            }}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. MORNING MEDITATION"
            autoFocus
          />
        </div>

        <div className="form-group mb-8">
          <label
            style={{
              fontSize: 11,
              fontWeight: 900,
              color: "var(--muted)",
              letterSpacing: 2,
              textTransform: "uppercase",
              marginBottom: 12,
              display: "block",
            }}
          >
            Identity & Intent
          </label>
          <textarea
            className="auth-input haptic-feedback"
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            placeholder="Why is this ritual essential to your biological evolution?"
            rows={isMobile ? 3 : 4}
            style={{
              height: "auto",
              minHeight: 100,
              padding: "20px",
              borderRadius: 18,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)",
              fontSize: 15,
              width: "100%",
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="form-group">
            <label
              style={{
                fontSize: 11,
                fontWeight: 900,
                color: "var(--muted)",
                letterSpacing: 1.5,
                textTransform: "uppercase",
                marginBottom: 10,
                display: "block",
              }}
            >
              Frequency
            </label>
            <select
              className="auth-input"
              style={{
                height: 56,
                borderRadius: 16,
                width: "100%",
                fontSize: 14,
                fontWeight: 700,
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
                fontSize: 11,
                fontWeight: 900,
                color: "var(--muted)",
                letterSpacing: 1.5,
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
                className="auth-input"
                style={{
                  height: 56,
                  borderRadius: 16,
                  width: "60%",
                  background: "rgba(255,255,255,0.02)",
                  fontWeight: 900,
                  fontSize: 18,
                  textAlign: "center",
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
                  fontSize: 11,
                  fontWeight: 900,
                  color: "var(--muted)",
                  letterSpacing: 1.5,
                }}
              >
                {form.unit.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div className="form-group mb-10">
          <label
            style={{
              fontSize: 11,
              fontWeight: 900,
              color: "var(--muted)",
              letterSpacing: 2,
              textTransform: "uppercase",
              marginBottom: 16,
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
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: c,
                  border:
                    form.color === c
                      ? "3px solid white"
                      : "2px solid rgba(255,255,255,0.1)",
                  position: "relative",
                }}
              >
                {form.color === c && (
                  <motion.div
                    layoutId="active-color-ring"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1.25 }}
                    style={{
                      position: "absolute",
                      inset: -6,
                      borderRadius: "50%",
                      border: `2px solid ${c}`,
                      opacity: 0.5,
                    }}
                  />
                )}
                {form.color === c && (
                  <motion.div
                    animate={{ scale: [1, 1.4], opacity: [0.3, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    style={{
                      position: "absolute",
                      inset: -6,
                      borderRadius: "50%",
                      border: `2px solid ${c}`,
                    }}
                  />
                )}
              </motion.button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="auth-button w-full haptic-tap"
          style={{
            height: 64,
            borderRadius: 20,
            fontSize: 16,
            fontWeight: 900,
            background: form.color,
            letterSpacing: 1.5,
          }}
        >
          {habit ? "REFINE RITUAL" : "FORGE RITUAL"}
        </button>

        {habit && (
          <button
            type="button"
            className="btn btn-ghost text-red w-full mt-4 haptic-tap"
            style={{
              height: 48,
              borderRadius: 14,
              fontSize: 14,
              fontWeight: 700,
              border: "1px solid rgba(239, 68, 68, 0.2)",
            }}
            onClick={() => onDelete(habit)}
          >
            Banish Ritual
          </button>
        )}
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
            {habit ? "Refine Ritual" : "Forge Ritual"}
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
      eachDayOfInterval({
        start: subDays(new Date(), daysToShow - 1),
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
              fontSize: 18,
              fontWeight: 800,
              fontFamily: "Syne",
              marginBottom: 4,
              letterSpacing: "-0.02em",
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

      <div className="ritual-consistency-dots">
        {completionStatus.map((s) => {
          return (
            <div
              key={s.dateStr}
              className={`ritual-dot ${s.done ? "completed" : ""} ${s.isToday ? "today" : ""}`}
              style={{
                backgroundColor: s.done ? habit.color : "",
                boxShadow: s.done ? `0 0 10px ${habit.color}aa` : "",
                borderColor: s.isToday ? habit.color : "",
              }}
              title={s.label}
            />
          );
        })}

        <div style={{ marginLeft: "auto" }}>
          <motion.button
            whileHover={{
              scale: 1.1,
              boxShadow: isTodayCompleted
                ? `0 8px 25px ${habit.color}66`
                : "0 8px 20px rgba(255,255,255,0.1)",
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
                ? `0 8px 20px ${habit.color}44`
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
          borderRadius: 24,
          border: `1.5px solid ${completed ? `${habit.color}33` : "rgba(255,255,255,0.08)"}`,
          overflow: "hidden",
          background: "rgba(20, 20, 25, 0.95)",
        }}
        onDragEnd={(e, info) => {
          if (info.offset.x > 80) {
            onComplete({ id: getSafeId(habit), date: today });
          } else if (info.offset.x < -80) {
            onDelete(habit);
          }
        }}
        className="glass-holographic aura-iridescent haptic-tap"
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
              fontSize: 28,
              filter: completed
                ? `drop-shadow(0 0 12px ${habit.color})`
                : "none",
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
                fontWeight: 800,
                fontSize: 17,
                fontFamily: "Syne",
                letterSpacing: "-0.02em",
                color: completed ? "white" : "var(--text)",
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
              boxShadow: completed ? `0 8px 20px ${habit.color}44` : "none",
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
    onSuccess: (res) => {
      feedback("success");
      invalidate();

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
    onError: (err) =>
      addToast(err.response?.data?.error || "Synchronization failed.", "error"),
  });

  const habits = (data || []).filter(
    (h) =>
      h.name?.toLowerCase().includes(search.toLowerCase()) ||
      h.description?.toLowerCase().includes(search.toLowerCase()),
  );
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
      {/* Immersive Background Layer */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: -1 }}>
        <AuraOrb
          color="rgba(124, 109, 250, 0.15)"
          size="400px"
          top="-5%"
          left="-5%"
          delay={0}
        />
        <AuraOrb
          color="rgba(110, 250, 204, 0.1)"
          size="350px"
          top="40%"
          left="65%"
          delay={3}
        />
        <AuraOrb
          color="rgba(250, 109, 138, 0.08)"
          size="300px"
          top="75%"
          left="5%"
          delay={5}
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
            <RefreshCcw
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
              Ritual Engine
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
              Bio-Neural Maintenance
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            width: "100%",
            marginTop: 24,
          }}
        >
          <div
            className="glass"
            style={{
              borderRadius: 16,
              padding: "0 16px",
              height: 52,
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <Search size={18} color="var(--muted)" />
            <input
              placeholder="Find rituals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: "none",
                border: "none",
                outline: "none",
                color: "white",
                fontWeight: 600,
                width: "100%",
                fontSize: 14,
              }}
            />
          </div>
          <button
            onClick={() => setModal("create")}
            className="auth-button magnetic-btn haptic-tap"
            style={{
              height: 52,
              width: 52,
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
            }}
          >
            <Plus size={24} strokeWidth={2.5} />
          </button>
        </motion.div>
      </div>

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
            Active
          </div>
          <div
            style={{
              fontSize: "28px",
              fontWeight: 900,
              fontFamily: "Syne",
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
            Sync Rate
          </div>
          <div
            style={{
              fontSize: "28px",
              fontWeight: 900,
              fontFamily: "Syne",
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
          className="glass-card aura-iridescent"
          style={{
            padding: "100px 40px",
            textAlign: "center",
            borderRadius: 40,
            border: "none",
          }}
        >
          <div
            className="empty-icon aura-float"
            style={{
              fontSize: 80,
              marginBottom: 24,
              filter: "drop-shadow(0 0 30px var(--accent-glow))",
            }}
          >
            🎭
          </div>
          <h2
            className="empty-title"
            style={{
              fontSize: 32,
              fontWeight: 800,
              fontFamily: "Syne",
              letterSpacing: "-0.04em",
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
