import React from 'react';
import WidgetWrapper from './WidgetWrapper';
import { Calendar, Check } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { scheduleAPI } from '../../utils/api';
import { useNotifications } from '../../context/NotificationContext';
import { safeFormat } from '../../utils/dateUtils';
import { getSafeId } from '../../utils/idUtils';

const ScheduleWidget = ({ data, navigate }) => {
  const qc = useQueryClient();
  const { addToast } = useNotifications();

  const handleToggleEvent = async (ev, e) => {
    e.stopPropagation();
    const eid = ev._id || ev.id;
    if (!eid) return;
    const todayStr = safeFormat(new Date(), "yyyy-MM-dd");
    try {
      await scheduleAPI.toggleComplete(eid, { clientDate: todayStr });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["schedule"] });
      addToast(ev.completed ? "Event reopened" : "Timeline event secured!", "success");
    } catch (err) {
      addToast(err?.response?.data?.error || "Failed to update event", "error");
    }
  };

  return (
    <WidgetWrapper title="Timeline" icon={Calendar}>
      {data?.schedule?.today?.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 300, overflowY: 'auto', paddingRight: 4 }}>
          {data.schedule.today.map((ev, i) => {
            const eid = getSafeId(ev, `event-${i}`);
            const now = new Date();
            const nowMin = now.getHours() * 60 + now.getMinutes();
            const [sh = 0, sm = 0] = (ev?.startTime || '0:0').split(':').map(Number);
            const startMin = sh * 60 + sm;
            const isCurrent = ev?.endTime ? (() => { const [eh = 0, em = 0] = ev.endTime.split(':').map(Number); return nowMin >= startMin && nowMin < eh * 60 + em; })() : false;
            const isPast = ev?.endTime ? (() => { const [eh = 0, em = 0] = ev.endTime.split(':').map(Number); return nowMin >= eh * 60 + em; })() : (nowMin >= startMin + 30);
            const isCompleted = Boolean(ev?.completed);

            return (
              <div key={eid} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                borderRadius: 12, borderLeft: `4px solid ${isCompleted ? 'var(--green)' : isCurrent ? 'var(--green)' : isPast ? 'var(--muted)' : 'var(--accent)'}`,
                background: isCompleted ? 'rgba(34,197,94,0.06)' : isCurrent ? 'rgba(95,250,209,0.08)' : 'var(--surface2)',
                opacity: isCompleted ? 0.6 : isPast ? 0.7 : 1,
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }} onClick={() => navigate('/schedule')} className="hover-lift">
                <div
                  onClick={(e) => handleToggleEvent(ev, e)}
                  title={isCompleted ? "Reopen event" : "Mark event completed"}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 6,
                    border: isCompleted ? '1.5px solid var(--green)' : '1.5px solid rgba(255,255,255,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isCompleted ? 'var(--green)' : 'rgba(255,255,255,0.03)',
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'all 0.15s ease'
                  }}
                >
                  {isCompleted && <Check size={12} strokeWidth={3} color="#fff" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>{ev.startTime}{ev.endTime ? ` – ${ev.endTime}` : ''}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, marginTop: 2, textDecoration: isCompleted ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</div>
                </div>
                {isCurrent && !isCompleted && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 10px var(--green)', animation: 'pulse 2s ease infinite' }} />}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state" style={{ 
          padding: '40px 24px', 
          opacity: 0.8,
          background: 'linear-gradient(145deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 100%)',
          borderRadius: 16,
          border: '1px dashed rgba(255,255,255,0.1)'
        }}>
          <div className="empty-icon" style={{ fontSize: 32, marginBottom: 12 }}>🍃</div>
          <div className="empty-title" style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.5px' }}>Orbit Clear</div>
          <div className="empty-desc" style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>No events scheduled for this window.</div>
        </div>
      )}
    </WidgetWrapper>
  );
};

export default ScheduleWidget;
