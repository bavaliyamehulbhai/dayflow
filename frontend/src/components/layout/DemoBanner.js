import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Info, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const DemoBanner = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="demo-banner"
      style={{
        background: 'rgba(124, 109, 250, 0.15)',
        backdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid rgba(124, 109, 250, 0.3)',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        zIndex: 1000,
        position: 'sticky',
        top: 0,
        width: '100%',
        color: 'var(--text)',
        fontSize: '13px',
        fontWeight: 600,
        letterSpacing: '0.02em',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'
      }}
    >
      <div className="demo-badge" style={{
        background: 'var(--grad-premium)',
        padding: '4px 10px',
        borderRadius: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        color: 'white',
        fontSize: '10px',
        fontWeight: 800,
        textTransform: 'uppercase',
        boxShadow: '0 0 15px rgba(124, 109, 250, 0.4)'
      }}>
        <Zap size={10} fill="white" />
        Demo Mode
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.9 }}>
        <Info size={16} className="text-accent" />
        <span>You are exploring DayFlow in a shared environment. Persistence is limited; data resets periodically.</span>
      </div>

      <motion.button
        whileHover={{ x: 5 }}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--accent)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontWeight: 700,
          cursor: 'pointer',
          paddingLeft: '12px'
        }}
        onClick={() => {
          logout();
          navigate('/register');
        }}
      >
        Go Premium <ArrowRight size={14} />
      </motion.button>

      <style dangerouslySetInnerHTML={{ __html: `
        .demo-banner {
          animation: atmosphericPulse 4s ease-in-out infinite;
        }
        @keyframes atmosphericPulse {
          0%, 100% { border-color: rgba(124, 109, 250, 0.3); }
          50% { border-color: rgba(0, 242, 254, 0.4); }
        }
      `}} />
    </motion.div>
  );
};

export default DemoBanner;
