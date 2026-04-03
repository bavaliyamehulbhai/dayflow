import React from 'react';
import WidgetWrapper from './WidgetWrapper';
import { Target, ArrowRight, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };

const TasksWidget = ({ data, navigate }) => {
  const taskTotal = data?.tasks?.summary?.total || 0;
  const taskCompleted = data?.tasks?.summary?.completed || 0;
  const completionPct = taskTotal ? Math.round((taskCompleted / taskTotal) * 100) : 0;

  return (
    <WidgetWrapper title="Priority Focus" icon={Target}>
      {/* Progress bar */}
      <div style={{ marginBottom: 20, background: 'var(--surface2)', padding: '16px', borderRadius: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 10 }}>
          <span>Daily Progress</span>
          <span style={{ color: 'var(--accent)' }}>{completionPct}%</span>
        </div>
        <div style={{ height: 10, background: 'var(--bg)', borderRadius: 5, overflow: 'hidden', position: 'relative' }}>
          <div className="shimmer-sweep" style={{ position: 'absolute', inset: 0, zIndex: 1 }} />
          <div style={{ width: `${completionPct}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--green))', borderRadius: 5, transition: 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1)', boxShadow: '0 0 15px var(--accent-glow)', position: 'relative', zIndex: 2 }} />
        </div>
      </div>

      {data?.tasks?.today?.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.tasks.today.sort((a, b) => (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2)).slice(0, 5).map(task => (
            <div key={task._id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 16px',
              background: 'var(--surface2)',
              borderRadius: 12,
              border: '1px solid var(--border)',
              transition: 'transform 0.2s ease',
              cursor: 'pointer'
            }} className="hover-lift" onClick={() => navigate('/tasks')}>
              <div style={{ width: 8, height: 8, borderRadius: '4px', background: task.priority === 'urgent' ? 'var(--red)' : task.priority === 'high' ? 'var(--orange)' : task.priority === 'medium' ? 'var(--yellow)' : 'var(--green)', flexShrink: 0, boxShadow: '0 0 8px currentColor' }} />
              <span style={{ flex: 1, fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</span>
              <span className={`badge badge-${task.priority}`} style={{ fontSize: 9 }}>{task.priority.toUpperCase()}</span>
            </div>
          ))}
          <button className="btn btn-sm btn-ghost mt-2" onClick={() => navigate('/tasks')} style={{ fontSize: 11, fontWeight: 800 }}>
            VIEW ALL <ArrowRight size={14} style={{ marginLeft: 4 }} />
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
