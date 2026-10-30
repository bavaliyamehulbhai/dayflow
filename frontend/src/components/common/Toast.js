import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';

const Toast = ({ toast, onRemove }) => {
  const { id, message, type, duration, customIcon } = toast;

  useEffect(() => {
    const timer = setTimeout(() => onRemove(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, onRemove]);

  const icons = {
    success: <CheckCircle2 color="#10b981" size={18} />,
    error: <XCircle color="#ef4444" size={18} />,
    warning: <AlertTriangle color="#f59e0b" size={18} />,
    info: <Info color="#7c6dfa" size={18} />,
  };

  const colors = {
    success: 'rgba(16, 185, 129, 0.15)',
    error: 'rgba(239, 68, 68, 0.15)',
    warning: 'rgba(245, 158, 11, 0.15)',
    info: 'rgba(124, 109, 250, 0.15)',
  };

  const borderColors = {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#7c6dfa',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      whileHover={{ y: -2 }}
      className="glass-card aura-iridescent toast-card"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        minWidth: '280px',
        maxWidth: '400px',
        background: '#18181b',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 14,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        pointerEvents: 'auto',
        marginBottom: 10,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Indicator accent strip */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: 3,
        height: '100%',
        background: borderColors[type] || '#7c6dfa',
        opacity: 0.9
      }} />

      <div style={{ 
        background: colors[type] || 'rgba(255,255,255,0.05)', 
        borderRadius: '50%', 
        padding: 6, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
      }}>
        {customIcon ? <span style={{ fontSize: 18 }}>{customIcon}</span> : (icons[type] || icons.info)}
      </div>

      <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#f4f4f5', letterSpacing: '-0.01em', lineHeight: 1.4 }}>
        {message}
      </div>

      <button
        onClick={() => onRemove(id)}
        style={{
          background: 'none',
          border: 'none',
          color: '#a1a1aa',
          cursor: 'pointer',
          padding: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.7,
          transition: 'opacity 0.2s ease'
        }}
        onMouseEnter={(e) => e.target.style.opacity = 1}
        onMouseLeave={(e) => e.target.style.opacity = 0.7}
      >
        <X size={14} />
      </button>
      
      {/* Auto-dismiss progress bar */}
      <motion.div
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: duration / 1000, ease: 'linear' }}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: 2,
          background: borderColors[type] || 'rgba(255,255,255,0.2)',
          opacity: 0.4
        }}
      />
    </motion.div>
  );
};

export default Toast;
