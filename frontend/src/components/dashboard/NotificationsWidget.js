import React from 'react';
import WidgetWrapper from './WidgetWrapper';
import { Bell, Clock, ArrowRight, AlertCircle, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { isAfter, isBefore, addHours, parseISO } from 'date-fns';
import { safeFormat } from '../../utils/dateUtils';
import { getSafeId } from '../../utils/idUtils';

const NotificationsWidget = ({ data, navigate }) => {
  // Filter tasks due within the next 48 hours that are not completed
  const now = new Date();
  const threshold = addHours(now, 48);

  const parseDueDate = (val) => {
    if (!val) return null;
    try {
      const d = typeof val === 'string' ? parseISO(val) : new Date(val);
      return isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  };

  const upcomingDeadlines = (data?.tasks?.upcoming || data?.tasks?.all || data?.tasks?.today || [])
    .filter(task => {
      if (!task?.dueDate || task.status === 'completed' || task.status === 'cancelled') return false;
      const dueDate = parseDueDate(task.dueDate);
      if (!dueDate) return false;
      return isBefore(dueDate, threshold);
    })
    .sort((a, b) => {
      const da = parseDueDate(a.dueDate) || 0;
      const db = parseDueDate(b.dueDate) || 0;
      return da - db;
    });

  return (
    <WidgetWrapper title="Signals & Deadlines" icon={Bell}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {upcomingDeadlines.length > 0 ? (
          upcomingDeadlines.slice(0, 4).map((task, idx) => {
            const dueDate = parseDueDate(task.dueDate) || now;
            const isOverdue = isBefore(dueDate, now);
            const isUrgent = isOverdue || isBefore(dueDate, addHours(now, 12));
            
            return (
              <motion.div
                key={getSafeId(task, `notif-${idx}`)}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => navigate('/notifications')}
                className="haptic-tap hover-lift"
                style={{
                  padding: '14px 16px',
                  borderRadius: 14,
                  border: `1px solid ${isOverdue ? 'rgba(255, 77, 77, 0.3)' : isUrgent ? 'rgba(255, 170, 0, 0.25)' : 'rgba(255, 255, 255, 0.04)'}`,
                  background: isOverdue 
                    ? 'linear-gradient(145deg, rgba(255,77,77,0.08) 0%, rgba(255,77,77,0.02) 100%)' 
                    : isUrgent 
                      ? 'linear-gradient(145deg, rgba(255,170,0,0.06) 0%, rgba(255,170,0,0.01) 100%)' 
                      : 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                  boxShadow: isUrgent ? 'inset 0 1px 1px rgba(255,107,107,0.1)' : 'inset 0 1px 1px rgba(255,255,255,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{ 
                  width: 36, height: 36, borderRadius: 10, 
                  background: isOverdue ? 'rgba(255, 77, 77, 0.15)' : isUrgent ? 'rgba(255, 170, 0, 0.12)' : 'rgba(124, 109, 250, 0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {isOverdue ? (
                    <AlertCircle size={18} color="#ff4d4d" />
                  ) : isUrgent ? (
                    <Clock size={18} color="#ffa500" />
                  ) : (
                    <Clock size={18} color="var(--accent)" />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    fontSize: 13, 
                    fontWeight: 800, 
                    fontFamily: "'Inter', sans-serif", 
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
                    color: isOverdue ? '#ff6b6b' : isUrgent ? '#ffa500' : 'var(--muted)',
                    marginTop: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}>
                    <Calendar size={10} />
                    {safeFormat(dueDate, 'MMM d, h:mm a', 'Time TBD')}
                  </div>
                </div>

                {isOverdue ? (
                  <div style={{ 
                    fontSize: 9, 
                    fontWeight: 900, 
                    color: '#ff4d4d', 
                    background: 'rgba(255, 77, 77, 0.15)',
                    padding: '2px 6px',
                    borderRadius: 6,
                    letterSpacing: 0.5
                  }}>
                    OVERDUE
                  </div>
                ) : isUrgent && (
                  <div style={{ 
                    fontSize: 9, 
                    fontWeight: 900, 
                    color: '#ffa500', 
                    background: 'rgba(255, 170, 0, 0.12)',
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
            padding: '20px 12px', 
            textAlign: 'center', 
            background: 'rgba(255, 255, 255, 0.02)', 
            borderRadius: 12, 
            border: '1px dashed rgba(255, 255, 255, 0.05)' 
          }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>🛰️</div>
            <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "'Inter', sans-serif", color: 'white' }}>Silence in the Archive</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>No imminent temporal deadlines detected.</div>
          </div>
        )}
        
        <button 
          className="btn btn-sm btn-ghost mt-2" 
          onClick={() => navigate('/notifications')} 
          style={{ fontSize: 11, fontWeight: 800, alignSelf: 'center', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          VIEW NOTIFICATIONS CENTER <ArrowRight size={14} />
        </button>
      </div>
    </WidgetWrapper>
  );
};

export default NotificationsWidget;
