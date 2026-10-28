import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Clock, 
  AlertCircle, 
  Calendar, 
  CheckCircle2, 
  Flame, 
  ArrowRight, 
  Check, 
  Sparkles,
  ExternalLink,
  RefreshCw,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { isAfter, isBefore, addHours, parseISO } from 'date-fns';
import { dashboardAPI, tasksAPI, habitsAPI } from '../utils/api';
import { safeFormat, safeToLocalISO } from '../utils/dateUtils';
import { getSafeId } from '../utils/idUtils';
import { useNotifications } from '../context/NotificationContext';
import AuraOrb from '../components/common/AuraOrb';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useNotifications();
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'overdue' | 'tasks' | 'habits' | 'schedule'
  const [processingId, setProcessingId] = useState(null);

  // 1. Fetch Dashboard data
  const { data: dashData, isLoading: dashLoading, refetch: refetchDash } = useQuery({
    queryKey: ['dashboard-notifications'],
    queryFn: () => dashboardAPI.get().then((r) => r.data.dashboard),
  });

  // 2. Fetch Tasks to accurately capture all overdue & upcoming tasks
  const { data: tasksResponse, isLoading: tasksLoading, refetch: refetchTasks } = useQuery({
    queryKey: ['tasks', 'all-notifications'],
    queryFn: () => tasksAPI.getAll({ limit: 100 }).then((r) => r.data),
  });

  const now = new Date();
  const threshold48h = addHours(now, 48);
  const threshold12h = addHours(now, 12);
  const todayStr = safeToLocalISO(now);

  const parseDueDate = (val) => {
    if (!val) return null;
    try {
      const d = typeof val === 'string' ? parseISO(val) : new Date(val);
      return isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  };

  // Complete Task Mutation
  const completeTaskMutation = useMutation({
    mutationFn: (taskId) => tasksAPI.update(taskId, { status: 'completed' }),
    onSuccess: () => {
      addToast('Task marked as completed! 🚀', 'success');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setProcessingId(null);
    },
    onError: () => {
      addToast('Failed to complete task', 'error');
      setProcessingId(null);
    }
  });

  // Complete Habit Mutation
  const completeHabitMutation = useMutation({
    mutationFn: (habitId) => habitsAPI.complete(habitId, { date: todayStr }),
    onSuccess: () => {
      addToast('Habit completed! Streak extended 🔥', 'success');
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setProcessingId(null);
    },
    onError: () => {
      addToast('Failed to complete habit', 'error');
      setProcessingId(null);
    }
  });

  const handleCompleteTask = (e, taskId) => {
    e.stopPropagation();
    setProcessingId(taskId);
    completeTaskMutation.mutate(taskId);
  };

  const handleCompleteHabit = (e, habitId) => {
    e.stopPropagation();
    setProcessingId(habitId);
    completeHabitMutation.mutate(habitId);
  };

  // Parse all signals
  const allTasks = useMemo(() => {
    const list = tasksResponse?.tasks || [];
    return list.filter(t => t.status !== 'completed' && t.status !== 'cancelled');
  }, [tasksResponse]);

  // Overdue Tasks
  const overdueTasks = useMemo(() => {
    return allTasks
      .filter(t => {
        const d = parseDueDate(t.dueDate);
        return d && isBefore(d, now);
      })
      .map(t => ({
        id: t._id,
        type: 'task',
        urgency: 'overdue',
        title: t.title,
        subtitle: `Overdue since ${safeFormat(t.dueDate, 'MMM d, h:mm a')}`,
        rawDate: parseDueDate(t.dueDate),
        category: t.category,
        priority: t.priority,
        rawItem: t
      }))
      .sort((a, b) => a.rawDate - b.rawDate);
  }, [allTasks, now]);

  // Upcoming Tasks (next 48h)
  const upcomingTasks = useMemo(() => {
    return allTasks
      .filter(t => {
        const d = parseDueDate(t.dueDate);
        return d && isAfter(d, now) && isBefore(d, threshold48h);
      })
      .map(t => {
        const d = parseDueDate(t.dueDate);
        const isImminent = isBefore(d, threshold12h);
        return {
          id: t._id,
          type: 'task',
          urgency: isImminent ? 'imminent' : 'upcoming',
          title: t.title,
          subtitle: `Due ${safeFormat(t.dueDate, 'MMM d, h:mm a')}`,
          rawDate: d,
          category: t.category,
          priority: t.priority,
          rawItem: t
        };
      })
      .sort((a, b) => a.rawDate - b.rawDate);
  }, [allTasks, now, threshold48h, threshold12h]);

  // Pending Habits Today
  const pendingHabits = useMemo(() => {
    const habitList = dashData?.habits?.list || [];
    return habitList
      .filter(h => !h.completedToday)
      .map(h => ({
        id: h._id,
        type: 'habit',
        urgency: 'habit',
        title: h.name,
        subtitle: `${h.streak?.current || 0} day streak on the line`,
        rawDate: now,
        color: h.color,
        icon: h.icon,
        rawItem: h
      }));
  }, [dashData, now]);

  // Today's Schedule Events
  const todaySchedule = useMemo(() => {
    const events = dashData?.schedule?.today || [];
    return events.map(e => ({
      id: e._id,
      type: 'schedule',
      urgency: 'schedule',
      title: e.title,
      subtitle: `${e.startTime} - ${e.endTime}`,
      rawDate: now,
      category: e.category,
      rawItem: e
    }));
  }, [dashData, now]);

  // Consolidated signals
  const allSignals = useMemo(() => {
    return [
      ...overdueTasks,
      ...upcomingTasks,
      ...pendingHabits,
      ...todaySchedule
    ];
  }, [overdueTasks, upcomingTasks, pendingHabits, todaySchedule]);

  // Filtered signals based on selected tab
  const displayedSignals = useMemo(() => {
    switch (filterTab) {
      case 'overdue':
        return overdueTasks;
      case 'tasks':
        return [...overdueTasks, ...upcomingTasks];
      case 'habits':
        return pendingHabits;
      case 'schedule':
        return todaySchedule;
      default:
        return allSignals;
    }
  }, [filterTab, overdueTasks, upcomingTasks, pendingHabits, todaySchedule, allSignals]);

  const handleRefresh = () => {
    refetchDash();
    refetchTasks();
    addToast('Signals refreshed', 'info');
  };

  const isLoading = dashLoading || tasksLoading;

  return (
    <div
      className="responsive-container page-shell"
      style={{ position: 'relative', minHeight: '100vh', paddingBottom: 60 }}
    >
      <AuraOrb
        color="rgba(124, 109, 250, 0.15)"
        size="520px"
        top="-10%"
        left="-10%"
        delay={0}
      />
      <AuraOrb
        color="rgba(255, 77, 77, 0.08)"
        size="440px"
        top="40%"
        left="60%"
        delay={3}
      />

      {/* Header Banner */}
      <div
        className="dashboard-header-premium"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          padding: '24px 28px',
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          borderRadius: '20px',
          marginBottom: '24px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <AuraOrb
          color="var(--accent)"
          size={220}
          top="-60px"
          left="-30px"
          delay={0}
          duration={15}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', zIndex: 1 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(124, 109, 250, 0.2) 0%, rgba(255, 77, 77, 0.15) 100%)',
            border: '1px solid rgba(124, 109, 250, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(124, 109, 250, 0.2)'
          }}>
            <Bell className="text-accent" size={24} />
          </div>
          <div>
            <h1
              className="dashboard-title"
              style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                fontFamily: 'Syne, sans-serif',
                margin: 0,
                color: 'var(--text)',
                letterSpacing: '-0.02em'
              }}
            >
              Signals & Notifications
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text2)', margin: '4px 0 0' }}>
              Actionable radar for deadlines, pending rituals, and daily momentum
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, zIndex: 1 }}>
          <button
            onClick={handleRefresh}
            className="btn btn-sm btn-ghost hover-lift"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: '8px 14px',
              color: 'var(--text2)',
              fontSize: 12,
              fontWeight: 600
            }}
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 14,
        marginBottom: 24
      }}>
        {/* Overdue */}
        <div style={{
          padding: '16px 20px',
          borderRadius: 16,
          background: overdueTasks.length > 0 
            ? 'linear-gradient(135deg, rgba(255, 77, 77, 0.12) 0%, rgba(20, 20, 28, 0.8) 100%)' 
            : 'var(--surface)',
          border: `1px solid ${overdueTasks.length > 0 ? 'rgba(255, 77, 77, 0.3)' : 'var(--border)'}`,
          display: 'flex',
          alignItems: 'center',
          gap: 14
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'rgba(255, 77, 77, 0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <AlertCircle size={20} color="#ff4d4d" />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: overdueTasks.length > 0 ? '#ff6b6b' : 'var(--text)' }}>
              {overdueTasks.length}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Overdue Tasks
            </div>
          </div>
        </div>

        {/* Due Next 48 Hours */}
        <div style={{
          padding: '16px 20px',
          borderRadius: 16,
          background: upcomingTasks.length > 0 
            ? 'linear-gradient(135deg, rgba(124, 109, 250, 0.1) 0%, rgba(20, 20, 28, 0.8) 100%)' 
            : 'var(--surface)',
          border: `1px solid ${upcomingTasks.length > 0 ? 'rgba(124, 109, 250, 0.25)' : 'var(--border)'}`,
          display: 'flex',
          alignItems: 'center',
          gap: 14
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'rgba(124, 109, 250, 0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Clock size={20} color="var(--accent)" />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent)' }}>
              {upcomingTasks.length}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Due In 48h
            </div>
          </div>
        </div>

        {/* Habits Pending */}
        <div style={{
          padding: '16px 20px',
          borderRadius: 16,
          background: pendingHabits.length > 0 
            ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(20, 20, 28, 0.8) 100%)' 
            : 'var(--surface)',
          border: `1px solid ${pendingHabits.length > 0 ? 'rgba(245, 158, 11, 0.25)' : 'var(--border)'}`,
          display: 'flex',
          alignItems: 'center',
          gap: 14
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'rgba(245, 158, 11, 0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Flame size={20} color="#f59e0b" />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#f59e0b' }}>
              {pendingHabits.length}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Pending Habits
            </div>
          </div>
        </div>

        {/* Today's Schedule */}
        <div style={{
          padding: '16px 20px',
          borderRadius: 16,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 14
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'rgba(0, 242, 254, 0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Calendar size={20} color="#00f2fe" />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#00f2fe' }}>
              {todaySchedule.length}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Schedule Events
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        overflowX: 'auto',
        paddingBottom: 8,
        marginBottom: 20
      }}>
        {[
          { key: 'all', label: 'All Signals', count: allSignals.length },
          { key: 'overdue', label: '🚨 Overdue', count: overdueTasks.length },
          { key: 'tasks', label: '📅 Tasks', count: overdueTasks.length + upcomingTasks.length },
          { key: 'habits', label: '🔥 Habits', count: pendingHabits.length },
          { key: 'schedule', label: '🗓️ Schedule', count: todaySchedule.length },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilterTab(tab.key)}
            className="haptic-tap"
            style={{
              padding: '8px 16px',
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              border: filterTab === tab.key ? '1px solid var(--accent)' : '1px solid var(--border)',
              background: filterTab === tab.key ? 'rgba(124, 109, 250, 0.18)' : 'var(--surface)',
              color: filterTab === tab.key ? 'var(--accent)' : 'var(--text2)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease'
            }}
          >
            <span>{tab.label}</span>
            <span style={{
              fontSize: 10,
              padding: '2px 6px',
              borderRadius: 10,
              background: filterTab === tab.key ? 'var(--accent)' : 'rgba(255, 255, 255, 0.08)',
              color: filterTab === tab.key ? '#fff' : 'var(--text3)',
              fontWeight: 800
            }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Signals Feed List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <AnimatePresence>
          {displayedSignals.length > 0 ? (
            displayedSignals.map((signal, idx) => {
              const isOverdue = signal.urgency === 'overdue';
              const isImminent = signal.urgency === 'imminent';
              const isHabit = signal.type === 'habit';
              const isSchedule = signal.type === 'schedule';
              const isBusy = processingId === signal.id;

              return (
                <motion.div
                  key={`${signal.type}-${signal.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.04 }}
                  className="hover-lift"
                  style={{
                    padding: '18px 22px',
                    borderRadius: 18,
                    background: isOverdue 
                      ? 'linear-gradient(135deg, rgba(255, 77, 77, 0.07) 0%, rgba(22, 22, 30, 0.8) 100%)' 
                      : isImminent 
                        ? 'linear-gradient(135deg, rgba(255, 170, 0, 0.06) 0%, rgba(22, 22, 30, 0.8) 100%)' 
                        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(22, 22, 30, 0.8) 100%)',
                    border: `1px solid ${
                      isOverdue 
                        ? 'rgba(255, 77, 77, 0.3)' 
                        : isImminent 
                          ? 'rgba(255, 170, 0, 0.25)' 
                          : isHabit
                            ? 'rgba(245, 158, 11, 0.2)'
                            : isSchedule
                              ? 'rgba(0, 242, 254, 0.2)'
                              : 'var(--border)'
                    }`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    flexWrap: 'wrap'
                  }}
                >
                  {/* Left: Icon & Details */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 260 }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: isOverdue 
                        ? 'rgba(255, 77, 77, 0.15)' 
                        : isImminent 
                          ? 'rgba(255, 170, 0, 0.12)' 
                          : isHabit 
                            ? 'rgba(245, 158, 11, 0.15)' 
                            : isSchedule 
                              ? 'rgba(0, 242, 254, 0.12)' 
                              : 'rgba(124, 109, 250, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {isOverdue ? (
                        <AlertCircle size={22} color="#ff4d4d" />
                      ) : isImminent ? (
                        <Clock size={22} color="#ffa500" />
                      ) : isHabit ? (
                        <Flame size={22} color="#f59e0b" />
                      ) : isSchedule ? (
                        <Calendar size={22} color="#00f2fe" />
                      ) : (
                        <Clock size={22} color="var(--accent)" />
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <span style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: 'var(--text)',
                          wordBreak: 'break-word'
                        }}>
                          {signal.title}
                        </span>

                        {/* Status Badges */}
                        {isOverdue && (
                          <span style={{
                            fontSize: 10,
                            fontWeight: 900,
                            color: '#ff4d4d',
                            background: 'rgba(255, 77, 77, 0.15)',
                            padding: '2px 8px',
                            borderRadius: 6,
                            letterSpacing: '0.05em'
                          }}>
                            OVERDUE
                          </span>
                        )}
                        {isImminent && (
                          <span style={{
                            fontSize: 10,
                            fontWeight: 900,
                            color: '#ffa500',
                            background: 'rgba(255, 170, 0, 0.12)',
                            padding: '2px 8px',
                            borderRadius: 6,
                            letterSpacing: '0.05em'
                          }}>
                            DUE SOON
                          </span>
                        )}
                        {isHabit && (
                          <span style={{
                            fontSize: 10,
                            fontWeight: 900,
                            color: '#f59e0b',
                            background: 'rgba(245, 158, 11, 0.12)',
                            padding: '2px 8px',
                            borderRadius: 6,
                            letterSpacing: '0.05em'
                          }}>
                            RITUAL
                          </span>
                        )}
                        {isSchedule && (
                          <span style={{
                            fontSize: 10,
                            fontWeight: 900,
                            color: '#00f2fe',
                            background: 'rgba(0, 242, 254, 0.12)',
                            padding: '2px 8px',
                            borderRadius: 6,
                            letterSpacing: '0.05em'
                          }}>
                            TODAY
                          </span>
                        )}
                      </div>

                      <div style={{
                        fontSize: 12,
                        color: isOverdue ? '#ff6b6b' : 'var(--text2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}>
                        <span>{signal.subtitle}</span>
                        {signal.category && (
                          <>
                            <span>•</span>
                            <span style={{ textTransform: 'capitalize', color: 'var(--text3)' }}>
                              {signal.category}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Inline Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {signal.type === 'task' && (
                      <>
                        <button
                          onClick={(e) => handleCompleteTask(e, signal.id)}
                          disabled={isBusy}
                          className="haptic-tap hover-lift"
                          style={{
                            padding: '8px 16px',
                            borderRadius: 10,
                            background: 'rgba(124, 109, 250, 0.15)',
                            border: '1px solid rgba(124, 109, 250, 0.3)',
                            color: 'var(--accent)',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            transition: 'all 0.2s'
                          }}
                        >
                          <Check size={14} />
                          {isBusy ? 'Saving...' : 'Mark Done'}
                        </button>
                        <button
                          onClick={() => navigate('/tasks')}
                          className="btn btn-sm btn-ghost"
                          title="Open in Tasks"
                          style={{ padding: '8px 10px', borderRadius: 10, color: 'var(--text3)' }}
                        >
                          <ExternalLink size={14} />
                        </button>
                      </>
                    )}

                    {signal.type === 'habit' && (
                      <>
                        <button
                          onClick={(e) => handleCompleteHabit(e, signal.id)}
                          disabled={isBusy}
                          className="haptic-tap hover-lift"
                          style={{
                            padding: '8px 16px',
                            borderRadius: 10,
                            background: 'rgba(245, 158, 11, 0.15)',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            color: '#f59e0b',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            transition: 'all 0.2s'
                          }}
                        >
                          <Flame size={14} />
                          {isBusy ? 'Saving...' : 'Check In'}
                        </button>
                        <button
                          onClick={() => navigate('/habits')}
                          className="btn btn-sm btn-ghost"
                          title="Open Habits"
                          style={{ padding: '8px 10px', borderRadius: 10, color: 'var(--text3)' }}
                        >
                          <ExternalLink size={14} />
                        </button>
                      </>
                    )}

                    {signal.type === 'schedule' && (
                      <button
                        onClick={() => navigate('/schedule')}
                        className="btn btn-sm btn-ghost hover-lift"
                        style={{
                          padding: '8px 14px',
                          borderRadius: 10,
                          border: '1px solid rgba(0, 242, 254, 0.2)',
                          color: '#00f2fe',
                          fontSize: 12,
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <span>View Schedule</span>
                        <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })
          ) : (
            /* Empty State */
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                padding: '60px 24px',
                textAlign: 'center',
                background: 'var(--surface)',
                borderRadius: 20,
                border: '1px dashed var(--border)',
                marginTop: 10
              }}
            >
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(124, 109, 250, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                border: '1px solid rgba(124, 109, 250, 0.2)'
              }}>
                <Sparkles size={28} color="var(--accent)" />
              </div>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                fontFamily: 'Syne, sans-serif',
                color: 'var(--text)',
                margin: '0 0 8px'
              }}>
                All Clear & Caught Up!
              </h3>
              <p style={{
                fontSize: '0.85rem',
                color: 'var(--text2)',
                maxWidth: 400,
                margin: '0 auto 24px',
                lineHeight: 1.5
              }}>
                {filterTab === 'all' 
                  ? 'No overdue deadlines, pending daily rituals, or imminent tasks detected. You are operating at peak flow!' 
                  : `No signals found under the "${filterTab}" category.`}
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="btn btn-sm btn-primary hover-lift"
                  style={{ padding: '8px 18px', fontSize: 13, fontWeight: 700 }}
                >
                  Return to Dashboard
                </button>
                <button
                  onClick={() => navigate('/tasks')}
                  className="btn btn-sm btn-ghost hover-lift"
                  style={{ padding: '8px 18px', fontSize: 13, fontWeight: 700 }}
                >
                  Create New Task
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
