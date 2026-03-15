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
  const handleMouseMove = (e) => {
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

  const handleCardMouseMove = (e) => {
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
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        background: 'var(--bg)',
        position: 'relative',
        overflow: 'hidden',
        perspective: '1200px'
      }}
    >
      {/* Animated Background Orbs */}
      <div style={{
        position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none',
        background: 'radial-gradient(circle at 50% 50%, rgba(124, 109, 250, 0.05), transparent 70%)'
      }}>
        <motion.div 
          animate={{ 
            x: [0, 100, 0], y: [0, 50, 0],
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{
            position: 'absolute', width: 600, height: 600, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(130,114,255,0.15), transparent 70%)',
            top: '-200px', left: '-100px', filter: 'blur(80px)'
          }} 
        />
        <motion.div 
          animate={{ 
            x: [0, -80, 0], y: [0, -100, 0],
            scale: [1, 1.1, 1],
            rotate: [0, -120, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          style={{
            position: 'absolute', width: 500, height: 500, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 107, 139, 0.1), transparent 70%)',
            bottom: '-150px', right: '-50px', filter: 'blur(100px)'
          }} 
        />
      </div>

      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 40, scale: 0.9 }}
        animate={{ 
          opacity: 1, 
          y: 0, 
          scale: 1,
          rotateY: mousePos.x * 12,
          rotateX: -mousePos.y * 12,
        }}
        transition={{ 
          opacity: { duration: 0.8 },
          y: { duration: 0.8 },
          rotateY: { type: 'spring', stiffness: 100, damping: 30 },
          rotateX: { type: 'spring', stiffness: 100, damping: 30 }
        }}
        style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1, transformStyle: 'preserve-3d' }}
      >
        {/* Holographic Glint / Scanline Effect */}
        <div style={{
          position: 'absolute', inset: -20, borderRadius: 40,
          background: 'linear-gradient(135deg, rgba(124,109,250,0.1), transparent, rgba(255,77,125,0.05))',
          pointerEvents: 'none', zIndex: -1,
          transform: 'translateZ(-50px)', filter: 'blur(20px)'
        }} />

        {/* Logo & Brand */}
        <div style={{ textAlign: 'center', marginBottom: 40, transform: 'translateZ(60px)' }}>
          <Magnetic>
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 84, height: 84, borderRadius: 28,
                background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                boxShadow: '0 20px 50px rgba(124,109,250,0.4), 0 0 100px rgba(124,109,250,0.2)',
                marginBottom: 24,
                border: '1.5px solid rgba(255,255,255,0.3)',
                cursor: 'pointer'
              }}>
              <Zap size={42} color="white" strokeWidth={2.5} fill="white" />
            </motion.div>
          </Magnetic>
          <motion.div style={{
            fontFamily: 'Syne, sans-serif', fontSize: 44, fontWeight: 800,
            color: 'var(--text)',
            letterSpacing: '-0.06em',
            marginBottom: 4,
            textShadow: '0 10px 30px rgba(0,0,0,0.5)'
          }}>DayFlow</motion.div>
          <div style={{ color: 'var(--muted)', fontSize: 16, fontWeight: 600, letterSpacing: '0.02em', opacity: 0.8 }}>
            Architecting Your <span className="holographic-text" style={{ color: 'var(--accent)', fontWeight: 800 }}>Infinite Potential</span>
          </div>
        </div>

        {/* Card */}
        <div className="card glass-card aura-iridescent" style={{
          background: 'rgba(13, 13, 22, 0.45)',
          backdropFilter: 'blur(50px) saturate(220%)',
          border: '1.5px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 36,
          padding: '48px 40px',
          boxShadow: '0 50px 100px rgba(0,0,0,0.7), inset 0 0 40px rgba(255,255,255,0.02)',
          transform: 'translateZ(40px)',
          transformStyle: 'preserve-3d'
        }}>
          <div style={{ marginBottom: 32, transform: 'translateZ(30px)' }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Syne', letterSpacing: '-0.02em', background: 'linear-gradient(to right, #fff, #a8a8c5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Welcome Back</h2>
            <p style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 600 }}>Enter your essence to resume focus</p>
          </div>

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

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20, transform: 'translateZ(20px)' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                Cognitive Portal (Email)
              </label>
              <input
                type="email"
                className="input haptic-feedback"
                placeholder="you@presence.app"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required autoFocus autoComplete="email"
                style={{ 
                    height: 54, background: 'rgba(255,255,255,0.03)', border: '1.5px solid rgba(255,255,255,0.08)',
                    borderRadius: 16, padding: '0 20px', fontSize: 15, fontWeight: 600, color: 'white',
                    transition: 'all 0.3s ease'
                }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                Security Cipher (Password)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input haptic-feedback"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required autoComplete="current-password"
                  style={{ 
                    height: 54, background: 'rgba(255,255,255,0.03)', border: '1.5px solid rgba(255,255,255,0.08)',
                    borderRadius: 16, padding: '0 20px', fontSize: 15, fontWeight: 600, width: '100%', color: 'white',
                    transition: 'all 0.3s ease'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{ 
                    position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="haptic-feedback"
              style={{
                width: '100%', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 800, marginTop: 12, borderRadius: 18,
                background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                color: 'white', border: 'none', cursor: 'pointer',
                letterSpacing: '0.05em',
                boxShadow: '0 15px 35px rgba(124,109,250,0.3)'
              }}
            >
              {loading ? (
                <div className="loading-spinner" style={{ width: 22, height: 22 }} />
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  Initiate Alignment <ArrowRight size={20} />
                </span>
              )}
            </motion.button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '28px 0', opacity: 0.3, transform: 'translateZ(10px)' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--text)' }} />
            <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase' }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'var(--text)' }} />
          </div>

          <motion.button
            onClick={handleDemo}
            disabled={loading}
            whileHover={{ scale: 1.02, background: 'rgba(255,255,255,0.08)' }}
            whileTap={{ scale: 0.98 }}
            style={{
              width: '100%', height: 54, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(255,255,255,0.03)', color: 'var(--text)',
              border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 16,
              fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s ease',
              transform: 'translateZ(10px)'
            }}
          >
            ⚡ Experience the Flow (Demo)
          </motion.button>

          <div style={{ marginTop: 32, textAlign: 'center', fontSize: 14, color: 'var(--muted)', fontWeight: 600, transform: 'translateZ(10px)' }}>
            New to the ecosystem?{' '}
            <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 800, textDecoration: 'none' }}>
              Manifest Identity
            </Link>
          </div>
        </div>

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

      <style>{`
        .holographic-text {
            background: linear-gradient(135deg, var(--accent) 0%, #fff 50%, var(--accent2) 100%);
            background-size: 200% auto;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: holoFlow 5s linear infinite;
        }

        @keyframes holoFlow {
            to { background-position: 200% center; }
        }

        .input:focus {
            background: rgba(255,255,255,0.06) !important;
            border-color: var(--accent) !important;
            box-shadow: 0 0 20px rgba(124,109,250,0.1);
        }
      `}</style>
    </div>
  );
}
