import React, { useContext } from 'react';
import WidgetWrapper from './WidgetWrapper';
import { Target, ArrowRight, Zap, Check, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { tasksAPI } from '../../utils/api';
import { useNotifications } from '../../context/NotificationContext';
import { safeFormat } from '../../utils/dateUtils';
import { getSafeId } from '../../utils/idUtils';
import { DashboardDensityContext } from '../../pages/DashboardPage';

const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };

const TasksWidget = ({ data, navigate }) => {
  const density = useContext(DashboardDensityContext) || 'comfortable';
  const qc = useQueryClient();
  const { addToast } = useNotifications();

  const taskTotal = data?.tasks?.todaySummary?.total ?? data?.tasks?.summary?.total ?? 0;
  const taskCompleted = data?.tasks?.todaySummary?.completed ?? data?.tasks?.summary?.completed ?? 0;
  const completionPct = data?.tasks?.todaySummary?.pct ?? (taskTotal ? Math.round((taskCompleted / taskTotal) * 100) : 0);
  const overdueCount = data?.tasks?.overdue || 0;

  const handleToggleTask = async (task, e) => {
    e.stopPropagation();
    const tid = task._id || task.id;
    if (!tid) return;
    const todayStr = safeFormat(new Date(), "yyyy-MM-dd");
    try {
      await tasksAPI.update(tid, {
        status: task.status === 'completed' ? 'pending' : 'completed',
        clientDate: todayStr
      });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      addToast(task.status === 'completed' ? "Task reopened" : "Task secured!", "success");
    } catch (err) {
      addToast(err?.response?.data?.error || "Failed to update task", "error");
    }
  };

  return (
    <WidgetWrapper title="Priority Focus" icon={Target}>
      {/* Progress bar and Overdue Alert */}
      <div style={{ marginBottom: density === 'compact' ? 12 : 20, background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)', padding: density === 'compact' ? '12px' : '16px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.04)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, fontWeight: 800, color: '#fff', marginBottom: density === 'compact' ? 8 : 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>Daily Progress</span>
            {overdueCount > 0 && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/tasks');
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  fontSize: 9,
                  fontWeight: 900,
                  color: '#ef4444',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  padding: '1px 6px',
                  borderRadius: 6,
                  cursor: 'pointer',
                }}
                title="View overdue tasks"
              >
                <AlertCircle size={9} />
                <span>{overdueCount} OVERDUE</span>
              </span>
            )}
          </div>
          <span style={{ color: 'var(--accent)', textShadow: '0 0 10px rgba(124,109,250,0.5)' }}>{completionPct}%</span>
        </div>
        <div style={{ height: 6, background: 'rgba(0,0,0,0.4)', borderRadius: 3, overflow: 'hidden', position: 'relative', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)' }}>
          <div className="shimmer-sweep" style={{ position: 'absolute', inset: 0, zIndex: 1 }} />
          <div style={{ width: `${completionPct}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent), #fff)', borderRadius: 3, transition: 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1)', position: 'relative', zIndex: 2, boxShadow: '0 0 10px var(--accent)' }} />
        </div>
      </div>

      {data?.tasks?.today?.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: density === 'compact' ? 6 : 10 }}>
          {[...(data?.tasks?.today || [])].sort((a, b) => (priorityOrder[a?.priority] || 2) - (priorityOrder[b?.priority] || 2)).slice(0, 5).map((task, index) => {
            const tid = getSafeId(task, `task-${index}`);
            const priority = task?.priority || 'medium';
            const isDone = task?.status === 'completed';

            return (
              <div key={tid} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: density === 'compact' ? '10px 14px' : '14px 16px',
                background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                borderRadius: 14,
                borderTop: '1px solid rgba(255,255,255,0.05)',
                borderLeft: '1px solid rgba(255,255,255,0.02)',
                borderRight: '1px solid rgba(255,255,255,0.02)',
                borderBottom: '1px solid rgba(255,255,255,0.02)',
                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.05)',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                opacity: isDone ? 0.6 : 1
              }} className="hover-lift" onClick={() => navigate('/tasks')}>
                <div
                  onClick={(e) => handleToggleTask(task, e)}
                  title={isDone ? "Reopen task" : "Mark task complete"}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 6,
                    border: isDone ? '1.5px solid var(--green)' : '1.5px solid rgba(255,255,255,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isDone ? 'var(--green)' : 'rgba(255,255,255,0.03)',
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'all 0.15s ease'
                  }}
                >
                  {isDone && <Check size={12} strokeWidth={3} color="#fff" />}
                </div>
                <div style={{ width: 8, height: 8, borderRadius: '4px', background: priority === 'urgent' ? 'var(--red)' : priority === 'high' ? 'var(--orange)' : priority === 'medium' ? 'var(--yellow)' : 'var(--green)', flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: isDone ? 'line-through' : 'none' }}>{task?.title || 'Untitled Task'}</span>
                <span className={`badge badge-${priority}`} style={{ fontSize: 9 }}>{priority.toUpperCase()}</span>
              </div>
            )
          })}
          <button className="btn btn-sm mt-2 hover-lift" onClick={() => navigate('/tasks')} style={{ 
            fontSize: 11, fontWeight: 800, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: 12 
          }}>
            VIEW ALL <ArrowRight size={14} style={{ marginLeft: 6, color: 'var(--accent)' }} />
          </button>
        </div>
      ) : (
        <div className="empty-state" style={{ padding: '40px 20px' }}>
          <div className="empty-icon" style={{ fontSize: 32, opacity: 0.8, marginBottom: 8 }}>✨</div>
          <div className="empty-title" style={{ fontSize: 14, fontWeight: 700 }}>Orbit Clear</div>
          <div className="empty-desc" style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>No high priority targets detected.</div>
        </div>
      )}
    </WidgetWrapper>
  );
};

export default TasksWidget;
