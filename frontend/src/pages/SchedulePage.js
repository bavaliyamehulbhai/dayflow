import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { scheduleAPI, tasksAPI } from "../utils/api";
import { useNotifications } from "../context/NotificationContext";
import { format, addDays, subDays, isValid, parseISO } from "date-fns";
import { safeFormat, safeNewDate, safeToLocalISO } from "../utils/dateUtils";
import { getSafeId } from "../utils/idUtils";
import {
  Calendar as CalendarIcon,
  Clock,
  Layers,
  Plus,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Trash2,
  Sparkles,
  MapPin,
  X,
  Pencil,
  Activity,
  Target,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ConfirmDialog from "../components/ConfirmDialog";
import SensitivityShield from "../components/layout/SensitivityShield";
import MagneticButton from "../components/common/MagneticButton";
import AuraOrb from "../components/common/AuraOrb";

const CATEGORIES = [
  "work",
  "personal",
  "health",
  "learning",
  "social",
  "other",
];
const CAT_COLORS = {
  work: "#7c6dfa",
  personal: "#fa6d8a",
  health: "#6dfacc",
  learning: "#fad96d",
  social: "#fa9a6d",
  other: "#a3a3a3",
};

function EventModal({ event, date, onClose, onSave, tasks, isMobile }) {
  const { addToast } = useNotifications();
  const [form, setForm] = useState({
    title: event?.title || "",
    description: event?.description || "",
    date: event?.date || date,
    startTime: event?.startTime || "",
    endTime: event?.endTime || "",
    category: event?.category || "other",
    color: event?.color || "#7c6dfa",
    linkedTask: event?.linkedTask?._id || "",
  });

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        zIndex: 1000,
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
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
          <div style={{ fontWeight: 600, fontSize: 18, color: "var(--text)" }}>
            {event ? "Edit Event" : "New Event"}
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
        <div
          style={{
            padding: "24px",
            overflowY: "auto",
            flex: 1
          }}
        >
          <div className="form-group mb-6">
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
              Title
            </label>
            <input
              className="auth-input"
              style={{
                height: 48,
                fontSize: 15,
                borderRadius: 8,
                background: "var(--bg)",
                border: "1px solid var(--border)",
                padding: "0 16px"
              }}
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              placeholder="Event title"
              autoFocus
            />
          </div>
          <div className="form-group mb-6">
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
              Context
            </label>
            <textarea
              className="auth-input"
              style={{
                padding: "12px 16px",
                minHeight: 100,
                fontSize: 14,
                borderRadius: 8,
                background: "var(--bg)",
                border: "1px solid var(--border)",
              }}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              rows={3}
              placeholder="Define the focus..."
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 16,
              marginBottom: 24,
            }}
          >
            <div className="form-group">
              <label
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 8,
                  display: "block",
                }}
              >
                DATE
              </label>
              <input
                type="date"
                className="auth-input"
                style={{ height: 42, fontSize: 13, borderRadius: 6, background: "var(--bg)", border: "1px solid var(--border)", padding: "0 12px" }}
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
              />
            </div>
            <div className="form-group">
              <label
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 8,
                  display: "block",
                }}
              >
                START
              </label>
              <input
                type="time"
                className="auth-input"
                style={{ height: 42, fontSize: 13, borderRadius: 6, background: "var(--bg)", border: "1px solid var(--border)", padding: "0 12px" }}
                value={form.startTime}
                onChange={(e) =>
                  setForm((f) => ({ ...f, startTime: e.target.value }))
                }
              />
            </div>
            <div className="form-group">
              <label
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 8,
                  display: "block",
                }}
              >
                END
              </label>
              <input
                type="time"
                className="auth-input"
                style={{ height: 42, fontSize: 13, borderRadius: 6, background: "var(--bg)", border: "1px solid var(--border)", padding: "0 12px" }}
                value={form.endTime}
                onChange={(e) =>
                  setForm((f) => ({ ...f, endTime: e.target.value }))
                }
              />
            </div>
          </div>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            <div className="form-group">
              <label
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 8,
                  display: "block",
                }}
              >
                DOMAIN
              </label>
              <select
                className="select"
                style={{ height: 42, borderRadius: 6, fontSize: 13, background: "var(--bg)", border: "1px solid var(--border)", padding: "0 12px", width: "100%" }}
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
              >
                {CATEGORIES.map((c, cIdx) => (
                  <option key={`cat-${cIdx}`} value={c}>
                    {c.toUpperCase()}
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
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 8,
                  display: "block",
                }}
              >
                LINK OBJECTIVE
              </label>
              <select
                className="select"
                style={{ height: 42, borderRadius: 6, fontSize: 13, background: "var(--bg)", border: "1px solid var(--border)", padding: "0 12px", width: "100%" }}
                value={form.linkedTask}
                onChange={(e) =>
                  setForm((f) => ({ ...f, linkedTask: e.target.value }))
                }
              >
                <option value="">NO LINK</option>
                {tasks?.map((t, tIdx) => {
                  const tid = getSafeId(t, `task-${tIdx}`);
                  return (
                    <option key={tid} value={tid}>
                      {t.title} ({t.priority?.toUpperCase() || "NORMAL"})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>
        <div
          style={{
            padding: "20px 24px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            gap: 12,
            justifyContent: "flex-end"
          }}
        >
          <button
            onClick={onClose}
            style={{ padding: "8px 16px", borderRadius: 6, fontWeight: 600, background: "transparent", border: "1px solid var(--border)", color: "var(--text)" }}
          >
            Cancel
          </button>
          <button
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              background: "var(--text)",
              color: "var(--bg)",
              border: "none"
            }}
            onClick={() => {
              if (!form.title.trim() || !form.startTime || !form.date)
                return addToast("Required data missing", "error");
              onSave({ ...form, linkedTask: form.linkedTask || null });
            }}
          >
            Save Event
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function useWindowWidth() {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return w;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

export default function SchedulePage() {
  const qc = useQueryClient();
  const { addToast } = useNotifications();
  const [currentDate, setCurrentDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [modal, setModal] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false });
  const width = useWindowWidth();
  const isMobile = width <= 768;

  const { data, isLoading } = useQuery({
    queryKey: ["schedule", currentDate],
    queryFn: () =>
      scheduleAPI.getAll({ date: currentDate }).then((r) => r.data.events),
  });

  const { data: tasks } = useQuery({
    queryKey: ["tasks-light"],
    queryFn: () =>
      tasksAPI
        .getAll({ status: "pending", limit: 30 })
        .then((r) => r.data.tasks),
  });

  const invalidate = () => qc.invalidateQueries(["schedule"]);

  const createMutation = useMutation({
    mutationFn: scheduleAPI.create,
    onSuccess: () => {
      addToast("Objective manifested", "success");
      setModal(null);
      invalidate();
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => scheduleAPI.update(id, data),
    onSuccess: () => {
      addToast("Alignment refined", "success");
      setModal(null);
      invalidate();
    },
  });
  const deleteMutation = useMutation({
    mutationFn: scheduleAPI.delete,
    onSuccess: () => {
      addToast("Alignment banished", "info");
      invalidate();
    },
  });
  const toggleMutation = useMutation({
    mutationFn: scheduleAPI.toggleComplete,
    onSuccess: () => invalidate(),
  });

  const events = data || [];
  const now = new Date();
  const todayStr = format(now, "yyyy-MM-dd");
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const getStatus = (ev) => {
    if (!ev?.startTime || typeof ev.startTime !== "string") return "future";
    if (currentDate < todayStr) return "past";
    if (currentDate > todayStr) return "future";

    const [sh = 0, sm = 0] = ev.startTime.split(":").map(Number);
    const startMin = sh * 60 + sm;
    if (!ev.endTime || typeof ev.endTime !== "string") {
      return startMin <= nowMin ? "past" : "future";
    }
    const [eh = 0, em = 0] = ev.endTime.split(":").map(Number);
    const endMin = eh * 60 + em;
    if (nowMin >= startMin && nowMin < endMin) return "current";
    if (nowMin >= endMin) return "past";
    return "future";
  };

  const handleSave = (data) => {
    const mid = getSafeId(modal);
    if (modal && mid) updateMutation.mutate({ id: mid, data });
    else createMutation.mutate(data);
  };

  const prevDay = () => {
    const d = new Date(currentDate + "T12:00:00");
    d.setDate(d.getDate() - 1);
    setCurrentDate(d.toISOString().split("T")[0]);
  };
  const nextDay = () => {
    const d = new Date(currentDate + "T12:00:00");
    d.setDate(d.getDate() + 1);
    setCurrentDate(d.toISOString().split("T")[0]);
  };

  const hours = Array.from({ length: 18 }, (_, i) => i + 6);

  const getEventTop = (time) => {
    if (!time || typeof time !== "string") return 0;
    const [h = 0, m = 0] = time.split(":").map(Number);
    const rowHeight = isMobile ? 48 : 64;
    return Math.max(0, ((h - 6) * 60 + m) * (rowHeight / 60));
  };

  const getEventHeight = (start, end) => {
    if (!start || typeof start !== "string") return 48;
    if (!end || typeof end !== "string") return 48;
    const [sh = 0, sm = 0] = start.split(":").map(Number);
    const [eh = 0, em = 0] = end.split(":").map(Number);
    const mins = eh * 60 + em - (sh * 60 + sm);
    const rowHeight = isMobile ? 48 : 64;
    return Math.max(40, (mins > 0 ? mins : 30) * (rowHeight / 60));
  };

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
            <CalendarIcon size={24} style={{ color: "var(--accent)" }} />
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
              Schedule
            </h1>
            <p style={{ fontSize: "0.95rem", color: "var(--muted)", margin: "4px 0 0", fontWeight: 500, letterSpacing: "0.2px" }}>
              Plan and align your calendar events
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
            <span style={{ letterSpacing: "0.5px" }}>New Event</span>
          </button>
        </div>
      </div>

        {/* Date navigation */}
        <div
          className="mb-8"
          style={{
            padding: isMobile ? "16px" : "16px 24px",
            display: "flex",
            alignItems: "center",
            gap: 20,
            flexWrap: "wrap",
            borderRadius: 12,
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px solid rgba(255,255,255,0.05)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              flex: isMobile ? "1 1 100%" : "1",
              justifyContent: isMobile ? "space-between" : "flex-start",
            }}
          >
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="btn btn-icon glass haptic-tap"
              onClick={prevDay}
              style={{ borderRadius: 8, width: 36, height: 36 }}
            >
              <ChevronLeft size={20} />
            </motion.button>
            <div
              style={{ textAlign: "center", minWidth: isMobile ? "auto" : 200 }}
            >
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: "white",
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                }}
              >
                {safeFormat(new Date(currentDate + "T12:00:00"), "EEEE")}
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--accent)",
                  marginTop: 4,
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                }}
              >
                {safeFormat(new Date(currentDate + "T12:00:00"), "MMMM d, yyyy")}
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="btn btn-icon glass haptic-tap"
              onClick={nextDay}
              style={{ borderRadius: 8, width: 36, height: 36 }}
            >
              <ChevronRight size={20} />
            </motion.button>
          </div>

          <div
            style={{
              display: "flex",
              gap: 12,
              flex: isMobile ? "1 1 100%" : "none",
              width: isMobile ? "100%" : "auto",
              alignItems: "center",
            }}
          >
            <button
              className="btn glass haptic-tap"
              style={{
                fontWeight: 600,
                fontSize: 12,
                height: 36,
                padding: "0 24px",
                borderRadius: 14,
                fontSize: 13,
                letterSpacing: 1,
              }}
              onClick={() =>
                setCurrentDate(safeFormat(new Date(), "yyyy-MM-dd"))
              }
            >
              TODAY
            </button>
            <div
              style={{
                height: 32,
                width: 1,
                background: "rgba(255,255,255,0.1)",
                margin: "0 8px",
              }}
              className="hide-mobile"
            />
            <input
              type="date"
              className="auth-input"
              style={{
                flex: isMobile ? 1 : "none",
                width: isMobile ? "auto" : 180,
                height: 44,
                borderRadius: 14,
                fontSize: 13,
                fontWeight: 800,
                padding: "0 16px",
              }}
              value={currentDate}
              onChange={(e) => setCurrentDate(e.target.value)}
            />
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 340px",
            gap: 24,
            alignItems: "start",
          }}
        >
          {/* Timeline */}
          <div
            style={{
              padding: 0,
              overflow: "hidden",
              border: "1px solid var(--border)",
              borderRadius: 16,
              background: "var(--surface-solid)",
            }}
          >
            <div
              style={{
                position: "relative",
                paddingLeft: isMobile ? 60 : 100,
                paddingRight: 16,
                paddingTop: 60,
                paddingBottom: 60,
              }}
            >
              {hours.map((h) => (
                <div
                  key={h}
                  onClick={() => {
                    const padHour = String(h).padStart(2, "0");
                    setModal({
                      title: "",
                      description: "",
                      startTime: `${padHour}:00`,
                      endTime: `${String(h + 1).padStart(2, "0")}:00`,
                      category: "other"
                    });
                  }}
                  style={{
                    position: "relative",
                    height: isMobile ? 48 : 64,
                    borderBottom: "1px solid rgba(255,255,255,0.02)",
                    zIndex: 1,
                    cursor: "pointer"
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: isMobile ? -54 : -84,
                      top: -11,
                      fontSize: 10,
                      color: "var(--muted)",
                      fontWeight: 600,
                      width: isMobile ? 44 : 70,
                      textAlign: "right",
                      opacity: 0.5,
                    }}
                  >
                    {h === 12 ? "12 PM" : h < 12 ? `${h} AM` : `${h - 12} PM`}
                  </div>
                </div>
              ))}

              {/* Indicator */}
              {currentDate === safeFormat(new Date(), "yyyy-MM-dd") &&
                now.getHours() >= 6 &&
                now.getHours() <= 23 && (
                  <div
                    style={{
                      position: "absolute",
                      top:
                        getEventTop(`${now.getHours()}:${now.getMinutes()}`) +
                        62,
                      left: 0,
                      right: 0,
                      height: 2,
                      background:
                        "linear-gradient(90deg, var(--accent), transparent)",
                      zIndex: 20,
                    }}
                  >
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: "var(--accent)",
                        marginTop: -4,
                        marginLeft: -5,
                      }}
                    />
                  </div>
                )}

              {/* Rendered Events */}
              <AnimatePresence>
                {events.length > 0
                  ? events.map((ev, idx) => {
                      const status =
                        currentDate === safeFormat(new Date(), "yyyy-MM-dd")
                          ? getStatus(ev)
                          : "future";
                      const top = getEventTop(ev.startTime);
                      const height = getEventHeight(ev.startTime, ev.endTime);
                      const color = CAT_COLORS[ev.category] || "var(--accent)";

                      const eventKey = getSafeId(ev, `ev-${idx}`);
                      return (
                        <motion.div
                          key={eventKey}
                          layoutId={eventKey}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          style={{
                            position: "absolute",
                            top: top + 64,
                            left: 14,
                            right: 14,
                            height: height - 6,
                            background:
                              status === "current"
                                ? `color-mix(in srgb, ${color} 10%, rgba(255, 255, 255, 0.02))`
                                : `rgba(255, 255, 255, 0.02)`,
                            border: `1px solid ${status === "current" ? `color-mix(in srgb, ${color} 30%, transparent)` : "rgba(255, 255, 255, 0.05)"}`,
                            borderLeft: `3px solid ${color}`,
                            borderRadius: 8,
                            padding: isMobile ? "8px 12px" : "12px 16px",
                            overflow: "hidden",
                            cursor: "pointer",
                            opacity: ev.isCompleted
                              ? 0.4
                              : status === "past"
                                ? 0.7
                                : 1,
                            zIndex: 10,
                            boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.05)",
                            backdropFilter: "blur(10px)",
                          }}
                          whileHover={{ scale: 1.01, zIndex: 11 }}
                          onClick={() => setModal(ev)}
                        >
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: isMobile ? 14 : 15,
                              color: "white",
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              letterSpacing: "0",
                            }}
                          >
                            {ev.isCompleted && (
                              <CheckCircle2
                                size={18}
                                style={{ color: "var(--green)" }}
                              />
                            )}
                            {ev.title}
                          </div>
                          {height > 60 && (
                            <div
                              style={{
                                fontSize: 11,
                                color: "var(--muted)",
                                marginTop: 8,
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                fontWeight: 800,
                              }}
                            >
                              <Clock size={14} />
                              {ev.startTime} — {ev.endTime || "∞"}
                            </div>
                          )}
                        </motion.div>
                      );
                    })
                  : null}
              </AnimatePresence>
            </div>
          </div>

          {/* List/Summary */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                paddingLeft: 8,
              }}
            >
              <Activity size={20} className="text-accent" />
              <div
                style={{
                  fontWeight: 900,
                  fontSize: 12,
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  letterSpacing: 2.5,
                }}
              >
                Chronology
              </div>
            </div>

            {isLoading ? (
              <div className="loading-spinner" />
            ) : events.length === 0 ? (
              <div
                className="premium-card aura-iridescent"
                style={{ padding: 40, textAlign: "center", borderRadius: 28 }}
              >
                <div style={{ fontSize: 44, marginBottom: 20 }}>🌌</div>
                <div
                  style={{
                    fontWeight: 900,
                    fontFamily: "Syne",
                    fontSize: 18,
                    marginBottom: 10,
                  }}
                >
                  VACUUM DETECTED
                </div>
                <div
                  style={{
                    color: "var(--muted)",
                    fontSize: 13,
                    lineHeight: 1.6,
                  }}
                >
                  Manifest a temporal objective to fill this cycle.
                </div>
              </div>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                {events.map((ev, i) => {
                  const color = CAT_COLORS[ev.category] || "var(--accent)";
                  const status =
                    currentDate === safeFormat(new Date(), "yyyy-MM-dd")
                      ? getStatus(ev)
                      : "future";
                  const evListKey = getSafeId(ev, `ev-side-${i}`);
                  return (
                    <motion.div
                      key={getSafeId(ev, `ev-list-${i}`)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="premium-card hover-lift"
                      style={{
                        padding: 16,
                        borderLeft: `4px solid ${color}`,
                        background:
                          status === "current"
                            ? `${color}08`
                            : "rgba(255,255,255,0.01)",
                        opacity: ev.isCompleted ? 0.4 : 1,
                      }}
                      onClick={() => setModal(ev)}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4
                            style={{
                              margin: 0,
                              fontSize: 15,
                              fontWeight: 900,
                              color: "white",
                              textDecoration: ev.isCompleted
                                ? "line-through"
                                : "none",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {ev.title}
                          </h4>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              marginTop: 6,
                              fontSize: 11,
                              color: "var(--muted)",
                              fontWeight: 800,
                            }}
                          >
                            <Clock size={12} /> {ev.startTime}
                          </div>
                        </div>
                        <div
                          style={{ display: "flex", gap: 8 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className="btn glass btn-sm haptic-tap"
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 10,
                              color: ev.isCompleted
                                ? "var(--green)"
                                : "var(--muted)",
                            }}
                            onClick={() => toggleMutation.mutate(getSafeId(ev))}
                          >
                            <CheckCircle2 size={18} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {isMobile && (
              <motion.button
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                onClick={() => setModal("create")}
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
                  boxShadow: "0 15px 40px rgba(124, 109, 250, 0.4)",
                  zIndex: 100,
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                <Plus size={32} strokeWidth={2.5} />
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {modal && (
          <EventModal
            event={modal === "create" ? null : modal}
            date={currentDate}
            onClose={() => setModal(null)}
            onSave={handleSave}
            tasks={tasks}
            isMobile={isMobile}
          />
        )}
      </AnimatePresence>

      <ConfirmDialog
        {...confirmDialog}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ open: false })}
      />
    </div>
  );
}
