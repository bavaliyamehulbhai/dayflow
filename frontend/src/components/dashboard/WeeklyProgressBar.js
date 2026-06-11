import React from 'react';
import { motion } from 'framer-motion';
import { Target, Zap, Award } from 'lucide-react';

const WeeklyProgressBar = ({ progress = {} }) => {
  const { completed = 0, goal = 30, percentage = 0 } = progress;
  
  // Determine color based on progress
  const getColor = () => {
    if (percentage < 30) return 'var(--accent)';
    if (percentage < 70) return 'var(--accent2)';
    if (percentage < 100) return 'var(--green)';
    return '#ffca28'; // Gold for goal met
  };

  const progressColor = getColor();

  return (
    <div style={{ position: 'relative' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '12px', 
            background: `${progressColor}15`, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            border: `1px solid ${progressColor}33`,
            color: progressColor
          }}>
            <Target size={20} />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text)', fontFamily: 'Syne' }}>Weekly Goal</div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Efficiency Protocol</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '20px', fontWeight: '900', color: percentage >= 100 ? '#ffca28' : 'var(--text)', fontFamily: 'Syne' }}>
            {completed}<span style={{ fontSize: '12px', color: 'var(--muted)', marginLeft: '4px' }}>/ {goal}</span>
          </div>
          <div style={{ fontSize: '10px', color: progressColor, fontWeight: '800' }}>{percentage}% COMPLETE</div>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div style={{ 
        height: '12px', 
        width: '100%', 
        background: 'rgba(0,0,0,0.2)', 
        borderRadius: '100px', 
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.05)'
      }}>
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ 
            height: '100%', 
            background: `linear-gradient(90deg, ${progressColor}, ${progressColor}dd)`,
            borderRadius: '100px',
            boxShadow: `0 0 20px ${progressColor}44`
          }}
        />
        
        {/* Animated Glow on progress point */}
        <motion.div 
          animate={{ x: [`${percentage - 5}%`, `${percentage}%`, `${percentage - 5}%`] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: '10px',
            background: '#fff',
            filter: 'blur(8px)',
            opacity: 0.3
          }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--muted)', fontWeight: '600' }}>
          <Zap size={12} style={{ color: 'var(--accent)' }} />
          <span>Keep pushing!</span>
        </div>
        {percentage >= 100 && (
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#ffca28', fontWeight: '800' }}
          >
            <Award size={12} />
            <span>LEVEL UP ELIGIBLE</span>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default WeeklyProgressBar;
