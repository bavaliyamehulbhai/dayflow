import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Lock, Zap, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

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

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'var(--bg)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Animated Background Orbs */}
      <div style={{
        position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute', width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(130,114,255,0.12), transparent 70%)',
          top: '-100px', left: '-100px',
          animation: 'floatOrb1 8s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 107, 139, 0.08), transparent 70%)',
          bottom: '-80px', right: '-80px',
          animation: 'floatOrb2 10s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(95,250,209,0.06), transparent 70%)',
          top: '60%', left: '30%',
          animation: 'floatOrb3 12s ease-in-out infinite',
        }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}
      >
        {/* Logo & Brand */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 56, height: 56, borderRadius: 18,
            background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            boxShadow: '0 8px 32px rgba(130,114,255,0.35)',
            marginBottom: 16,
          }}>
            <Zap size={28} color="white" strokeWidth={2.5} />
          </div>
          <div style={{
            fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800,
            background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.5px',
          }}>DayFlow</div>
          <div style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>
            Master your day, every day
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(18,18,26,0.8)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid var(--border)',
          borderRadius: 24,
          padding: '36px 32px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px var(--border), 0 0 80px rgba(130,114,255,0.06)',
        }}>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`auth-alert ${lockInfo ? 'auth-alert-lock' : 'auth-alert-error'}`}
            >
              {lockInfo && <Lock size={14} style={{ flexShrink: 0 }} />}
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.5px', color: 'var(--text2)' }}>
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required autoFocus autoComplete="email"
                style={{ marginTop: 6, height: 50 }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.5px', color: 'var(--text2)' }}>
                PASSWORD
              </label>
              <div className="input-password-wrap" style={{ marginTop: 6 }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required autoComplete="current-password"
                  style={{ height: 50 }}
                />
                <button
                  type="button"
                  className="password-eye"
                  onClick={() => setShowPassword(v => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                width: '100%', justifyContent: 'center', height: 52,
                fontSize: 15, fontWeight: 700, marginTop: 4, borderRadius: 14,
                background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                border: 'none',
                boxShadow: '0 8px 24px rgba(130,114,255,0.4)',
              }}
            >
              {loading ? (
                <span className="loading-spinner" style={{ width: 18, height: 18 }} />
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  Sign In <ArrowRight size={18} />
                </span>
              )}
            </motion.button>
          </form>

          <div className="auth-divider" style={{ margin: '20px 0' }}><span>or</span></div>

          <motion.button
            className="btn"
            style={{
              width: '100%', justifyContent: 'center', height: 48,
              border: '1px solid var(--border)',
              background: 'var(--surface2)',
              borderRadius: 14,
              fontSize: 14, fontWeight: 600,
            }}
            onClick={handleDemo}
            disabled={loading}
            whileHover={{ borderColor: 'var(--accent)', background: 'rgba(130,114,255,0.08)' }}
            whileTap={{ scale: 0.98 }}
          >
            ⚡ Try Demo Account
          </motion.button>

          <div className="auth-footer" style={{ marginTop: 20 }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 700 }}>
              Create one free
            </Link>
          </div>
        </div>
      </motion.div>

      <style>{`
        @keyframes floatOrb1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, 20px) scale(1.05); }
        }
        @keyframes floatOrb2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-20px, 30px) scale(1.08); }
        }
        @keyframes floatOrb3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20px, -20px) scale(1.1); }
        }
      `}</style>
    </div>
  );
}
