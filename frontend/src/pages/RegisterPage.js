import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Zap, ArrowRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

const InputField = ({ label, type, placeholder, value, onChange, onBlur, error, success, autoComplete, autoFocus, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
      {label}
    </label>
    <div style={{ position: 'relative' }}>
      <input
        type={type}
        className={`input ${error ? 'input-error' : success ? 'input-ok' : ''}`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        style={{ height: 50, paddingRight: children ? 44 : undefined }}
      />
      {children}
    </div>
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          style={{ fontSize: 11, color: 'var(--red)', fontWeight: 600 }}
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

  const EyeBtn = ({ show, onToggle }) => (
    <button type="button" className="password-eye" onClick={onToggle} tabIndex={-1}>
      {show ? <EyeOff size={15} /> : <Eye size={15} />}
    </button>
  );

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', background: 'var(--bg)', position: 'relative', overflow: 'hidden',
    }}>
      {/* Background Orbs */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(130,114,255,0.10), transparent 70%)', top: '-120px', right: '-80px', animation: 'floatOrb1 9s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,107,139,0.07), transparent 70%)', bottom: '-60px', left: '-60px', animation: 'floatOrb2 11s ease-in-out infinite' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: 16, background: 'linear-gradient(135deg, var(--accent), var(--accent2))', boxShadow: '0 8px 24px rgba(130,114,255,0.35)', marginBottom: 12 }}>
            <Zap size={24} color="white" strokeWidth={2.5} />
          </div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, background: 'linear-gradient(135deg, var(--accent), var(--accent2))', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px' }}>DayFlow</div>
          <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 2 }}>Start your productivity journey</div>
        </div>

        {/* Card */}
        <div style={{ background: 'rgba(18,18,26,0.8)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid var(--border)', borderRadius: 24, padding: '32px 28px', boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px var(--border)' }}>
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="auth-alert auth-alert-error">
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <InputField
              label="Full Name" type="text" placeholder="Mehul Shah"
              value={form.name} onChange={handleChange('name')} onBlur={() => handleBlur('name')}
              error={getFieldError('name')} success={touched.name && form.name.length >= 2}
              autoFocus autoComplete="name"
            />
            <InputField
              label="Email Address" type="email" placeholder="you@example.com"
              value={form.email} onChange={handleChange('email')} onBlur={() => handleBlur('email')}
              error={getFieldError('email')} success={touched.email && /^\S+@\S+\.\S+$/.test(form.email)}
              autoComplete="email"
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Password</label>
              <div className="input-password-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`input ${getFieldError('password') ? 'input-error' : touched.password && strength.score >= 3 ? 'input-ok' : ''}`}
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  value={form.password} onChange={handleChange('password')} onBlur={() => handleBlur('password')}
                  autoComplete="new-password" style={{ height: 50 }}
                />
                <EyeBtn show={showPassword} onToggle={() => setShowPassword(v => !v)} />
              </div>
              {form.password && (
                <div className="password-strength-wrap">
                  <div className="password-strength-bars">
                    {[0, 1, 2, 3].map(i => (
                      <div key={i} className="password-strength-bar" style={{ background: i < filledBars ? strength.color : undefined, opacity: i < filledBars ? 1 : 0.15 }} />
                    ))}
                  </div>
                  <span className="password-strength-label" style={{ color: strength.color }}>{strength.label}</span>
                </div>
              )}
              {getFieldError('password') && <div className="form-error">{getFieldError('password')}</div>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Confirm Password</label>
              <div className="input-password-wrap">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  className={`input ${getFieldError('confirm') ? 'input-error' : touched.confirm && form.password === form.confirm && form.confirm ? 'input-ok' : ''}`}
                  placeholder="Repeat password"
                  value={form.confirm} onChange={handleChange('confirm')} onBlur={() => handleBlur('confirm')}
                  autoComplete="new-password" style={{ height: 50 }}
                />
                <EyeBtn show={showConfirm} onToggle={() => setShowConfirm(v => !v)} />
              </div>
              {getFieldError('confirm') && <div className="form-error">{getFieldError('confirm')}</div>}
            </div>

            <motion.button
              type="submit" className="btn btn-primary" disabled={loading}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              style={{ width: '100%', justifyContent: 'center', height: 52, fontSize: 15, fontWeight: 700, marginTop: 4, borderRadius: 14, background: 'linear-gradient(135deg, var(--accent), var(--accent2))', border: 'none', boxShadow: '0 8px 24px rgba(130,114,255,0.4)' }}
            >
              {loading
                ? <span className="loading-spinner" style={{ width: 18, height: 18 }} />
                : <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>Create Account <ArrowRight size={18} /></span>
              }
            </motion.button>
          </form>

          <div className="auth-footer" style={{ marginTop: 20, textAlign: 'center' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 700 }}>Sign in</Link>
          </div>
        </div>
      </motion.div>

      <style>{`
        @keyframes floatOrb1 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-25px, 20px) scale(1.05); } }
        @keyframes floatOrb2 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(20px, -30px) scale(1.08); } }
      `}</style>
    </div>
  );
}
