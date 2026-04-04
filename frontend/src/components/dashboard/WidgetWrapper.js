import React from 'react';
import { motion } from 'framer-motion';
import { GripVertical } from 'lucide-react';
import { useReorderControlled } from 'framer-motion';

const WidgetWrapper = ({ children, title, icon: Icon, onSettingsClick, dragControls, id }) => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={isMobile ? {} : { y: -6, scale: 1.01 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="card glass-holographic widget-card-elite haptic-tap gpu-accel"
      style={{
        padding: isMobile ? '20px' : '28px',
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(255, 255, 255, 0.04)',
        backdropFilter: isMobile ? 'blur(20px) saturate(210%)' : 'blur(40px) saturate(220%)',
        WebkitBackdropFilter: isMobile ? 'blur(20px) saturate(210%)' : 'blur(40px) saturate(220%)',
        borderRadius: isMobile ? '24px' : '35px',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.45)',
        overflow: 'hidden',
        willChange: 'transform, opacity'
      }}
    >
      {/* ─── Holographic Border Overlay ────────────────────────────────────────── */}
      <div style={{ 
        position: 'absolute', 
        inset: 0, 
        borderRadius: '35px',
        padding: '1.2px',
        background: 'linear-gradient(135deg, rgba(124, 109, 250, 0.45) 0%, rgba(0, 242, 254, 0.3) 50%, rgba(255, 0, 128, 0.2) 100%)',
        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'destination-out',
        maskComposite: 'exclude',
        pointerEvents: 'none',
        opacity: 0.8
      }} />

      <div className="flex-between mb-8" style={{ transform: 'translateZ(15px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div 
            className="drag-handle"
            style={{ 
              cursor: 'grab', 
              color: 'var(--muted)', 
              display: 'flex', 
              alignItems: 'center',
              padding: '6px',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.05)'
            }}
          >
            <GripVertical size={14} />
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 10, 
            color: 'var(--text)', 
            fontWeight: 800, 
            fontSize: 16, 
            letterSpacing: '-0.02em',
            fontFamily: "'Plus Jakarta Sans', sans-serif"
          }}>
            <div style={{ 
              background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              padding: '8px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(124, 109, 250, 0.2)'
            }}>
              {Icon && <Icon size={16} color="white" />}
            </div>
            {title}
          </div>
        </div>
        {onSettingsClick && (
          <button 
            onClick={onSettingsClick}
            className="btn-luxe-settings"
            style={{ 
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'var(--muted)',
              padding: '6px 14px', 
              fontSize: 11, 
              borderRadius: '20px',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase'
            }}
          >
            Manage
          </button>
        )}
      </div>

      <div className="widget-content" style={{ flex: 1, transform: 'translateZ(5px)' }}>
        {children}
      </div>

      {/* Subtle bottom glow */}
      <div style={{ 
        position: 'absolute', 
        bottom: 0, 
        left: '10%', 
        right: '10%', 
        height: '1px', 
        background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
        opacity: 0.3
      }} />
    </motion.div>
  );
};

export default WidgetWrapper;
