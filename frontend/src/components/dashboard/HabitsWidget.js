import React from 'react';
import WidgetWrapper from './WidgetWrapper';
import { RefreshCw, Flame, Check } from 'lucide-react';
import { getSafeId } from '../../utils/idUtils';

const HabitsWidget = ({ data, navigate }) => {
  return (
    <WidgetWrapper title="Rituals" icon={RefreshCw}>
      {data?.habits?.list?.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {data.habits.list.slice(0, 5).map((h, index) => {
            const hid = getSafeId(h, `habit-${index}`);
            return (
              <div key={hid} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => navigate('/habits')}>
              <div style={{ fontSize: 20 }}>{h.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{h.name}</div>
                {h.streak.current > 0 && <div style={{ fontSize: 10, color: 'var(--orange)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}><Flame size={12} /> {h.streak.current} DAY STREAK</div>}
              </div>
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                background: h.completedToday ? h.color : 'rgba(255,255,255,0.03)',
                border: `2px solid ${h.completedToday ? h.color : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white',
                boxShadow: h.completedToday ? `0 0 10px ${h.color}44` : 'none',
                transition: 'all 0.2s ease'
              }}>
                {h.completedToday && <Check size={14} strokeWidth={3} />}
              </div>
            </div>
            )
          })}
        </div>
      ) : (
        <div className="empty-state" style={{ padding: '40px 24px', opacity: 0.8 }}>
          <div className="empty-icon" style={{ fontSize: 32, marginBottom: 12 }}>🌱</div>
          <div className="empty-title" style={{ fontSize: 14, fontWeight: 700 }}>Rituals Offline</div>
          <div className="empty-desc" style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Initialize your first habit to track progress.</div>
        </div>
      )}
    </WidgetWrapper>
  );
};

export default HabitsWidget;
