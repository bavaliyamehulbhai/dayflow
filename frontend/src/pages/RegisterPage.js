import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Eye, EyeOff, Zap, ArrowRight, ArrowLeft, ShieldCheck, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RegisterPage() {
  const { register } = useAuth();
  const { addToast } = useNotifications();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [touched, setTouched] = useState({});

  const calcStrength = (p) => {
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  };

  const getStrengthMeta = (score) => {
    if (score <= 1) return { label: 'Weak', color: '#f87171' };
    if (score === 2) return { label: 'Fair', color: '#fb923c' };
    if (score === 3) return { label: 'Good', color: '#facc15' };
    return { label: 'Strong', color: '#10b981' };
  };

  const strengthScore = calcStrength(form.password);
  const strength = getStrengthMeta(strengthScore);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setTouched({ name: true, email: true, password: true, confirm: true });

    if (form.password !== form.confirm) { 
      const msg = 'Passwords do not match.';
      setError(msg); 
      addToast(msg, 'error');
      return; 
    }
    if (form.password.length < 8) { 
      const msg = 'Password must be at least 8 characters.';
      setError(msg); 
      addToast(msg, 'error');
      return; 
    }

    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      addToast('Account created! Welcome to DayFlow.', 'success');
      navigate('/dashboard');
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Registration failed. Please try a different email.';
      setError(errorMsg);
      addToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#09090b',
      color: '#f4f4f5',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 16px',
      position: 'relative',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      overflow: 'hidden'
    }}>
      {/* Precision Grid Background (Non-blurry, ultra-crisp) */}
      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        backgroundImage: `
          linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px',
        maskImage: 'radial-gradient(ellipse 80% 60% at 50% 25%, black 40%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 25%, black 40%, transparent 100%)'
      }} />

      {/* Top Ambient Glow Ring */}
      <div style={{
        position: 'absolute',
        top: -120,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 600,
        height: 300,
        background: 'radial-gradient(circle, rgba(124, 109, 250, 0.12) 0%, rgba(10, 132, 255, 0.03) 60%, transparent 80%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Back to Home Link */}
      <div style={{ position: 'absolute', top: 24, left: 24, zIndex: 10 }}>
        <Link 
          to="/" 
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            fontWeight: 500,
            color: '#a1a1aa',
            textDecoration: 'none',
            padding: '8px 14px',
            borderRadius: 8,
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#ffffff';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#a1a1aa';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.07)';
          }}
        >
          <ArrowLeft size={15} />
          <span>Back to Home</span>
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #7c6dfa 0%, #0a84ff 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(124, 109, 250, 0.35)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <Zap size={20} color="white" fill="white" />
            </div>
            <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: '#ffffff' }}>
              DayFlow
            </span>
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: 6,
              background: 'rgba(124, 109, 250, 0.15)',
              color: '#a78bfa',
              border: '1px solid rgba(124, 109, 250, 0.25)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              v2.0
            </span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff', margin: 0 }}>
            Create your account
          </h1>
          <p style={{ fontSize: 13, color: '#a1a1aa', marginTop: 4, marginBottom: 0 }}>
            Start mastering your daily output in seconds.
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'linear-gradient(180deg, #121217 0%, #0d0d12 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 20,
          padding: '28px 24px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
        }}>
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#f87171',
              padding: '12px 14px',
              borderRadius: 10,
              marginBottom: 18,
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Full Name */}
            <div>
              <label style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: '#d4d4d8',
                marginBottom: 6
              }}>
                Full Name
              </label>
              <input
                type="text"
                placeholder="Mehul Bavaliya"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
                autoFocus
                autoComplete="name"
                style={{
                  width: '100%',
                  height: 42,
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 10,
                  padding: '0 14px',
                  fontSize: 14,
                  color: '#ffffff',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#7c6dfa';
                  e.target.style.boxShadow = '0 0 0 2px rgba(124, 109, 250, 0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Email Address */}
            <div>
              <label style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: '#d4d4d8',
                marginBottom: 6
              }}>
                Email address
              </label>
              <input
                type="email"
                placeholder="name@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
                autoComplete="email"
                style={{
                  width: '100%',
                  height: 42,
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 10,
                  padding: '0 14px',
                  fontSize: 14,
                  color: '#ffffff',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#7c6dfa';
                  e.target.style.boxShadow = '0 0 0 2px rgba(124, 109, 250, 0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: '#d4d4d8',
                marginBottom: 6
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                  autoComplete="new-password"
                  style={{
                    width: '100%',
                    height: 42,
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 10,
                    padding: '0 40px 0 14px',
                    fontSize: 14,
                    color: '#ffffff',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#7c6dfa';
                    e.target.style.boxShadow = '0 0 0 2px rgba(124, 109, 250, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#71717a',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 4
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {form.password && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', gap: 4, height: 4, marginBottom: 4 }}>
                    {[1, 2, 3, 4].map(idx => (
                      <div 
                        key={idx} 
                        style={{ 
                          flex: 1, 
                          borderRadius: 2, 
                          background: idx <= strengthScore ? strength.color : 'rgba(255,255,255,0.06)',
                          transition: 'background 0.3s'
                        }} 
                      />
                    ))}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: strength.color, textAlign: 'right' }}>
                    {strength.label} password
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: '#d4d4d8',
                marginBottom: 6
              }}>
                Confirm Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repeat your password"
                  value={form.confirm}
                  onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                  required
                  autoComplete="new-password"
                  style={{
                    width: '100%',
                    height: 42,
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 10,
                    padding: '0 40px 0 14px',
                    fontSize: 14,
                    color: '#ffffff',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#7c6dfa';
                    e.target.style.boxShadow = '0 0 0 2px rgba(124, 109, 250, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#71717a',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 4
                  }}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 6,
                width: '100%',
                height: 44,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #7c6dfa 0%, #5850ec 100%)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 4px 14px rgba(124, 109, 250, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
                fontSize: 14,
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'opacity 0.2s, transform 0.1s'
              }}
            >
              {loading ? (
                <span>Creating workspace...</span>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Card Footer Link */}
          <div style={{
            marginTop: 20,
            textAlign: 'center',
            fontSize: 13,
            color: '#a1a1aa'
          }}>
            Already have an account?{' '}
            <Link 
              to="/login" 
              style={{ 
                color: '#a78bfa', 
                fontWeight: 600, 
                textDecoration: 'none' 
              }}
              onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
              onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* Security / System status bottom badge */}
        <div style={{
          marginTop: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          fontSize: 11,
          color: '#52525b',
          fontWeight: 500
        }}>
          <ShieldCheck size={14} color="#10b981" />
          <span>No credit card required · Free tier forever</span>
        </div>
      </motion.div>
    </div>
  );
}
