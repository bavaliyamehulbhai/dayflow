import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const EmptyState = ({ icon: Icon = Sparkles, title, description, action, iconColor = 'var(--accent)' }) => {
  return (
    <div className="empty-state-premium" style={{ 
      padding: '40px 20px', 
      textAlign: 'center', 
      borderRadius: 16,
      position: 'relative',
      overflow: 'hidden',
      background: 'rgba(255, 255, 255, 0.02)',
      border: '1px dashed rgba(255, 255, 255, 0.08)'
    }}>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: 'relative', zIndex: 1 }}
      >
        <motion.div 
          style={{ 
            display: 'inline-flex', padding: 16, borderRadius: 16, 
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            marginBottom: 24,
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)'
          }}
        >
          <Icon size={32} style={{ color: iconColor }} />
        </motion.div>
        
        <h3 style={{ 
          fontSize: '18px', fontWeight: 700, fontFamily: "'Inter', sans-serif", 
          letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 8,
          lineHeight: 1.2
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
