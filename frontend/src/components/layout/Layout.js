import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
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
  ShieldOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CommandPalette from './CommandPalette';
import ShortcutsHelp from './ShortcutsHelp';
import ShortcutOverlay from './ShortcutOverlay';
import { useSecurity } from '../../context/SecurityGuard';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/tasks', icon: CheckCircle2, label: 'Tasks' },
  { to: '/schedule', icon: Calendar, label: 'Schedule' },
  { to: '/habits', icon: RefreshCw, label: 'Habits' },
  { to: '/pomodoro', icon: Timer, label: 'Focus' },
  { to: '/notes', icon: FileText, label: 'Notes' },
];

// Bottom 6 tabs for mobile
const mobileTabItems = [
  { to: '/', icon: LayoutDashboard, label: 'Home', exact: true },
  { to: '/tasks', icon: CheckCircle2, label: 'Tasks' },
  { to: '/schedule', icon: Calendar, label: 'Schedule' },
  { to: '/habits', icon: RefreshCw, label: 'Habits' },
  { to: '/pomodoro', icon: Timer, label: 'Focus' },
  { to: '/notes', icon: FileText, label: 'Notes' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { isSecureMode, toggleSecureMode } = useSecurity();
  const navigate = useNavigate();
  const location = useLocation();

  // Detect device type via window width
  const [isTablet, setIsTablet] = useState(window.innerWidth <= 1024 && window.innerWidth > 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      setIsMobile(w <= 768);
      setIsTablet(w <= 1024 && w > 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('See you soon! 👋');
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="app-layout">
      {/* ─── Global Aura Orbs ────────────────────────────────────────────── */}
      <div className="aura-orb" style={{ top: '10%', left: '15%', width: 400, height: 400, background: 'var(--aura-color)' }} />
      <div className="aura-orb" style={{ bottom: '15%', right: '10%', width: 500, height: 500, background: 'var(--aura-color-2)', animationDelay: '-5s' }} />
      <div className="aura-orb" style={{ top: '50%', left: '50%', width: 300, height: 300, background: 'var(--aura-color-3)', animationDelay: '-10s', filter: 'blur(120px)' }} />

      {/* ─── Desktop + Tablet Sidebar ──────────────────────────────────────── */}
      {/* ─── Desktop + Tablet Sidebar ──────────────────────────────────────── */}
      {!isMobile && (
        <aside className={`sidebar ${isTablet ? 'sidebar-icon' : ''}`} style={{
          background: 'var(--surface)',
          backdropFilter: 'var(--glass-premium)',
          WebkitBackdropFilter: 'var(--glass-premium)',
          borderRight: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg)',
          transformStyle: 'preserve-3d'
        }}>
          <div className="sidebar-logo" style={{
            padding: '32px 24px',
            fontSize: isTablet ? '24px' : '28px',
            textAlign: isTablet ? 'center' : 'left',
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            background: 'var(--grad-premium)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.06em',
            textShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }}>
            {isTablet ? '⚡' : 'DayFlow'}
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

            <div className="nav-section" style={{ marginTop: 12 }}>
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
                style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                onClick={toggleSecureMode}
                title={isSecureMode ? 'Disable Secure Mode' : 'Enable Secure Mode'}
              >
                {isSecureMode ? <ShieldOff size={18} className="nav-icon" style={{ color: 'var(--accent)' }} /> : <Shield size={18} className="nav-icon" />}
                {!isTablet && <span className="nav-label" style={{ color: isSecureMode ? 'var(--accent)' : 'inherit' }}>{isSecureMode ? 'Public Mode' : 'Private Mode'}</span>}
              </button>
              <button
                className="nav-link logout-btn"
                style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
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
              style={{ justifyContent: isTablet ? 'center' : 'flex-start' }}
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
          <header className="mobile-header glass" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
            <div className="mobile-header-logo">DayFlow</div>
            <button
              className="mobile-header-avatar"
              onClick={() => navigate('/profile')}
            >
              {initials}
            </button>
          </header>
        )}

        {/* ─── Main Content ──────────────────────────────────────────────────── */}
        <main className="main-content" style={{ 
          marginLeft: 0,
          background: 'var(--grad-mesh)',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20, scale: 0.98, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -20, scale: 1.02, filter: 'blur(10px)' }}
              transition={{
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1]
              }}
              style={{ perspective: 1000 }}
              className="page-content"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ─── Mobile Bottom Tab Bar ─────────────────────────────────────────── */}
      {
        isMobile && (
          <nav className="bottom-tab-bar">
            {mobileTabItems.map(Item => {
              const isActive = Item.exact
                ? location.pathname === Item.to
                : location.pathname.startsWith(Item.to);
              return (
                <NavLink
                  key={Item.to}
                  to={Item.to}
                  end={Item.exact}
                  className={`bottom-tab ${isActive ? 'active' : ''}`}
                >
                  <motion.div
                    className="bottom-tab-icon"
                    whileTap={{ scale: 0.9 }}
                    animate={{
                      scale: isActive ? 1.1 : 1,
                      y: isActive ? -2 : 0
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    {isActive && <div className="bottom-tab-glow" />}
                    <Item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  </motion.div>
                  <span className="bottom-tab-label">{Item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        )
      }
      <CommandPalette />
      <ShortcutsHelp />
      <ShortcutOverlay />

      {/* Mobile Privacy Curtain */}
      <div 
        className={`privacy-curtain ${isSecureMode ? 'active' : ''}`}
        onClick={toggleSecureMode}
      >
        <div style={{ textAlign: 'center', pointerEvents: 'none' }}>
            <ShieldOff size={64} color="var(--accent)" style={{ marginBottom: 20, opacity: 0.5 }} />
            <h2 style={{ color: 'white', fontFamily: 'Syne', fontWeight: 800 }}>Shield Active</h2>
            <p style={{ color: 'var(--muted)', fontSize: 13, fontWeight: 600 }}>Tap anywhere to reveal</p>
        </div>
        <div className="curtain-handle" />
      </div>
    </div >
  );
}
