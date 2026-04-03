import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

const Toast = ({ toast, onRemove }) => {
  const { id, message, type, duration, customIcon } = toast;

  useEffect(() => {
    const timer = setTimeout(() => onRemove(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, onRemove]);

  const icons = {
    success: <CheckCircle className="text-green-400" size={18} />,
    error: <XCircle className="text-red-400" size={18} />,
    warning: <AlertTriangle className="text-yellow-400" size={18} />,
    info: <Info className="text-blue-400" size={18} />,
  };

  const colors = {
    success: 'rgba(34, 197, 94, 0.15)',
    error: 'rgba(239, 68, 68, 0.15)',
    warning: 'rgba(234, 179, 8, 0.15)',
    info: 'rgba(59, 130, 246, 0.15)',
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
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(16px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 16,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        pointerEvents: 'auto',
        marginBottom: 12,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background Glow */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: 4,
        height: '100%',
        background: type === 'success' ? 'var(--green)' : type === 'error' ? 'var(--red)' : type === 'warning' ? 'var(--orange)' : 'var(--accent)',
        opacity: 0.8
      }} />

      <div style={{ 
        background: colors[type] || 'rgba(255,255,255,0.05)', 
        borderRadius: '50%', 
        padding: 6, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        boxShadow: `0 0 10px ${colors[type] || 'rgba(255,255,255,0.05)'}`
      }}>
        {customIcon ? <span style={{ fontSize: 18 }}>{customIcon}</span> : icons[type]}
      </div>

      <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>
        {message}
      </div>

      <button
        onClick={() => onRemove(id)}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--muted)',
          cursor: 'pointer',
          padding: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.6,
          transition: 'opacity 0.2s ease'
        }}
        onMouseEnter={(e) => e.target.style.opacity = 1}
        onMouseLeave={(e) => e.target.style.opacity = 0.6}
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
          background: 'rgba(255,255,255,0.2)',
          opacity: 0.3
        }}
      />
    </motion.div>
  );
};

export default Toast;
