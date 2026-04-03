import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, EyeOff, ShieldAlert, Zap } from 'lucide-react';
import { useNotifications } from './NotificationContext';

const SecurityContext = createContext();

export const useSecurity = () => useContext(SecurityContext);

export const SecurityProvider = ({ children }) => {
  const { user, logout } = useAuth();
  const { addToast } = useNotifications();
  const [isLocked, setIsLocked] = useState(false);
  const [isSecureMode, setIsSecureMode] = useState(false);
  const timerRef = useRef(null);

  // Inactivity Timeout (10 minutes)
  const TIMEOUT_MS = 10 * 60 * 1000;

  const lockSession = useCallback(() => {
    if (user && !isLocked) {
      setIsLocked(true);
      addToast('Session locked due to inactivity', 'info', 3000, '🔒');
    }
  }, [user, isLocked, addToast]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!isLocked && user) {
      timerRef.current = setTimeout(lockSession, TIMEOUT_MS);
    }
  }, [lockSession, user, isLocked, TIMEOUT_MS]);

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const handleActivity = () => resetTimer();

    if (user && !isLocked) {
      events.forEach(e => window.addEventListener(e, handleActivity));
      resetTimer();
    }

    return () => {
      events.forEach(e => window.removeEventListener(e, handleActivity));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [user, isLocked, resetTimer]);

  const unlock = () => {
    setIsLocked(false);
    resetTimer();
  };

  const toggleSecureMode = () => {
      setIsSecureMode(v => !v);
      addToast(isSecureMode ? 'Environment Secured' : 'Privacy Mode Active', 'info', 3000, isSecureMode ? '🛡️' : '🕶️');
  };

  // Visibility Guard: Auto-blur when tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && user) {
        // We don't necessarily want to LOCK the session (logout/confirm) 
        // every time they switch tabs, but we definitely want to BLUR it.
        setIsSecureMode(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  return (
    <SecurityContext.Provider value={{ isLocked, isSecureMode, toggleSecureMode, unlock }}>
      <div className={isSecureMode ? 'secure-blur-active' : ''}>
        {children}
      </div>

      {/* Lock Screen Overlay */}
      <AnimatePresence>
        {isLocked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 10000,
              background: 'rgba(3, 3, 5, 0.8)',
              backdropFilter: 'blur(40px) saturate(200%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="card"
              style={{
                maxWidth: 400,
                width: '100%',
                textAlign: 'center',
                padding: '40px 30px',
                border: '1px solid var(--border-focus)',
                boxShadow: '0 0 50px rgba(124, 109, 250, 0.2)'
              }}
            >
              <div style={{
                width: 64, height: 64, borderRadius: 20,
                background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 24px',
                boxShadow: '0 10px 20px rgba(124, 109, 250, 0.3)'
              }}>
                <Lock size={32} color="white" />
              </div>
              
              <h2 style={{ fontFamily: 'Syne', fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Session Guarded</h2>
              <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 32, fontWeight: 500 }}>
                Your environment has been locked for your protection.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button
                  className="btn btn-primary"
                  onClick={unlock}
                  style={{ width: '100%', height: 52, fontSize: 16, fontWeight: 700, borderRadius: 14 }}
                >
                  Confirm Identity
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={logout}
                  style={{ width: '100%', height: 50, fontSize: 14, fontWeight: 600, color: 'var(--red)' }}
                >
                  End Session
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .secure-blur-active .sensitive-content {
            filter: blur(8px);
            transition: filter 0.3s ease;
            user-select: none;
            pointer-events: none;
        }

        .secure-blur-active .sensitive-content:hover {
            filter: blur(0px);
            pointer-events: auto;
        }
      `}</style>
    </SecurityContext.Provider>
  );
};

// Security components are exported from their respective files.
