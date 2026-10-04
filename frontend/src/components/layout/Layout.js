import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  LayoutDashboard,
  CheckCircle2,
  Calendar,
  RefreshCw,
  Timer,
  FileText,
  Settings,
  LogOut,
  User,
  Shield,
  ShieldOff,
  Bell,
  Plus,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import CommandPalette from './CommandPalette';
import ShortcutsHelp from './ShortcutsHelp';
import ShortcutOverlay from './ShortcutOverlay';
import DemoBanner from './DemoBanner';
import { useSecurity } from '../../context/SecurityGuard';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/tasks', icon: CheckCircle2, label: 'Tasks' },
  { to: '/schedule', icon: Calendar, label: 'Schedule' },
  { to: '/habits', icon: RefreshCw, label: 'Habits' },
  { to: '/pomodoro', icon: Timer, label: 'Focus' },
  { to: '/notes', icon: FileText, label: 'Notes' },
];

// Bottom Premium tabs for mobile - Pro-Minimalist (Icon Only)
const mobileTabItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home', exact: true },
  { to: '/tasks', icon: CheckCircle2, label: 'Tasks' },
  { id: 'manifest', action: 'command', icon: Plus, label: 'Manifest' },
  { to: '/habits', icon: RefreshCw, label: 'Habits' },
  { to: '/notes', icon: FileText, label: 'Notes' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { addToast } = useNotifications();
  const { isSecureMode, toggleSecureMode } = useSecurity();
  const navigate = useNavigate();
  const location = useLocation();

  const [isTablet, setIsTablet] = useState(window.innerWidth <= 1024 && window.innerWidth > 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    let timeoutId = null;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const w = window.innerWidth;
        const mobile = w <= 768;
        const tablet = w <= 1024 && w > 768;
        setIsMobile(mobile);
        setIsTablet(tablet);
        
        // Dynamic Token Support
        const root = document.documentElement;
        if (mobile) root.style.setProperty('--sidebar-w', '0px');
        else if (tablet) root.style.setProperty('--sidebar-w', '68px');
        else root.style.setProperty('--sidebar-w', '260px');
      }, 150);
    };
    handleResize(); // Initial call
    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  const handleLogout = () => {
    logout();
    addToast('See you soon! 👋', 'info');
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const triggerCommandPalette = () => {
    // Dispatch shortcut for Command Palette
    window.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      bubbles: true
    }));
  };

  return (
    <div className="app-layout">
      {/* ─── Precision Background Grid ───────────────────────────────────────── */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 10%, black 40%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 10%, black 40%, transparent 100%)'
        }}
      />

      {/* ─── Desktop + Tablet Sidebar ──────────────────────────────────────── */}
      {!isMobile && (
        <aside className={`sidebar ${isTablet ? 'sidebar-icon' : ''}`}>
          <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: isTablet ? '16px 0' : '20px 16px', justifyContent: isTablet ? 'center' : 'flex-start' }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              background: 'linear-gradient(135deg, #7c6dfa 0%, #0a84ff 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(124, 109, 250, 0.35)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              flexShrink: 0
            }}>
              <Zap size={18} color="white" fill="white" />
            </div>
            {!isTablet && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.03em', color: '#ffffff' }}>
                  DayFlow
                </span>
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '1px 5px',
                  borderRadius: 5,
                  background: 'rgba(124, 109, 250, 0.15)',
                  color: '#a78bfa',
                  border: '1px solid rgba(124, 109, 250, 0.25)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  v2.0
                </span>
              </div>
            )}
          </div>

          <nav className="sidebar-nav">
            <div className="nav-section">
              {!isTablet && <span className="nav-section-label">Main Menu</span>}
              {navItems.map(Item => (
                <NavLink
                  key={Item.to}
                  to={Item.to}
                  end={Item.exact}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  title={Item.label}
                >
                  <Item.icon size={18} className="nav-icon" />
                  {!isTablet && <span className="nav-label">{Item.label}</span>}
                </NavLink>
              ))}
            </div>

            <div className="nav-section mt-4">
              {!isTablet && <span className="nav-section-label">Preferences</span>}
              <NavLink
                to="/profile"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                title="Settings"
              >
                <Settings size={18} className="nav-icon" />
                {!isTablet && <span className="nav-label">Settings</span>}
              </NavLink>
              <button
                className={`nav-link ${isSecureMode ? 'secure-active' : ''}`}
                onClick={toggleSecureMode}
                title={isSecureMode ? 'Disable Secure Mode' : 'Enable Secure Mode'}
              >
                {isSecureMode ? <ShieldOff size={18} className="nav-icon" style={{ color: 'var(--accent)' }} /> : <Shield size={18} className="nav-icon" />}
                {!isTablet && <span className="nav-label" style={{ color: isSecureMode ? 'var(--accent)' : 'inherit' }}>{isSecureMode ? 'Public Mode' : 'Private Mode'}</span>}
              </button>
              <button
                className="nav-link logout-btn"
                onClick={handleLogout}
                title="Log Out"
              >
                <LogOut size={18} className="nav-icon" />
                {!isTablet && <span className="nav-label">Log Out</span>}
              </button>
            </div>
          </nav>

          <div className="sidebar-user">
            <div
              className="user-card"
              onClick={() => navigate('/profile')}
              title={user?.name}
            >
              <div className="user-avatar">{initials}</div>
              {!isTablet && (
                <div className="user-info">
                  <div className="user-name">{user?.name || 'User'}</div>
                  <div className="user-role">{user?.email}</div>
                </div>
              )}
            </div>
          </div>
        </aside>
      )}

      {/* ─── Main Content Area ─────────────────────────────────────────────── */}
      <div className="main-wrapper">
        {/* ─── Mobile Top Header ─────────────────────────────────────────────── */}
        {isMobile && (
          <header className="mobile-header-luxe" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            width: '100%',
            display: 'flex',
            flexDirection: 'column', // Allow children to stack
            background: 'rgba(3, 3, 5, 0.9)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            paddingTop: 'env(safe-area-inset-top, 0px)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 20px',
              minHeight: '64px',
              width: '100%'
            }}>
              <div style={{ 
                fontFamily: 'Syne, sans-serif', 
                fontWeight: 800, 
                fontSize: '20px', 
                letterSpacing: '-0.04em',
                textTransform: 'uppercase',
                background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.6) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 10px rgba(124, 109, 250, 0.2))'
              }}>
                {location.pathname === '/' ? 'DAYFLOW' : 
                 location.pathname.split('/')[1].replace('-', ' ')}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div 
                  className="haptic-tap"
                  onClick={() => navigate('/notifications')}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--muted)'
                  }}
                >
                  <Bell size={20} />
                </div>
                <button
                  className="haptic-tap"
                  onClick={() => navigate('/profile')}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '12px',
                    background: 'var(--grad-premium)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '13px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 8px 20px rgba(124, 109, 250, 0.3)',
                    color: 'white'
                  }}
                >
                  {initials}
                </button>
              </div>
            </div>
          </header>
        )}

        {/* ─── Main Content ──────────────────────────────────────────────────── */}
        <main className="main-content" style={{
          paddingBottom: isMobile ? '160px' : '20px',
          paddingTop: isMobile ? 'calc(64px + env(safe-area-inset-top, 0px))' : 0
        }}>
          {user?.isDemo && <DemoBanner />}
          <div className="page-content">
            {children}
          </div>
        </main>
      </div>

      {/* ─── Mobile Bottom Tab Bar (Elite Holographic Orb) ───────────────── */}
      {
        isMobile && (
          <div className="elite-nav-container">
            {/* SVG Gooey Filter Removed for Performance */}

            <nav className="bottom-tab-bar premium-glass-bottom elite-dock">
              {mobileTabItems.map((item, index) => {
                const isAction = !!item.action;
                const isActive = !isAction && (item.exact
                  ? location.pathname === item.to
                  : location.pathname.startsWith(item.to));
                
                if (isAction) {
                  return (
                    <button 
                      key={item.id} 
                      className="bottom-tab action-orb-wrapper haptic-tap"
                      onClick={() => {
                        // If on tasks page, trigger create modal intent
                        if (location.pathname === '/tasks') {
                          window.dispatchEvent(new CustomEvent('df_open_create_modal'));
                        } else {
                          triggerCommandPalette();
                        }
                      }}
                    >
                      <div className="holographic-orb-container">
                        <div className="orb-event-horizon" />
                        <div className="holographic-orb">
                          <Plus size={32} strokeWidth={3} color="white" />
                        </div>
                      </div>
                    </button>
                  );
                }

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.exact}
                    className={({ isActive }) => `bottom-tab ${isActive ? 'active' : ''} haptic-tap`}
                  >
                    <div className="bottom-tab-icon">
                      {isActive && <motion.div layoutId="active-nav-glow" className="bottom-tab-glow" />}
                      <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        )
      }

      <CommandPalette />
      <ShortcutsHelp />
      <ShortcutOverlay />

      {/* Mobile Privacy Curtain */}
      <style>{`
        @media (max-width: 768px) {
          .bottom-tab-bar {
            z-index: 1000 !important;
          }
        }
        .privacy-curtain {
          z-index: 10002 !important;
        }
        .command-palette-overlay {
          z-index: 10001 !important;
        }
      `}</style>
    </div>
  );
}
