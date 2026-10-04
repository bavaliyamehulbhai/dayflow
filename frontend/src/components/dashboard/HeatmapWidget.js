import React from 'react';
import ActivityHeatmapYear from '../ActivityHeatmapYear';
import WidgetWrapper from './WidgetWrapper';
import { Activity, ArrowRight, CheckCircle2, Timer, Trophy, Calendar } from 'lucide-react';
import { safeFormat } from '../../utils/dateUtils';
import { motion, AnimatePresence } from 'framer-motion';
import MagneticButton from '../common/MagneticButton';

const HeatmapWidget = ({ activityData, isMobile, navigate, selectedLog, setSelectedLog }) => {
  return (
    <WidgetWrapper title="Consistency Tracker" icon={Activity}>
      <div style={{ marginBottom: isMobile ? 12 : 24, overflowX: 'auto', paddingBottom: 8 }}>
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
              padding: '14px 16px', 
              background: 'linear-gradient(135deg, var(--surface2), var(--surface3))',
              borderRadius: 12,
              border: '1px solid var(--accent)',
              boxShadow: '0 0 20px rgba(95, 250, 209, 0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
                    Inspecting Progress
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>
                    {safeFormat(selectedLog.date, 'EEEE, MMMM do', 'Date Undefined')}
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
                    <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Inter', sans-serif", letterSpacing: '-0.02em' }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{s.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ 
        borderTop: '1px solid rgba(255,255,255,0.05)', 
        paddingTop: 24, 
        marginTop: 24,
        position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 10px var(--accent)' }} />
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                Activity Logs
              </div>
            </div>
            <h1 style={{ 
              fontSize: isMobile ? '1.4rem' : '2.0rem', 
              fontWeight: 900, 
              fontFamily: "'Syne', sans-serif", 
              letterSpacing: '-0.04em', 
              margin: 0, 
              lineHeight: 1,
              background: 'linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.7) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Mission Control
            </h1>
          </div>
          <MagneticButton 
            className="btn btn-sm btn-ghost haptic-feedback hover-lift" 
            onClick={() => navigate('/profile')}
            style={{ 
              background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))', 
              border: '1px solid rgba(255,255,255,0.1)',
              padding: '10px 18px',
              borderRadius: '14px',
              fontSize: 12,
              fontWeight: 700,
              color: '#fff',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)'
            }}
          >
            Full Profile <ArrowRight size={14} style={{ marginLeft: 6, color: 'var(--accent)' }} />
          </MagneticButton>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(Array.isArray(activityData) ? activityData : []).slice(-3).reverse().map((log, i) => (
            <div key={log.date} style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              padding: '14px 18px',
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '16px',
              alignItems: 'center',
              border: '1px solid rgba(255,255,255,0.03)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
            }} className="hover-lift">
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                {safeFormat(log.date, 'MMMM do', 'N/A')}
              </span>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  {log.tasksCompleted} execs
                </span>
                <div style={{
                  width: 12,
                  height: 12,
                  borderRadius: 4,
                  background: ['var(--surface3)', 'var(--accent)', 'var(--accent4)', 'var(--accent3)', 'linear-gradient(135deg, var(--accent), var(--accent2))'][log.intensity || 0],
                  border: '1px solid rgba(255,255,255,0.1)'
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
