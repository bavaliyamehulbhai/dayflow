import React from 'react';
import { useCountUp } from '../../hooks/useCountUp'; // I'll need to create this hook
import SensitivityShield from '../layout/SensitivityShield';
import { CheckCircle2, Zap, Timer, Trophy } from 'lucide-react';
import WidgetWrapper from './WidgetWrapper';

const AnimatedStat = React.memo(({ value, label, color, icon: Icon, onClick }) => {
  const animated = useCountUp(typeof value === 'number' ? value : 0);
  const display = typeof value === 'string' ? value : animated;
  return (
    <div 
      className="stat-card-premium gpu-accel haptic-tap" 
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default', background: 'var(--surface2)', borderRadius: 16, padding: '16px', position: 'relative', overflow: 'hidden' }}
    >
      <div className="stat-card-glow" style={{ position: 'absolute', inset: 0, opacity: 0.1, background: `radial-gradient(circle at 50% 50%, ${color}, transparent 70%)` }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ color, opacity: 0.9, marginBottom: 4 }}><Icon size={20} /></div>
        <SensitivityShield>
          <div style={{ fontSize: 24, fontWeight: 900, color, letterSpacing: '-0.02em' }}>{display}</div>
        </SensitivityShield>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {stats.map((s, i) => (
          <AnimatedStat key={i} {...s} />
        ))}
      </div>
    </WidgetWrapper>
  );
};

export default StatsWidget;
