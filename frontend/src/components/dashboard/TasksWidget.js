import React, { useContext } from 'react';
import WidgetWrapper from './WidgetWrapper';
import { Target, ArrowRight, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { getSafeId } from '../../utils/idUtils';
import { DashboardDensityContext } from '../../pages/DashboardPage';

const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };

const TasksWidget = ({ data, navigate }) => {
  const density = useContext(DashboardDensityContext) || 'comfortable';
  const taskTotal = data?.tasks?.summary?.total || 0;
  const taskCompleted = data?.tasks?.summary?.completed || 0;
  const completionPct = taskTotal ? Math.round((taskCompleted / taskTotal) * 100) : 0;

  return (
    <WidgetWrapper title="Priority Focus" icon={Target}>
      {/* Progress bar */}
      <div style={{ marginBottom: density === 'compact' ? 12 : 20, background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)', padding: density === 'compact' ? '12px' : '16px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.04)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 800, color: '#fff', marginBottom: density === 'compact' ? 8 : 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          <span>Daily Progress</span>
          <span style={{ color: 'var(--accent)', textShadow: '0 0 10px rgba(124,109,250,0.5)' }}>{completionPct}%</span>
        </div>
        <div style={{ height: 6, background: 'rgba(0,0,0,0.4)', borderRadius: 3, overflow: 'hidden', position: 'relative', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)' }}>
          <div className="shimmer-sweep" style={{ position: 'absolute', inset: 0, zIndex: 1 }} />
          <div style={{ width: `${completionPct}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent), #fff)', borderRadius: 3, transition: 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1)', position: 'relative', zIndex: 2, boxShadow: '0 0 10px var(--accent)' }} />
        </div>
      </div>

      {data?.tasks?.today?.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: density === 'compact' ? 6 : 10 }}>
          {data.tasks.today.sort((a, b) => (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2)).slice(0, 5).map((task, index) => {
            const tid = getSafeId(task, `task-${index}`);
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
                cursor: 'pointer'
              }} className="hover-lift" onClick={() => navigate('/tasks')}>
                <div style={{ width: 8, height: 8, borderRadius: '4px', background: task.priority === 'urgent' ? 'var(--red)' : task.priority === 'high' ? 'var(--orange)' : task.priority === 'medium' ? 'var(--yellow)' : 'var(--green)', flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</span>
                <span className={`badge badge-${task.priority}`} style={{ fontSize: 9 }}>{task.priority.toUpperCase()}</span>
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
