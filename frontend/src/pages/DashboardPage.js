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
import { Sun, Moon, Sunrise, Sunset, Zap, Sparkles } from "lucide-react";
import { motion, Reorder, AnimatePresence } from "framer-motion";
import Skeleton from "../components/Skeleton";
import GuidedTour from "../components/common/GuidedTour";
import { getSafeId } from "../utils/idUtils";

// Import Widgets
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
import GoogleCalendarWidget from "../components/dashboard/GoogleCalendarWidget";

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

// ─── Clock Component (Header) ──────────────────────────────────────────────────
function Clock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const hours = time.getHours();
  const pct = Math.min(
    100,
    Math.max(0, (((hours - 6) * 60 + time.getMinutes()) / (17 * 60)) * 100),
  );
  const isMobile = window.innerWidth <= 768;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="hero-module-clock"
      style={{
        padding: isMobile ? "60px 0 30px" : "90px 0 50px",
        textAlign: "center",
        position: "relative",
        zIndex: 1,
        marginBottom: isMobile ? "50px" : "70px",
        background:
          "radial-gradient(circle at 50% 50%, rgba(124, 109, 250, 0.12) 0%, transparent 75%)",
      }}
    >
      <motion.div
        animate={{ filter: ["blur(0px)", "blur(0.5px)", "blur(0px)"] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      >
        <div
          style={{
            fontSize: isMobile ? "clamp(3.2rem, 14vw, 4.8rem)" : "10rem",
            fontWeight: 900,
            fontFamily: "Syne, sans-serif",
            letterSpacing: "-0.06em",
            lineHeight: 0.9,
            background:
              "linear-gradient(135deg, #fff 30%, rgba(255,255,255,0.7) 60%, #fff 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textShadow: "0 0 40px rgba(124, 109, 250, 0.4)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            position: "relative",
          }}
        >
          {safeFormat(time, "HH:mm")}
          <span
            style={{
              opacity: 0.4,
              fontSize: "0.35em",
              marginLeft: 12,
              WebkitTextFillColor: "var(--accent)",
              textShadow: "none",
            }}
          >
            {safeFormat(time, "ss")}
          </span>
        </div>
        <div
          className="clock-date-display"
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: isMobile ? "0.9rem" : "1.2rem",
            fontWeight: 800,
            color: "var(--accent3)",
            marginTop: 16,
            textTransform: "uppercase",
            letterSpacing: "0.4em",
          }}
        >
          {safeFormat(time, "EEEE, MMMM do")}
        </div>
      </motion.div>

      <div
        style={{
          marginTop: isMobile ? "28px" : "80px",
          maxWidth: "800px",
          marginLeft: "auto",
          marginRight: "auto",
          position: "relative",
          padding: isMobile ? "0 20px" : "0",
        }}
      >
        <div
          style={{
            height: 6,
            background: "rgba(255,255,255,0.02)",
            borderRadius: 20,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.05)",
            backdropFilter: "blur(5px)",
          }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 3, ease: "circOut" }}
            style={{
              height: "100%",
              background: "linear-gradient(90deg, #7c6dfa 0%, #00f2fe 100%)",
              borderRadius: 20,
              boxShadow: "0 0 25px rgba(124, 109, 250, 0.3)",
              position: "relative",
            }}
          >
            <div
              className="shimmer-sweep"
              style={{ position: "absolute", inset: 0, opacity: 0.5 }}
            />
          </motion.div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 10,
            color: "var(--muted)",
            marginTop: 16,
            fontWeight: 900,
            letterSpacing: "0.2em",
          }}
        >
          <span style={{ opacity: 0.5 }}>DAWN</span>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              color: "#fff",
              background: "rgba(255, 255, 255, 0.05)",
              padding: "8px 20px",
              borderRadius: 30,
              border: "1px solid rgba(255, 255, 255, 0.1)",
              fontSize: 11,
              fontWeight: 800,
              backdropFilter: "blur(10px)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
            }}
          >
            {Math.round(pct)}% COMPLETE
          </motion.div>
          <span style={{ opacity: 0.5 }}>DUSK</span>
        </div>
      </div>
    </motion.div>
  );
}

const AuraOrb = React.memo(
  ({ color, size, top, left, delay, duration = 15 }) => (
    <motion.div
      animate={{
        x: [0, 50, -30, 0],
        y: [0, -40, 60, 0],
        scale: [1, 1.2, 0.9, 1],
        opacity: [0.1, 0.2, 0.1],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
      style={{
        position: "absolute",
        width: size,
        height: size,
        background: color,
        borderRadius: "50%",
        filter: "blur(80px)",
        zIndex: -1,
        top,
        left,
        pointerEvents: "none",
        willChange: "transform, opacity",
      }}
    />
  ),
);

const DEFAULT_LAYOUT = [
  "stats",
  "weekly-goal",
  "notifications",
  "google-calendar",
  "heatmap",
  "tasks",
  "ai-coach",
  "productivity",
  "schedule",
  "habits",
  "notes",
];

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
      return <WeeklyProgressBar progress={data?.weeklyProgress} />;
    case "google-calendar":
      return <GoogleCalendarWidget />;
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

  useEffect(() => {
    if (user && !user.onboardingCompleted) {
      setShowTour(true);
    }
    if (
      user?.preferences?.dashboardLayout &&
      user.preferences.dashboardLayout.length > 0
    ) {
      setLayout(user.preferences.dashboardLayout);
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
    <div className="responsive-container page-shell">
      <div
        className="dashboard-header"
        style={{ position: "relative", overflow: "visible", marginBottom: 32 }}
      >
        <AuraOrb
          color="var(--accent)"
          size={300}
          top="-100px"
          left="-50px"
          delay={0}
        />
        <AuraOrb
          color="var(--accent2)"
          size={250}
          top="20px"
          left="200px"
          delay={2}
          duration={12}
        />
        <div className="flex-items-center gap-4" style={{ justifyContent: isMobile ? 'center' : 'flex-start' }}>
          <GreetingIcon
            className="text-accent aura-float"
            size={isMobile ? 28 : 44}
          />
          <div
            className="dashboard-title text-display"
            style={{ fontSize: "var(--fs-2xl)" }}
          >
            {greeting},{" "}
            <span className="holographic-text">
              {user?.name?.split(" ")[0]}
            </span>
          </div>
        </div>
      </div>

      <Clock />

      <Reorder.Group
        axis="y"
        values={layout}
        onReorder={isMobile ? () => {} : handleReorder}
        style={{
          display: "grid",
          gridTemplateColumns: isMobile
            ? "1fr"
            : "repeat(auto-fill, minmax(420px, 1fr))",
          gap: isMobile ? "32px" : "48px",
          padding: 0,
          margin: 0,
          paddingBottom: isMobile ? "120px" : "60px",
          listStyle: "none",
        }}
      >
        <AnimatePresence mode="popLayout">
          {layout.map((itemId, index) => {
            const safeKey = getSafeId(itemId, `widget-${index}`);
            const animProps = {
              initial: { opacity: 0, y: 30, scale: 0.95 },
              animate: {
                opacity: 1,
                y: 0,
                scale: 1,
                transition: {
                  duration: 0.6,
                  delay: index * 0.1,
                  ease: [0.16, 1, 0.3, 1],
                },
              },
              exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
              style: { listStyle: "none" }
            };

            const childContent = (
              <div
                style={{ height: "100%", perspective: "1000px" }}
                className="app-module-entrance gpu-accel"
              >
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
            );

            if (isMobile) {
               return (
                 <motion.li key={safeKey} {...animProps}>
                   {childContent}
                 </motion.li>
               );
            }

            return (
              <Reorder.Item
                key={safeKey}
                value={itemId}
                dragListener={true}
                {...animProps}
                whileDrag={{
                  scale: 1.05,
                  boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
                }}
              >
                {childContent}
              </Reorder.Item>
            );
          })}
        </AnimatePresence>
      </Reorder.Group>

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
