import React from 'react';
import ActivityHeatmapYear from '../ActivityHeatmapYear';
import WidgetWrapper from './WidgetWrapper';
import { Activity, ArrowRight, CheckCircle2, Timer, Trophy, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import MagneticButton from '../common/MagneticButton';

const HeatmapWidget = ({ activityData, isMobile, navigate, selectedLog, setSelectedLog }) => {
  return (
    <WidgetWrapper title="Consistency Tracker" icon={Activity}>
      <div style={{ marginBottom: 24, overflowX: 'auto', paddingBottom: 8 }}>
        <ActivityHeatmapYear 
          data={Array.isArray(activityData) ? activityData : []} 
          isMobile={isMobile} 
          onSelectDay={(d, log) => setSelectedLog(log)} 
        />
      </div>

      {/* Selected Day Details */}
      <AnimatePresence mode="wait">
        {selectedLog && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="selected-day-card mb-6" style={{ 
              padding: '20px', 
              background: 'linear-gradient(135deg, var(--surface2), var(--surface3))',
              borderRadius: 16,
              border: '1px solid var(--accent)',
              boxShadow: '0 0 20px rgba(95, 250, 209, 0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
                    Inspecting Progress
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>
                    {format(new Date(selectedLog.date), 'EEEE, MMMM do')}
                  </h3>
                </div>
                <button 
                  className="btn btn-sm btn-ghost" 
                  onClick={() => setSelectedLog(null)}
                  style={{ padding: '4px 8px', fontSize: 11 }}
                >
                  Clear Selection
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 12 }}>
                {[
                  { label: 'Tasks', value: selectedLog.tasksCompleted, icon: CheckCircle2, sub: 'completed' },
                  { label: 'Focus', value: `${selectedLog.focusMinutes}m`, icon: Timer, sub: 'session' },
                  { label: 'Rituals', value: selectedLog.habitsCompleted, icon: Trophy, sub: 'done' },
                  { label: 'Events', value: selectedLog.scheduleEventsCompleted, icon: Calendar, sub: 'attended' }
                ].map((s, idx) => (
                  <div key={idx} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <s.icon size={14} style={{ color: 'var(--accent)' }} />
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</span>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em' }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{s.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: isMobile ? '1.2rem' : '2.0rem', fontWeight: 800, fontFamily: 'Syne, sans-serif', letterSpacing: '-0.06em', margin: 0, lineHeight: 1 }}>
              Mission Control
            </h1>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--muted)', marginTop: 8, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
              Activity Logs
            </div>
          </div>
          <MagneticButton 
            className="btn btn-sm btn-ghost haptic-feedback" 
            onClick={() => navigate('/profile')}
            style={{ 
              background: 'rgba(255,255,255,0.02)', 
              border: '1px solid rgba(255,255,255,0.05)',
              padding: '8px 16px',
              borderRadius: '20px'
            }}
          >
            Full Profile <ArrowRight size={14} style={{ marginLeft: 6 }} />
          </MagneticButton>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(Array.isArray(activityData) ? activityData : []).slice(-3).reverse().map((log, i) => (
            <div key={log.date} style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              padding: '14px 20px',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: '20px',
              alignItems: 'center',
              border: '1px solid rgba(255,255,255,0.04)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }} className="hover-lift">
              <span style={{ fontSize: 13, fontWeight: 700, opacity: 0.8 }}>{format(new Date(log.date), 'MMMM do')}</span>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent3)', fontFamily: 'Syne, sans-serif', letterSpacing: '0.02em' }}>{log.tasksCompleted} execs</span>
                <div style={{
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  background: ['var(--surface3)', 'var(--accent)', 'var(--accent4)', 'var(--accent3)', 'linear-gradient(135deg, var(--accent), var(--accent2))'][log.intensity || 0],
                  border: '1px solid var(--border)'
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </WidgetWrapper>
  );
};

export default HeatmapWidget;
