import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { pomodoroAPI, tasksAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { safeFormat } from "../utils/dateUtils";
import {
  Target,
  Coffee,
  Trees,
  Play,
  Pause,
  RotateCcw,
  History,
  Zap,
  Trophy,
  Brain,
  Timer,
  Layers,
  StickyNote,
  Award,
  ChevronDown,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  CloudRain,
  Wind,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import useFeedback from "../hooks/useFeedback";
import ConfirmDialog from "../components/ConfirmDialog";
import AuraOrb from "../components/common/AuraOrb";
import { getSafeId } from "../utils/idUtils";

// ─── Sound Engine ─────────────────────────────────────────────────────────────
const createRainSound = (ctx) => {
  const bufferSize = 2 * ctx.sampleRate,
    noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate),
    output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  const whiteNoise = ctx.createBufferSource();
  whiteNoise.buffer = noiseBuffer;
  whiteNoise.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 400;

  const gain = ctx.createGain();
  gain.gain.value = 0;

  whiteNoise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  return { source: whiteNoise, gain, filter };
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100, damping: 12 },
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const MODES = {
  work: {
    label: "Focus",
    color: "#7c6dfa",
    icon: Brain,
    gradient: "linear-gradient(135deg, #7c6dfa, #fa6d8a)",
  },
  "short-break": {
    label: "Recharge",
    color: "#22c55e",
    icon: Coffee,
    gradient: "linear-gradient(135deg, #22c55e, #10b981)",
  },
  "long-break": {
    label: "Stasis",
    color: "#ff4d7d",
    icon: Trees,
    gradient: "linear-gradient(135deg, #ff4d7d, #f43f5e)",
  },
};

// Responsive hook
function useWindowWidth() {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return w;
}

export default function PomodoroPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { addToast } = useNotifications();
  const feedback = useFeedback();
  const width = useWindowWidth();
  const isMobile = width <= 768;
  const isTablet = width <= 1024 && width > 768;

  const prefs = user?.preferences || {
    pomodoroWork: 25,
    pomodoroBreak: 5,
    pomodoroLong: 15,
  };
  const DURATIONS = {
    work: (prefs.pomodoroWork || 25) * 60,
    "short-break": (prefs.pomodoroBreak || 5) * 60,
    "long-break": (prefs.pomodoroLong || 15) * 60,
  };

  // Performance optimization: use local storage for persistence
  const [mode, setMode] = useState(
    () => localStorage.getItem("df_pomo_mode") || "work",
  );
  const [timeLeft, setTimeLeft] = useState(() => {
    const saved = localStorage.getItem("df_pomo_timeLeft");
    const lastUpdate = localStorage.getItem("df_pomo_lastUpdate");
    const running = localStorage.getItem("df_pomo_running") === "true";

    if (saved && lastUpdate && running) {
      const elapsed = Math.floor((Date.now() - parseInt(lastUpdate)) / 1000);
      return Math.max(0, parseInt(saved) - elapsed);
    }
    return saved
      ? parseInt(saved)
      : DURATIONS[localStorage.getItem("df_pomo_mode") || "work"];
  });
  const [running, setRunning] = useState(
    () => localStorage.getItem("df_pomo_running") === "true",
  );
  const [sessions, setSessions] = useState(
    () => parseInt(localStorage.getItem("df_pomo_sessions")) || 0,
  );
  const [currentPomoId, setCurrentPomoId] = useState(() =>
    localStorage.getItem("df_pomo_id"),
  );
  const [startedAt, setStartedAt] = useState(() => {
    const s = localStorage.getItem("df_pomo_startedAt");
    return s ? parseInt(s) : null;
  });
  const [note, setNote] = useState("");
  const [linkedTask, setLinkedTask] = useState("");
  const [confirmState, setConfirmState] = useState({
    open: false,
    action: null,
    message: "",
  });
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [soundType, setSoundType] = useState("none");
  const [soundVolume, setSoundVolume] = useState(0.3);
  const intervalRef = useRef(null);
  const audioCtxRef = useRef(null);
  const rainRef = useRef(null);
  const persistRef = useRef(0);

  // Sync to local storage
  useEffect(() => {
    const now = Date.now();
    // Throttle writes: Only every 10 seconds OR state transition
    const shouldPersist =
      !running || timeLeft % 10 === 0 || now - persistRef.current > 10000;
    if (!shouldPersist) return;

    localStorage.setItem("df_pomo_mode", mode);
    localStorage.setItem("df_pomo_timeLeft", timeLeft);
    localStorage.setItem("df_pomo_running", running);
    localStorage.setItem("df_pomo_sessions", sessions);
    localStorage.setItem("df_pomo_lastUpdate", now);
    if (currentPomoId) localStorage.setItem("df_pomo_id", currentPomoId);
    else localStorage.removeItem("df_pomo_id");
    if (startedAt) localStorage.setItem("df_pomo_startedAt", startedAt);
    else localStorage.removeItem("df_pomo_startedAt");
    persistRef.current = now;
  }, [mode, timeLeft, running, sessions, currentPomoId, startedAt]);

  // Audio Cleanup on Unmount
  useEffect(() => {
    return () => {
      if (rainRef.current) {
        try {
          rainRef.current.source.stop();
        } catch {}
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close();
      }
    };
  }, []);

  const { data: statsData } = useQuery({
    queryKey: ["pomo-stats"],
    queryFn: () => pomodoroAPI.stats({ period: 7 }).then((r) => r.data.stats),
  });

  const focusTrendData = useMemo(() => {
    const base = statsData?.daily || [];
    return base.map((day) => {
      if (typeof day.minutes === "number" && day.minutes > 0) return day;
      if (typeof day.focusMinutes === "number" && day.focusMinutes > 0) {
        return { ...day, minutes: day.focusMinutes };
      }
      if (typeof day.totalMinutes === "number" && day.totalMinutes > 0) {
        return { ...day, minutes: day.totalMinutes };
      }
      if (typeof day.count === "number" && day.count > 0) {
        return { ...day, minutes: day.count * (prefs.pomodoroWork || 25) };
      }
      return { ...day, minutes: 0 };
    });
  }, [statsData, prefs.pomodoroWork]);

  const { data: tasksData } = useQuery({
    queryKey: ["tasks-for-pomo"],
    queryFn: () =>
      tasksAPI
        .getAll({ status: "pending", limit: 20 })
        .then((r) => r.data.tasks),
  });

  const startMutation = useMutation({
    mutationFn: (data) => pomodoroAPI.start(data),
    onSuccess: (r) => setCurrentPomoId(getSafeId(r.data.pomodoro)),
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, data }) => pomodoroAPI.complete(id, data),
    onSuccess: () => {
      qc.invalidateQueries(["pomo-stats"]);
      qc.invalidateQueries(["dashboard"]);
    },
  });

  const duration = DURATIONS[mode];
  const progress = ((duration - timeLeft) / duration) * 100;
  const modeInfo = MODES[mode];
  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const playSound = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (
          window.AudioContext || window.webkitAudioContext
        )();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 440;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.8);
    } catch {}
  }, []);

  const toggleSound = (type) => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (
        window.AudioContext || window.webkitAudioContext
      )();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === "suspended") ctx.resume();

    if (soundType === type) {
      if (rainRef.current) {
        rainRef.current.gain.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + 1,
        );
        setTimeout(() => {
          if (rainRef.current) rainRef.current.source.stop();
          rainRef.current = null;
        }, 1100);
      }
      setSoundType("none");
    } else {
      if (rainRef.current) rainRef.current.source.stop();
      if (type === "rain") {
        const rain = createRainSound(ctx);
        rain.source.start();
        rain.gain.gain.exponentialRampToValueAtTime(
          soundVolume,
          ctx.currentTime + 1,
        );
        rainRef.current = rain;
      }
      setSoundType(type);
    }
  };

  useEffect(() => {
    if (rainRef.current) {
      rainRef.current.gain.gain.setTargetAtTime(
        soundVolume,
        audioCtxRef.current.currentTime,
        0.1,
      );
    }
  }, [soundVolume]);

  const handleComplete = useCallback(() => {
    clearInterval(intervalRef.current);
    setRunning(false);
    playSound();
    feedback("complete");
    if (currentPomoId && mode === "work") {
      const actualDuration = startedAt
        ? Math.round((Date.now() - startedAt) / 1000)
        : DURATIONS.work;
      completeMutation.mutate({
        id: currentPomoId,
        data: { actualDuration, note },
      });
      setSessions((s) => s + 1);
    }
    const nextMode =
      mode === "work"
        ? (sessions + 1) % 4 === 0
          ? "long-break"
          : "short-break"
        : "work";
    addToast(`✨ ${modeInfo.label} session complete!`, "success", 4000);
    setTimeout(() => {
      setMode(nextMode);
      setTimeLeft(DURATIONS[nextMode]);
      setCurrentPomoId(null);
      setStartedAt(null);
    }, 500);
  }, [
    mode,
    currentPomoId,
    sessions,
    startedAt,
    note,
    modeInfo,
    completeMutation,
    DURATIONS,
    playSound,
    addToast,
  ]);

  useEffect(() => {
    if (running) {
      const startTimer = Date.now();
      const initialTime = timeLeft;

      intervalRef.current = setInterval(() => {
        const delta = Math.floor((Date.now() - startTimer) / 1000);
        const nextTime = Math.max(0, initialTime - delta);

        setTimeLeft(nextTime);
        if (nextTime <= 0) {
          handleComplete();
        }
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, handleComplete]);

  useEffect(() => {
    document.title = running
      ? `${formatTime(timeLeft)} · ${modeInfo.label}`
      : "Flow State";
    return () => {
      document.title = "DayFlow";
    };
  }, [running, timeLeft, modeInfo]);

  const handleStart = () => {
    if (!running) {
      setStartedAt(Date.now());
      if (mode === "work" && !currentPomoId) {
        startMutation.mutate({
          type: mode,
          linkedTask: linkedTask || undefined,
        });
      }
    }
    setRunning(!running);
  };

  const handleReset = () => {
    setConfirmState({
      open: true,
      action: "reset",
      message: "Reset this session? Your progress will be lost.",
    });
  };

  const handleModeChange = (newMode) => {
    if (running) {
      setConfirmState({
        open: true,
        action: "mode",
        newMode,
        message: "Abandon current session and switch mode?",
      });
      return;
    }
    switchMode(newMode);
  };

  const switchMode = (newMode) => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setMode(newMode);
    setTimeLeft(DURATIONS[newMode]);
    setCurrentPomoId(null);
    setStartedAt(null);
  };

  const handleConfirm = () => {
    const { action, newMode } = confirmState;
    if (action === "reset") {
      clearInterval(intervalRef.current);
      setRunning(false);
      setTimeLeft(DURATIONS[mode]);
      setCurrentPomoId(null);
      setStartedAt(null);
    } else if (action === "mode") {
      switchMode(newMode);
    }
    setConfirmState({ open: false, action: null, message: "" });
  };

  // Responsive SVG timer size
  const timerSize = isMobile ? Math.min(width - 60, 240) : isTablet ? 250 : 280;
  const radius = timerSize * 0.39;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const sidebarContent = (
    <>
      {/* Stats */}
      <motion.div
        variants={itemVariants}
        className="premium-card aura-iridescent"
        style={{
          borderRadius: 24,
          padding: 24,
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 20,
          }}
        >
          <History size={16} className="text-accent" />
          <div
            style={{
              fontSize: 13,
              color: "var(--muted)",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: 1.5,
            }}
          >
            Mastery Protocol
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            {
              label: "Cycle Stats",
              value: statsData?.periodPomos ?? 0,
              sub: `${statsData?.periodFocusMinutes || 0}m`,
              icon: Zap,
              color: "#7c6dfa",
            },
            {
              label: "Temporal Mass",
              value: statsData?.totalPomos ?? 0,
              sub: "loops",
              icon: Layers,
              color: "#ff4d7d",
            },
            {
              label: "Deep Focus",
              value: statsData?.totalFocusMinutes
                ? `${Math.floor(statsData.totalFocusMinutes / 60)}h`
                : "0h",
              sub: "accrued",
              icon: Trophy,
              color: "#00f2fe",
            },
          ].map((s, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                padding: "16px",
                background: "rgba(255,255,255,0.02)",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.03)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <s.icon size={18} style={{ color: s.color }} />
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--muted)",
                    fontWeight: 900,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  {s.label}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: "var(--text)",
                    }}
                  >
                    {s.value}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--muted)",
                      fontWeight: 600,
                    }}
                  >
                    {s.sub}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Link Task */}
      <motion.div
        variants={itemVariants}
        className="premium-card aura-iridescent"
        style={{
          borderRadius: 24,
          padding: 24,
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 16,
          }}
        >
          <Target size={16} className="text-accent" />
          <div
            style={{
              fontSize: 13,
              color: "var(--muted)",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: 1.5,
            }}
          >
            Active Objective
          </div>
        </div>
        <div style={{ position: "relative" }}>
          <select
            className="auth-input"
            style={{ height: 50, fontSize: 14, borderRadius: 14 }}
            value={linkedTask}
            onChange={(e) => setLinkedTask(e.target.value)}
          >
            <option value="">— Unlinked Session —</option>
            {tasksData?.map((t, index) => {
              const tid = getSafeId(t, `task-${index}`);
              return (
                <option key={tid} value={tid}>
                  {t.title}
                </option>
              );
            })}
          </select>
        </div>
      </motion.div>

      {/* Session Note */}
      <motion.div
        variants={itemVariants}
        className="premium-card aura-iridescent"
        style={{
          borderRadius: 24,
          padding: 24,
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 16,
          }}
        >
          <StickyNote size={16} className="text-accent" />
          <div
            style={{
              fontSize: 13,
              color: "var(--muted)",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: 1.5,
            }}
          >
            Session Intent
          </div>
        </div>
        <textarea
          className="auth-input"
          rows={3}
          style={{
            minHeight: 100,
            borderRadius: 16,
            padding: 16,
            fontSize: 14,
          }}
          placeholder="Declare your focus for this interval..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </motion.div>

      {/* Soundscapes */}
      <motion.div
        variants={itemVariants}
        className="premium-card aura-iridescent"
        style={{
          borderRadius: 24,
          padding: 24,
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 16,
          }}
        >
          <Volume2 size={16} className="text-accent" />
          <div
            style={{
              fontSize: 13,
              color: "var(--muted)",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: 1.5,
            }}
          >
            Atmospheres
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button
            className={`btn haptic-tap ${soundType === "rain" ? "btn-primary" : "glass"}`}
            style={{
              flex: 1,
              borderRadius: 12,
              height: 44,
              fontSize: 12,
              fontWeight: 700,
            }}
            onClick={() => toggleSound("rain")}
          >
            <CloudRain size={16} /> <span style={{ marginLeft: 8 }}>Rain</span>
          </button>
          <button
            className={`btn haptic-tap glass`}
            style={{
              flex: 1,
              borderRadius: 12,
              height: 44,
              fontSize: 12,
              fontWeight: 700,
            }}
            onClick={() => toggleSound(soundType)}
          >
            <VolumeX size={16} /> <span style={{ marginLeft: 8 }}>Mute</span>
          </button>
        </div>
        {soundType !== "none" && (
          <div style={{ padding: "0 4px" }}>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={soundVolume}
              onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
              style={{
                width: "100%",
                accentColor: "var(--accent)",
                cursor: "pointer",
              }}
            />
          </div>
        )}
      </motion.div>

      {/* Config */}
      <motion.div
        variants={itemVariants}
        className="premium-card aura-iridescent"
        style={{
          borderRadius: 24,
          padding: 20,
          border: "1px solid rgba(255,255,255,0.03)",
          opacity: 0.8,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 16,
          }}
        >
          <Layers size={14} className="text-muted" />
          <div
            style={{
              fontSize: 11,
              color: "var(--muted)",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: 1.5,
            }}
          >
            Parameters
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            {
              label: "Work",
              value: prefs.pomodoroWork,
              icon: Brain,
              color: "#7c6dfa",
            },
            {
              label: "Break",
              value: prefs.pomodoroBreak,
              icon: Coffee,
              color: "#22c55e",
            },
            {
              label: "Long",
              value: prefs.pomodoroLong,
              icon: Trees,
              color: "#ff4d7d",
            },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: 12,
                padding: "4px 0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "var(--muted)",
                  fontWeight: 600,
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: s.color,
                  }}
                />{" "}
                {s.label}
              </div>
              <span style={{ fontWeight: 800, color: "var(--text)" }}>
                {s.value}m
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </>
  );

  return (
    <div
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
        color="rgba(255, 77, 125, 0.1)"
        size="500px"
        top="60%"
        left="60%"
        delay={5}
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={`responsive-container page-shell ${running && isMobile && isFocusMode ? "focus-immersion" : ""}`}
        style={{ position: "relative", zIndex: 1 }}
      >
        <div
          className="page-header mb-10"
          style={{ alignItems: "flex-start", position: "relative" }}
        >
          <div>
            <div
              className="page-title flex items-center gap-4"
              style={{
                fontFamily: "Syne, sans-serif",
                fontSize: "clamp(28px, 5vw, 42px)",
                fontWeight: 900,
                letterSpacing: "-0.05em",
                lineHeight: 1,
                background:
                  "linear-gradient(to right, #fff, rgba(255,255,255,0.7))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              <div
                className="auth-logo-icon aura-float"
                style={{
                  width: isMobile ? 40 : 54,
                  height: isMobile ? 40 : 54,
                  marginBottom: 0,
                  background: "var(--grad-premium)",
                }}
              >
                <Timer
                  size={isMobile ? 20 : 28}
                  color="white"
                  strokeWidth={2.5}
                  fill="white"
                />
              </div>
              Temporal Engine
            </div>
            <p
              className="page-subtitle"
              style={{
                fontSize: "var(--fs-sm)",
                fontWeight: 700,
                color: "var(--muted)",
                marginTop: 12,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                opacity: 0.8,
              }}
            >
              Optimizing cognitive output · v2.4
            </p>
          </div>
          <button
            className="btn glass haptic-tap glow-on-hover"
            onClick={() => setIsFocusMode(true)}
            style={{
              borderRadius: 20,
              height: isMobile ? 44 : 54,
              padding: isMobile ? "0 20px" : "0 32px",
              fontWeight: 900,
              border: "1px solid rgba(255,255,255,0.1)",
              fontSize: isMobile ? 12 : 14,
              background: "rgba(255,255,255,0.03)",
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            <Maximize2 size={isMobile ? 16 : 18} style={{ marginRight: 10 }} />{" "}
            IMMERSE
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile || isTablet ? "1fr" : "1fr 320px",
            gap: isMobile ? 16 : 24,
            minWidth: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: isMobile ? 14 : 20,
              minWidth: 0,
            }}
          >
            <motion.div
              variants={itemVariants}
              className="glass-holographic aura-iridescent"
              style={{
                textAlign: "center",
                padding: isMobile
                  ? "var(--space-6) var(--space-4)"
                  : "var(--space-10) var(--space-6)",
                position: "relative",
                overflow: "hidden",
                borderRadius: isMobile ? 32 : 40,
                border: "none",
              }}
            >
              <div className="btn-glint" style={{ opacity: 0.05 }} />

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  justifyContent: "center",
                  marginBottom: isMobile ? 32 : 56,
                  background: "rgba(255,255,255,0.03)",
                  padding: 6,
                  borderRadius: 50,
                  border: "1px solid rgba(255,255,255,0.05)",
                  width: "fit-content",
                  margin: `0 auto ${isMobile ? "32px" : "56px"}`,
                }}
              >
                {Object.entries(MODES).map(([key, info]) => (
                  <button
                    key={key}
                    onClick={() => handleModeChange(key)}
                    className="haptic-tap"
                    style={{
                      padding: isMobile ? "10px 18px" : "12px 24px",
                      fontSize: 13,
                      fontWeight: 800,
                      borderRadius: 50,
                      border: "none",
                      background: mode === key ? info.gradient : "transparent",
                      color: mode === key ? "white" : "var(--muted)",
                      cursor: "pointer",
                      boxShadow:
                        mode === key ? `0 10px 20px ${info.color}33` : "none",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <info.icon size={16} />
                    <span className={isMobile && mode !== key ? "hide" : ""}>
                      {info.label}
                    </span>
                  </button>
                ))}
              </div>

              <div
                style={{
                  position: "relative",
                  display: "inline-block",
                  marginBottom: isMobile ? 16 : 44,
                }}
              >
                <svg
                  width={timerSize}
                  height={timerSize}
                  style={{ transform: "rotate(-90deg)", display: "block" }}
                  viewBox={`0 0 ${timerSize} ${timerSize}`}
                >
                  <defs>
                    <linearGradient
                      id="pomoGradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor={modeInfo.color} />
                      <stop offset="100%" stopColor="var(--accent2)" />
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <circle
                    cx={timerSize / 2}
                    cy={timerSize / 2}
                    r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.03)"
                    strokeWidth={isMobile ? 8 : 12}
                  />
                  <motion.circle
                    cx={timerSize / 2}
                    cy={timerSize / 2}
                    r={radius}
                    fill="none"
                    stroke={`url(#pomoGradient-${mode})`}
                    strokeWidth={isMobile ? 8 : 12}
                    strokeDasharray={circumference}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    strokeLinecap="round"
                    filter="url(#pomoGlow)"
                  />
                </svg>
                <svg width="0" height="0" style={{ position: "absolute" }}>
                  <defs>
                    <linearGradient
                      id={`pomoGradient-${mode}`}
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor={modeInfo.color} />
                      <stop offset="100%" stopColor="#fa6d8a" />
                    </linearGradient>
                    <filter id="pomoGlow">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feComposite
                        in="SourceGraphic"
                        in2="blur"
                        operator="over"
                      />
                    </filter>
                  </defs>
                </svg>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={timeLeft}
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 1.05, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{
                        fontFamily: "Syne, sans-serif",
                        fontSize: isMobile ? "54px" : "88px",
                        fontWeight: 800,
                        letterSpacing: "-0.05em",
                        lineHeight: 1,
                        color: "var(--text)",
                        filter: running
                          ? `drop-shadow(0 0 30px ${modeInfo.color}44)`
                          : "none",
                      }}
                    >
                      {formatTime(timeLeft)}
                    </motion.div>
                  </AnimatePresence>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--muted)",
                      textTransform: "uppercase",
                      letterSpacing: 4,
                      fontWeight: 900,
                      marginTop: 8,
                      opacity: 0.6,
                    }}
                  >
                    {modeInfo.label}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 12,
                  justifyContent: "center",
                  marginBottom: isMobile ? 32 : 48,
                }}
              >
                {[0, 1, 2, 3].map((i) => {
                  const isActive = i === sessions % 4;
                  const isCompleted = i < sessions % 4;
                  return (
                    <motion.div
                      key={i}
                      animate={{
                        scale: isActive && running ? [1, 1.2, 1] : 1,
                        background:
                          isCompleted || isActive
                            ? modeInfo.color
                            : "var(--border)",
                        opacity: isCompleted ? 1 : isActive ? 0.8 : 0.3,
                      }}
                      transition={{
                        repeat: isActive && running ? Infinity : 0,
                        duration: 2,
                      }}
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 5,
                        boxShadow:
                          isCompleted || (isActive && running)
                            ? `0 0 20px ${modeInfo.color}66`
                            : "none",
                        border: isActive
                          ? `2px solid rgba(255,255,255,0.2)`
                          : "none",
                      }}
                    />
                  );
                })}
                {sessions > 0 && sessions % 4 === 0 && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    style={{
                      marginLeft: 12,
                      fontSize: 13,
                      fontWeight: 900,
                      color: "var(--accent)",
                      letterSpacing: 1,
                    }}
                  >
                    ⚡ FLOW MASTER
                  </motion.span>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: isMobile ? 12 : 16,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  whileHover={{
                    scale: 1.02,
                    boxShadow: `0 20px 40px ${modeInfo.color}33`,
                  }}
                  className="auth-button magnetic-btn"
                  onClick={handleStart}
                  style={{
                    height: isMobile ? 54 : 64,
                    fontSize: isMobile ? 16 : 18,
                    fontWeight: 800,
                    background: modeInfo.gradient,
                    width: "auto",
                    padding: isMobile ? "0 32px" : "0 56px",
                    borderRadius: isMobile ? 16 : 20,
                  }}
                >
                  <div className="btn-glint" />
                  {running ? (
                    <>
                      <Pause
                        size={isMobile ? 18 : 22}
                        style={{ marginRight: isMobile ? 8 : 12 }}
                      />{" "}
                      STasis
                    </>
                  ) : startedAt ? (
                    <>
                      <Play
                        size={isMobile ? 18 : 22}
                        style={{ marginRight: isMobile ? 8 : 12 }}
                      />{" "}
                      Resume
                    </>
                  ) : (
                    <>
                      <Play
                        size={isMobile ? 18 : 22}
                        style={{ marginRight: isMobile ? 8 : 12 }}
                      />{" "}
                      Initiate
                    </>
                  )}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ background: "rgba(255,255,255,0.08)" }}
                  className="btn glass haptic-tap"
                  onClick={handleReset}
                  style={{
                    width: isMobile ? 54 : 64,
                    height: isMobile ? 54 : 64,
                    padding: 0,
                    borderRadius: isMobile ? 16 : 20,
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <RotateCcw size={isMobile ? 18 : 20} />
                </motion.button>
              </div>

              <div
                style={{
                  marginTop: isMobile ? 20 : 28,
                  fontSize: 13,
                  color: "var(--muted)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <Zap size={13} style={{ color: "var(--accent)" }} />
                Sessions this week:{" "}
                <strong style={{ color: "var(--text)", marginLeft: 4 }}>
                  {statsData?.periodPomos || 0}
                </strong>
              </div>
            </motion.div>

            <div className="card glass-card">
              <div className="card-title" style={{ marginBottom: 20 }}>
                <Award size={16} className="text-accent" /> 7-Day Focus Trend
              </div>
              <div
                style={{
                  height: isMobile ? 180 : 220,
                  minWidth: 0,
                  width: "100%",
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={focusTrendData}
                    margin={{ top: 10, right: 10, bottom: 0, left: -10 }}
                  >
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor="var(--accent)"
                          stopOpacity={1}
                        />
                        <stop
                          offset="100%"
                          stopColor="var(--accent2)"
                          stopOpacity={0.3}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                      vertical={false}
                      opacity={0.4}
                    />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "var(--muted)", fontSize: 10 }}
                      tickFormatter={(d) => safeFormat(d, "EEE")}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "var(--muted)", fontSize: 10 }}
                      width={35}
                      tickFormatter={(v) => `${v}m`}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(130,114,255,0.05)" }}
                      contentStyle={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: 10,
                        fontSize: 12,
                      }}
                      formatter={(value) => [`${value} minutes`, "Focus Time"]}
                      labelFormatter={(label) =>
                        safeFormat(label, "MMMM do, yyyy")
                      }
                    />
                    <Bar
                      dataKey="minutes"
                      radius={[6, 6, 0, 0]}
                      barSize={isMobile ? 18 : 24}
                    >
                      {focusTrendData?.map((_, i) => (
                        <Cell key={i} fill="url(#barGrad)" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {(isMobile || isTablet) && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: isMobile ? 14 : 20,
                }}
              >
                {sidebarContent}
              </div>
            )}
          </div>

          {!isMobile && !isTablet && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {sidebarContent}
            </div>
          )}
        </div>
      </motion.div>

      <ConfirmDialog
        open={confirmState.open}
        title={
          confirmState.action === "reset" ? "Reset Session?" : "Switch Mode?"
        }
        message={confirmState.message}
        confirmText={confirmState.action === "reset" ? "Reset" : "Switch"}
        onConfirm={handleConfirm}
        onCancel={() =>
          setConfirmState({ open: false, action: null, message: "" })
        }
      />

      <AnimatePresence>
        {isFocusMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              background: "rgba(5, 5, 10, 1)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: 40,
              overflow: "hidden",
            }}
          >
            <motion.div
              animate={{
                scale: running ? [1, 1.1, 1] : 1,
                opacity: running ? [0.05, 0.15, 0.05] : 0.05,
              }}
              transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
              style={{
                position: "absolute",
                inset: -200,
                background: `radial-gradient(circle at center, ${modeInfo.color}, transparent 70%)`,
                pointerEvents: "none",
              }}
            />

            <div
              style={{ position: "absolute", top: 40, right: 40, zIndex: 100 }}
            >
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                className="btn glass haptic-tap"
                onClick={() => setIsFocusMode(false)}
                style={{
                  borderRadius: 20,
                  width: 64,
                  height: 64,
                  padding: 0,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  backdropFilter: "blur(20px)",
                }}
              >
                <Minimize2 size={24} />
              </motion.button>
            </div>

            <div
              style={{
                textAlign: "center",
                maxWidth: 1200,
                width: "100%",
                position: "relative",
                zIndex: 50,
              }}
            >
              <motion.div
                animate={{
                  scale: running ? [1, 1.02, 1] : 1,
                }}
                transition={{
                  repeat: Infinity,
                  duration: 4,
                  ease: "easeInOut",
                }}
                style={{
                  fontFamily: "Syne, sans-serif",
                  fontSize: "clamp(10rem, 30vw, 24rem)",
                  fontWeight: 800,
                  letterSpacing: "-0.06em",
                  lineHeight: 0.8,
                  color: "white",
                  marginBottom: 20,
                  filter: `drop-shadow(0 0 80px ${modeInfo.color}33)`,
                }}
              >
                {formatTime(timeLeft)}
              </motion.div>

              <div
                style={{
                  fontSize: 24,
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  letterSpacing: 12,
                  fontWeight: 900,
                  marginBottom: 80,
                  opacity: 0.5,
                  fontFamily: "Syne",
                }}
              >
                {modeInfo.label} Protocol
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 32,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <motion.button
                  whileHover={{
                    scale: 1.05,
                    boxShadow: `0 40px 100px ${modeInfo.color}44`,
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="auth-button"
                  onClick={handleStart}
                  style={{
                    padding: "0 80px",
                    height: 90,
                    fontSize: 28,
                    fontWeight: 900,
                    background: modeInfo.gradient,
                    borderRadius: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "auto",
                  }}
                >
                  <div className="btn-glint" />
                  {running ? (
                    <Pause size={32} fill="white" />
                  ) : (
                    <Play size={32} fill="white" />
                  )}
                </motion.button>
                <motion.button
                  whileHover={{
                    scale: 1.1,
                    rotate: -30,
                    background: "rgba(255,255,255,0.08)",
                  }}
                  whileTap={{ scale: 0.9 }}
                  className="btn glass haptic-tap"
                  onClick={handleReset}
                  style={{
                    width: 90,
                    height: 90,
                    borderRadius: 32,
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.03)",
                  }}
                >
                  <RotateCcw size={28} />
                </motion.button>
              </div>

              {linkedTask && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="auth-card aura-iridescent"
                  style={{
                    marginTop: 100,
                    padding: "40px",
                    background: "rgba(255,255,255,0.01)",
                    borderRadius: 40,
                    border: "1px solid rgba(255,255,255,0.05)",
                    backdropFilter: "blur(40px)",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div className="btn-glint" style={{ opacity: 0.05 }} />
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--muted)",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: 4,
                      marginBottom: 16,
                    }}
                  >
                    Linked Objective
                  </div>
                  <div
                    style={{
                      fontSize: 32,
                      fontWeight: 900,
                      color: "white",
                      fontFamily: "Syne",
                    }}
                  >
                    {tasksData?.find((t) => getSafeId(t) === linkedTask)
                      ?.title || "Undefined Core"}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
