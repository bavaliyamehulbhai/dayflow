import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const EmptyState = ({ icon: Icon = Sparkles, title, description, action, iconColor = 'var(--accent)' }) => {
  return (
    <div className="card empty-state-premium" style={{ 
      padding: '80px 40px', 
      textAlign: 'center', 
      background: 'rgba(130, 114, 255, 0.02)',
      border: '1px solid rgba(130, 114, 255, 0.05)',
      borderRadius: 40,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Aura */}
      <div style={{ 
        position: 'absolute', inset: 0, 
        background: 'radial-gradient(circle at 50% 50%, rgba(130, 114, 255, 0.03) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div style={{ 
          display: 'inline-flex', padding: 24, borderRadius: 32, 
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          marginBottom: 32,
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
        }}>
          <Icon size={48} style={{ color: iconColor, filter: `drop-shadow(0 0 12px ${iconColor}66)` }} />
        </div>
        
        <h3 style={{ 
          fontSize: 28, fontWeight: 900, fontFamily: 'Syne, sans-serif', 
          letterSpacing: '-0.04em', color: 'var(--text)', marginBottom: 16 
        }}>
          {title}
        </h3>
        
        <p style={{ 
          fontSize: 16, color: 'var(--muted)', fontWeight: 600, 
          maxWidth: 420, margin: '0 auto 40px', lineHeight: 1.6 
        }}>
          {description}
        </p>
        
        {action && (
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 20px 40px var(--accent-glow)' }}
            whileTap={{ scale: 0.95 }}
            onClick={action.onClick}
            className="btn btn-primary haptic-feedback"
            style={{ padding: '14px 32px', fontSize: 16, fontWeight: 800, borderRadius: 16 }}
          >
            {action.label}
          </motion.button>
        )}
      </motion.div>
    </div>
  );
};

export default EmptyState;
