import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Zap, ArrowRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return { score, label: 'Weak', color: '#ff6b6b' };
  if (score === 2) return { score, label: 'Fair', color: '#ffd96d' };
  if (score === 3) return { score, label: 'Good', color: '#ff9a6d' };
  if (score === 4) return { score, label: 'Strong', color: '#5ffad1' };
  return { score, label: 'Crystal', color: '#8272ff' };
}

const InputField = ({ label, type, placeholder, value, onChange, onBlur, error, success, autoComplete, autoFocus, className }) => (
  <div className="form-group">
    <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>
      {label}
    </label>
    <div style={{ position: 'relative' }}>
      <input
        type={type}
        className={`auth-input haptic-feedback ${className} ${error ? 'input-error' : success ? 'input-ok' : ''}`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
      />
    </div>
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          style={{ fontSize: 11, color: 'var(--red)', fontWeight: 600, marginTop: 4 }}
        >
          {error}
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [touched, setTouched] = useState({});

  const strength = getPasswordStrength(form.password);
  const filledBars = Math.round((strength.score / 5) * 4);

  const getFieldError = useCallback((field) => {
    if (!touched[field]) return '';
    if (field === 'name' && form.name.length < 2) return 'Name must be at least 2 characters';
    if (field === 'email' && !/^\S+@\S+\.\S+$/.test(form.email)) return 'Enter a valid email address';
    if (field === 'password') {
      if (form.password.length < 8) return 'At least 8 characters required';
      if (!/[A-Z]/.test(form.password)) return 'Must include an uppercase letter';
      if (!/[0-9]/.test(form.password)) return 'Must include a number';
    }
    if (field === 'confirm' && form.confirm && form.password !== form.confirm) return 'Passwords do not match';
    return '';
  }, [form, touched]);

  const handleBlur = (f) => setTouched(t => ({ ...t, [f]: true }));
  const handleChange = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setTouched({ name: true, email: true, password: true, confirm: true });
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (!/[A-Z]/.test(form.password)) { setError('Password must contain an uppercase letter.'); return; }
    if (!/[0-9]/.test(form.password)) { setError('Password must contain a number.'); return; }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Welcome to DayFlow!');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
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

  const EyeBtn = ({ show, onToggle }) => (
    <button type="button" className="password-eye" onClick={onToggle} tabIndex={-1} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>
      {show ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );

  return (
    <div 
      onMouseMove={handleCardMouseMove}
      onMouseLeave={handleCardMouseLeave}
      className="auth-container"
    >
      {/* Background Orbs */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', background: 'radial-gradient(circle at 50% 50%, rgba(124,109,250,0.08), transparent 70%)' }}>
        <motion.div 
          animate={{ x: [-100, 100, -100], y: [80, -80, 80], scale: [1, 1.3, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          style={{ position: 'absolute', width: 800, height: 800, borderRadius: '50%', background: 'radial-gradient(circle, rgba(130,114,255,0.18), transparent 70%)', top: '-250px', right: '-150px', filter: 'blur(100px)' }} 
        />
        <motion.div 
          animate={{ x: [80, -80, 80], y: [-60, 60, -60], scale: [1, 1.2, 1], rotate: [0, -180, -360] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          style={{ position: 'absolute', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,107,139,0.12), transparent 70%)', bottom: '-200px', left: '-150px', filter: 'blur(120px)' }} 
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
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ 
            opacity: 1, 
            y: 0, 
            scale: 1,
            rotateY: (window.innerWidth <= 768) ? 0 : mousePos.x * 12,
            rotateX: (window.innerWidth <= 768) ? 0 : -mousePos.y * 12,
        }}
        transition={{ 
            rotateY: { type: 'spring', stiffness: 100, damping: 30 },
            rotateX: { type: 'spring', stiffness: 100, damping: 30 },
            opacity: { duration: 0.8 },
            y: { duration: 0.8 }
        }}
        style={{ width: '100%', maxWidth: 480, position: 'relative', zIndex: 1, transformStyle: 'preserve-3d' }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 'clamp(24px, 5vh, 40px)', transform: 'translateZ(60px)' }}>
          <Magnetic>
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="auth-logo-icon"
            >
              <Zap size={window.innerWidth <= 768 ? 32 : 42} color="white" strokeWidth={2.5} fill="white" />
            </motion.div>
          </Magnetic>
          <div className="auth-title">DayFlow</div>
          <div style={{ color: 'var(--muted)', fontSize: 'clamp(14px, 2vw, 16px)', marginTop: 8, fontWeight: 700, opacity: 0.9, letterSpacing: '0.02em' }}>
            Initialize your <span className="holographic-text">Neural Presence</span>
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
            style={{ marginBottom: 32, transform: 'translateZ(30px)' }}
          >
            <h2 style={{ fontSize: 28, fontWeight: 900, fontFamily: 'Syne', letterSpacing: '-0.04em', background: 'linear-gradient(to right, #fff, #a8a8c5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Synchronize</h2>
            <p style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 700, marginTop: 6, opacity: 0.8 }}>Forge your portal to cognitive clarity.</p>
          </motion.div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} 
              style={{ 
                background: 'rgba(248, 113, 113, 0.1)', 
                border: '1px solid rgba(248, 113, 113, 0.2)',
                color: 'var(--red)',
                padding: '12px 16px', borderRadius: 14, marginBottom: 24,
                fontSize: 13, fontWeight: 700, transform: 'translateZ(20px)',
                display: 'flex', alignItems: 'center', gap: 10
              }}
            >
              <Zap size={14} style={{ transform: 'rotate(180deg)' }} />
              <span>{error}</span>
            </motion.div>
          )}

          <motion.form 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            onSubmit={handleSubmit} 
            style={{ display: 'flex', flexDirection: 'column', gap: 20, transform: 'translateZ(20px)' }}
          >
            <div className="form-group">
              <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', letterSpacing: '1.5px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <span style={{ width: 10, height: 1.5, background: 'var(--accent)', borderRadius: 1 }}></span>
                Full Manifestation
              </label>
              <input
                type="text"
                className="auth-input haptic-feedback"
                placeholder="Mehul Shah"
                value={form.name}
                onChange={handleChange('name')}
                onBlur={() => handleBlur('name')}
                required autoFocus autoComplete="name"
              />
              {getFieldError('name') && <div style={{ fontSize: 11, color: 'var(--red)', fontWeight: 600, marginTop: 4 }}>{getFieldError('name')}</div>}
            </div>

            <div className="form-group">
              <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', letterSpacing: '1.5px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <span style={{ width: 10, height: 1.5, background: 'var(--accent2)', borderRadius: 1 }}></span>
                Cognitive Relay
              </label>
              <input
                type="email"
                className="auth-input haptic-feedback"
                placeholder="you@presence.app"
                value={form.email}
                onChange={handleChange('email')}
                onBlur={() => handleBlur('email')}
                required autoComplete="email"
              />
              {getFieldError('email') && <div style={{ fontSize: 11, color: 'var(--red)', fontWeight: 600, marginTop: 4 }}>{getFieldError('email')}</div>}
            </div>

            <div className="form-group">
              <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', letterSpacing: '1.5px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <span style={{ width: 10, height: 1.5, background: 'var(--accent)', borderRadius: 1 }}></span>
                Security Cipher
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input haptic-feedback"
                  placeholder="The complex key..."
                  value={form.password}
                  onChange={handleChange('password')}
                  onBlur={() => handleBlur('password')}
                  autoComplete="new-password" 
                />
                <EyeBtn show={showPassword} onToggle={() => setShowPassword(v => !v)} />
              </div>
              {form.password && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', gap: 4, height: 4, marginBottom: 8 }}>
                    {[0, 1, 2, 3].map(i => (
                      <div key={i} style={{ flex: 1, borderRadius: 2, background: i < filledBars ? strength.color : 'rgba(255,255,255,0.05)', transition: 'all 0.3s ease' }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 800, color: strength.color, textTransform: 'uppercase', letterSpacing: '1px' }}>{strength.label} Strength</span>
                </div>
              )}
              {getFieldError('password') && <div style={{ fontSize: 11, color: 'var(--red)', fontWeight: 600, marginTop: 4 }}>{getFieldError('password')}</div>}
            </div>

            <div className="form-group">
              <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', letterSpacing: '1.5px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <span style={{ width: 10, height: 1.5, background: 'var(--accent2)', borderRadius: 1 }}></span>
                Affirm Cipher
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  className="auth-input haptic-feedback"
                  placeholder="Repeat the key..."
                  value={form.confirm}
                  onChange={handleChange('confirm')}
                  onBlur={() => handleBlur('confirm')}
                  autoComplete="new-password" 
                />
                <EyeBtn show={showConfirm} onToggle={() => setShowConfirm(v => !v)} />
              </div>
              {getFieldError('confirm') && <div style={{ fontSize: 11, color: 'var(--red)', fontWeight: 600, marginTop: 4 }}>{getFieldError('confirm')}</div>}
            </div>

            <motion.button
              type="submit" disabled={loading}
              className="auth-button haptic-feedback"
            >
              <div className="btn-glint" />
              {loading
                ? <div className="loading-spinner" style={{ width: 24, height: 24, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                : <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>CONSTRUCT IDENTITY <ArrowRight size={22} strokeWidth={2.5} /></span>
              }
            </motion.button>
          </motion.form>

          <div style={{ marginTop: 32, textAlign: 'center', fontSize: 14, color: 'var(--muted)', fontWeight: 600, transform: 'translateZ(10px)' }}>
            Already part of the ecosystem?{' '}
            <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 800, textDecoration: 'none' }}>Alignment Portal</Link>
          </div>
        </motion.div>
      </motion.div>

    </div>
  );
}
