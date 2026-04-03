import React from 'react';
import WidgetWrapper from './WidgetWrapper';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';

const ScheduleWidget = ({ data, navigate }) => {
  return (
    <WidgetWrapper title="Timeline" icon={Calendar}>
      {data?.schedule?.today?.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 300, overflowY: 'auto', paddingRight: 4 }}>
          {data.schedule.today.map((ev, i) => {
            const now = new Date();
            const nowMin = now.getHours() * 60 + now.getMinutes();
            const [sh, sm] = ev.startTime.split(':').map(Number);
            const startMin = sh * 60 + sm;
            const isCurrent = ev.endTime ? (() => { const [eh, em] = ev.endTime.split(':').map(Number); return nowMin >= startMin && nowMin < eh * 60 + em; })() : false;
            const isPast = ev.endTime ? (() => { const [eh, em] = ev.endTime.split(':').map(Number); return nowMin >= eh * 60 + em; })() : false;

            return (
              <div key={ev._id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                borderRadius: 12, borderLeft: `4px solid ${isCurrent ? 'var(--green)' : isPast ? 'var(--muted)' : 'var(--accent)'}`,
                background: isCurrent ? 'rgba(95,250,209,0.08)' : 'var(--surface2)',
                opacity: isPast ? 0.6 : 1,
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }} onClick={() => navigate('/schedule')}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>{ev.startTime}{ev.endTime ? ` – ${ev.endTime}` : ''}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, marginTop: 2 }}>{ev.title}</div>
                </div>
                {isCurrent && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 10px var(--green)', animation: 'pulse 2s ease infinite' }} />}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state" style={{ padding: '40px 24px', opacity: 0.8 }}>
          <div className="empty-icon" style={{ fontSize: 32, marginBottom: 12 }}>🍃</div>
          <div className="empty-title" style={{ fontSize: 14, fontWeight: 700 }}>Orbit Clear</div>
          <div className="empty-desc" style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>No events scheduled for this window.</div>
        </div>
      )}
    </WidgetWrapper>
  );
};

export default ScheduleWidget;
