import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { authAPI, badgesAPI, dashboardAPI } from '../utils/api';
import ActivityHeatmapYear from '../components/ActivityHeatmapYear';
import ActivityTimeline from '../components/ActivityTimeline';
import ProductivityCircle from '../components/ProductivityCircle';
import ActivityTags from '../components/ActivityTags';
import toast from 'react-hot-toast';
import { format, differenceInDays } from 'date-fns';
import {
  User, Lock, Timer, BarChart2, Medal, Shield, Zap, Trophy,
  CheckCircle2, Flame, Clock, Brain, Coffee, Trees, Save,
  Star, Edit3, Camera, Target, Activity, TrendingUp, Award,
  BookOpen, LogOut, Download, ChevronRight, Sparkles, AlertCircle, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

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

  return (
    <div className="responsive-container pb-10">

      {/* ─── HERO CARD ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
        style={{
          marginBottom: 20, padding: 'var(--space-6) var(--space-8)',
          background: 'linear-gradient(135deg,rgba(130,114,255,0.07),rgba(250,109,138,0.05),rgba(109,250,204,0.03))',
          border: '1px solid var(--border)', position: 'relative', overflow: 'hidden'
        }}
      >
        {/* BG orbs */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 250, height: 250, background: 'var(--accent)', opacity: 0.05, borderRadius: '50%', filter: 'blur(70px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 200, height: 200, background: 'var(--accent2)', opacity: 0.05, borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none' }} />

        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'center' : 'center',
          gap: isMobile ? 24 : 32,
          position: 'relative',
          zIndex: 1,
          textAlign: isMobile ? 'center' : 'left',
          maxWidth: 1000,
          margin: '0 auto'
        }}>
          {/* Avatar with gradient picker */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div
              style={{
                width: isMobile ? 72 : 90, height: isMobile ? 72 : 90, borderRadius: '50%',
                background: avatarGrad, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: isMobile ? 26 : 32,
                color: 'white', boxShadow: `0 8px 32px rgba(130,114,255,0.4),0 0 0 3px rgba(130,114,255,0.15)`,
                cursor: 'pointer', transition: 'transform 0.2s', position: 'relative'
              }}
              onClick={() => setShowGradientPicker(v => !v)}
            >
              {initials}
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: '50%', background: 'var(--surface)', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Camera size={11} color="var(--muted)" />
              </div>
            </div>
            {/* Online dot */}
            <div style={{ position: 'absolute', bottom: 4, left: 4, width: 12, height: 12, borderRadius: '50%', background: 'var(--green)', border: '2px solid var(--bg)', boxShadow: '0 0 8px var(--green)' }} />

            {/* Gradient picker dropdown */}
            <AnimatePresence>
              {showGradientPicker && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 8 }}
                  style={{ position: 'absolute', top: '100%', left: 0, marginTop: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 10, display: 'flex', flexWrap: 'wrap', gap: 6, width: 168, zIndex: 100, boxShadow: '0 12px 40px rgba(0,0,0,0.4)' }}
                >
                  <div style={{ width: '100%', fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>Pick Color</div>
                  {Object.entries(AVATAR_GRADIENTS).map(([key, grad]) => (
                    <button
                      key={key}
                      onClick={() => { setProfileForm(f => ({ ...f, avatarGradient: key })); setShowGradientPicker(false); }}
                      style={{ width: 28, height: 28, borderRadius: '50%', background: grad, border: profileForm.avatarGradient === key ? '2.5px solid white' : '2px solid transparent', cursor: 'pointer', boxShadow: profileForm.avatarGradient === key ? '0 0 10px rgba(255,255,255,0.4)' : 'none', transition: 'all 0.2s', flexShrink: 0 }}
                      title={key}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Name, bio, meta */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: isMobile ? 'center' : 'flex-start' }}>
              <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 'var(--fs-2xl)', fontWeight: 800, letterSpacing: -0.5 }}>
                {user?.name}
              </div>
              {earnedCount >= 5 && (
                <span className="badge badge-gold">
                  ⭐ PRO
                </span>
              )}
            </div>

            {/* Bio editable */}
            {editingBio ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
                <input
                  ref={bioRef}
                  className="input"
                  value={profileForm.bio}
                  onChange={e => setProfileForm(f => ({ ...f, bio: e.target.value.slice(0, 250) }))}
                  placeholder="Add a personal tagline..."
                  style={{ fontSize: 13, padding: '6px 12px', flex: 1, maxWidth: 320 }}
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') handleProfileSave(); if (e.key === 'Escape') setEditingBio(false); }}
                />
                <button className="btn btn-primary btn-sm" onClick={handleProfileSave} style={{ padding: '6px 14px', fontSize: 12 }}>Save</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditingBio(false)} style={{ fontSize: 12 }}>✕</button>
              </div>
            ) : (
              <div
                style={{
                  fontSize: 14,
                  color: user?.bio ? 'var(--text2)' : 'var(--muted)',
                  marginTop: 8,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  maxWidth: 420,
                  justifyContent: isMobile ? 'center' : 'flex-start'
                }}
                onClick={() => setEditingBio(true)}
              >
                <span style={{ fontStyle: !user?.bio ? 'italic' : 'normal' }}>{user?.bio || 'Add a bio or tagline...'}</span>
                <Edit3 size={13} style={{ color: 'var(--muted)', flexShrink: 0 }} />
              </div>
            )}

            {/* Meta pills */}
            <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap', justifyContent: isMobile ? 'center' : 'flex-start' }}>
              <span className="badge badge-accent">
                <Zap size={10} /> {memberDays}d member
              </span>
              <span className="badge badge-yellow">
                <Trophy size={10} /> {tasksCompleted} tasks
              </span>
              <span
                onClick={() => setActiveTab('badges')}
                className="badge"
                style={{
                  background: earnedCount > 0 ? 'rgba(255,215,0,0.1)' : 'var(--surface2)',
                  color: earnedCount > 0 ? '#ffd700' : 'var(--muted)',
                  cursor: 'pointer'
                }}
              >
                🏅 {earnedCount}/{totalBadges}
              </span>
            </div>
          </div>

          {/* Score ring */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <ScoreRing score={productivityScore} size={isMobile ? 80 : 110} />
            <div style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Productivity</div>
          </div>
        </div>

        {/* Profile completeness bar */}
        {completeness < 100 && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 20, padding: '12px 16px', background: 'var(--surface2)', borderRadius: 12, border: '1px solid var(--border)', maxWidth: 600, margin: '20px auto 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Profile Completeness</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent)' }}>{completeness}%</span>
            </div>
            <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${completeness}%` }} transition={{ duration: 1 }} style={{ height: '100%', background: 'linear-gradient(90deg,var(--accent),var(--accent2))', borderRadius: 3 }} />
            </div>
          </motion.div>
        )}

        {/* Quick action shortcuts */}
        <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap', justifyContent: isMobile ? 'center' : 'flex-start' }}>
          {[
            { label: 'Tasks', icon: Target, path: '/tasks', color: 'var(--accent)' },
            { label: 'Focus', icon: Timer, path: '/pomodoro', color: 'var(--green)' },
            { label: 'Habits', icon: Flame, path: '/habits', color: 'var(--orange)' },
            { label: 'Journal', icon: BookOpen, path: '/notes', color: 'var(--accent2)' },
          ].map(s => (
            <motion.button
              key={s.label}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(s.path)}
              className="btn btn-ghost btn-sm"
              style={{ borderRadius: 50, padding: '8px 16px', gap: 8 }}
            >
              <s.icon size={14} style={{ color: s.color }} />
              {s.label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ─── TAB BAR ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: isMobile ? 4 : 8, marginBottom: 20, background: 'var(--surface)', padding: 6, borderRadius: 16, border: '1px solid var(--border)', overflowX: 'auto', scrollbarWidth: 'none', maxWidth: 800, margin: '0 auto 20px' }}>
        {TABS.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: isMobile ? '0 0 auto' : 1, padding: '10px 14px', borderRadius: 11, border: 'none',
                background: active ? 'var(--accent)' : 'transparent',
                color: active ? 'white' : 'var(--muted)',
                fontWeight: 700, fontSize: 'var(--fs-sm)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                transition: 'all 0.2s ease',
                boxShadow: active ? '0 4px 16px rgba(130,114,255,0.35)' : 'none',
                whiteSpace: 'nowrap', position: 'relative'
              }}
            >
              <tab.icon size={15} />
              <span style={{ fontSize: 'var(--fs-sm)' }}>{tab.label}</span>
              {tab.id === 'badges' && earnedCount > 0 && (
                <span style={{ position: 'absolute', top: 4, right: 4, width: 16, height: 16, borderRadius: '50%', background: '#ffd700', color: '#000', fontSize: 9, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {earnedCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─── TAB CONTENT ───────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>

          {/* ── PROFILE ─────────────────────────────── */}
          {activeTab === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="card" style={{ maxWidth: 800, margin: '0 auto' }}>
                <div className="card-title mb-6"><User size={15} className="text-accent" /> Personal Info</div>
                <form onSubmit={handleProfileSave}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input className="input" value={profileForm.name} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bio / Tagline <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: 11 }}>(max 250 chars)</span></label>
                    <textarea className="textarea" rows={2} value={profileForm.bio} onChange={e => setProfileForm(f => ({ ...f, bio: e.target.value.slice(0, 250) }))} placeholder="Your personal tagline or bio..." style={{ resize: 'vertical' }} />
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, textAlign: 'right' }}>{profileForm.bio.length}/250</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <div style={{ position: 'relative' }}>
                      <input className="input" value={user?.email || ''} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
                      <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 9, fontWeight: 700, color: 'var(--muted)', background: 'var(--surface2)', padding: '3px 8px', borderRadius: 6, border: '1px solid var(--border)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Fixed</span>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Avatar Color</label>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: isMobile ? 'center' : 'flex-start' }}>
                      {Object.entries(AVATAR_GRADIENTS).map(([key, grad]) => (
                        <button
                          key={key} type="button"
                          onClick={() => setProfileForm(f => ({ ...f, avatarGradient: key }))}
                          style={{ width: 36, height: 36, borderRadius: '50%', background: grad, border: profileForm.avatarGradient === key ? '3px solid white' : '3px solid transparent', cursor: 'pointer', boxShadow: profileForm.avatarGradient === key ? '0 0 14px rgba(255,255,255,0.5)' : 'none', transition: 'all 0.2s', flexShrink: 0 }}
                        />
                      ))}
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={profileMutation.isPending} style={{ width: isMobile ? '100%' : 160 }}>
                    {profileMutation.isPending ? 'Saving...' : <><Save size={15} /> Save Changes</>}
                  </button>
                </form>
              </div>

              {/* Account Info card */}
              <div className="card" style={{ maxWidth: 800, margin: '0 auto' }}>
                <div className="card-title mb-4"><Activity size={14} className="text-accent2" /> Account Overview</div>
                <div className="stats-grid" style={{ gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)' }}>
                  {[
                    { label: 'Member Since', value: memberSince },
                    { label: 'Days Active', value: `${memberDays}d` },
                    { label: 'Account ID', value: user?._id?.slice(-8)?.toUpperCase() || '—' },
                    { label: 'Region', value: 'Atlas' },
                  ].map((s, i) => (
                    <div key={i} className="stat-card p-3 flex justify-between items-center bg-surface2 border border-border rounded-xl">
                      <span className="text-xs text-muted font-bold uppercase">{s.label}</span>
                      <span className="text-sm font-bold text-text">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Danger zone */}
              <div className="card" style={{ border: '1px solid rgba(255,107,107,0.2)', padding: '20px 24px', maxWidth: 800, margin: '0 auto' }}>
                <div className="card-title" style={{ marginBottom: 16, color: 'var(--red)' }}>⚠ Danger Zone</div>
                <button
                  className="btn btn-ghost"
                  onClick={() => { logout(); navigate('/login'); }}
                  style={{ color: 'var(--red)', borderColor: 'rgba(255,107,107,0.3)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, width: isMobile ? '100%' : 'auto', justifyContent: 'center' }}
                >
                  <LogOut size={15} /> Sign Out of All Devices
                </button>
              </div>
            </div>
          )}

          {/* ── SECURITY ─────────────────────────────── */}
          {activeTab === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 800, margin: '0 auto' }}>
              <div className="card">
                <div className="card-title" style={{ marginBottom: 24 }}><Lock size={15} style={{ color: 'var(--accent2)' }} /> Change Password</div>
                <form onSubmit={handlePasswordChange}>
                  <div className="form-group">
                    <label className="form-label">Current Password</label>
                    <input type="password" className="input" value={pwForm.currentPassword} onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))} required autoComplete="current-password" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">New Password</label>
                    <input type="password" className="input" value={pwForm.newPassword} onChange={e => { setPwForm(f => ({ ...f, newPassword: e.target.value })); checkStrength(e.target.value); }} minLength={8} required autoComplete="new-password" />
                    {pwForm.newPassword && (
                      <div style={{ marginTop: 10 }}>
                        <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                          {[0, 1, 2, 3].map(i => <div key={i} style={{ flex: 1, height: 4, borderRadius: 4, background: i < pwStrength ? strengthColors[pwStrength - 1] : 'var(--border)', transition: 'all 0.3s' }} />)}
                        </div>
                        <span style={{ fontSize: 11, color: pwStrength > 0 ? strengthColors[pwStrength - 1] : 'var(--muted)', fontWeight: 700 }}>{pwStrength > 0 ? strengthLabels[pwStrength - 1] : 'Enter password'}</span>
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Confirm New Password</label>
                    <input type="password" className="input" value={pwForm.confirmPassword} onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))} required autoComplete="new-password"
                      style={{ borderColor: pwForm.confirmPassword && pwForm.confirmPassword !== pwForm.newPassword ? 'rgba(255,107,107,0.5)' : undefined }} />
                    {pwForm.confirmPassword && pwForm.confirmPassword !== pwForm.newPassword && (
                      <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 6 }}>Passwords don't match</div>
                    )}
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={passwordMutation.isPending} style={{ width: isMobile ? '100%' : 180 }}>
                    {passwordMutation.isPending ? 'Updating...' : <><Shield size={15} /> Update Password</>}
                  </button>
                </form>
              </div>
              <div className="card" style={{ background: 'rgba(95,250,209,0.04)', border: '1px solid rgba(95,250,209,0.15)' }}>
                <div className="card-title" style={{ marginBottom: 16, color: 'var(--green)' }}><Shield size={14} /> Security Status</div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
                  {[
                    { label: 'Account Status', value: 'Active & Secure', icon: '✅' },
                    { label: 'Login Protection', value: 'Limited (20/15min)', icon: '🔒' },
                    { label: 'Token Expiry', value: '7 days', icon: '⏱' },
                    { label: 'NoSQL Injection', value: 'Sanitised', icon: '🛡️' },
                    { label: 'Password Hash', value: 'bcrypt 12', icon: '🔑' },
                  ].map(s => (
                    <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, padding: '10px 14px', background: 'var(--surface2)', borderRadius: 10, border: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>{s.icon} {s.label}</span>
                      <span style={{ fontWeight: 700, color: 'var(--green)', fontSize: 10 }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── FOCUS ─────────────────────────────────── */}
          {activeTab === 'pomodoro' && (
            <div className="card" style={{ maxWidth: 800, margin: '0 auto' }}>
              <div className="card-title" style={{ marginBottom: 28 }}><Timer size={15} style={{ color: 'var(--green)' }} /> Focus Timer Settings</div>
              <form onSubmit={handleProfileSave}>
                {[
                  { key: 'pomodoroWork', label: 'Focus Duration', hint: 'Recommended: 25 min', icon: Brain, color: 'var(--accent)', max: 90 },
                  { key: 'pomodoroBreak', label: 'Short Break', hint: 'Recommended: 5 min', icon: Coffee, color: 'var(--green)', max: 30 },
                  { key: 'pomodoroLong', label: 'Long Break', hint: 'Recommended: 15 min', icon: Trees, color: 'var(--accent2)', max: 60 },
                ].map(f => (
                  <div key={f.key} className="form-group" style={{ marginBottom: 28 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <f.icon size={15} style={{ color: f.color }} /> {f.label}
                        <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: 11 }}>{f.hint}</span>
                      </label>
                      <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 24, color: f.color }}>
                        {profileForm[f.key]}<span style={{ fontSize: 12, fontWeight: 500, color: 'var(--muted)', marginLeft: 3 }}>min</span>
                      </div>
                    </div>
                    <div style={{ position: 'relative', height: 8, marginBottom: 6 }}>
                      <div style={{ position: 'absolute', inset: 0, background: 'var(--surface2)', borderRadius: 4, border: '1px solid var(--border)' }} />
                      <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: `${(profileForm[f.key] / f.max) * 100}%`, background: `linear-gradient(90deg,${f.color}88,${f.color})`, borderRadius: 4, transition: 'width 0.15s ease' }} />
                    </div>
                    <input type="range" min={1} max={f.max} value={profileForm[f.key]} onChange={e => setProfileForm(p => ({ ...p, [f.key]: parseInt(e.target.value) }))} style={{ width: '100%', marginTop: -4, opacity: 0, cursor: 'pointer', height: 24, position: 'relative', zIndex: 1 }} />
                  </div>
                ))}
                <div style={{ background: 'var(--surface2)', borderRadius: 14, padding: '16px 20px', marginBottom: 24, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Sparkles size={16} style={{ color: 'var(--accent)' }} />
                  <div>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>Full cycle: </span>
                    <strong style={{ fontSize: 13 }}>
                      {4 * profileForm.pomodoroWork + 3 * profileForm.pomodoroBreak + profileForm.pomodoroLong} min
                    </strong>
                    <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 6 }}>(4×focus + 3×short + 1×long)</span>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" disabled={profileMutation.isPending} style={{ width: isMobile ? '100%' : 180 }}>
                  {profileMutation.isPending ? 'Syncing...' : <><Save size={15} /> Save Intervals</>}
                </button>
              </form>
            </div>
          )}

          {/* ── STATS ─────────────────────────────────── */}
          {activeTab === 'stats' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1000, margin: '0 auto' }}>
              {/* Score + heatmap hero */}
              <div className="card" style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center', justifyContent: isMobile ? 'center' : 'flex-start', padding: isMobile ? '20px' : '28px 32px', background: 'linear-gradient(135deg,rgba(130,114,255,0.06),rgba(109,250,204,0.04))' }}>
                <ScoreRing score={productivityScore} size={isMobile ? 100 : 130} />
                <div style={{ flex: 1, minWidth: 260, textAlign: isMobile ? 'center' : 'left' }}>
                  <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Productivity Score</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.5 }}>
                    Composite score based on tasks, focus, streak and badge progress.
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '8px 24px' }}>
                    {[
                      { label: 'Tasks (35%)', val: Math.min(tasksCompleted, 100) / 100 * 35, max: 35, color: 'var(--accent)' },
                      { label: 'Focus (30%)', val: Math.min(focusMinutes / 60, 50) / 50 * 30, max: 30, color: 'var(--green)' },
                      { label: 'Streak (20%)', val: Math.min(longestStreak, 30) / 30 * 20, max: 20, color: 'var(--orange)' },
                      { label: 'Badges (15%)', val: (earnedCount / totalBadges) * 15, max: 15, color: '#ffd700' },
                    ].map(b => (
                      <div key={b.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--muted)', marginBottom: 3 }}>
                          <span>{b.label}</span><span style={{ fontWeight: 700, color: b.color }}>{Math.round(b.val)}/{b.max}</span>
                        </div>
                        <div style={{ height: 4, background: 'var(--surface2)', borderRadius: 2, overflow: 'hidden' }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${(b.val / b.max) * 100}%` }} transition={{ duration: 1 }} style={{ height: '100%', background: b.color, borderRadius: 2, boxShadow: `0 0 6px ${b.color}88` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Stat cards grid */}
              <div className="stats-grid mb-6" style={{ gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)' }}>
                {[
                  { label: 'Pomodoros', value: totalPomodoros, icon: '🍅', color: 'var(--accent)' },
                  { label: 'Focus Time', value: `${Math.floor(focusMinutes / 60)}h ${focusMinutes % 60}m`, icon: '⏱', color: 'var(--green)' },
                  { label: 'Tasks Done', value: tasksCompleted, icon: '✅', color: 'var(--accent2)' },
                  { label: 'Best Streak', value: `${longestStreak}d`, icon: '🔥', color: 'var(--orange)' },
                ].map((s, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="stat-card text-center p-4">
                    <div style={{ fontSize: 'var(--fs-lg)', marginBottom: 4 }}>{s.icon}</div>
                    <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 'var(--fs-xl)', fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div className="text-xs text-muted font-bold uppercase mt-1" style={{ fontSize: 9 }}>{s.label}</div>
                  </motion.div>
                ))}
              </div>

              {/* Growth & Predictions Row */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 16 }}>
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="card" style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '20px 24px' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(46, 204, 113, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TrendingUp size={24} color="var(--green)" />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Performance Growth</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                      <span style={{ fontSize: 28, fontWeight: 900, color: 'var(--text)' }}>
                        {analytics.growth > 0 ? `+${analytics.growth}%` : `${analytics.growth}%`}
                      </span>
                      <span style={{ fontSize: 12, color: analytics.growth >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>
                        vs last week
                      </span>
                    </div>
                  </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="card" style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '20px 24px', border: '1px solid var(--accent)' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(130, 114, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Award size={24} color="var(--accent)" />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Prediction Insight</div>
                    <div style={{ marginTop: 4 }}>
                      {analytics.predictions?.daysToNextMilestone === 0 ? (
                        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--accent)' }}>
                          Milestone Reached! ✨
                        </div>
                      ) : (
                        <>
                          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>
                            <span style={{ color: 'var(--accent)' }}>{analytics.predictions?.daysToNextMilestone} days</span> to reach {analytics.predictions?.nextStreakMilestone}d streak
                          </div>
                          <div style={{ height: 4, background: 'var(--surface2)', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
                            <div style={{
                              height: '100%',
                              width: `${Math.max(10, 100 - (analytics.predictions?.daysToNextMilestone / 5) * 100)}%`,
                              background: 'var(--accent)'
                            }} />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Activity heatmap + Side Analytics */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 320px', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="card">
                    <ActivityHeatmapYear
                      data={activityData}
                      isMobile={isMobile}
                      onSelectDay={(date, log) => setSelectedDayData({ date, log })}
                    />
                    <div style={{ marginTop: 32, borderTop: '1px solid var(--border)', paddingTop: 24 }}>
                      <ActivityTimeline selectedDay={selectedDayData.date} data={selectedDayData.log} />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <ProductivityCircle
                    stats={{
                      tasks: user?.stats?.tasksCompleted || 0,
                      habits: user?.stats?.habitsCompleted || 0,
                      focus: user?.stats?.totalPomodoros || 0,
                      schedule: user?.stats?.totalScheduleEvents || 0
                    }}
                  />
                  <ActivityTags />
                </div>
              </div>
            </div>
          )}

          {/* ── BADGES ─────────────────────────────────── */}
          {activeTab === 'badges' && (
            <div style={{ maxWidth: 1000, margin: '0 auto' }}>
              {/* Summary bar */}
              <div className="card" style={{ padding: '20px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, background: 'linear-gradient(135deg,rgba(130,114,255,0.06),rgba(255,215,0,0.04))' }}>
                <div>
                  <div style={{ fontFamily: 'Syne,sans-serif', fontSize: isMobile ? 20 : 24, fontWeight: 800 }}>
                    🏅 {earnedCount} <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: 16 }}>/ {totalBadges} earned</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Complete tasks, focus and habits to unlock more</div>
                </div>
                <div style={{ flex: 1, minWidth: 120, maxWidth: 220 }}>
                  <div style={{ height: 10, background: 'var(--surface2)', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(earnedCount / totalBadges) * 100}%` }} transition={{ duration: 1, ease: 'easeOut' }} style={{ height: '100%', background: 'linear-gradient(90deg,#cd7f32,#ffd700,#e5e4e2)', borderRadius: 6, boxShadow: '0 0 10px rgba(255,215,0,0.4)' }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6, textAlign: 'right' }}>{Math.round((earnedCount / totalBadges) * 100)}% complete</div>
                </div>
              </div>

              {byTier.map(({ tier, badges: tierBadges }) => {
                const tc = TIER_CONFIG[tier];
                return (
                  <div key={tier} style={{ marginBottom: 28 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: tc.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px ${tc.glow}` }}>
                        <Star size={14} color="white" fill="white" />
                      </div>
                      <span style={{ fontWeight: 800, fontSize: 14, color: tc.color, textTransform: 'uppercase', letterSpacing: 1.5 }}>{tc.label}</span>
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>{tierBadges.filter(b => b.earned).length}/{tierBadges.length}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fill,minmax(190px,1fr))', gap: 12 }}>
                      {tierBadges.map((badge, i) => (
                        <motion.div
                          key={badge.id}
                          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}
                          whileHover={{ scale: 1.03, y: -3 }}
                          style={{
                            padding: 'var(--space-4) var(--space-4)', borderRadius: 16, textAlign: 'center', position: 'relative',
                            background: badge.earned ? `linear-gradient(135deg,${tc.color}12,${tc.color}06)` : 'var(--surface)',
                            border: `1.5px solid ${badge.earned ? tc.color + '44' : 'var(--border)'}`,
                            boxShadow: badge.earned ? `0 4px 24px ${tc.glow}` : 'none',
                            transition: 'all 0.3s ease',
                          }}
                        >
                          {badge.earned && (
                            <div style={{ position: 'absolute', top: 10, right: 10, width: 18, height: 18, borderRadius: '50%', background: tc.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 8px ${tc.glow}` }}>
                              <CheckCircle2 size={11} color="white" />
                            </div>
                          )}
                          <div style={{ fontSize: isMobile ? 32 : 40, marginBottom: 10, filter: badge.earned ? `drop-shadow(0 0 10px ${tc.color})` : 'grayscale(1) opacity(0.3)', transition: 'filter 0.3s ease' }}>
                            {badge.earned ? badge.icon : '🔒'}
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: badge.earned ? 'var(--text)' : 'var(--muted)', marginBottom: 4 }}>
                            {badge.earned ? badge.name : '???'}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.4 }}>
                            {badge.earned ? badge.description : 'Keep going to unlock'}
                          </div>
                          {badge.earned && badge.earnedAt && (
                            <div style={{ fontSize: 10, color: tc.color, marginTop: 8, fontWeight: 700 }}>
                              ✓ {format(new Date(badge.earnedAt), 'MMM d, yyyy')}
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
    </div>
  );
}
