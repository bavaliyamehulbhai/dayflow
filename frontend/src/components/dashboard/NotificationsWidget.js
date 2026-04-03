import React from 'react';
import WidgetWrapper from './WidgetWrapper';
import { Bell, Clock, ArrowRight, AlertCircle, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, isAfter, isBefore, addHours, parseISO } from 'date-fns';

const NotificationsWidget = ({ data, navigate }) => {
  // Filter tasks due within the next 48 hours that are not completed
  const now = new Date();
  const threshold = addHours(now, 48);

  const upcomingDeadlines = (data?.tasks?.all || [])
    .filter(task => {
      if (!task.dueDate || task.status === 'completed') return false;
      const dueDate = parseISO(task.dueDate);
      return isAfter(dueDate, now) && isBefore(dueDate, threshold);
    })
    .sort((a, b) => parseISO(a.dueDate) - parseISO(b.dueDate));

  return (
    <WidgetWrapper title="Signals & Deadlines" icon={Bell}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {upcomingDeadlines.length > 0 ? (
          upcomingDeadlines.slice(0, 4).map((task, idx) => {
            const dueDate = parseISO(task.dueDate);
            const isUrgent = isBefore(dueDate, addHours(now, 12));
            
            return (
              <motion.div
                key={task._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => navigate('/tasks')}
                className="glass-card aura-iridescent haptic-tap"
                style={{
                  padding: '14px 16px',
                  borderRadius: 16,
                  border: `1px solid ${isUrgent ? 'rgba(255, 107, 107, 0.2)' : 'rgba(255, 255, 255, 0.05)'}`,
                  background: isUrgent ? 'rgba(255, 107, 107, 0.03)' : 'rgba(255, 255, 255, 0.02)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{ 
                  width: 36, height: 36, borderRadius: 10, 
                  background: isUrgent ? 'rgba(255, 107, 107, 0.1)' : 'rgba(124, 109, 250, 0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {isUrgent ? (
                    <AlertCircle size={18} color="var(--red)" />
                  ) : (
                    <Clock size={18} color="var(--accent)" />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    fontSize: 13, 
                    fontWeight: 800, 
                    fontFamily: 'Syne', 
                    color: 'white',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {task.title}
                  </div>
                  <div style={{ 
                    fontSize: 10, 
                    fontWeight: 700, 
                    color: isUrgent ? 'var(--red)' : 'var(--muted)',
                    marginTop: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}>
                    <Calendar size={10} />
                    {format(dueDate, 'MMM d, h:mm a')}
                  </div>
                </div>

                {isUrgent && (
                  <div style={{ 
                    fontSize: 9, 
                    fontWeight: 900, 
                    color: 'var(--red)', 
                    background: 'rgba(255, 107, 107, 0.1)',
                    padding: '2px 6px',
                    borderRadius: 6,
                    letterSpacing: 0.5
                  }}>
                    IMMINENT
                  </div>
                )}
              </motion.div>
            );
          })
        ) : (
          <div style={{ 
            padding: '32px 16px', 
            textAlign: 'center', 
            background: 'rgba(255, 255, 255, 0.02)', 
            borderRadius: 20, 
            border: '1px dashed rgba(255, 255, 255, 0.05)' 
          }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>🛰️</div>
            <div style={{ fontSize: 13, fontWeight: 800, fontFamily: 'Syne', color: 'white' }}>Silence in the Archive</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>No imminent temporal deadlines detected.</div>
          </div>
        )}
        
        <button 
          className="btn btn-sm btn-ghost mt-2" 
          onClick={() => navigate('/tasks')} 
          style={{ fontSize: 11, fontWeight: 800, alignSelf: 'center' }}
        >
          TEMPORAL VIEW <ArrowRight size={14} style={{ marginLeft: 4 }} />
        </button>
      </div>
    </WidgetWrapper>
  );
};

export default NotificationsWidget;
