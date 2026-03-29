import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, Command, Zap, Search, Bell, Ghost } from 'lucide-react';

const ShortcutLine = ({ keys, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{label}</span>
    <div style={{ display: 'flex', gap: 6 }}>
      {keys.map(k => (
        <kbd key={k} style={{
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 6,
          padding: '4px 8px',
          fontSize: 11,
          fontWeight: 800,
          color: 'var(--accent)',
          fontFamily: 'monospace',
          boxShadow: '0 4px 0 rgba(0,0,0,0.2)'
        }}>{k}</kbd>
      ))}
    </div>
  </div>
);

export default function ShortcutOverlay() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Control' || e.key === 'Meta') {
        setIsVisible(true);
      }
    };
    const handleKeyUp = (e) => {
      if (e.key === 'Control' || e.key === 'Meta') {
        setIsVisible(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(5, 5, 10, 0.6)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none'
          }}
        >
          <motion.div
            initial={{ scale: 0.9, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 30 }}
            className="card"
            style={{
              width: 500,
              padding: '40px',
              background: 'rgba(13, 13, 22, 0.8)',
              border: '1px solid var(--accent)',
              boxShadow: '0 0 100px rgba(130, 114, 255, 0.2)',
              borderRadius: 32,
              textAlign: 'center'
            }}
          >
            <div style={{ 
                width: 56, height: 56, borderRadius: 16, 
                background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 24px',
                boxShadow: '0 10px 30px rgba(124, 109, 250, 0.4)'
            }}>
                <Keyboard size={28} color="white" />
            </div>

            <h2 style={{ fontFamily: 'Syne', fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Spatial Shortcuts</h2>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 32, fontWeight: 600 }}>Master the DayFlow ecosystem with precision</p>

            <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <ShortcutLine label="Launch Command Palette" keys={['Ctrl', 'K']} />
              <ShortcutLine label="Toggle Side Navigation" keys={['Ctrl', '\\']} />
              <ShortcutLine label="Create New Essence (Task/Note)" keys={['Ctrl', 'N']} />
              <ShortcutLine label="Inhabitants Secure Mode" keys={['Ctrl', 'S']} />
              <ShortcutLine label="Ascend to Focus Portal" keys={['Ctrl', 'P']} />
              <ShortcutLine label="Quick Exit (Logout)" keys={['Ctrl', 'Q']} />
            </div>

            <div style={{ marginTop: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: 0.5 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2 }}>Neural Link Active</span>
            </div>
          </motion.div>

          <style>{`
            @keyframes pulse {
                0% { opacity: 0.3; transform: scale(1); }
                50% { opacity: 1; transform: scale(1.2); }
                100% { opacity: 0.3; transform: scale(1); }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
