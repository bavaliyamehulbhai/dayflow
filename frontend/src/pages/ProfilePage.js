import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { authAPI, badgesAPI, dashboardAPI } from '../utils/api';
import ActivityHeatmapYear from '../components/ActivityHeatmapYear';
import ActivityTimeline from '../components/ActivityTimeline';
import ProductivityCircle from '../components/ProductivityCircle';
import SessionManager from '../components/profile/SessionManager';
import ActivityTags from '../components/ActivityTags';
import toast from 'react-hot-toast';
import { format, differenceInDays } from 'date-fns';
import {
  User, Lock, Timer, BarChart2, Medal, Shield, Zap, Trophy,
  CheckCircle2, Flame, Clock, Brain, Coffee, Trees, Save,
  Star, Edit3, Camera, Target, Activity, TrendingUp, Award,
  BookOpen, LogOut, Download, ChevronRight, Sparkles, AlertCircle, ChevronDown,
  ShieldCheck, ShieldAlert, Fingerprint, Eye, EyeOff,
  Palette, Sun, Moon
} from 'lucide-react';
import { useZenTheme } from '../hooks/useZenTheme';
import ConfirmDialog from '../components/ConfirmDialog';
import SensitivityShield from '../components/layout/SensitivityShield';

function useWindowWidth() {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return w;
}

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'pomodoro', label: 'Focus', icon: Timer },
  { id: 'stats', label: 'Stats', icon: BarChart2 },
  { id: 'badges', label: 'Badges', icon: Medal },
];

const AVATAR_GRADIENTS = {
  purple: 'linear-gradient(135deg,#7c6dfa,#b76dfa)',
  rose: 'linear-gradient(135deg,#fa6d8a,#fa9a6d)',
  teal: 'linear-gradient(135deg,#6dfacc,#6daafa)',
  gold: 'linear-gradient(135deg,#fad96d,#fa9a6d)',
  blue: 'linear-gradient(135deg,#6daafa,#6dfaed)',
  pink: 'linear-gradient(135deg,#e96dfa,#fa6d8a)',
  green: 'linear-gradient(135deg,#6dfacc,#7c6dfa)',
  orange: 'linear-gradient(135deg,#fa9a6d,#fad96d)',
};

const TIER_CONFIG = {
  bronze: { label: 'Bronze', color: '#cd7f32', glow: 'rgba(205,127,50,0.35)', gradient: 'linear-gradient(135deg,#cd7f32,#b8650a)' },
  silver: { label: 'Silver', color: '#a8a9ad', glow: 'rgba(168,169,173,0.35)', gradient: 'linear-gradient(135deg,#c0c0c0,#a8a9ad)' },
  gold: { label: 'Gold', color: '#ffd700', glow: 'rgba(255,215,0,0.35)', gradient: 'linear-gradient(135deg,#ffd700,#ffaa00)' },
  platinum: { label: 'Platinum', color: '#e5e4e2', glow: 'rgba(229,228,226,0.45)', gradient: 'linear-gradient(135deg,#e5e4e2,#9fa0a3)' },
};

function showBadgeToast(badge) {
  const tier = TIER_CONFIG[badge.tier] || TIER_CONFIG.bronze;
  toast.custom((t) => (
    <motion.div
      initial={{ opacity: 0, y: 60, scale: 0.85 }}
      animate={{ opacity: t.visible ? 1 : 0, y: t.visible ? 0 : 60, scale: t.visible ? 1 : 0.85 }}
      style={{
        background: 'linear-gradient(135deg,#1a1a2e,#0f0f1e)', border: `1.5px solid ${tier.color}66`,
        borderRadius: 18, padding: 'var(--space-4) var(--space-6)', display: 'flex', alignItems: 'center', gap: 16,
        boxShadow: `0 16px 48px rgba(0,0,0,0.6),0 0 24px ${tier.glow}`, minWidth: 300, maxWidth: 360, cursor: 'pointer',
      }}
      onClick={() => toast.dismiss(t.id)}
    >
      <div style={{ fontSize: 44, filter: `drop-shadow(0 0 12px ${tier.color})`, flexShrink: 0 }}>{badge.icon}</div>
      <div>
        <div style={{ fontSize: 10, fontWeight: 800, color: tier.color, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>
          🏅 Achievement Unlocked · {tier.label}
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, color: 'white', lineHeight: 1.2 }}>{badge.name}</div>
        <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{badge.description}</div>
      </div>
    </motion.div>
  ), { duration: 5000, position: 'bottom-right' });
}

// ── Animated SVG ring (productivity score) ───────────────────────────────────
function ScoreRing({ score, size = 120 }) {
  const r = (size / 2) - 12;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 80 ? '#6dfacc' : score >= 50 ? '#fad96d' : '#fa6d8a';
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface2)" strokeWidth={10} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${dash} ${circ}` }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 'var(--fs-xl)', fontWeight: 900, fontFamily: 'Syne, sans-serif', color }}>{score}</div>
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Score</div>
      </div>
    </div>
  );
}


export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const [accent, setAccent] = useZenTheme();
  const navigate = useNavigate();
  const width = useWindowWidth();
  const isMobile = width <= 768;
  const bioRef = useRef(null);

  const [activeTab, setActiveTab] = useState('profile');
  const [editingBio, setEditingBio] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    avatarGradient: user?.avatarGradient || 'purple',
    pomodoroWork: user?.preferences?.pomodoroWork || 25,
    pomodoroBreak: user?.preferences?.pomodoroBreak || 5,
    pomodoroLong: user?.preferences?.pomodoroLong || 15
  });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwStrength, setPwStrength] = useState(0);
  const [showGradientPicker, setShowGradientPicker] = useState(false);

  const [selectedDayData, setSelectedDayData] = useState({ date: null, log: null });
  const [confirmDialog, setConfirmDialog] = useState({ open: false });

  // Fetch badges
  const { data: badgeData, refetch: refetchBadges } = useQuery({
    queryKey: ['badges'],
    queryFn: () => badgesAPI.get().then(r => r.data),
  });

  // Fetch 12-month activity with analytics
  const { data: activityResponse } = useQuery({
    queryKey: ['activity12m'],
    queryFn: () => dashboardAPI.getActivity12m().then(r => r.data),
    initialData: { logs: [], analytics: {} }
  });

  const { data: securityHistory } = useQuery({
    queryKey: ['securityHistory'],
    queryFn: () => authAPI.getSecurityHistory().then(r => r.data),
    initialData: { logs: [] }
  });

  const activityData = activityResponse.logs || [];
  const analytics = activityResponse.analytics || {};

  // ── Activity Stats Calculation ─────────────────────────────────────────────
  const activityStats = useMemo(() => {
    if (!activityData?.length) return { totalSubmissions: 0, activeDays: 0, maxStreak: 0 };

    let totalSubmissions = 0;
    const dates = activityData.map(l => {
      totalSubmissions += (l.tasksCompleted || 0) + (l.pomodoros || 0) + (l.habitsCompleted || 0) + (l.notesCreated || 0);
      return new Date(l.date);
    }).sort((a, b) => a - b);

    let maxStreak = 0;
    let currentStreak = 0;

    if (dates.length > 0) {
      currentStreak = 1;
      maxStreak = 1;
      for (let i = 1; i < dates.length; i++) {
        const diff = (dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24);
        if (Math.round(diff) === 1) {
          currentStreak++;
          maxStreak = Math.max(maxStreak, currentStreak);
        } else {
          currentStreak = 1;
        }
      }
    }

    return { totalSubmissions, activeDays: activityData.length, maxStreak };
  }, [activityData]);

  useEffect(() => {
    badgesAPI.check().then(r => {
      (r.data.newBadges || []).forEach(b => showBadgeToast(b));
      if ((r.data.newBadges || []).length > 0) refetchBadges();
    }).catch(() => { });
  }, []);

  const checkStrength = (pw) => {
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    setPwStrength(s);
  };

  const profileMutation = useMutation({
    mutationFn: (data) => authAPI.updateProfile(data),
    onSuccess: (r) => { updateUser(r.data.user); toast.success('Profile saved! ✨'); setEditingBio(false); },
    onError: (e) => toast.error(e.response?.data?.error || 'Update failed')
  });

  const passwordMutation = useMutation({
    mutationFn: (data) => authAPI.changePassword(data),
    onSuccess: () => { toast.success('Password updated! 🔐'); setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); setPwStrength(0); },
    onError: (e) => toast.error(e.response?.data?.error || 'Password change failed')
  });

  const handleProfileSave = (e) => {
    e?.preventDefault();
    profileMutation.mutate({
      name: profileForm.name,
      bio: profileForm.bio,
      avatarGradient: profileForm.avatarGradient,
      preferences: {
        pomodoroWork: parseInt(profileForm.pomodoroWork),
        pomodoroBreak: parseInt(profileForm.pomodoroBreak),
        pomodoroLong: parseInt(profileForm.pomodoroLong)
      }
    });
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) return toast.error('Passwords do not match');
    if (pwStrength < 2) return toast.error('Please use a stronger password');
    passwordMutation.mutate({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
  };

  const handleExportData = async () => {
    try {
      const res = await authAPI.exportData();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `dayflow_export_${user._id}.json`);
      document.body.appendChild(link);
      link.click();
      toast.success('Data exported successfully! 📂');
    } catch (err) {
      toast.error('Export failed');
    }
  };

  const handleDeleteAccount = async () => {
    setConfirmDialog({
      open: true,
      title: 'Danger Zone',
      message: 'WARNING: This will permanently delete your account and ALL associated data. This action CANNOT BE UNDONE. Are you absolutely sure?',
      confirmText: 'Permanently Delete',
      onConfirm: async () => {
        try {
          await authAPI.deleteAccount();
          toast.success('Account deleted. We will miss you! 👋');
          logout();
          navigate('/login');
        } catch (err) {
          toast.error('Deletion failed');
        }
      }
    });
  };

  // ── Computed values ────────────────────────────────────────────────────────
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  const memberSince = user?.createdAt ? format(new Date(user.createdAt), 'MMM d, yyyy') : '—';
  const memberDays = user?.createdAt ? differenceInDays(new Date(), new Date(user.createdAt)) : 0;
  const avatarGrad = AVATAR_GRADIENTS[profileForm.avatarGradient] || AVATAR_GRADIENTS.purple;

  const tasksCompleted = user?.stats?.tasksCompleted || 0;
  const totalPomodoros = user?.stats?.totalPomodoros || 0;
  const focusMinutes = user?.stats?.totalFocusMinutes || 0;
  const longestStreak = user?.stats?.longestStreak || 0;
  const currentStreak = user?.stats?.currentStreak || 0;

  // Productivity Score: composite 0-100
  const earnedCount = badgeData?.count || 0;
  const totalBadges = badgeData?.total || 15;
  const catalogue = badgeData?.catalogue || [];
  const byTier = ['bronze', 'silver', 'gold', 'platinum'].map(tier => ({
    tier, badges: catalogue.filter(b => b.tier === tier)
  }));

  const productivityScore = Math.min(100, Math.round(
    (Math.min(tasksCompleted, 100) / 100) * 35 +
    (Math.min(focusMinutes / 60, 50) / 50) * 30 +
    (Math.min(longestStreak, 30) / 30) * 20 +
    (earnedCount / totalBadges) * 15
  ));

  // Profile completeness
  const profileFields = [
    !!user?.name, !!user?.bio, user?.avatarGradient !== 'purple',
    tasksCompleted > 0, totalPomodoros > 0
  ];
  const completeness = Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100);

  const strengthColors = ['var(--red)', 'var(--orange)', 'var(--yellow)', 'var(--green)'];
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];

  // Security Health Calculation
  const securityHealth = useMemo(() => {
    let score = 0;
    const checks = [
      { id: 'verified', label: 'Email Verified', status: user?.isVerified, weight: 30 },
      { id: '2fa', label: '2FA Protection', status: user?.twoFactorEnabled, weight: 40 },
      { id: 'password', label: 'Recent Password', status: true, weight: 30 }, // Simplified
    ];

    checks.forEach(c => { if (c.status) score += c.weight; });

    return { score, checks };
  }, [user]);

  return (
    <div className="responsive-container pb-20">
      
      {/* ─── IDENTITY HERO ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="premium-card aura-iridescent"
        style={{
          marginBottom: 32, 
          padding: isMobile ? '32px 24px' : '48px 64px',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: 40,
          position: 'relative',
          overflow: 'visible'
        }}
      >
        <div className="btn-glint" style={{ opacity: 0.1 }} />
        
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: 'center',
          gap: isMobile ? 32 : 48,
          position: 'relative',
          zIndex: 10,
          textAlign: isMobile ? 'center' : 'left'
        }}>
          {/* Avatar Section */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              style={{
                width: isMobile ? 100 : 160, 
                height: isMobile ? 100 : 160, 
                borderRadius: '50%',
                background: avatarGrad, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontFamily: 'Syne, sans-serif', 
                fontWeight: 800, 
                fontSize: isMobile ? '40px' : '64px',
                color: 'white', 
                boxShadow: `0 20px 60px ${profileForm.avatarGradient === 'purple' ? 'rgba(124,109,250,0.5)' : 'rgba(0,0,0,0.3)'}`,
                cursor: 'pointer',
                border: '4px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)'
              }}
              onClick={() => setShowGradientPicker(v => !v)}
            >
              <div style={{ position: 'absolute', inset: -8, border: '1.5px solid rgba(255,255,255,0.05)', borderRadius: '50%' }} />
              {initials}
              <div style={{ position: 'absolute', bottom: 8, right: 8, width: 32, height: 32, borderRadius: '50%', background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                <Edit3 size={14} color="var(--text)" />
              </div>
            </motion.div>

            {/* Gradient Picker */}
            <AnimatePresence>
              {showGradientPicker && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 12, x: isMobile ? '-50%' : 0 }} 
                  animate={{ opacity: 1, scale: 1, y: 0, x: isMobile ? '-50%' : 0 }} 
                  exit={{ opacity: 0, scale: 0.9, y: 12, x: isMobile ? '-50%' : 0 }}
                  style={{ 
                    position: 'absolute', 
                    top: '110%', 
                    left: isMobile ? '50%' : 0, 
                    background: 'rgba(15, 15, 25, 0.95)', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: 24, 
                    padding: 16, 
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 12, 
                    width: 200, 
                    zIndex: 1000, 
                    boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
                    backdropFilter: 'blur(20px)'
                  }}
                >
                  {Object.entries(AVATAR_GRADIENTS).map(([key, grad]) => (
                    <button
                      key={key}
                      onClick={() => { setProfileForm(f => ({ ...f, avatarGradient: key })); setShowGradientPicker(false); }}
                      style={{ width: 34, height: 34, borderRadius: '50%', background: grad, border: profileForm.avatarGradient === key ? '2.5px solid white' : 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: isMobile ? 'center' : 'flex-start', marginBottom: 8 }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: isMobile ? '32px' : '48px', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, color: 'white' }}>
                {user?.name}
              </div>
              {earnedCount >= 5 && (
                <div style={{ 
                  background: 'linear-gradient(135deg, #ffd700, #ffaa00)', 
                  color: 'black', padding: '4px 12px', borderRadius: 50, 
                  fontSize: 10, fontWeight: 900, letterSpacing: 1.5,
                  boxShadow: '0 4px 15px rgba(255,215,0,0.3)'
                }}>ZENITH ADHERENT</div>
              )}
            </div>

            <div
              style={{
                fontSize: 16,
                color: user?.bio ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                justifyContent: isMobile ? 'center' : 'flex-start',
                fontStyle: user?.bio ? 'normal' : 'italic'
              }}
              onClick={() => setEditingBio(true)}
            >
              {user?.bio || 'Initialize your personality core...'}
              <Edit3 size={14} style={{ opacity: 0.5 }} />
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap', justifyContent: isMobile ? 'center' : 'flex-start' }}>
              <div className="glass-badge" style={{ padding: '8px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', color: 'var(--green)', fontSize: 11, fontWeight: 800 }}>
                <Zap size={12} style={{ marginRight: 8 }} /> {memberDays} CYCLES
              </div>
              <div className="glass-badge" style={{ padding: '8px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', color: 'var(--accent)', fontSize: 11, fontWeight: 800 }}>
                <Trophy size={12} style={{ marginRight: 8 }} /> {earnedCount} ACHIEVEMENTS
              </div>
              <div className="glass-badge" style={{ padding: '8px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', color: '#ff4d7d', fontSize: 11, fontWeight: 800 }}>
                <Flame size={12} style={{ marginRight: 8 }} /> {currentStreak}D STREAK
              </div>
            </div>
          </div>

          {!isMobile && (
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase' }}>Cognitive Score</div>
              <div style={{ fontSize: 48, fontFamily: 'Syne', fontWeight: 800, lineHeight: 1, color: productivityScore > 80 ? 'var(--green)' : 'var(--text)' }}>
                {productivityScore}<span style={{ fontSize: 20, opacity: 0.3, marginLeft: 2 }}>/100</span>
              </div>
              <div className="glass-badge" style={{ background: 'rgba(255,255,255,0.05)', padding: '6px 12px', fontSize: 10, fontWeight: 800, color: 'var(--muted)' }}>RANK: ASCENDANT</div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ─── TAB NAVIGATION ────────────────────────────────────────────────── */}
      <div style={{ 
        display: 'flex', 
        gap: 8, 
        marginBottom: 40, 
        padding: 6, 
        borderRadius: 24, 
        background: 'rgba(255,255,255,0.03)', 
        border: '1px solid rgba(255,255,255,0.05)',
        width: 'fit-content',
        margin: '0 auto 40px',
        overflowX: 'auto',
        scrollbarWidth: 'none'
      }}>
        {TABS.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="haptic-tap"
              style={{
                padding: isMobile ? '12px 16px' : '14px 28px',
                borderRadius: 20,
                border: 'none',
                background: active ? 'white' : 'transparent',
                color: active ? 'black' : 'var(--muted)',
                fontWeight: 800,
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                whiteSpace: 'nowrap',
                boxShadow: active ? '0 10px 20px rgba(255,255,255,0.1)' : 'none'
              }}
            >
              <tab.icon size={18} strokeWidth={active ? 2.5 : 2} />
              <span className={isMobile && !active ? 'hide' : ''}>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── TAB CONTENT ───────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>

          {/* ── PROFILE ─────────────────────────────── */}
          {activeTab === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              
              {/* Bio Editor (Overlay-like when active) */}
              <AnimatePresence>
                {editingBio && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="premium-card aura-iridescent"
                    style={{ padding: 32, borderRadius: 32, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(20, 20, 30, 0.95)', backdropFilter: 'blur(30px)' }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--muted)', letterSpacing: 2, marginBottom: 20, textTransform: 'uppercase' }}>Update Personality Core</div>
                    <textarea 
                      className="auth-input"
                      rows={4}
                      value={profileForm.bio}
                      onChange={e => setProfileForm(f => ({ ...f, bio: e.target.value.slice(0, 250) }))}
                      placeholder="Declare your identity..."
                      style={{ fontSize: 15, borderRadius: 20, padding: 20, minHeight: 120, marginBottom: 20 }}
                      autoFocus
                    />
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                      <button className="btn glass haptic-tap" onClick={() => setEditingBio(false)} style={{ borderRadius: 14, padding: '0 24px', height: 48, fontWeight: 800 }}>Cancel</button>
                      <button className="auth-button haptic-tap" onClick={handleProfileSave} style={{ width: 'auto', padding: '0 32px', height: 48, fontSize: 14 }}>
                        <div className="btn-glint" /> Save Bio
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="premium-card" style={{ padding: isMobile ? 24 : 40, borderRadius: 32, border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
                  <User size={20} className="text-accent" />
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'white', letterSpacing: -0.5 }}>Identity Parameters</div>
                </div>
                
                <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div className="form-group">
                    <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10, display: 'block' }}>Legal Designation</label>
                    <input className="auth-input" value={profileForm.name} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name" style={{ height: 56, borderRadius: 16 }} />
                  </div>
                  
                  <div className="form-group">
                    <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10, display: 'block' }}>Communication Channel</label>
                    <div style={{ position: 'relative' }}>
                      <input className="auth-input" value={user?.email || ''} disabled style={{ height: 56, borderRadius: 16, borderStyle: 'dashed', opacity: 0.6 }} />
                      <div style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 900, color: 'var(--muted)', border: '1px solid rgba(255,255,255,0.1)' }}>VERIFIED</div>
                    </div>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <button type="submit" className="auth-button haptic-tap" disabled={profileMutation.isPending} style={{ width: isMobile ? '100%' : 220, height: 56, fontSize: 15 }}>
                      <div className="btn-glint" />
                      {profileMutation.isPending ? 'Syncing...' : <><Save size={18} style={{ marginRight: 10 }} /> Update Identity</>}
                    </button>
                  </div>
                </form>
              </div>

              {/* Growth Stats card */}
              <div className="premium-card aura-iridescent" style={{ padding: isMobile ? 24 : 40, borderRadius: 32, border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
                  <TrendingUp size={20} className="text-accent2" />
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'white', letterSpacing: -0.5 }}>Expansion Metrics</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 24 }}>
                  {[
                    { label: 'Tasks Mastered', value: tasksCompleted, target: 500, icon: Target, color: '#7c6dfa' },
                    { label: 'Deep Focus (hrs)', value: Math.floor(focusMinutes / 60), target: 100, icon: Clock, color: '#22c55e' },
                    { label: 'Active Streak (days)', value: currentStreak, target: 30, icon: Flame, color: '#f59e0b' },
                    { label: 'Rituals Maintained', value: analytics.habitsTotal || 0, target: 100, icon: Zap, color: '#ec4899' },
                  ].map((s, i) => {
                    const progress = Math.min(100, (s.value / s.target) * 100);
                    return (
                      <div key={i} className="glass" style={{ padding: 24, borderRadius: 24, border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${s.color}33` }}>
                              <s.icon size={18} style={{ color: s.color }} />
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{s.label}</span>
                          </div>
                          <span style={{ fontSize: 24, fontWeight: 900, fontFamily: 'Syne', color: s.color }}>{s.value}</span>
                        </div>
                        <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 10, overflow: 'hidden' }}>
                          <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ width: `${progress}%` }} 
                            style={{ height: '100%', background: s.color, borderRadius: 10, boxShadow: `0 0 15px ${s.color}44` }} 
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 10, color: 'var(--muted)', fontWeight: 900, letterSpacing: 1 }}>
                          <span>LVL 14</span>
                          <span>{Math.round(progress)}% TO ASCENSION</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Danger zone */}
              <div className="premium-card" style={{ padding: 24, borderRadius: 24, border: '1px solid rgba(255,107,107,0.1)', background: 'rgba(255,107,107,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: 1.5 }}>System Override</div>
                </div>
                <button
                  className="btn glass haptic-tap"
                  onClick={() => { logout(); navigate('/login'); }}
                  style={{ color: 'var(--red)', border: '1px solid rgba(255,107,107,0.2)', height: 48, borderRadius: 14, fontSize: 13, width: isMobile ? '100%' : 'auto', padding: '0 24px', fontWeight: 700 }}
                >
                  <LogOut size={16} /> Disconnect from All Channels
                </button>
              </div>
            </div>
          )}

          {/* ── SECURITY ─────────────────────────────── */}
          {activeTab === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              
              <div className="premium-card aura-iridescent" style={{ padding: isMobile ? 24 : 40, borderRadius: 32, border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
                  <Lock size={20} className="text-accent2" />
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'white', letterSpacing: -0.5 }}>Access Protocol</div>
                </div>
                
                <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div className="form-group">
                    <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10, display: 'block' }}>Current Cipher</label>
                    <input type="password" className="auth-input" value={pwForm.currentPassword} onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))} required autoComplete="current-password" style={{ height: 56, borderRadius: 16 }} />
                  </div>
                  
                  <div className="form-group">
                    <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10, display: 'block' }}>New Cipher Initiation</label>
                    <input type="password" className="auth-input" value={pwForm.newPassword} onChange={e => { setPwForm(f => ({ ...f, newPassword: e.target.value })); checkStrength(e.target.value); }} minLength={8} required autoComplete="new-password" style={{ height: 56, borderRadius: 16 }} />
                    {pwForm.newPassword && (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                          {[0, 1, 2, 3].map(i => <div key={i} style={{ flex: 1, height: 4, borderRadius: 4, background: i < pwStrength ? strengthColors[pwStrength - 1] : 'rgba(255,255,255,0.05)', transition: 'all 0.3s' }} />)}
                        </div>
                        <span style={{ fontSize: 11, color: pwStrength > 0 ? strengthColors[pwStrength - 1] : 'var(--muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>Entropy: {pwStrength > 0 ? strengthLabels[pwStrength - 1] : 'Analyzing...'}</span>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10, display: 'block' }}>Confirm New Cipher</label>
                    <input type="password" className="auth-input" value={pwForm.confirmPassword} onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))} required autoComplete="new-password"
                      style={{ height: 56, borderRadius: 16, borderColor: pwForm.confirmPassword && pwForm.confirmPassword !== pwForm.newPassword ? 'rgba(255,107,107,0.5)' : undefined }} />
                    {pwForm.confirmPassword && pwForm.confirmPassword !== pwForm.newPassword && (
                      <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 8, fontWeight: 700 }}>Mismatch detected in sequence</div>
                    )}
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <button type="submit" className="auth-button haptic-tap" disabled={passwordMutation.isPending} style={{ width: isMobile ? '100%' : 220, height: 56, fontSize: 15 }}>
                      <div className="btn-glint" />
                      {passwordMutation.isPending ? 'Recalibrating...' : <><Shield size={18} style={{ marginRight: 10 }} /> Finalize Protocol</>}
                    </button>
                  </div>
                </form>
              </div>

              <div className="premium-card" style={{ padding: isMobile ? 24 : 40, borderRadius: 32, border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(130,114,255,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <ShieldCheck size={20} className="text-accent" />
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'white', letterSpacing: -0.5 }}>Fortress Integrity</div>
                  </div>
                  <div style={{ fontSize: 32, fontWeight: 900, fontFamily: 'Syne', color: securityHealth.score >= 70 ? 'var(--green)' : 'var(--orange)' }}>{securityHealth.score}%</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 16, marginBottom: 40 }}>
                  {securityHealth.checks.map(c => (
                    <div key={c.id} className="glass" style={{ padding: '16px 20px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.02)' }}>
                      {c.status ? <CheckCircle2 size={18} color="var(--green)" /> : <AlertCircle size={18} color="var(--orange)" />}
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{c.label}</span>
                    </div>
                  ))}
                </div>

                <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 20, display: 'block' }}>Neutralization Logs</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {securityHistory.logs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 32, color: 'var(--muted)', fontSize: 14, fontStyle: 'italic' }}>No intercepted threats recorded</div>
                  ) : (
                    securityHistory.logs.slice(0, 5).map((log, i) => (
                      <div key={i} className="glass" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', background: 'rgba(255,255,255,0.01)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.03)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <Shield size={14} style={{ color: log.status === 'success' ? 'var(--green)' : 'var(--red)' }} />
                          <span style={{ fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>{log.action.replace('_', ' ')}</span>
                          <span style={{ color: 'var(--muted)', fontSize: 11, fontWeight: 600 }}>IP: {log.ip || '0.0.0.0'}</span>
                        </div>
                        <div style={{ color: 'var(--muted)', fontSize: 11, fontWeight: 800 }}>{format(new Date(log.createdAt), 'MMM d, HH:mm')}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="premium-card" style={{ padding: 24, borderRadius: 32, border: '1px solid rgba(255,255,255,0.05)' }}>
                <SessionManager />
              </div>

              <div className="premium-card" style={{ padding: 24, borderRadius: 32, border: '1px solid rgba(34,197,94,0.1)', background: 'rgba(34,197,94,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                  <Shield size={18} className="text-green" />
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: 1.5 }}>Active Protocols</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                  {[
                    { label: 'Cloud Synchrony', value: 'Active', icon: '☁️' },
                    { label: 'Brute-Force Shield', value: 'Engaged', icon: '🔒' },
                    { label: 'Session Integrity', value: 'Validated', icon: '⏱' },
                    { label: 'Injection Sanitizer', value: 'Total', icon: '🛡️' },
                    { label: 'Entropy Vault', value: 'Bcrypt 12', icon: '🔑' },
                    { label: 'Encryption Engine', value: 'AES-256', icon: '🔐' },
                  ].map(s => (
                    <div key={s.label} className="glass" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, fontWeight: 600 }}>{s.icon} {s.label}</span>
                      <span style={{ fontWeight: 900, color: 'var(--green)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="premium-card" style={{ padding: 32, borderRadius: 32, border: '1px solid rgba(124,109,250,0.1)', background: 'rgba(124,109,250,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <Fingerprint size={18} className="text-accent" />
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'white', textTransform: 'uppercase', letterSpacing: 1.5 }}>Cognitive Privacy</div>
                </div>
                <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 24, lineHeight: 1.6 }}>
                  You retain total dominance over your data. Export your consciousness or initiate a total purge at any time.
                </p>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <button onClick={handleExportData} className="btn glass haptic-tap" style={{ flex: 1, minWidth: 200, height: 50, fontSize: 13, borderRadius: 14, fontWeight: 800 }}>
                    <Download size={16} /> Export Consciousness (.json)
                  </button>
                  <button onClick={handleDeleteAccount} className="btn haptic-tap" style={{ flex: 1, minWidth: 200, height: 50, fontSize: 13, borderRadius: 14, fontWeight: 800, background: 'rgba(255,107,107,0.1)', color: 'var(--red)', border: '1px solid rgba(255,107,107,0.2)' }}>
                    <AlertCircle size={16} /> Permanent Deletion
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── APPEARANCE ────────────────────────────── */}
          {activeTab === 'appearance' && (
            <div className="premium-card aura-iridescent" style={{ padding: isMobile ? 24 : 40, borderRadius: 32, border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
                <Palette size={20} className="text-accent" />
                <div style={{ fontSize: 18, fontWeight: 800, color: 'white', letterSpacing: -0.5 }}>Atmospheric Protocol</div>
              </div>
              
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', marginBottom: 40, lineHeight: 1.6, maxWidth: 600 }}>
                Calibrate your neural interface with a custom spectrum. Changes are synchronized across your consciousness.
              </p>

              <div style={{ marginBottom: 40 }}>
                <label style={{ fontSize: 12, fontWeight: 900, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 20, display: 'block' }}>Neutralized Spectrum</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 20 }}>
                  {[
                    { name: 'DayFlow', color: '#8272ff' },
                    { name: 'Sunset', color: '#ff6b8b' },
                    { name: 'Emerald', color: '#5ffad1' },
                    { name: 'Gold', color: '#fad96d' },
                    { name: 'Amber', color: '#ff9a6d' },
                    { name: 'Sapphire', color: '#4facfe' },
                    { name: 'Iris', color: '#a78bfa' },
                    { name: 'Crimson', color: '#fb7185' },
                  ].map(p => (
                    <div key={p.color} style={{ textAlign: 'center' }}>
                      <motion.button
                        whileHover={{ scale: 1.1, y: -4 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setAccent(p.color)}
                        style={{
                          width: '100%',
                          aspectRatio: '1',
                          background: p.color,
                          border: '4px solid rgba(255,255,255,0.1)',
                          borderRadius: 20,
                          cursor: 'pointer',
                          boxShadow: accent === p.color ? `0 15px 35px ${p.color}44` : 'none',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        {accent === p.color && (
                          <motion.div 
                            layoutId="accent-check"
                            style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.2)' }}
                          >
                            <CheckCircle2 size={24} color="white" />
                          </motion.div>
                        )}
                        <div className="btn-glint" />
                      </motion.button>
                      <div style={{ marginTop: 10, fontSize: 11, fontWeight: 800, color: accent === p.color ? 'white' : 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{p.name}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass" style={{ padding: 24, borderRadius: 24, border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Moon size={20} className="text-accent" />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'white' }}>Luminosity Mode</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>Zenith is optimized for deep work in low-light environments.</div>
                  </div>
                </div>
                <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--accent)', background: 'rgba(130,114,255,0.1)', padding: '6px 12px', borderRadius: 10, border: '1px solid rgba(130,114,255,0.2)' }}>PERMANENT DARK</div>
              </div>

              <div className="card" style={{ background: 'var(--surface2)', border: '1px dashed var(--border)', padding: '24px', textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>Current Atmosphere</div>
                <div style={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 24,
                  fontWeight: 900,
                  color: 'var(--accent)',
                  textShadow: '0 0 20px var(--accent-glow)'
                }}>
                  Vibrant Productivity
                </div>
              </div>
            </div>
          )}

          {/* ── FOCUS ─────────────────────────────────── */}
          {activeTab === 'pomodoro' && (
            <div className="premium-card aura-iridescent" style={{ padding: isMobile ? 24 : 40, borderRadius: 32, border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
                <Timer size={20} className="text-green" />
                <div style={{ fontSize: 18, fontWeight: 800, color: 'white', letterSpacing: -0.5 }}>Temporal Calibration</div>
              </div>
              
              <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
                {[
                  { key: 'pomodoroWork', label: 'Neural Focus Depth', hint: 'Deep integration period', icon: Brain, color: '#7c6dfa', max: 90 },
                  { key: 'pomodoroBreak', label: 'Cognitive Recovery', hint: 'Short system cooldown', icon: Coffee, color: '#22c55e', max: 30 },
                  { key: 'pomodoroLong', label: 'Buffer Expansion', hint: 'Extended recalibration', icon: Trees, color: '#4facfe', max: 60 },
                ].map(f => (
                  <div key={f.key} className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                          <f.icon size={18} style={{ color: f.color }} />
                          <label style={{ fontSize: 14, fontWeight: 800, color: 'white' }}>{f.label}</label>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>{f.hint}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontFamily: 'Syne', fontSize: 32, fontWeight: 900, color: f.color, lineHeight: 1 }}>{profileForm[f.key]}</span>
                        <span style={{ fontSize: 12, fontWeight: 900, color: 'var(--muted)', marginLeft: 4, textTransform: 'uppercase' }}>MIN</span>
                      </div>
                    </div>
                    
                    <div style={{ position: 'relative', height: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(profileForm[f.key] / f.max) * 100}%` }}
                        style={{ height: '100%', background: f.color, borderRadius: 20, boxShadow: `0 0 15px ${f.color}44` }} 
                      />
                      <input 
                        type="range" min={1} max={f.max} 
                        value={profileForm[f.key]} 
                        onChange={e => setProfileForm(p => ({ ...p, [f.key]: parseInt(e.target.value) }))} 
                        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 10, width: '100%' }} 
                      />
                    </div>
                  </div>
                ))}

                <div className="glass" style={{ padding: 24, borderRadius: 24, border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 20, background: 'rgba(130,114,255,0.03)' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 16, background: 'rgba(130,114,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Sparkles size={24} className="text-accent" />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 900, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>Neural Sequence Total</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'white' }}>
                      {4 * profileForm.pomodoroWork + 3 * profileForm.pomodoroBreak + profileForm.pomodoroLong} Minutes of Optimized Focus
                    </div>
                  </div>
                </div>

                <button type="submit" className="auth-button haptic-tap" disabled={profileMutation.isPending} style={{ width: isMobile ? '100%' : 240 }}>
                  <div className="btn-glint" />
                  {profileMutation.isPending ? 'Syncing...' : <><Save size={18} style={{ marginRight: 10 }} /> Store Protocol</>}
                </button>
              </form>
            </div>
          )}

          {/* ── STATS ─────────────────────────────────── */}
          {activeTab === 'stats' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              
              <div className="premium-card aura-iridescent" style={{ padding: isMobile ? 24 : 40, borderRadius: 32, border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', alignItems: 'center' }}>
                  <ScoreRing score={productivityScore} size={isMobile ? 120 : 160} />
                  <div style={{ flex: 1, minWidth: 280 }}>
                    <div style={{ fontSize: 12, fontWeight: 900, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Composite Efficiency</div>
                    <div style={{ fontFamily: 'Syne', fontSize: 32, fontWeight: 800, color: 'white', marginBottom: 16 }}>Productivity Score</div>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '20px 32px' }}>
                      {[
                        { label: 'Tasks (35%)', val: Math.min(tasksCompleted, 100) / 100 * 35, max: 35, color: '#7c6dfa' },
                        { label: 'Focus (30%)', val: Math.min(focusMinutes / 60, 50) / 50 * 30, max: 30, color: '#22c55e' },
                        { label: 'Streak (20%)', val: Math.min(longestStreak, 30) / 30 * 20, max: 20, color: '#f59e0b' },
                        { label: 'Badges (15%)', val: (earnedCount / totalBadges) * 15, max: 15, color: '#ffd700' },
                      ].map(b => (
                        <div key={b.label}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            <span>{b.label}</span><span style={{ color: b.color }}>{Math.round(b.val)}/{b.max}</span>
                          </div>
                          <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 10, overflow: 'hidden' }}>
                            <motion.div initial={{ width: 0 }} animate={{ width: `${(b.val / b.max) * 100}%` }} style={{ height: '100%', background: b.color, borderRadius: 10, boxShadow: `0 0 10px ${b.color}44` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 16 }}>
                {[
                  { label: 'Pomodoros', value: totalPomodoros, icon: '🍅', color: '#7c6dfa' },
                  { label: 'Focus Time', value: `${Math.floor(focusMinutes / 60)}h`, icon: '⏱', color: '#22c55e' },
                  { label: 'Tasks Done', value: tasksCompleted, icon: '✅', color: '#4facfe' },
                  { label: 'Best Streak', value: `${longestStreak}d`, icon: '🔥', color: '#f59e0b' },
                ].map((s, i) => (
                  <motion.div key={i} whileHover={{ y: -5 }} className="premium-card" style={{ padding: 24, borderRadius: 24, textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: 24, marginBottom: 12 }}>{s.icon}</div>
                    <div style={{ fontFamily: 'Syne', fontSize: 28, fontWeight: 900, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 4 }}>{s.label}</div>
                  </motion.div>
                ))}
              </div>

              <div style={{ gridTemplateColumns: isMobile ? '1fr' : '1fr 320px', display: 'grid', gap: 24 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div className="premium-card" style={{ padding: isMobile ? 20 : 32, borderRadius: 32, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: 'white' }}>Neural Activity Map</div>
                      <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Last 365 Cycles</div>
                    </div>
                    <ActivityHeatmapYear data={activityData} isMobile={isMobile} onSelectDay={(date, log) => setSelectedDayData({ date, log })} />
                    <div style={{ marginTop: 32, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 24 }}>
                      <ActivityTimeline selectedDay={selectedDayData.date} data={selectedDayData.log} />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div className="premium-card" style={{ padding: 24, borderRadius: 24, border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(130,114,255,0.03)' }}>
                    <ProductivityCircle
                      stats={{
                        tasks: user?.stats?.tasksCompleted || 0,
                        habits: user?.stats?.habitsCompleted || 0,
                        focus: user?.stats?.totalPomodoros || 0,
                        schedule: user?.stats?.totalScheduleEvents || 0
                      }}
                    />
                  </div>
                  <div className="premium-card" style={{ padding: 24, borderRadius: 24, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <ActivityTags />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── BADGES ─────────────────────────────────── */}
          {activeTab === 'badges' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              
              <div className="premium-card aura-iridescent" style={{ padding: isMobile ? 24 : 32, borderRadius: 32, border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                  <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(255,215,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,215,0,0.2)' }}>
                    <Award size={32} color="#ffd700" />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 900, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>Neural Achievements</div>
                    <div style={{ fontFamily: 'Syne', fontSize: 32, fontWeight: 800, color: 'white' }}>
                      {earnedCount} <span style={{ fontSize: 16, color: 'var(--muted)', fontWeight: 400 }}>/ {totalBadges} UNLOCKED</span>
                    </div>
                  </div>
                </div>
                
                <div style={{ flex: 1, minWidth: 200, maxWidth: 300 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 11, fontWeight: 900, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
                    <span>Progression</span>
                    <span>{Math.round((earnedCount / totalBadges) * 100)}%</span>
                  </div>
                  <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 10, overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(earnedCount / totalBadges) * 100}%` }} style={{ height: '100%', background: 'linear-gradient(90deg, #cd7f32, #ffd700, #e5e4e2)', borderRadius: 10, boxShadow: '0 0 15px rgba(255,215,0,0.3)' }} />
                  </div>
                </div>
              </div>

              {byTier.map(({ tier, badges: tierBadges }) => {
                const tc = TIER_CONFIG[tier];
                return (
                  <div key={tier}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: tc.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 16px ${tc.glow}` }}>
                        <Star size={16} color="white" fill="white" />
                      </div>
                      <span style={{ fontWeight: 900, fontSize: 14, color: tc.color, textTransform: 'uppercase', letterSpacing: 2 }}>{tc.label} CLASSIFICATION</span>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                      {tierBadges.map((badge, i) => (
                        <motion.div
                          key={badge.id}
                          whileHover={{ y: -8, scale: 1.02 }}
                          style={{
                            padding: 24, borderRadius: 24, textAlign: 'center', position: 'relative',
                            background: badge.earned ? `linear-gradient(135deg, ${tc.color}15, transparent)` : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${badge.earned ? tc.color + '33' : 'rgba(255,255,255,0.05)'}`,
                            boxShadow: badge.earned ? `0 10px 30px ${tc.glow}` : 'none',
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{ fontSize: 48, marginBottom: 16, filter: badge.earned ? `drop-shadow(0 0 10px ${tc.color})` : 'grayscale(1) opacity(0.2)' }}>
                            {badge.earned ? badge.icon : '🔒'}
                          </div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: badge.earned ? 'white' : 'var(--muted)', marginBottom: 6 }}>
                            {badge.earned ? badge.name : 'HIDDEN LOG'}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 12 }}>
                            {badge.earned ? badge.description : 'Maintain sequence to unlock'}
                          </div>
                          {badge.earned && badge.earnedAt && (
                            <div style={{ fontSize: 10, color: tc.color, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1 }}>
                              ACQUIRED • {format(new Date(badge.earnedAt), 'MMM d')}
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </motion.div>
      </AnimatePresence>
      <ConfirmDialog {...confirmDialog} onCancel={() => setConfirmDialog({ open: false })} />
    </div>
  );
}
