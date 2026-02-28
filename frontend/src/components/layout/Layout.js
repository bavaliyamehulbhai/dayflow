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
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

      {/* ─── Desktop + Tablet Sidebar ──────────────────────────────────────── */}
      {!isMobile && (
        <aside className={`sidebar ${isTablet ? 'sidebar-icon' : ''}`}>
          <div className="sidebar-logo">
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

      {/* ─── Mobile Top Header ─────────────────────────────────────────────── */}
      {isMobile && (
        <header className="mobile-header glass">
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
      <main className="main-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="page-content"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

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
                    animate={{ scale: isActive ? 1.12 : 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  >
                    {isActive && <div className="bottom-tab-glow" />}
                    <Item.icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                  </motion.div>
                  <span className="bottom-tab-label">{Item.label}</span>
                </NavLink>
              );
            })}

            {/* Quick logout: swipe-friendly long-press area not needed, just a thin profile link */}
          </nav>
        )
      }
    </div >
  );
}
