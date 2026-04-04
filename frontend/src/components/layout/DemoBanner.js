import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Info, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const DemoBanner = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const isMobile = window.innerWidth <= 768;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="premium-status-bar"
      style={{
        background: 'rgba(13, 13, 22, 0.45)',
        backdropFilter: 'blur(30px) saturate(210%)',
        WebkitBackdropFilter: 'blur(30px) saturate(210%)',
        borderBottom: '1px solid rgba(124, 109, 250, 0.15)',
        padding: isMobile ? '8px 16px' : '10px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: isMobile ? '8px' : '16px',
        zIndex: 1000,
        position: 'relative',
        width: '100%',
        color: 'var(--text)',
        fontSize: isMobile ? '11px' : '12px',
        fontWeight: 600,
        letterSpacing: '0.04em',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
        overflow: 'hidden'
      }}
    >
      <div className="status-indicator-glow" />
      
      <div className="demo-badge-luxe">
        <Zap size={10} fill="currentColor" />
        {isMobile ? 'DEMO' : 'DEMO MODE'}
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.85, flex: 1, justifyContent: isMobile ? 'flex-start' : 'center' }}>
        <Info size={14} style={{ color: 'var(--accent)' }} />
        <span className={isMobile ? 'text-truncate' : ''}>
          {isMobile 
            ? 'Shared environment; data resets periodicially.' 
            : 'You are in a shared environment. Persistence is limited; data resets periodically.'}
        </span>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={{
          background: 'var(--grad-premium)',
          border: 'none',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontWeight: 800,
          cursor: 'pointer',
          padding: '6px 14px',
          borderRadius: '30px',
          fontSize: '10px',
          boxShadow: '0 4px 15px rgba(124, 109, 250, 0.3)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em'
        }}
        onClick={() => {
          logout();
          navigate('/register');
        }}
      >
        GO PREMIUM <ArrowRight size={12} />
      </motion.button>

      <style dangerouslySetInnerHTML={{ __html: `
        .premium-status-bar {
          animation: statusGlowPulse 6s ease-in-out infinite;
        }
        .status-indicator-glow {
          position: absolute;
          top: -20px;
          left: 50%;
          width: 200px;
          height: 40px;
          background: var(--accent);
          filter: blur(40px);
          opacity: 0.1;
          transform: translateX(-50%);
          pointer-events: none;
        }
        .demo-badge-luxe {
          background: rgba(124, 109, 250, 0.08);
          color: var(--accent);
          padding: 4px 10px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 9px;
          font-weight: 900;
          border: 1px solid rgba(124, 109, 250, 0.2);
          text-transform: uppercase;
          backdrop-filter: blur(5px);
        }
        .text-truncate {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 140px;
        }
        @keyframes statusGlowPulse {
          0%, 100% { border-color: rgba(124, 109, 250, 0.15); }
          50% { border-color: rgba(0, 242, 254, 0.3); }
        }
      `}} />
    </motion.div>
  );
};

export default DemoBanner;
