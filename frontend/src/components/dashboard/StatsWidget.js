import React, { useContext } from 'react';
import { useCountUp } from '../../hooks/useCountUp';
import SensitivityShield from '../layout/SensitivityShield';
import { CheckCircle2, Zap, Timer, Trophy } from 'lucide-react';
import WidgetWrapper from './WidgetWrapper';
import { DashboardDensityContext } from '../../pages/DashboardPage';

const AnimatedStat = React.memo(({ value, label, color, icon: Icon, onClick }) => {
  const density = useContext(DashboardDensityContext) || 'comfortable';
  const animated = useCountUp(typeof value === 'number' ? value : 0);
  const display = typeof value === 'string' ? value : animated;
  const isMobile = window.innerWidth <= 768;
  return (
    <div 
      className="haptic-tap" 
      onClick={onClick}
      style={{ 
        cursor: onClick ? 'pointer' : 'default', 
        background: 'transparent', 
        borderRadius: 8, 
        padding: '12px', 
        position: 'relative', 
        border: '1px solid var(--border2)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text2)' }}>
        <Icon size={14} />
        <div style={{ fontSize: 12, fontWeight: 500 }}>{label}</div>
      </div>
      <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
        {display}
      </div>
    </div>
  );
});

const StatsWidget = ({ data, user, navigate }) => {
  const currentStreak = user?.stats?.currentStreak || 0;
  const isHot = currentStreak >= 3;

  const stats = [
    { label: 'Tasks', value: data?.tasks?.summary?.completed || 0, color: 'var(--green)', icon: CheckCircle2, onClick: () => navigate('/tasks?status=completed') },
    { 
      label: 'Streak', 
      value: currentStreak, 
      color: isHot ? '#ff7043' : (currentStreak > 0 ? '#ffb74d' : 'var(--muted)'), 
      icon: Zap, 
      onClick: () => navigate('/profile') 
    },
    { label: 'Focus', value: data?.pomodoro?.todayMinutes || 0, color: 'var(--accent)', icon: Timer, onClick: () => navigate('/pomodoro') },
    { label: 'Rituals', value: `${data?.habits?.completedToday || 0}/${data?.habits?.total || 0}`, color: 'var(--accent3)', icon: Trophy, onClick: () => navigate('/habits') },
  ];

  return (
    <WidgetWrapper title="Vitals" icon={Zap}>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', 
        gap: 12 
      }}>
        {stats.map((s, i) => (
          <AnimatedStat key={i} {...s} />
        ))}
      </div>
    </WidgetWrapper>
  );
};

export default StatsWidget;
