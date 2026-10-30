import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  CheckCircle2, 
  Calendar, 
  Timer, 
  ArrowRight, 
  Activity, 
  Cpu, 
  Sparkles, 
  ShieldCheck, 
  TrendingUp, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  Flame, 
  Check, 
  BarChart3, 
  Clock, 
  ExternalLink,
  Laptop,
  CheckCheck,
  Menu,
  X,
  Loader2,
  LayoutDashboard,
  Target,
  Smartphone,
  Lock,
  ListTodo
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export default function LandingPage() {
  const { user, login } = useAuth();
  const { addToast } = useNotifications();
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleInstantDemo = async () => {
    if (user) {
      navigate('/dashboard');
      return;
    }
    setIsDemoLoading(true);
    try {
      await login('demo@dayflow.app', 'Demo123!');
      addToast('Welcome to DayFlow Demo Workspace! 🚀', 'success');
      navigate('/dashboard');
    } catch {
      addToast('Redirecting to login...', 'info');
      navigate('/login');
    } finally {
      setIsDemoLoading(false);
    }
  };

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const faqs = [
    {
      q: "What makes DayFlow different from separate to-do & habit apps?",
      a: "Most productivity workflows fail because of fragmentation — keeping tasks in one app, habits in another, Pomodoro timer in a third tab, and calendar elsewhere. DayFlow fuses them into one unified, ultra-fast cockpit with zero context-switching."
    },
    {
      q: "Is DayFlow free to use?",
      a: "Yes. DayFlow has a robust Free Forever tier including full task organization, habit heatmaps, focus timers, daily scheduling, and offline PWA support."
    },
    {
      q: "Can I install DayFlow on mobile (iOS / Android) and desktop?",
      a: "Yes. DayFlow is engineered as a progressive web app (PWA). You can install it directly from your browser on iPhone, Android, Mac, or Windows with 1 tap for native full-screen performance."
    },
    {
      q: "How does DayFlow ensure privacy and data security?",
      a: "Your account is secured with JWT tokens, Argon2-grade password hashing, anti-tampering sanitization, and strict data isolation. We do not sell telemetry or train public models on your personal workflow."
    }
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#09090b', 
      color: '#f4f4f5', 
      overflowX: 'hidden',
      position: 'relative',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      {/* Precision Micro Grid Background */}
      <div style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        backgroundImage: `
          linear-gradient(to right, rgba(255, 255, 255, 0.025) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255, 255, 255, 0.025) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        maskImage: 'radial-gradient(ellipse 70% 50% at 50% 0%, black 40%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 70% 50% at 50% 0%, black 40%, transparent 100%)'
      }} />

      {/* Subtle Top Ambient Lighting (Non-intrusive, zero lag) */}
      <div style={{
        position: 'absolute',
        top: -120,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 720,
        height: 280,
        background: 'radial-gradient(circle, rgba(124, 109, 250, 0.14) 0%, rgba(14, 165, 233, 0.04) 50%, transparent 80%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Navigation Bar */}
      <nav style={{ 
        position: 'sticky', 
        top: 0, 
        left: 0, 
        right: 0, 
        zIndex: 100,
        padding: '12px 24px',
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: 'rgba(9, 9, 11, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.07)'
      }}>
        {/* Brand */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ 
            width: 32, 
            height: 32, 
            borderRadius: 8, 
            background: 'linear-gradient(135deg, #7c6dfa 0%, #4f46e5 100%)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(124, 109, 250, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <Zap size={17} color="white" fill="white" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
              DayFlow
            </span>
            <span style={{ 
              fontSize: 10, 
              fontWeight: 700, 
              padding: '2px 6px', 
              borderRadius: 4, 
              background: 'rgba(124, 109, 250, 0.12)', 
              color: '#a78bfa',
              border: '1px solid rgba(124, 109, 250, 0.2)',
              letterSpacing: '0.04em'
            }}>
              OS
            </span>
          </div>
        </Link>

        {/* Center Navigation Links (Desktop) */}
        <div className="landing-desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <button 
            onClick={() => scrollToSection('features')} 
            style={{ background: 'none', border: 'none', color: '#a1a1aa', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'color 0.15s' }}
            onMouseEnter={(e) => e.target.style.color = '#ffffff'}
            onMouseLeave={(e) => e.target.style.color = '#a1a1aa'}
          >
            Features
          </button>
          <button 
            onClick={() => scrollToSection('preview')} 
            style={{ background: 'none', border: 'none', color: '#a1a1aa', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'color 0.15s' }}
            onMouseEnter={(e) => e.target.style.color = '#ffffff'}
            onMouseLeave={(e) => e.target.style.color = '#a1a1aa'}
          >
            Command Center
          </button>
          <button 
            onClick={() => scrollToSection('comparison')} 
            style={{ background: 'none', border: 'none', color: '#a1a1aa', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'color 0.15s' }}
            onMouseEnter={(e) => e.target.style.color = '#ffffff'}
            onMouseLeave={(e) => e.target.style.color = '#a1a1aa'}
          >
            Why DayFlow
          </button>
          <button 
            onClick={() => scrollToSection('faq')} 
            style={{ background: 'none', border: 'none', color: '#a1a1aa', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'color 0.15s' }}
            onMouseEnter={(e) => e.target.style.color = '#ffffff'}
            onMouseLeave={(e) => e.target.style.color = '#a1a1aa'}
          >
            FAQ
          </button>
        </div>

        {/* Action Buttons (Desktop) */}
        <div className="landing-desktop-actions" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {user ? (
            <Link to="/dashboard" style={{ 
              padding: '7px 16px', 
              borderRadius: 8, 
              fontSize: 13, 
              fontWeight: 700, 
              color: '#ffffff', 
              textDecoration: 'none',
              background: 'linear-gradient(135deg, #7c6dfa 0%, #5850ec 100%)',
              boxShadow: '0 2px 10px rgba(124, 109, 250, 0.3)',
              border: '1px solid rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              <LayoutDashboard size={14} />
              <span>Dashboard</span>
              <ArrowRight size={13} />
            </Link>
          ) : (
            <>
              <button
                onClick={handleInstantDemo}
                disabled={isDemoLoading}
                style={{
                  padding: '7px 13px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#d4d4d8',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
              >
                {isDemoLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} color="#a78bfa" />}
                <span>Demo</span>
              </button>
              <Link to="/login" style={{ 
                padding: '7px 13px', 
                borderRadius: 8, 
                fontSize: 13, 
                fontWeight: 600, 
                color: '#a1a1aa', 
                textDecoration: 'none',
                transition: 'color 0.15s'
              }}
              onMouseEnter={(e) => e.target.style.color = '#ffffff'}
              onMouseLeave={(e) => e.target.style.color = '#a1a1aa'}
              >
                Sign In
              </Link>
              <Link to="/register" style={{ 
                padding: '7px 15px', 
                borderRadius: 8, 
                fontSize: 13, 
                fontWeight: 700, 
                color: '#ffffff', 
                textDecoration: 'none',
                background: 'linear-gradient(135deg, #7c6dfa 0%, #5850ec 100%)',
                boxShadow: '0 2px 10px rgba(124, 109, 250, 0.25)',
                border: '1px solid rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}>
                <span>Start Free</span>
                <ArrowRight size={13} />
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="landing-mobile-menu-btn"
          aria-label="Toggle menu"
          style={{
            display: 'none',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 7,
            padding: 6,
            color: '#ffffff',
            cursor: 'pointer'
          }}
        >
          {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        {/* Mobile Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: '#0d0d12',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                boxShadow: '0 20px 40px rgba(0,0,0,0.8)'
              }}
            >
              <button 
                onClick={() => { scrollToSection('features'); setMobileMenuOpen(false); }} 
                style={{ background: 'none', border: 'none', color: '#d4d4d8', fontSize: 14, fontWeight: 600, textAlign: 'left', padding: '6px 0', cursor: 'pointer' }}
              >
                Features
              </button>
              <button 
                onClick={() => { scrollToSection('preview'); setMobileMenuOpen(false); }} 
                style={{ background: 'none', border: 'none', color: '#d4d4d8', fontSize: 14, fontWeight: 600, textAlign: 'left', padding: '6px 0', cursor: 'pointer' }}
              >
                Command Center
              </button>
              <button 
                onClick={() => { scrollToSection('comparison'); setMobileMenuOpen(false); }} 
                style={{ background: 'none', border: 'none', color: '#d4d4d8', fontSize: 14, fontWeight: 600, textAlign: 'left', padding: '6px 0', cursor: 'pointer' }}
              >
                Why DayFlow
              </button>
              <button 
                onClick={() => { scrollToSection('faq'); setMobileMenuOpen(false); }} 
                style={{ background: 'none', border: 'none', color: '#d4d4d8', fontSize: 14, fontWeight: 600, textAlign: 'left', padding: '6px 0', cursor: 'pointer' }}
              >
                FAQ
              </button>

              <div style={{ height: 1, background: 'rgba(255, 255, 255, 0.08)', margin: '4px 0' }} />

              {user ? (
                <Link 
                  to="/dashboard" 
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ 
                    padding: '10px 16px', 
                    borderRadius: 8, 
                    fontSize: 13, 
                    fontWeight: 700, 
                    color: '#ffffff', 
                    textDecoration: 'none',
                    background: 'linear-gradient(135deg, #7c6dfa 0%, #5850ec 100%)',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  <LayoutDashboard size={15} />
                  <span>Go to Dashboard</span>
                </Link>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button
                    onClick={() => { handleInstantDemo(); setMobileMenuOpen(false); }}
                    disabled={isDemoLoading}
                    style={{
                      padding: '10px',
                      borderRadius: 8,
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#ffffff',
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6
                    }}
                  >
                    {isDemoLoading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={14} color="#a78bfa" />}
                    <span>Explore Instant Demo</span>
                  </button>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Link 
                      to="/login" 
                      onClick={() => setMobileMenuOpen(false)}
                      style={{ 
                        flex: 1,
                        padding: '9px', 
                        borderRadius: 8, 
                        fontSize: 13, 
                        fontWeight: 600, 
                        color: '#e4e4e7', 
                        textDecoration: 'none',
                        background: 'rgba(255, 255, 255, 0.03)', 
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        textAlign: 'center'
                      }}
                    >
                      Sign In
                    </Link>
                    <Link 
                      to="/register" 
                      onClick={() => setMobileMenuOpen(false)}
                      style={{ 
                        flex: 1,
                        padding: '9px', 
                        borderRadius: 8, 
                        fontSize: 13, 
                        fontWeight: 700, 
                        color: '#ffffff', 
                        textDecoration: 'none',
                        background: 'linear-gradient(135deg, #7c6dfa 0%, #5850ec 100%)',
                        textAlign: 'center'
                      }}
                    >
                      Start Free
                    </Link>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section (Compact & Impactful) */}
      <section style={{ 
        position: 'relative', 
        zIndex: 1, 
        paddingTop: 'clamp(48px, 8vh, 72px)', 
        paddingBottom: 'clamp(36px, 6vh, 48px)',
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        textAlign: 'center',
        paddingLeft: 20,
        paddingRight: 20,
        maxWidth: 960,
        margin: '0 auto'
      }}>
        {/* Subtle Live Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 8, 
            padding: '4px 12px', 
            borderRadius: 100, 
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: 20,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)'
          }}
        >
          <span style={{ 
            width: 6, 
            height: 6, 
            borderRadius: '50%', 
            background: '#10b981', 
            boxShadow: '0 0 6px #10b981' 
          }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#e4e4e7' }}>
            DayFlow 2.0 · Unified Cognitive OS
          </span>
          <ArrowRight size={12} color="#a1a1aa" />
        </motion.div>

        {/* Hero Headline */}
        <motion.h1 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          style={{ 
            fontSize: 'clamp(34px, 5.2vw, 62px)', 
            fontWeight: 800, 
            lineHeight: 1.1,
            letterSpacing: '-0.035em',
            marginBottom: 16,
            maxWidth: 840,
            color: '#ffffff'
          }}
        >
          Focus deeper.<br/>
          <span style={{
            background: 'linear-gradient(135deg, #ffffff 40%, #a1a1aa 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Execute with absolute precision.
          </span>
        </motion.h1>

        {/* Concise Subtitle */}
        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          style={{ 
            fontSize: 'clamp(15px, 1.8vw, 17px)', 
            color: '#a1a1aa', 
            maxWidth: 620, 
            margin: '0 auto 28px',
            lineHeight: 1.55, 
            fontWeight: 400 
          }}
        >
          A single high-precision cockpit combining high-leverage tasks, habit streak heatmaps, Pomodoro flow timers, and daily timeblocking.
        </motion.p>

        {/* Primary Action Row */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.22 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 22 }}
        >
          {user ? (
            <Link to="/dashboard" style={{ 
              padding: '11px 26px', 
              borderRadius: 10, 
              fontSize: 14, 
              fontWeight: 700, 
              color: '#ffffff', 
              textDecoration: 'none',
              background: 'linear-gradient(135deg, #7c6dfa 0%, #5850ec 100%)',
              boxShadow: '0 4px 16px rgba(124, 109, 250, 0.35)',
              border: '1px solid rgba(255,255,255,0.15)',
              display: 'flex', 
              alignItems: 'center', 
              gap: 8,
              transition: 'transform 0.15s ease'
            }}>
              <LayoutDashboard size={16} />
              <span>Open Your Workspace</span>
              <ArrowRight size={15} />
            </Link>
          ) : (
            <>
              <Link to="/register" style={{ 
                padding: '11px 24px', 
                borderRadius: 10, 
                fontSize: 14, 
                fontWeight: 700, 
                color: '#ffffff', 
                textDecoration: 'none',
                background: 'linear-gradient(135deg, #7c6dfa 0%, #5850ec 100%)',
                boxShadow: '0 4px 16px rgba(124, 109, 250, 0.35)',
                border: '1px solid rgba(255,255,255,0.15)',
                display: 'flex', 
                alignItems: 'center', 
                gap: 8,
                transition: 'transform 0.15s ease'
              }}>
                <span>Start Free Workspace</span>
                <ArrowRight size={15} />
              </Link>
              <button 
                onClick={handleInstantDemo}
                disabled={isDemoLoading}
                style={{ 
                  padding: '11px 20px', 
                  borderRadius: 10, 
                  fontSize: 14, 
                  fontWeight: 600, 
                  color: '#e4e4e7', 
                  cursor: 'pointer',
                  background: 'rgba(255, 255, 255, 0.035)',
                  border: '1px solid rgba(255, 255, 255, 0.09)',
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 7,
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.035)'}
              >
                {isDemoLoading ? (
                  <Loader2 size={15} className="animate-spin" color="#a78bfa" />
                ) : (
                  <Sparkles size={15} color="#a78bfa" />
                )}
                <span>{isDemoLoading ? 'Launching...' : '1-Click Instant Demo'}</span>
              </button>
            </>
          )}
        </motion.div>

        {/* Clean Trust Signals */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 18, 
            color: '#71717a', 
            fontSize: 12, 
            fontWeight: 500,
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Check size={13} color="#10b981" /> Free tier forever
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Check size={13} color="#10b981" /> No credit card required
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Check size={13} color="#10b981" /> Sub-50ms instant response
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Check size={13} color="#10b981" /> Offline PWA support
          </span>
        </motion.div>
      </section>

      {/* Interactive App Command Center (Compact & Ultra-Crisp) */}
      <section id="preview" style={{ 
        position: 'relative', 
        zIndex: 1, 
        maxWidth: 1040, 
        margin: '0 auto 64px',
        padding: '0 18px'
      }}>
        <div style={{
          background: '#0e0e13',
          borderRadius: 16,
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden'
        }}>
          {/* Mockup Window Titlebar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            background: 'rgba(255, 255, 255, 0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f56' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#27c93f' }} />
              <span style={{ marginLeft: 10, fontSize: 11, color: '#71717a', fontWeight: 600 }}>
                DayFlow OS — Today's Focus
              </span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '3px 8px',
              borderRadius: 5,
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              fontSize: 10,
              color: '#a1a1aa'
            }}>
              <span>⌘K Quick Jump</span>
            </div>
          </div>

          {/* Compact Tab Switcher */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            background: 'rgba(255, 255, 255, 0.01)',
            overflowX: 'auto'
          }}>
            {[
              { id: 'all', label: 'All-In-One' },
              { id: 'tasks', label: 'Tasks' },
              { id: 'habits', label: 'Habits' },
              { id: 'focus', label: 'Focus Timer' },
              { id: 'schedule', label: 'Schedule' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: activeTab === tab.id ? '1px solid rgba(124, 109, 250, 0.4)' : '1px solid transparent',
                  background: activeTab === tab.id ? 'rgba(124, 109, 250, 0.15)' : 'transparent',
                  color: activeTab === tab.id ? '#ffffff' : '#71717a',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Mockup Dashboard Content Grid */}
          <div style={{ padding: '18px 16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
            {/* Column 1: Daily Tasks */}
            {(activeTab === 'all' || activeTab === 'tasks') && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: 10,
              border: '1px solid rgba(255, 255, 255, 0.05)',
              padding: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 10
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={14} color="#7c6dfa" /> Daily Execution
                </span>
                <span style={{ fontSize: 10, fontWeight: 600, color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: 4 }}>
                  3 of 4 Completed
                </span>
              </div>

              {[
                { title: 'Finalize DayFlow production release', tag: 'Core', done: true, priority: 'High' },
                { title: '90-min Deep Focus session', tag: 'Deep Work', done: true, priority: 'High' },
                { title: 'Review streak heatmaps & consistency', tag: 'Ritual', done: true, priority: 'Normal' },
                { title: 'Plan tomorrow high-leverage agenda', tag: 'Planning', done: false, priority: 'Normal' },
              ].map((task, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: 6,
                  background: task.done ? 'rgba(255,255,255,0.015)' : 'rgba(255,255,255,0.035)',
                  border: '1px solid rgba(255, 255, 255, 0.04)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 14, height: 14, borderRadius: 4,
                      border: task.done ? 'none' : '1.5px solid rgba(255,255,255,0.2)',
                      background: task.done ? '#10b981' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {task.done && <Check size={10} color="white" strokeWidth={3} />}
                    </div>
                    <span style={{ 
                      fontSize: 12, 
                      fontWeight: 500, 
                      color: task.done ? '#71717a' : '#f4f4f5',
                      textDecoration: task.done ? 'line-through' : 'none'
                    }}>
                      {task.title}
                    </span>
                  </div>
                  <span style={{
                    fontSize: 9,
                    fontWeight: 600,
                    padding: '2px 5px',
                    borderRadius: 3,
                    background: task.priority === 'High' ? 'rgba(244, 63, 94, 0.12)' : 'rgba(124, 109, 250, 0.12)',
                    color: task.priority === 'High' ? '#fb7185' : '#a78bfa'
                  }}>
                    {task.tag}
                  </span>
                </div>
              ))}
            </div>
            )}

            {/* Column 2: Focus Timer */}
            {(activeTab === 'all' || activeTab === 'focus') && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: 10,
              border: '1px solid rgba(255, 255, 255, 0.05)',
              padding: 14,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 12
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Timer size={14} color="#f59e0b" /> Focus Session
                  </span>
                  <span style={{ 
                    fontSize: 10, 
                    fontWeight: 700, 
                    color: '#f59e0b', 
                    background: 'rgba(245, 158, 11, 0.12)', 
                    padding: '2px 6px', 
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#f59e0b' }} />
                    Active Interval
                  </span>
                </div>

                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                  <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
                    25:00
                  </div>
                  <div style={{ fontSize: 11, color: '#71717a', fontWeight: 500, marginTop: 2 }}>
                    Cycle 2 of 4 · Deep Work Block
                  </div>
                </div>

                <div style={{ width: '100%', height: 4, borderRadius: 6, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ width: '65%', height: '100%', background: 'linear-gradient(90deg, #f59e0b, #7c6dfa)', borderRadius: 6 }} />
                </div>
              </div>

              <div style={{ 
                padding: '8px 10px', 
                borderRadius: 6, 
                background: 'rgba(124, 109, 250, 0.08)', 
                border: '1px solid rgba(124, 109, 250, 0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <Flame size={15} color="#f59e0b" />
                <div style={{ fontSize: 11, color: '#e4e4e7', fontWeight: 500 }}>
                  <strong style={{ color: '#ffffff' }}>18 Day Streak</strong> · 4 Focus sessions logged
                </div>
              </div>
            </div>
            )}

            {/* Column 3: Habits & Consistency */}
            {(activeTab === 'all' || activeTab === 'habits' || activeTab === 'schedule') && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: 10,
              border: '1px solid rgba(255, 255, 255, 0.05)',
              padding: 14,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 12
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Activity size={14} color="#10b981" /> Ritual Consistency
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: 4 }}>
                    92% SCORE
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { name: 'Morning Coding Sprint', streak: '24d', active: true },
                    { name: 'Read 20 min Technical Paper', streak: '12d', active: true },
                    { name: 'Hydration & Posture Reset', streak: '30d', active: true }
                  ].map((h, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
                      <span style={{ color: '#d4d4d8', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981' }} />
                        {h.name}
                      </span>
                      <span style={{ color: '#f59e0b', fontWeight: 600 }}>🔥 {h.streak}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weekly Mini Pulse Heatmap */}
              <div>
                <div style={{ fontSize: 10, color: '#71717a', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Weekly Heatmap Pulse
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                    <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{
                        height: 18,
                        borderRadius: 3,
                        background: i < 5 ? '#10b981' : 'rgba(255,255,255,0.06)',
                        opacity: i === 4 ? 1 : i < 4 ? 0.75 : 0.3,
                        marginBottom: 3
                      }} />
                      <span style={{ fontSize: 9, color: '#71717a', fontWeight: 600 }}>{day}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            )}
          </div>
        </div>
      </section>

      {/* Metrics Strip (Compact 4-Card Row) */}
      <section style={{ 
        position: 'relative', 
        zIndex: 1, 
        maxWidth: 1040, 
        margin: '0 auto 72px', 
        padding: '0 18px' 
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: 12,
          background: 'rgba(255, 255, 255, 0.015)',
          padding: '16px 20px',
          borderRadius: 12,
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          {[
            { value: '< 45ms', label: 'Zero-Lag Response', sub: 'Instantaneous UI updates' },
            { value: '4-in-1', label: 'Consolidated Workflow', sub: 'Tasks, habits, focus, schedule' },
            { value: '100%', label: 'Focused Day Isolation', sub: 'No yesterday/tomorrow spillover' },
            { value: 'PWA', label: 'Native Mobile & Desktop', sub: 'Installable with zero friction' }
          ].map((stat, i) => (
            <div key={i} style={{ padding: '6px 8px' }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', marginBottom: 2 }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#e4e4e7' }}>
                {stat.label}
              </div>
              <div style={{ fontSize: 11, color: '#71717a' }}>
                {stat.sub}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4 Core Pillars (Clean, Balanced & Compact) */}
      <section id="features" style={{ 
        position: 'relative', 
        zIndex: 1, 
        maxWidth: 1040, 
        margin: '0 auto 80px', 
        padding: '0 18px' 
      }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ 
            fontSize: 11, 
            fontWeight: 700, 
            textTransform: 'uppercase', 
            letterSpacing: '0.08em', 
            color: '#a78bfa',
            marginBottom: 8
          }}>
            Engineered Capabilities
          </div>
          <h2 style={{ fontSize: 'clamp(24px, 3.2vw, 34px)', fontWeight: 800, letterSpacing: '-0.03em', color: '#ffffff', marginBottom: 8 }}>
            Built for uninterrupted flow.
          </h2>
          <p style={{ color: '#a1a1aa', fontSize: 14, maxWidth: 500, margin: '0 auto', lineHeight: 1.5 }}>
            Carefully tuned modules designed to eliminate cognitive friction and keep you executing.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          {[
            {
              icon: CheckCircle2,
              color: '#7c6dfa',
              title: 'High-Impact Tasks',
              desc: 'Prioritized daily queues with subtasks, inline tags, search filters, and single-tap completions.'
            },
            {
              icon: Activity,
              color: '#10b981',
              title: 'Habit Matrix Heatmaps',
              desc: 'GitHub-grade streak matrix turning daily repetition into lasting biological momentum.'
            },
            {
              icon: Timer,
              color: '#f59e0b',
              title: 'Flow Pomodoro Engine',
              desc: 'Customizable work/break cycles with ambient soundscapes and distraction logging.'
            },
            {
              icon: Calendar,
              color: '#00f2fe',
              title: 'Dynamic Timeblocking',
              desc: 'Calendar schedule blocks synchronizing your demanding tasks with your daily energy peaks.'
            }
          ].map((item, idx) => (
            <div 
              key={idx}
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 12,
                padding: '20px 18px',
                transition: 'border-color 0.15s, transform 0.15s'
              }}
              className="hover-card-elevation"
            >
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 9,
                background: `linear-gradient(135deg, ${item.color}22, ${item.color}08)`,
                border: `1px solid ${item.color}33`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 14
              }}>
                <item.icon size={18} color={item.color} />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', marginBottom: 6 }}>
                {item.title}
              </h3>
              <p style={{ color: '#a1a1aa', fontSize: 12, lineHeight: 1.5, margin: 0 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison: DayFlow vs Fragmented Apps */}
      <section id="comparison" style={{ 
        position: 'relative', 
        zIndex: 1, 
        maxWidth: 920, 
        margin: '0 auto 80px', 
        padding: '0 18px' 
      }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.025em', marginBottom: 8 }}>
            Why builders choose DayFlow
          </h2>
          <p style={{ color: '#a1a1aa', fontSize: 14 }}>
            Stop paying for 4 separate apps when one cockpit does it better.
          </p>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: 12,
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr 1fr',
            padding: '12px 16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            background: 'rgba(255, 255, 255, 0.02)',
            fontSize: 11,
            fontWeight: 700,
            color: '#a1a1aa',
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }}>
            <div>Workflow Dimension</div>
            <div>Fragmented Tools</div>
            <div style={{ color: '#a78bfa' }}>DayFlow OS</div>
          </div>

          {[
            { feature: 'Unified Cockpit', old: '3-4 tabs open simultaneously', modern: 'Single high-velocity dashboard' },
            { feature: 'Deep Focus Integration', old: 'Separate disconnected timer app', modern: 'Direct 1-tap Pomodoro link' },
            { feature: 'Visual Habit Heatmap', old: 'Basic checklist or expensive addon', modern: 'GitHub-grade matrix built-in' },
            { feature: 'Day-Wise Discipline', old: 'Endless roll-over backlog stress', modern: 'Focused today-first isolation' },
            { feature: 'Response Speed', old: 'Sluggish electron/web views', modern: 'Sub-50ms optimistic rendering' },
          ].map((row, idx) => (
            <div key={idx} style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 1fr 1fr',
              padding: '12px 16px',
              borderBottom: idx === 4 ? 'none' : '1px solid rgba(255, 255, 255, 0.04)',
              fontSize: 12,
              alignItems: 'center'
            }}>
              <div style={{ fontWeight: 600, color: '#f4f4f5' }}>{row.feature}</div>
              <div style={{ color: '#71717a' }}>{row.old}</div>
              <div style={{ color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                <CheckCheck size={14} color="#10b981" /> {row.modern}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Frequently Asked Questions (Compact Accordion) */}
      <section id="faq" style={{ 
        position: 'relative', 
        zIndex: 1, 
        maxWidth: 780, 
        margin: '0 auto 80px', 
        padding: '0 18px' 
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.025em', marginBottom: 6 }}>
            Frequently Asked Questions
          </h2>
          <p style={{ color: '#a1a1aa', fontSize: 14 }}>
            Answers to common questions about DayFlow.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {faqs.map((faq, index) => {
            const isOpen = activeFaq === index;
            return (
              <div 
                key={index}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: 10,
                  overflow: 'hidden',
                  transition: 'background 0.15s ease'
                }}
              >
                <button
                  onClick={() => toggleFaq(index)}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'none',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: 14,
                    fontWeight: 600,
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp size={16} color="#a1a1aa" /> : <ChevronDown size={16} color="#a1a1aa" />}
                </button>
                {isOpen && (
                  <div style={{
                    padding: '0 16px 14px 16px',
                    color: '#a1a1aa',
                    fontSize: 13,
                    lineHeight: 1.5,
                    borderTop: '1px solid rgba(255,255,255,0.04)',
                    paddingTop: 10
                  }}>
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Final Call to Action (Sleek, Not Oversized) */}
      <section style={{ 
        position: 'relative', 
        zIndex: 1, 
        maxWidth: 820, 
        margin: '0 auto 64px', 
        padding: '0 18px' 
      }}>
        <div style={{
          background: 'linear-gradient(145deg, rgba(124, 109, 250, 0.08) 0%, rgba(14, 165, 233, 0.03) 100%)',
          border: '1px solid rgba(124, 109, 250, 0.2)',
          borderRadius: 16,
          padding: 'clamp(28px, 4vw, 42px) 20px',
          textAlign: 'center',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.4)'
        }}>
          <h2 style={{ fontSize: 'clamp(22px, 3.2vw, 32px)', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.025em', marginBottom: 10 }}>
            Master your daily rhythm.
          </h2>
          <p style={{ color: '#d4d4d8', fontSize: 14, maxWidth: 480, margin: '0 auto 22px', lineHeight: 1.5 }}>
            Join professionals orchestrating their priorities, deep focus blocks, and habits inside DayFlow.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
            {user ? (
              <Link to="/dashboard" style={{ 
                padding: '10px 24px', 
                borderRadius: 8, 
                fontSize: 14, 
                fontWeight: 700, 
                color: '#ffffff', 
                textDecoration: 'none',
                background: 'linear-gradient(135deg, #7c6dfa 0%, #5850ec 100%)',
                boxShadow: '0 2px 12px rgba(124, 109, 250, 0.35)',
                border: '1px solid rgba(255,255,255,0.15)',
                display: 'flex', 
                alignItems: 'center', 
                gap: 8
              }}>
                <LayoutDashboard size={15} />
                <span>Go to Dashboard</span>
                <ArrowRight size={14} />
              </Link>
            ) : (
              <>
                <Link to="/register" style={{ 
                  padding: '10px 22px', 
                  borderRadius: 8, 
                  fontSize: 14, 
                  fontWeight: 700, 
                  color: '#ffffff', 
                  textDecoration: 'none',
                  background: 'linear-gradient(135deg, #7c6dfa 0%, #5850ec 100%)',
                  boxShadow: '0 2px 12px rgba(124, 109, 250, 0.35)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8
                }}>
                  <span>Get Started Free</span>
                  <ArrowRight size={14} />
                </Link>
                <button
                  onClick={handleInstantDemo}
                  disabled={isDemoLoading}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#e4e4e7',
                    cursor: 'pointer',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  {isDemoLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} color="#a78bfa" />}
                  <span>{isDemoLoading ? 'Launching...' : '1-Click Demo'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Clean Compact Footer */}
      <footer style={{ 
        position: 'relative', 
        zIndex: 1, 
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        padding: '36px 20px 24px',
        background: '#070709'
      }}>
        <div style={{ 
          maxWidth: 1040, 
          margin: '0 auto', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 24
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ 
              width: 28, 
              height: 28, 
              borderRadius: 7, 
              background: 'linear-gradient(135deg, #7c6dfa, #0a84ff)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center'
            }}>
              <Zap size={15} color="white" fill="white" />
            </div>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
              DayFlow
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 12, color: '#71717a' }}>
            <button onClick={() => scrollToSection('features')} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', fontSize: 12 }}>Features</button>
            <button onClick={() => scrollToSection('comparison')} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', fontSize: 12 }}>Why DayFlow</button>
            <button onClick={() => scrollToSection('faq')} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', fontSize: 12 }}>FAQ</button>
            {user ? (
              <Link to="/dashboard" style={{ color: '#a78bfa', fontWeight: 600, textDecoration: 'none' }}>Dashboard</Link>
            ) : (
              <>
                <Link to="/login" style={{ color: '#a1a1aa', textDecoration: 'none' }}>Sign In</Link>
                <Link to="/register" style={{ color: '#a1a1aa', textDecoration: 'none' }}>Register</Link>
              </>
            )}
          </div>
        </div>

        <div style={{ 
          maxWidth: 1040, 
          margin: '0 auto', 
          borderTop: '1px solid rgba(255, 255, 255, 0.04)',
          paddingTop: 18,
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10
        }}>
          <div style={{ fontSize: 11, color: '#52525b' }}>
            © {new Date().getFullYear()} DayFlow OS. High-precision productivity suite. All rights reserved.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#52525b' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981' }} />
            <span>All systems operational</span>
          </div>
        </div>
      </footer>

      {/* Scoped CSS for Responsive Viewports & Hover Effects */}
      <style>{`
        @media (max-width: 768px) {
          .landing-desktop-nav,
          .landing-desktop-actions {
            display: none !important;
          }
          .landing-mobile-menu-btn {
            display: block !important;
          }
        }
        .hover-card-elevation:hover {
          border-color: rgba(255, 255, 255, 0.12) !important;
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}
