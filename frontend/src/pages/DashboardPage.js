import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { dashboardAPI, authAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { format, addSeconds } from "date-fns";
import { safeFormat } from "../utils/dateUtils";
import {
  Sun,
  Moon,
  Sunrise,
  Sunset,
  Zap,
  Sparkles,
  Target,
  GripVertical,
  X,
  Check,
  Eye,
  EyeOff,
  Sliders,
  LayoutGrid
} from "lucide-react";
import { motion, Reorder, AnimatePresence } from "framer-motion";

export const DashboardDensityContext = React.createContext('comfortable');
import Skeleton from "../components/Skeleton";
import GuidedTour from "../components/common/GuidedTour";
import { getSafeId } from "../utils/idUtils";

// Import Widgets
import WidgetWrapper from "../components/dashboard/WidgetWrapper";
import StatsWidget from "../components/dashboard/StatsWidget";
import HeatmapWidget from "../components/dashboard/HeatmapWidget";
import TasksWidget from "../components/dashboard/TasksWidget";
import AICoachWidget from "../components/dashboard/AICoachWidget";
import ProductivityWidget from "../components/dashboard/ProductivityWidget";
import ScheduleWidget from "../components/dashboard/ScheduleWidget";
import HabitsWidget from "../components/dashboard/HabitsWidget";
import NotesWidget from "../components/dashboard/NotesWidget";
import NotificationsWidget from "../components/dashboard/NotificationsWidget";
import WeeklyProgressBar from "../components/dashboard/WeeklyProgressBar";

const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };

function useWindowWidth() {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    let timeoutId = null;
    const h = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setW(window.innerWidth), 150);
    };
    window.addEventListener("resize", h);
    return () => {
      window.removeEventListener("resize", h);
      clearTimeout(timeoutId);
    };
  }, []);
  return w;
}

// ─── Clock Component (Premium) ────────────────────────────────────────────────
const Clock = React.memo(() => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className="premium-card aura-iridescent"
      style={{
        zIndex: 1,
        padding: "10px 20px",
        textAlign: "right",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        boxShadow: "0 10px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
      }}
    >
      <div style={{ fontSize: "1.45rem", fontWeight: 800, fontFamily: "Inter, sans-serif", color: "#fff", display: "flex", alignItems: "center", gap: "6px", letterSpacing: "-0.5px" }}>
        <span>{safeFormat(time, "HH:mm")}</span>
        <span style={{ fontSize: "0.85rem", color: "var(--accent)", fontWeight: 900 }}>{safeFormat(time, "ss")}</span>
      </div>
      <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1.5px", marginTop: "2px" }}>
        {safeFormat(time, "EEEE, MMMM d")}
      </div>
    </div>
  );
});

const AuraOrb = React.memo(() => null);

const DEFAULT_LAYOUT = [
  "stats",
  "weekly-goal",
  "notifications",
  "heatmap",
  "tasks",
  "ai-coach",
  "productivity",
  "schedule",
  "habits",
  "notes",
];

const getWidgetSpan = (id) => {
  if (id === "stats" || id === "heatmap") return "span 2";
  return "span 1";
};

// ─── Shared Widget Components ───────────────────────────────────────
const WidgetRenderer = ({
  id,
  data,
  user,
  navigate,
  activityData,
  isMobile,
  selectedLog,
  setSelectedLog,
}) => {
  const widgetId = getSafeId(id);

  switch (widgetId) {
    case "stats":
      return <StatsWidget data={data} user={user} navigate={navigate} />;
    case "heatmap":
      return (
        <HeatmapWidget
          activityData={activityData}
          isMobile={isMobile}
          navigate={navigate}
          selectedLog={selectedLog}
          setSelectedLog={setSelectedLog}
        />
      );
    case "tasks":
      return <TasksWidget data={data} navigate={navigate} />;
    case "ai-coach":
      return <AICoachWidget />;
    case "productivity":
      return <ProductivityWidget data={data} />;
    case "schedule":
      return <ScheduleWidget data={data} navigate={navigate} />;
    case "habits":
      return <HabitsWidget data={data} navigate={navigate} />;
    case "notes":
      return <NotesWidget data={data} navigate={navigate} />;
    case "notifications":
      return <NotificationsWidget data={data} navigate={navigate} />;
    case "weekly-goal":
      return (
        <WidgetWrapper title="Weekly Progress" icon={Target}>
          <WeeklyProgressBar progress={data?.weeklyProgress} />
        </WidgetWrapper>
      );
    default:
      return null;
  }
};

const MemoWidget = React.memo(WidgetRenderer);

export default function DashboardPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const width = useWindowWidth();
  const isMobile = width <= 768;
  const [selectedLog, setSelectedLog] = useState(null);
  const [showTour, setShowTour] = useState(false);
  const [layout, setLayout] = useState(DEFAULT_LAYOUT);

  // Layout visibilities and density custom states
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [activeWidgets, setActiveWidgets] = useState(() => {
    const saved = localStorage.getItem("df_dashboard_visible_widgets");
    return saved ? JSON.parse(saved) : DEFAULT_LAYOUT;
  });
  const [density, setDensity] = useState(() => {
    return localStorage.getItem("df_dashboard_density") || "comfortable";
  });

  useEffect(() => {
    if (user && !user.onboardingCompleted) {
      setShowTour(true);
    }
    if (
      user?.preferences?.dashboardLayout &&
      user.preferences.dashboardLayout.length > 0
    ) {
      const savedLayout = user.preferences.dashboardLayout;
      const missingLayout = DEFAULT_LAYOUT.filter(id => !savedLayout.includes(id));
      setLayout([...savedLayout, ...missingLayout]);
    }
  }, [user]);

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => dashboardAPI.get().then((r) => r.data.dashboard),
    staleTime: 5 * 60 * 1000,
  });

  const { data: activityData } = useQuery({
    queryKey: ["activity12m"],
    queryFn: () => dashboardAPI.getActivity12m().then((r) => r.data.activity),
  });

  const handleReorder = async (newOrder) => {
    setLayout(newOrder);
    try {
      const { data: updatedData } =
        await authAPI.updateDashboardLayout(newOrder);
      updateUser(updatedData.user);
    } catch (err) {
      console.error("Failed to persist dashboard layout:", err);
    }
  };

  const toggleWidgetVisibility = (id) => {
    const next = activeWidgets.includes(id)
      ? activeWidgets.filter(w => w !== id)
      : [...activeWidgets, id];
    setActiveWidgets(next);
    localStorage.setItem("df_dashboard_visible_widgets", JSON.stringify(next));
  };

  const applyPreset = (presetType) => {
    if (presetType === "standard") {
      setDensity("comfortable");
      setActiveWidgets(DEFAULT_LAYOUT);
      localStorage.setItem("df_dashboard_density", "comfortable");
      localStorage.setItem("df_dashboard_visible_widgets", JSON.stringify(DEFAULT_LAYOUT));
    } else if (presetType === "focus") {
      setDensity("focus");
      const focusWidgets = ["stats", "weekly-goal", "tasks", "schedule"];
      setActiveWidgets(focusWidgets);
      localStorage.setItem("df_dashboard_density", "focus");
      localStorage.setItem("df_dashboard_visible_widgets", JSON.stringify(focusWidgets));
    } else if (presetType === "compact") {
      setDensity("compact");
      setActiveWidgets(DEFAULT_LAYOUT);
      localStorage.setItem("df_dashboard_density", "compact");
      localStorage.setItem("df_dashboard_visible_widgets", JSON.stringify(DEFAULT_LAYOUT));
    }
  };

  const handleDensityChange = (newDensity) => {
    setDensity(newDensity);
    localStorage.setItem("df_dashboard_density", newDensity);
  };

  const visibleWidgets = useMemo(() => {
    return layout.filter(id => activeWidgets.includes(id));
  }, [layout, activeWidgets]);

  const { greeting, GreetingIcon } = useMemo(() => {
    const hours = new Date().getHours();
    if (hours >= 5 && hours < 12)
      return { greeting: "Good Morning", GreetingIcon: Sunrise };
    if (hours >= 12 && hours < 17)
      return { greeting: "Good Afternoon", GreetingIcon: Sun };
    if (hours >= 17 && hours < 21)
      return { greeting: "Good Evening", GreetingIcon: Sunset };
    return { greeting: "Good Night", GreetingIcon: Moon };
  }, []);

  if (isLoading || !layout.length) {
    return (
      <div className="responsive-container page-shell">
        <Skeleton width="300px" height="40px" className="mb-4" />
        <Skeleton height="200px" borderRadius={24} className="mb-8" />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "1fr"
              : "repeat(auto-fill, minmax(360px, 1fr))",
            gap: 24,
          }}
        >
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} height="300px" borderRadius={20} />
          ))}
        </div>
      </div>
    );
  }

  const tourSteps = [
    {
      target: "#tour-welcome",
      title: "Welcome!",
      content:
        "Customize your workspace by dragging widgets to rearrange them.",
    },
    {
      target: ".drag-handle",
      title: "Drag & Drop",
      content: "Use these handles to reorganize your dashboard.",
    },
  ];

  return (
    <div className="responsive-container page-shell" style={{ overflowX: 'hidden' }}>
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
            <GreetingIcon size={24} style={{ color: "var(--accent)" }} />
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
              {greeting}, {user?.name?.split(" ")[0] || "User"}
            </h1>
            <p style={{ fontSize: "0.95rem", color: "var(--muted)", margin: "4px 0 0", fontWeight: 500, letterSpacing: "0.2px" }}>
              Overview of your workspace
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "16px", alignItems: "center", zIndex: 1 }}>
          <button
            onClick={() => setCustomizeOpen(true)}
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
            <Sparkles size={16} style={{ color: "var(--accent)" }} />
            <span style={{ letterSpacing: "0.5px" }}>Customize</span>
          </button>
          <Clock />
        </div>
      </div>

      <DashboardDensityContext.Provider value={density}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "1fr"
              : "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "16px",
            padding: 0,
            margin: 0,
            paddingBottom: "80px",
          }}
        >
          <AnimatePresence mode="popLayout">
            {visibleWidgets.map((itemId, index) => {
              const safeKey = getSafeId(itemId, `widget-${index}`);
              const span = getWidgetSpan(itemId);
              
              return (
                <motion.div
                  key={safeKey}
                  layoutId={safeKey}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  transition={{
                    type: "spring",
                    stiffness: 350,
                    damping: 30,
                    delay: index * 0.05
                  }}
                  style={{
                    gridColumn: isMobile ? "auto" : (density === "compact" ? "auto" : span)
                  }}
                >
                  <div style={{ height: "100%" }} className="gpu-accel">
                    <MemoWidget
                      id={itemId}
                      data={data}
                      user={user}
                      navigate={navigate}
                      activityData={activityData}
                      isMobile={isMobile}
                      selectedLog={selectedLog}
                      setSelectedLog={setSelectedLog}
                    />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </DashboardDensityContext.Provider>

      {/* ─── CUSTOMIZE SIDEBAR DRAWER ─────────────────────────────────────── */}
      <AnimatePresence>
        {customizeOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setCustomizeOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.7)",
                backdropFilter: "blur(4px)",
                zIndex: 999
              }}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              style={{
                position: "fixed",
                right: 0,
                top: 0,
                bottom: 0,
                width: isMobile ? "100%" : "380px",
                background: "rgba(10, 10, 12, 0.95)",
                backdropFilter: "blur(20px)",
                borderLeft: "1px solid rgba(255, 255, 255, 0.05)",
                padding: "24px",
                zIndex: 1000,
                display: "flex",
                flexDirection: "column",
                gap: 24,
                boxShadow: "-10px 0 30px rgba(0,0,0,0.5)",
                boxSizing: "border-box"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Sliders className="text-accent" size={16} />
                  <h3 style={{ fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 700, color: "white", margin: 0, letterSpacing: 0.5 }}>WORKSPACE</h3>
                </div>
                <button
                  onClick={() => setCustomizeOpen(false)}
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "none",
                    borderRadius: 10,
                    padding: 8,
                    color: "white",
                    cursor: "pointer"
                  }}
                  className="haptic-tap"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Presets */}
              <div>
                <h4 style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>LAYOUT PRESETS</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  {[
                    { id: "standard", label: "Standard" },
                    { id: "compact", label: "Compact" },
                    { id: "focus", label: "Focus" }
                  ].map(p => (
                    <button
                      key={p.id}
                      onClick={() => applyPreset(p.id)}
                      style={{
                        padding: "10px 8px",
                        fontSize: 10,
                        fontWeight: 800,
                        borderRadius: 10,
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        color: "white",
                        cursor: "pointer"
                      }}
                      className="haptic-tap hover-lift"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Density */}
              <div>
                <h4 style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>DENSITY SPACING</h4>
                <div style={{ display: "flex", gap: 8, background: "rgba(0,0,0,0.2)", padding: 4, borderRadius: 10, border: "1px solid rgba(255,255,255,0.04)" }}>
                  {[
                    { id: "compact", label: "Compact" },
                    { id: "comfortable", label: "Comfortable" },
                    { id: "focus", label: "Focus" }
                  ].map(d => {
                    const active = density === d.id;
                    return (
                      <button
                        key={d.id}
                        onClick={() => handleDensityChange(d.id)}
                        style={{
                          flex: 1,
                          padding: "8px 0",
                          fontSize: 11,
                          fontWeight: 800,
                          borderRadius: 8,
                          background: active ? "var(--accent)" : "transparent",
                          color: active ? "white" : "var(--muted)",
                          border: "none",
                          cursor: "pointer",
                          transition: "all 0.2s ease"
                        }}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Visibility and Reordering */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
                <h4 style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>REORDER & TOGGLE WIDGETS</h4>
                
                <div style={{ flex: 1, overflowY: "auto", paddingRight: 4 }} className="custom-scrollbar">
                  <Reorder.Group
                    axis="y"
                    values={layout}
                    onReorder={handleReorder}
                    style={{ display: "flex", flexDirection: "column", gap: 8, padding: 0, margin: 0, listStyle: "none" }}
                  >
                    {layout.map(itemId => {
                      const isVisible = activeWidgets.includes(itemId);
                      return (
                        <Reorder.Item
                          key={itemId}
                          value={itemId}
                          style={{
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.05)",
                            borderRadius: 12,
                            padding: "10px 14px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            cursor: "grab",
                            listStyle: "none"
                          }}
                          whileDrag={{ scale: 1.02, background: "rgba(255,255,255,0.08)" }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <GripVertical size={14} style={{ color: "var(--muted)" }} />
                            <span style={{ fontSize: 12, fontWeight: 700, textTransform: "capitalize", color: isVisible ? "white" : "var(--muted)" }}>
                              {itemId.replace("-", " ")}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleWidgetVisibility(itemId);
                            }}
                            style={{
                              background: isVisible ? "rgba(99, 102, 241, 0.15)" : "rgba(255,255,255,0.03)",
                              border: isVisible ? "1px solid var(--accent)" : "1px solid rgba(255,255,255,0.05)",
                              color: isVisible ? "var(--accent)" : "var(--muted)",
                              fontSize: 9,
                              fontWeight: 900,
                              padding: "4px 8px",
                              borderRadius: 6,
                              cursor: "pointer"
                            }}
                          >
                            {isVisible ? "VISIBLE" : "HIDDEN"}
                          </button>
                        </Reorder.Item>
                      );
                    })}
                  </Reorder.Group>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <GuidedTour
        show={showTour}
        steps={tourSteps}
        onComplete={() =>
          authAPI.completeOnboarding().then((r) => updateUser(r.data.user))
        }
        onSkip={() =>
          authAPI.completeOnboarding().then((r) => updateUser(r.data.user))
        }
      />
    </div>
  );
}
