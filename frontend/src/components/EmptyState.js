import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const EmptyState = ({ icon: Icon = Sparkles, title, description, action, iconColor = 'var(--accent)' }) => {
  return (
    <div className="card glass-holographic empty-state-premium" style={{ 
      padding: '80px 40px', 
      textAlign: 'center', 
      borderRadius: 40,
      position: 'relative',
      overflow: 'hidden',
      border: 'none'
    }}>
      {/* Background Aura */}
      <div className="aura-pulse" style={{ 
        position: 'absolute', 
        top: '50%',
        left: '50%',
        width: '120%',
        height: '120%',
        background: 'var(--grad-mesh-vibrant)',
        transform: 'translate(-50%, -50%)',
        opacity: 0.15,
        filter: 'blur(80px)',
        pointerEvents: 'none'
      }} />
      
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: 'relative', zIndex: 1 }}
      >
        <motion.div 
          className="aura-float"
          style={{ 
            display: 'inline-flex', padding: 24, borderRadius: 32, 
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: 32,
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Icon size={48} style={{ color: iconColor, filter: `drop-shadow(0 0 15px ${iconColor}cc)` }} />
        </motion.div>
        
        <h3 style={{ 
          fontSize: 'var(--fs-xl)', fontWeight: 900, fontFamily: 'Syne, sans-serif', 
          letterSpacing: '-0.04em', color: 'var(--text)', marginBottom: 16,
          lineHeight: 1.1
        }}>
          {title}
        </h3>
        
        <p style={{ 
          fontSize: 'var(--fs-base)', color: 'var(--text2)', fontWeight: 500, 
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
            style={{ padding: '16px 36px', fontSize: 16, fontWeight: 800, borderRadius: 18 }}
          >
            {action.label}
          </motion.button>
        )}
      </motion.div>
    </div>
  );
};

export default EmptyState;
