import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Eye, EyeOff, Lock, Zap, ArrowRight, ArrowLeft, ShieldCheck, Fingerprint } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
  const { login, login2FA } = useAuth();
  const { addToast } = useNotifications();
  const navigate = useNavigate();

  const [step, setStep] = useState('credentials'); // 'credentials' | '2fa'
  const [form, setForm] = useState({ email: '', password: '' });
  const [twoFactorData, setTwoFactorData] = useState({ userId: '', code: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [lockUntil, setLockUntil] = useState(null);
  const [lockCountdown, setLockCountdown] = useState(0);

  // Live countdown timer for account lockout
  useEffect(() => {
    if (!lockUntil) return;
    const updateCountdown = () => {
      const diff = Math.max(0, Math.ceil((lockUntil.getTime() - Date.now()) / 1000));
      setLockCountdown(diff);
      if (diff <= 0) {
        setLockUntil(null);
        setError('');
      }
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [lockUntil]);

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(form.email, form.password);

      // Handle Two-Factor Authentication requirement
      if (res?.twoFactorRequired) {
        setTwoFactorData({ userId: res.userId, code: '' });
        setStep('2fa');
        addToast('Two-Factor Authentication required', 'info');
        return;
      }

      addToast('Synchronizing workspace...', 'success');
      navigate('/dashboard');
    } catch (err) {
      const data = err.response?.data;
      const errorMsg = data?.error || 'Login failed. Please verify credentials.';
      if (err.response?.status === 423 && data?.lockedUntil) {
        setLockUntil(new Date(data.lockedUntil));
      }
      setError(errorMsg);
      addToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handle2FASubmit = async (e) => {
    e.preventDefault();
    if (!twoFactorData.code || twoFactorData.code.trim().length < 6) {
      setError('Please enter a valid 6-digit code or recovery code.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await login2FA(twoFactorData.userId, twoFactorData.code.trim());
      addToast('Authentication verified! Welcome back.', 'success');
      navigate('/dashboard');
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Invalid 2FA verification code.';
      setError(errorMsg);
      addToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setError('');
    setLoading(true);
    try {
      await login('demo@dayflow.app', 'Demo123!');
      addToast('Welcome to DayFlow Demo!', 'success');
      navigate('/dashboard');
    } catch {
      const errorMsg = 'Demo account connectivity issues.';
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
      padding: '24px 16px',
      position: 'relative',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      overflow: 'hidden'
    }}>
      {/* Precision Grid Background */}
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
        maskImage: 'radial-gradient(ellipse 80% 60% at 50% 30%, black 40%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 30%, black 40%, transparent 100%)'
      }} />

      {/* Top Ambient Glow */}
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
        style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
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
            {step === '2fa' ? 'Security Checkpoint' : 'Welcome back'}
          </h1>
          <p style={{ fontSize: 13, color: '#a1a1aa', marginTop: 4, marginBottom: 0 }}>
            {step === '2fa'
              ? 'Enter the 6-digit verification code from your authenticator app.'
              : 'Enter your credentials to access your workspace.'}
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
          {/* Lockout Warning Banner with dynamic countdown */}
          {lockCountdown > 0 && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              padding: '12px 14px',
              borderRadius: 10,
              marginBottom: 18,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}>
              <Lock size={16} color="#f87171" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700 }}>Account Locked</div>
                <div style={{ fontSize: 11, opacity: 0.85 }}>
                  Cooldown active: {Math.floor(lockCountdown / 60)}m {lockCountdown % 60}s remaining.
                </div>
              </div>
            </div>
          )}

          {error && lockCountdown <= 0 && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#f87171',
              padding: '12px 14px',
              borderRadius: 10,
              marginBottom: 20,
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}>
              <Lock size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <AnimatePresence mode="wait">
            {step === 'credentials' ? (
              <motion.form
                key="step-credentials"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleCredentialsSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
              >
                {/* Email Field */}
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
                    onChange={e => {
                      setForm(f => ({ ...f, email: e.target.value }));
                      if (error) setError('');
                    }}
                    required
                    autoFocus
                    autoComplete="email"
                    style={{
                      width: '100%',
                      height: 44,
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

                {/* Password Field */}
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
                      placeholder="••••••••"
                      value={form.password}
                      onChange={e => {
                        setForm(f => ({ ...f, password: e.target.value }));
                        if (error) setError('');
                      }}
                      required
                      autoComplete="current-password"
                      style={{
                        width: '100%',
                        height: 44,
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
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || lockCountdown > 0}
                  style={{
                    marginTop: 4,
                    width: '100%',
                    height: 44,
                    borderRadius: 10,
                    background: lockCountdown > 0
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'linear-gradient(135deg, #7c6dfa 0%, #5850ec 100%)',
                    color: lockCountdown > 0 ? '#71717a' : '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    boxShadow: lockCountdown > 0
                      ? 'none'
                      : '0 4px 14px rgba(124, 109, 250, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: (loading || lockCountdown > 0) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    transition: 'opacity 0.2s, transform 0.1s'
                  }}
                >
                  {loading ? (
                    <span>Authenticating...</span>
                  ) : lockCountdown > 0 ? (
                    <span>Temporarily Locked</span>
                  ) : (
                    <>
                      <span>Sign In to Workspace</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="step-2fa"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.2 }}
                onSubmit={handle2FASubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
              >
                <div style={{
                  padding: '16px',
                  borderRadius: 12,
                  background: 'rgba(124, 109, 250, 0.06)',
                  border: '1px solid rgba(124, 109, 250, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'rgba(124, 109, 250, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent)',
                    flexShrink: 0
                  }}>
                    <Fingerprint size={20} />
                  </div>
                  <div style={{ fontSize: 12, color: '#d4d4d8', lineHeight: 1.4 }}>
                    Please enter the code generated by your Authenticator app (or an 8-character recovery code).
                  </div>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#d4d4d8',
                    marginBottom: 8,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase'
                  }}>
                    Security Passcode
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="000000"
                    value={twoFactorData.code}
                    onChange={e => {
                      setTwoFactorData(prev => ({ ...prev, code: e.target.value.toUpperCase() }));
                      if (error) setError('');
                    }}
                    required
                    autoFocus
                    style={{
                      width: '100%',
                      height: 52,
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: 12,
                      padding: '0 16px',
                      fontSize: 22,
                      fontWeight: 800,
                      letterSpacing: 6,
                      textAlign: 'center',
                      color: '#ffffff',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#7c6dfa';
                      e.target.style.boxShadow = '0 0 0 2px rgba(124, 109, 250, 0.2)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || twoFactorData.code.trim().length < 6}
                  style={{
                    marginTop: 4,
                    width: '100%',
                    height: 46,
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #7c6dfa 0%, #5850ec 100%)',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    boxShadow: '0 4px 14px rgba(124, 109, 250, 0.35)',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: (loading || twoFactorData.code.trim().length < 6) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8
                  }}
                >
                  {loading ? 'Verifying Code...' : 'Verify & Enter Workspace'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('credentials');
                    setError('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#a1a1aa',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '6px',
                    textAlign: 'center',
                    marginTop: -4
                  }}
                  onMouseEnter={(e) => e.target.style.color = '#ffffff'}
                  onMouseLeave={(e) => e.target.style.color = '#a1a1aa'}
                >
                  ← Back to Email & Password
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Divider */}
          {step === 'credentials' && (
            <>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                margin: '20px 0'
              }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(255, 255, 255, 0.06)' }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  or quick access
                </span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255, 255, 255, 0.06)' }} />
              </div>

              {/* Demo Button */}
              <button
                type="button"
                onClick={handleDemo}
                disabled={loading}
                style={{
                  width: '100%',
                  height: 42,
                  borderRadius: 10,
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#e4e4e7',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'background 0.2s, border-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                }}
              >
                <Zap size={14} color="#f59e0b" fill="#f59e0b" />
                <span>Launch Instant Demo Workspace</span>
              </button>
            </>
          )}

          {/* Card Footer Link */}
          <div style={{
            marginTop: 22,
            textAlign: 'center',
            fontSize: 13,
            color: '#a1a1aa'
          }}>
            Don't have an account?{' '}
            <Link 
              to="/register" 
              style={{ 
                color: '#a78bfa', 
                fontWeight: 600, 
                textDecoration: 'none' 
              }}
              onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
              onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
            >
              Sign up
            </Link>
          </div>
        </div>

        {/* Security / System status bottom badge */}
        <div style={{
          marginTop: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          fontSize: 11,
          color: '#52525b',
          fontWeight: 500
        }}>
          <ShieldCheck size={14} color="#10b981" />
          <span>256-bit encrypted authentication · Sub-50ms sync</span>
        </div>
      </motion.div>
    </div>
  );
}
