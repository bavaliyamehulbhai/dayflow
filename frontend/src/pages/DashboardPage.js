import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardAPI, authAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Sun, Moon, Sunrise, Sunset, Zap, Sparkles
} from 'lucide-react';
import { motion, Reorder } from 'framer-motion';
import Skeleton from '../components/Skeleton';
import GuidedTour from '../components/common/GuidedTour';

// Import Widgets
import StatsWidget from '../components/dashboard/StatsWidget';
import HeatmapWidget from '../components/dashboard/HeatmapWidget';
import TasksWidget from '../components/dashboard/TasksWidget';
import AICoachWidget from '../components/dashboard/AICoachWidget';
import ProductivityWidget from '../components/dashboard/ProductivityWidget';
import ScheduleWidget from '../components/dashboard/ScheduleWidget';
import HabitsWidget from '../components/dashboard/HabitsWidget';
import NotesWidget from '../components/dashboard/NotesWidget';
import NotificationsWidget from '../components/dashboard/NotificationsWidget';
import WeeklyProgressBar from '../components/dashboard/WeeklyProgressBar';
import GoogleCalendarWidget from '../components/dashboard/GoogleCalendarWidget';

const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };

function useWindowWidth() {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
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

  let GreetingIcon = Zap;
  const hours = time.getHours();
  const pct = Math.min(100, Math.max(0, ((hours - 6) * 60 + time.getMinutes()) / (17 * 60) * 100));
  if (hours < 12) GreetingIcon = Sunrise;      // Good Morning
  else if (hours < 17) GreetingIcon = Sun;     // Good Afternoon
  else if (hours < 21) GreetingIcon = Sunset;  // Good Evening
  else GreetingIcon = Moon;                    // Good Night

  const isMobile = window.innerWidth <= 768;
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="clock-card-premium"
      style={{ marginBottom: 40 }}
    >
      <div className="greeting-icon-bg" style={{ color: 'var(--accent)' }}>
        <GreetingIcon size={isMobile ? 48 : 120} />
      </div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        <div className="clock-time-display">
          {format(time, 'HH:mm:ss')}
        </div>
        <div className="clock-date-display">
          {format(time, 'EEEE, MMMM do')}
        </div>
      </motion.div>

      <div style={{ marginTop: isMobile ? '24px' : '48px', maxWidth: '800px', margin: `${isMobile ? '24px' : '48px'} auto 0` }}>
        <div style={{ height: 6, background: 'rgba(255,255,255,0.03)', borderRadius: 3, overflow: 'hidden' }}>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 2, ease: "circOut" }}
            style={{ 
              height: '100%', 
              background: 'var(--grad-premium)', 
              borderRadius: 3, 
              boxShadow: '0 0 25px var(--accent-glow)'
            }} 
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginTop: 16, fontWeight: 800, letterSpacing: '0.1em' }}>
          <span>SUNRISE</span>
          <span style={{ color: 'var(--text)', background: 'rgba(124, 109, 250, 0.1)', padding: '4px 12px', borderRadius: 20, border: '1px solid rgba(124, 109, 250, 0.2)' }}>
            {Math.round(pct)}% JOURNEY COMPLETE
          </span>
          <span>SUNSET</span>
        </div>
      </div>
    </motion.div>
  );
}

const AuraOrb = React.memo(({ color, size, top, left, delay, duration = 15 }) => (
  <motion.div
    animate={{
      x: [0, 50, -30, 0],
      y: [0, -40, 60, 0],
      scale: [1, 1.2, 0.9, 1],
      opacity: [0.1, 0.2, 0.1]
    }}
    transition={{
      duration,
      repeat: Infinity,
      ease: "easeInOut",
      delay
    }}
    style={{
      position: 'absolute',
      width: size,
      height: size,
      background: color,
      borderRadius: '50%',
      filter: 'blur(80px)',
      zIndex: -1,
      top,
      left,
      pointerEvents: 'none',
      willChange: 'transform, opacity'
    }}
  />
));

const DEFAULT_LAYOUT = ['stats', 'weekly-goal', 'notifications', 'google-calendar', 'heatmap', 'tasks', 'ai-coach', 'productivity', 'schedule', 'habits', 'notes'];

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
    if (user?.preferences?.dashboardLayout && user.preferences.dashboardLayout.length > 0) {
      setLayout(user.preferences.dashboardLayout);
    }
  }, [user]);

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardAPI.get().then(r => r.data.dashboard),
    refetchInterval: 60000
  });

  const { data: activityData } = useQuery({
    queryKey: ['activity12m'],
    queryFn: () => dashboardAPI.getActivity12m().then(r => r.data.activity)
  });

  const handleReorder = async (newOrder) => {
    setLayout(newOrder);
    try {
      const { data: updatedData } = await authAPI.updateDashboardLayout(newOrder);
      updateUser(updatedData.user);
    } catch (err) {
      console.error('Failed to persist dashboard layout:', err);
    }
  };

  const renderWidget = (id) => {
    switch (id) {
      case 'stats': return <StatsWidget data={data} user={user} navigate={navigate} />;
      case 'heatmap': return <HeatmapWidget activityData={activityData} isMobile={isMobile} navigate={navigate} selectedLog={selectedLog} setSelectedLog={setSelectedLog} />;
      case 'tasks': return <TasksWidget data={data} navigate={navigate} />;
      case 'ai-coach': return <AICoachWidget />;
      case 'productivity': return <ProductivityWidget data={data} />;
      case 'schedule': return <ScheduleWidget data={data} navigate={navigate} />;
      case 'habits': return <HabitsWidget data={data} navigate={navigate} />;
      case 'notes': return <NotesWidget data={data} navigate={navigate} />;
      case 'notifications': return <NotificationsWidget data={data} navigate={navigate} />;
      case 'weekly-goal': return <WeeklyProgressBar progress={data?.weeklyProgress} />;
      case 'google-calendar': return <GoogleCalendarWidget />;
      default: return null;
    }
  };

  if (isLoading || !layout.length) {
    return (
      <div className="responsive-container">
        <Skeleton width="300px" height="40px" className="mb-4" />
        <Skeleton height="200px" borderRadius={24} className="mb-8" />
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(360px, 1fr))', gap: 24 }}>
          {[...Array(6)].map((_, i) => <Skeleton key={i} height="300px" borderRadius={20} />)}
        </div>
      </div>
    );
  }

  const hours = new Date().getHours();
  let greeting = 'Good Morning';
  let GreetingIcon = Sunrise;
  if (hours >= 12 && hours < 17) { greeting = 'Good Afternoon'; GreetingIcon = Sun; }
  else if (hours >= 17 && hours < 21) { greeting = 'Good Evening'; GreetingIcon = Sunset; }
  else if (hours >= 21 || hours < 5) { greeting = 'Good Night'; GreetingIcon = Moon; }

  const tourSteps = [
    { target: '#tour-welcome', title: 'Welcome!', content: 'Customize your workspace by dragging widgets to rearrange them.' },
    { target: '.drag-handle', title: 'Drag & Drop', content: 'Use these handles to reorganize your dashboard.' }
  ];

  return (
    <div className="responsive-container">
      <div className="dashboard-header" style={{ position: 'relative', overflow: 'visible', marginBottom: 32 }}>
        <AuraOrb color="var(--accent)" size={300} top="-100px" left="-50px" delay={0} />
        <AuraOrb color="var(--accent2)" size={250} top="20px" left="200px" delay={2} duration={12} />
        <div className="flex-items-center gap-4">
          <GreetingIcon className="text-accent aura-float" size={isMobile ? 28 : 44} />
          <div className="dashboard-title text-display" style={{ fontSize: 'var(--fs-2xl)' }}>
            {greeting}, <span className="holographic-text">{user?.name?.split(' ')[0]}</span>
          </div>
        </div>
      </div>

      <Clock />

      <Reorder.Group 
        axis="y" 
        values={layout} 
        onReorder={handleReorder}
        style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(380px, 1fr))', 
          gap: 'clamp(16px, 3vw, 32px)',
          paddingBottom: 40
        }}
      >
        {layout.map((widgetId) => (
          <Reorder.Item 
            key={widgetId} 
            value={widgetId}
            style={{ listStyle: 'none' }}
          >
            {renderWidget(widgetId)}
          </Reorder.Item>
        ))}
      </Reorder.Group>

      <GuidedTour 
        show={showTour} 
        steps={tourSteps} 
        onComplete={() => authAPI.completeOnboarding().then(r => updateUser(r.data.user))}
        onSkip={() => authAPI.completeOnboarding().then(r => updateUser(r.data.user))} 
      />
    </div>
  );
}
