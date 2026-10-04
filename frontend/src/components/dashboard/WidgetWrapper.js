import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { GripVertical } from 'lucide-react';
import { useReorderControlled } from 'framer-motion';
import { DashboardDensityContext } from '../../pages/DashboardPage';

const WidgetWrapper = ({ children, title, icon: Icon, onSettingsClick, id, density: propDensity }) => {
  const contextDensity = useContext(DashboardDensityContext);
  const density = propDensity || contextDensity || 'comfortable';
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  const getPadding = () => {
    return '16px';
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className="premium-card"
      style={{
        padding: '20px',
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        background: 'linear-gradient(145deg, #1c1c1e 0%, #121214 100%)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        overflow: 'hidden'
      }}
    >
      <div className="flex-between" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#fff', fontWeight: 800, fontSize: 14, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
          {Icon && (
            <div style={{ 
              width: 28, height: 28, borderRadius: 8, 
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              <Icon size={14} style={{ color: 'var(--accent)' }} />
            </div>
          )}
          <span style={{ 
            background: 'linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.6) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            {title}
          </span>
        </div>
        {onSettingsClick && (
          <button 
            onClick={onSettingsClick}
            style={{ 
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              color: 'var(--text2)',
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14, 
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            className="hover-lift"
          >
            ...
          </button>
        )}
      </div>

      <div className="widget-content" style={{ flex: 1 }}>
        {children}
      </div>
    </motion.div>
  );
};

export default WidgetWrapper;
