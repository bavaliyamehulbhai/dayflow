import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Lock, Zap, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRef } from 'react';

const Magnetic = ({ children }) => {
  const ref = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const isMobile = window.innerWidth <= 768;

  const handleMouseMove = (e) => {
    if (isMobile) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const x = clientX - (left + width / 2);
    const y = clientY - (top + height / 2);
    setPosition({ x, y });
  };
  const handleMouseLeave = () => setPosition({ x: 0, y: 0 });
  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x * 0.3, y: position.y * 0.3 }}
      transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }}
    >
      {children}
    </motion.div>
  );
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [lockInfo, setLockInfo] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLockInfo(null);
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      const data = err.response?.data;
      if (err.response?.status === 423) {
        setLockInfo(data?.lockedUntil ? new Date(data.lockedUntil) : null);
        setError(data?.error || 'Account temporarily locked.');
      } else {
        setError(data?.error || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setLoading(true);
    try {
      await login('demo@dayflow.app', 'Demo123!');
      toast.success('Welcome to DayFlow Demo!');
      navigate('/');
    } catch {
      setError('Demo account not available. Please register.');
    } finally {
      setLoading(false);
    }
  };

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const cardRef = useRef(null);
  const lastMouseUpdate = useRef(0);

  const handleCardMouseMove = (e) => {
    const now = performance.now();
    if (now - lastMouseUpdate.current < 16) return; // Throttle to ~60fps
    lastMouseUpdate.current = now;

    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = (e.clientX - centerX) / (rect.width / 2);
    const y = (e.clientY - centerY) / (rect.height / 2);
    setMousePos({ x, y });
  };

  const handleCardMouseLeave = () => setMousePos({ x: 0, y: 0 });

  return (
    <div 
      onMouseMove={handleCardMouseMove}
      onMouseLeave={handleCardMouseLeave}
      className="auth-container"
    >
      {/* Animated Background Orbs */}
      <div style={{
        position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none',
        background: 'radial-gradient(circle at 50% 50%, rgba(124, 109, 250, 0.08), transparent 70%)'
      }}>
        <motion.div 
          animate={{ 
            x: [0, 150, 50, 0], y: [0, 100, -50, 0],
            scale: [1, 1.3, 1.1, 1],
            rotate: [0, 120, 240, 360]
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          style={{
            position: 'absolute', width: 800, height: 800, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(130,114,255,0.18), transparent 70%)',
            top: '-300px', left: '-200px', filter: 'blur(120px)'
          }} 
        />
        <motion.div 
          animate={{ 
            x: [0, -120, -40, 0], y: [0, -150, 80, 0],
            scale: [1, 1.2, 1.4, 1],
            rotate: [0, -180, -300, -360]
          }}
          transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
          style={{
            position: 'absolute', width: 700, height: 700, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 107, 139, 0.12), transparent 70%)',
            bottom: '-250px', right: '-150px', filter: 'blur(140px)'
          }} 
        />
        {/* Spatial Grid Layer */}
        <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            opacity: 0.5,
            maskImage: 'radial-gradient(circle at 50% 50%, black, transparent 80%)'
        }} />
      </div>

      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 40, scale: 0.9 }}
        animate={{ 
          opacity: 1, 
          y: 0, 
          scale: 1,
          rotateY: (window.innerWidth <= 768) ? 0 : mousePos.x * 12,
          rotateX: (window.innerWidth <= 768) ? 0 : -mousePos.y * 12,
        }}
        transition={{ 
          opacity: { duration: 0.8 },
          y: { duration: 0.8 },
          rotateY: { type: 'spring', stiffness: 100, damping: 30 },
          rotateX: { type: 'spring', stiffness: 100, damping: 30 }
        }}
        style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1, transformStyle: 'preserve-3d' }}
      >
        {/* Holographic Glint / Scanline Effect */}
        <div style={{
          position: 'absolute', inset: -20, borderRadius: 40,
          background: 'linear-gradient(135deg, rgba(124,109,250,0.1), transparent, rgba(255,77,125,0.05))',
          pointerEvents: 'none', zIndex: -1,
          transform: 'translateZ(-50px)', filter: 'blur(20px)'
        }} />

        {/* Logo & Brand */}
        <div style={{ textAlign: 'center', marginBottom: 'clamp(16px, 3.5vh, 28px)', transform: 'translateZ(60px)' }}>
          <Magnetic>
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="auth-logo-icon"
            >
              <Zap size={window.innerWidth <= 768 ? 32 : 42} color="white" strokeWidth={2.5} fill="white" />
            </motion.div>
          </Magnetic>
          <motion.div className="auth-title">DayFlow</motion.div>
          <div style={{ color: 'var(--muted)', fontSize: 'clamp(13px, 1.8vw, 15px)', fontWeight: 600, letterSpacing: '0.02em', opacity: 0.8 }}>
            Your <span className="holographic-text">Personal Dashboard</span>
          </div>
        </div>

        {/* Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="auth-card aura-iridescent" 
          style={{
            transform: 'translateZ(40px)',
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Internal Glow Orbs */}
          <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%', background: 'var(--accent)', filter: 'blur(60px)', opacity: 0.08, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '40%', height: '40%', background: 'var(--accent2)', filter: 'blur(60px)', opacity: 0.08, pointerEvents: 'none' }} />

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            style={{ marginBottom: 24, transform: 'translateZ(30px)' }}
          >
            <h2 style={{ fontSize: 24, fontWeight: 900, fontFamily: 'Syne', letterSpacing: '-0.03em', background: 'linear-gradient(to right, #fff, #a8a8c5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Welcome back</h2>
            <p style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600, marginTop: 2 }}>Enter your details to login.</p>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ 
                background: 'rgba(248, 113, 113, 0.1)', 
                border: '1px solid rgba(248, 113, 113, 0.2)',
                color: 'var(--red)',
                padding: '12px 16px', borderRadius: 14, marginBottom: 24,
                fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10,
                transform: 'translateZ(20px)'
              }}
            >
              <Lock size={14} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </motion.div>
          )}

          <motion.form 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            onSubmit={handleSubmit} 
            style={{ display: 'flex', flexDirection: 'column', gap: 14, transform: 'translateZ(20px)' }}
          >
            <div className="form-group">
              <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', letterSpacing: '1.5px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ width: 12, height: 1.2, background: 'var(--accent)', borderRadius: 1 }}></span>
                Email
              </label>
              <input
                type="email"
                className="auth-input haptic-feedback"
                placeholder="Enter your email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required autoFocus autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', letterSpacing: '1.5px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ width: 12, height: 1.2, background: 'var(--accent2)', borderRadius: 1 }}></span>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input haptic-feedback"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{ 
                    position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              className="auth-button haptic-feedback"
              style={{ marginTop: 8 }}
            >
              <div className="btn-glint" />
              {loading ? (
                <div className="loading-spinner" style={{ width: 24, height: 24 }} />
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  LOGIN <ArrowRight size={22} strokeWidth={2.5} />
                </span>
              )}
            </motion.button>
          </motion.form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '24px 0', opacity: 0.3, transform: 'translateZ(10px)' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--text)' }} />
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'var(--text)' }} />
          </div>

          <motion.button
            onClick={handleDemo}
            disabled={loading}
            whileHover={{ scale: 1.02, background: 'rgba(255,255,255,0.08)' }}
            whileTap={{ scale: 0.98 }}
            style={{
              width: '100%', height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(255,255,255,0.02)', color: 'var(--text)',
              border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: 14,
              fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s ease',
              transform: 'translateZ(10px)'
            }}
          >
            ⚡ Try Demo Account
          </motion.button>

            New here?{' '}
            <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 800, textDecoration: 'none' }}>
              Create Account
            </Link>
        </motion.div>

        {/* Floating elements behind card */}
        <div style={{
          position: 'absolute', bottom: -50, left: -50, width: 120, height: 120,
          background: 'var(--accent)', borderRadius: '50%', filter: 'blur(40px)', opacity: 0.2, zIndex: -1
        }} />
        <div style={{
          position: 'absolute', top: -30, right: -40, width: 100, height: 100,
          background: 'var(--accent2)', borderRadius: '50%', filter: 'blur(40px)', opacity: 0.15, zIndex: -1
        }} />
      </motion.div>
    </div>
  );
}
