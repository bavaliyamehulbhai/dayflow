import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Smartphone,
  Download,
  Check,
  Share,
  PlusSquare,
  Bell,
  Zap,
  Monitor,
  Sparkles,
  X,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import usePWAInstall from '../../hooks/usePWAInstall';
import { useNotifications } from '../../context/NotificationContext';

export default function AppInstallCard({ isMobile }) {
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const { addToast } = useNotifications();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('ios'); // 'ios' | 'manual'
  const [installing, setInstalling] = useState(false);

  const handleInstallClick = async () => {
    setInstalling(true);
    try {
      const result = await promptInstall();
      if (result.outcome === 'accepted') {
        addToast('Welcome to DayFlow App! 🚀', 'success');
      } else if (result.outcome === 'ios_instructions') {
        setModalMode('ios');
        setModalOpen(true);
      } else if (result.outcome === 'manual_instructions') {
        setModalMode('manual');
        setModalOpen(true);
      } else if (result.outcome === 'already_installed') {
        addToast('DayFlow is already installed on this device! 📱', 'info');
      }
    } catch (e) {
      console.warn('Install error:', e);
    } finally {
      setInstalling(false);
    }
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      addToast('Notifications are not supported in this browser.', 'error');
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        addToast('Notifications enabled for DayFlow! 🔔', 'success');
      } else if (perm === 'denied') {
        addToast('Notification permission was blocked in browser settings.', 'warning');
      } else {
        addToast('Notification permission not granted.', 'info');
      }
    } catch (err) {
      addToast('Failed to request notification permission.', 'error');
    }
  };

  return (
    <>
      <div
        className="premium-card aura-iridescent"
        style={{
          padding: isMobile ? 20 : 28,
          borderRadius: 20,
          border: '1px solid rgba(124, 109, 250, 0.2)',
          background: 'linear-gradient(145deg, rgba(124, 109, 250, 0.08) 0%, rgba(20, 20, 24, 0.95) 100%)',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 12px 36px rgba(0,0,0,0.4)',
        }}
      >
        {/* Glow orb */}
        <div
          style={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 140,
            height: 140,
            borderRadius: '50%',
            background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)',
            opacity: 0.15,
            filter: 'blur(30px)',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: 'linear-gradient(135deg, #7c6dfa 0%, #0a84ff 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(124, 109, 250, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                flexShrink: 0,
              }}
            >
              <Smartphone size={24} color="#fff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3
                  style={{
                    fontSize: isMobile ? 16 : 18,
                    fontWeight: 800,
                    color: '#fff',
                    margin: 0,
                    letterSpacing: '-0.02em',
                  }}
                >
                  DayFlow Mobile & PWA App
                </h3>
              </div>
              <p
                style={{
                  fontSize: 12,
                  color: 'var(--muted)',
                  margin: '4px 0 0',
                  fontWeight: 500,
                }}
              >
                Standalone performance with zero browser address bar clutter
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div>
            {isInstalled ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 10,
                  background: 'rgba(34, 197, 94, 0.15)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  color: 'var(--green)',
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                <Check size={14} strokeWidth={3} />
                <span>Running as App</span>
              </span>
            ) : isInstallable ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 10,
                  background: 'rgba(124, 109, 250, 0.2)',
                  border: '1px solid rgba(124, 109, 250, 0.4)',
                  color: 'var(--accent)',
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  boxShadow: '0 0 12px rgba(124, 109, 250, 0.2)',
                }}
              >
                <Sparkles size={13} />
                <span>Ready to Install</span>
              </span>
            ) : isIOS ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 10,
                  background: 'rgba(10, 132, 255, 0.15)',
                  border: '1px solid rgba(10, 132, 255, 0.3)',
                  color: '#60a5fa',
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                <Smartphone size={13} />
                <span>iOS Safari Ready</span>
              </span>
            ) : (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 10,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'var(--muted)',
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                <Monitor size={13} />
                <span>PWA Enabled</span>
              </span>
            )}
          </div>
        </div>

        {/* Highlights grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: 12,
            marginBottom: 20,
          }}
        >
          {[
            {
              icon: Zap,
              color: 'var(--green)',
              title: '1-Tap Launch',
              desc: 'Home screen shortcut opens directly in full immersion.',
            },
            {
              icon: ShieldCheck,
              color: 'var(--accent)',
              title: 'Offline Sync',
              desc: 'Service worker caches your day flow for high responsiveness.',
            },
            {
              icon: Bell,
              color: 'var(--accent2)',
              title: 'Mobile Signals',
              desc: 'Stay on track with schedule and timer notifications.',
            },
          ].map((feat, i) => (
            <div
              key={i}
              style={{
                padding: '12px 14px',
                borderRadius: 12,
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <feat.icon size={14} style={{ color: feat.color }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{feat.title}</span>
              </div>
              <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0, lineHeight: 1.4 }}>
                {feat.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Action Row */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          {isInstalled ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 24px',
                borderRadius: 12,
                background: 'rgba(34, 197, 94, 0.15)',
                color: 'var(--green)',
                fontWeight: 700,
                fontSize: 13,
                border: '1px solid rgba(34, 197, 94, 0.3)',
              }}
            >
              <Check size={16} strokeWidth={3} />
              <span>DayFlow is running in standalone app mode</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleInstallClick}
              disabled={installing}
              className="haptic-tap hover-lift"
              style={{
                background: 'linear-gradient(135deg, #7c6dfa 0%, #0a84ff 100%)',
                color: '#fff',
                border: 'none',
                padding: isMobile ? '12px 20px' : '12px 28px',
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(124, 109, 250, 0.4)',
                letterSpacing: '0.02em',
                width: isMobile ? '100%' : 'auto',
                justifyContent: 'center',
              }}
            >
              <Download size={16} strokeWidth={2.5} />
              <span>{installing ? 'Preparing...' : 'Install DayFlow App'}</span>
            </button>
          )}

          {/* Test Notification Button */}
          <button
            type="button"
            onClick={requestNotificationPermission}
            className="haptic-tap"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#fff',
              padding: '12px 18px',
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              width: isMobile ? '100%' : 'auto',
              justifyContent: 'center',
            }}
          >
            <Bell size={15} style={{ color: 'var(--accent)' }} />
            <span>Enable App Notifications</span>
          </button>
        </div>
      </div>

      {/* Guide Modal for iOS / Desktop Manual Instructions */}
      <AnimatePresence>
        {modalOpen && (
          <div
            className="modal-overlay"
            style={{ zIndex: 99999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="premium-card"
              style={{
                maxWidth: 480,
                width: '90%',
                padding: 28,
                borderRadius: 24,
                border: '1px solid rgba(255,255,255,0.1)',
                background: '#141418',
                boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Smartphone size={20} className="text-accent" />
                  <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#fff' }}>
                    {modalMode === 'ios' ? 'Install on iOS Safari' : 'Install on Your Device'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 4 }}
                >
                  <X size={20} />
                </button>
              </div>

              {modalMode === 'ios' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>
                    Apple iOS requires adding web applications to your home screen directly through Safari:
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '12px 14px', borderRadius: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(124,109,250,0.2)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, flexShrink: 0 }}>
                        1
                      </div>
                      <div style={{ fontSize: 13, color: '#fff' }}>
                        Tap the <strong>Share</strong> button <Share size={14} style={{ display: 'inline', verticalAlign: 'middle', margin: '0 2px' }} /> in the bottom bar of Safari.
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '12px 14px', borderRadius: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(124,109,250,0.2)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, flexShrink: 0 }}>
                        2
                      </div>
                      <div style={{ fontSize: 13, color: '#fff' }}>
                        Scroll down and tap <strong>Add to Home Screen</strong> <PlusSquare size={14} style={{ display: 'inline', verticalAlign: 'middle', margin: '0 2px' }} />.
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '12px 14px', borderRadius: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(124,109,250,0.2)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, flexShrink: 0 }}>
                        3
                      </div>
                      <div style={{ fontSize: 13, color: '#fff' }}>
                        Tap <strong>Add</strong> in the top-right corner. DayFlow is now installed!
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>
                    You can install DayFlow directly from your browser menu:
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 14px', borderRadius: 12, fontSize: 13, color: '#fff' }}>
                      💻 <strong>Desktop (Chrome/Edge):</strong> Look for the <strong>Install DayFlow</strong> icon (⊕) in the browser URL bar on the right side, or click the browser 3 dots menu &gt; <em>"Install DayFlow..."</em>.
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 14px', borderRadius: 12, fontSize: 13, color: '#fff' }}>
                      📱 <strong>Android (Chrome):</strong> Tap the 3-dot menu at top right &gt; select <em>"Add to Home screen"</em> or <em>"Install App"</em>.
                    </div>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="auth-button"
                style={{ width: '100%', height: 46, borderRadius: 12, marginTop: 24, fontSize: 14, fontWeight: 800 }}
              >
                Got It
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

