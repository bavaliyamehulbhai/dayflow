import React from 'react';
import { motion } from 'framer-motion';
import { GripVertical } from 'lucide-react';
import { useReorderControlled } from 'framer-motion';

const WidgetWrapper = ({ children, title, icon: Icon, onSettingsClick, dragControls, id }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      className="card glass-holographic aura-iridescent widget-card"
      style={{
        padding: '24px',
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid var(--border)',
        overflow: 'hidden'
      }}
    >
      <div className="flex-between mb-6" style={{ transform: 'translateZ(10px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div 
            className="drag-handle"
            style={{ 
              cursor: 'grab', 
              color: 'var(--muted)', 
              display: 'flex', 
              alignItems: 'center',
              padding: '4px',
              borderRadius: '6px',
              background: 'rgba(255,255,255,0.03)'
            }}
          >
            <GripVertical size={16} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)', fontWeight: 800, fontSize: 15, letterSpacing: '-0.02em' }}>
            {Icon && <Icon size={18} className="text-accent" />}
            {title}
          </div>
        </div>
        {onSettingsClick && (
          <button 
            onClick={onSettingsClick}
            className="btn btn-sm btn-ghost"
            style={{ padding: '4px 8px', fontSize: 11, opacity: 0.6 }}
          >
            Settings
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
