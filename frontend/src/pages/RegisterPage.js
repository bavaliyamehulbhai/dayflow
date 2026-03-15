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
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>
      {label}
    </label>
    <div style={{ position: 'relative' }}>
      <input
        type={type}
        className={`input ${className} ${error ? 'input-error' : success ? 'input-ok' : ''}`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        style={{ 
          height: 52, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: 14, padding: '0 20px', fontSize: 15, fontWeight: 600, width: '100%'
        }}
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
      style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px', background: 'var(--bg)', position: 'relative', overflow: 'hidden',
        perspective: '1200px'
      }}
    >
      {/* Background Orbs */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', background: 'radial-gradient(circle at 50% 50%, rgba(124,109,250,0.05), transparent 70%)' }}>
        <motion.div 
          animate={{ x: [-80, 80, -80], y: [50, -50, 50], scale: [1, 1.2, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(130,114,255,0.12), transparent 70%)', top: '-150px', right: '-100px', filter: 'blur(80px)' }} 
        />
        <motion.div 
          animate={{ x: [60, -60, 60], y: [-40, 40, -40], scale: [1, 1.15, 1] }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,107,139,0.08), transparent 70%)', bottom: '-100px', left: '-100px', filter: 'blur(90px)' }} 
        />
      </div>

      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ 
            opacity: 1, 
            y: 0, 
            scale: 1,
            rotateY: mousePos.x * 10,
            rotateX: -mousePos.y * 10,
        }}
        transition={{ 
            rotateY: { type: 'spring', stiffness: 100, damping: 30 },
            rotateX: { type: 'spring', stiffness: 100, damping: 30 }
        }}
        style={{ width: '100%', maxWidth: 460, position: 'relative', zIndex: 1, transformStyle: 'preserve-3d' }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32, transform: 'translateZ(60px)' }}>
          <Magnetic>
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              style={{ 
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', 
                width: 72, height: 72, borderRadius: 24, 
                background: 'linear-gradient(135deg, var(--accent), var(--accent2))', 
                boxShadow: '0 15px 40px rgba(124,109,250,0.3)', 
                marginBottom: 16,
                border: '1.5px solid rgba(255,255,255,0.3)',
                cursor: 'pointer'
              }}>
              <Zap size={36} color="white" strokeWidth={2.5} fill="white" />
            </motion.div>
          </Magnetic>
          <div style={{ 
            fontFamily: 'Syne, sans-serif', fontSize: 36, fontWeight: 800, 
            color: 'var(--text)', 
            letterSpacing: '-0.06em' 
          }}>DayFlow</div>
          <div style={{ color: 'var(--muted)', fontSize: 16, marginTop: 4, fontWeight: 600, opacity: 0.8 }}>
            Manifest your <span className="holographic-text" style={{ color: 'var(--accent)', fontWeight: 800 }}>Digital Identity</span>
          </div>
        </div>

        {/* Card */}
        <div className="card glass-card aura-iridescent" style={{ 
          background: 'rgba(13, 13, 22, 0.45)', 
          backdropFilter: 'blur(50px) saturate(220%)', 
          border: '1.5px solid rgba(255, 255, 255, 0.1)', 
          borderRadius: 36, 
          padding: '40px 32px', 
          boxShadow: '0 50px 100px rgba(0,0,0,0.7), inset 0 0 30px rgba(255,255,255,0.02)',
          transform: 'translateZ(40px)',
          transformStyle: 'preserve-3d'
        }}>
          <div style={{ marginBottom: 28, transform: 'translateZ(30px)' }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Syne', letterSpacing: '-0.02em', background: 'linear-gradient(to right, #fff, #a8a8c5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Begin Journey</h2>
            <p style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 600 }}>Create your portal to higher focus</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} 
              style={{ 
                background: 'rgba(248, 113, 113, 0.1)', 
                border: '1px solid rgba(248, 113, 113, 0.2)',
                color: 'var(--red)',
                padding: '12px 16px', borderRadius: 14, marginBottom: 24,
                fontSize: 13, fontWeight: 700, transform: 'translateZ(20px)'
              }}
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, transform: 'translateZ(20px)' }}>
            <InputField
              label="Full Manifestation (Name)" type="text" placeholder="Mehul Shah"
              value={form.name} onChange={handleChange('name')} onBlur={() => handleBlur('name')}
              error={getFieldError('name')} success={touched.name && form.name.length >= 2}
              autoFocus autoComplete="name"
              className="haptic-feedback"
            />
            <InputField
              label="Cognitive Relay (Email)" type="email" placeholder="you@presence.app"
              value={form.email} onChange={handleChange('email')} onBlur={() => handleBlur('email')}
              error={getFieldError('email')} success={touched.email && /^\S+@\S+\.\S+$/.test(form.email)}
              autoComplete="email"
              className="haptic-feedback"
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>Security Cipher</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`input haptic-feedback ${getFieldError('password') ? 'input-error' : touched.password && strength.score >= 3 ? 'input-ok' : ''}`}
                  placeholder="The complex key..."
                  value={form.password} onChange={handleChange('password')} onBlur={() => handleBlur('password')}
                  autoComplete="new-password" 
                  style={{ 
                    height: 52, background: 'rgba(255,255,255,0.03)', border: '1.5px solid rgba(255,255,255,0.08)',
                    borderRadius: 14, padding: '0 20px', fontSize: 15, fontWeight: 600, width: '100%', color: 'white'
                  }}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>Affirm Cipher</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  className={`input haptic-feedback ${getFieldError('confirm') ? 'input-error' : touched.confirm && form.password === form.confirm && form.confirm ? 'input-ok' : ''}`}
                  placeholder="Repeat the key..."
                  value={form.confirm} onChange={handleChange('confirm')} onBlur={() => handleBlur('confirm')}
                  autoComplete="new-password" 
                  style={{ 
                    height: 52, background: 'rgba(255,255,255,0.03)', border: '1.5px solid rgba(255,255,255,0.08)',
                    borderRadius: 14, padding: '0 20px', fontSize: 15, fontWeight: 600, width: '100%', color: 'white'
                  }}
                />
                <EyeBtn show={showConfirm} onToggle={() => setShowConfirm(v => !v)} />
              </div>
              {getFieldError('confirm') && <div style={{ fontSize: 11, color: 'var(--red)', fontWeight: 600, marginTop: 4 }}>{getFieldError('confirm')}</div>}
            </div>

            <motion.button
              type="submit" disabled={loading}
              whileHover={{ scale: 1.02 }} 
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
              {loading
                ? <div className="loading-spinner" style={{ width: 22, height: 22 }} />
                : <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>Construct Identity <ArrowRight size={20} /></span>
              }
            </motion.button>
          </form>

          <div style={{ marginTop: 32, textAlign: 'center', fontSize: 14, color: 'var(--muted)', fontWeight: 600, transform: 'translateZ(10px)' }}>
            Already part of the ecosystem?{' '}
            <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 800, textDecoration: 'none' }}>Sign in</Link>
          </div>
        </div>
      </motion.div>

      <style>{`
        .holographic-text {
            background: linear-gradient(135deg, var(--accent) 0%, #fff 50%, var(--accent2) 100%);
            background-size: 200% auto;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: holoFlow 5s linear infinite;
        }
        @keyframes holoFlow { to { background-position: 200% center; } }
        
        .password-eye:hover { color: var(--accent) !important; transform: scale(1.1) translateY(-50%) !important; }
      `}</style>
    </div>
  );
}
