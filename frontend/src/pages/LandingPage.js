import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  CheckCircle2, 
  Calendar, 
  Timer, 
  ArrowRight, 
  Activity, 
  Cpu, 
  Sparkles, 
  ShieldCheck, 
  TrendingUp, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  Flame, 
  Check, 
  BarChart3, 
  Clock, 
  ExternalLink,
  Laptop,
  CheckCheck
} from 'lucide-react';

export default function LandingPage() {
  const [activeFaq, setActiveFaq] = useState(null);
  const [activeTab, setActiveTab] = useState('tasks');

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const faqs = [
    {
      q: "What makes DayFlow different from conventional to-do apps?",
      a: "Traditional tools force you to jump between separate apps for task lists, timers, habit trackers, and journals. DayFlow synthesizes these into one unified, hyper-fast operating system powered by an intelligent AI Coach that analyzes your momentum and guides your focus in real-time."
    },
    {
      q: "Is DayFlow free to use?",
      a: "Yes! DayFlow includes a generous Free Forever tier with full access to task management, habit heatmaps, Pomodoro focus timers, and core analytics. Advanced neural insights and unlimited history are available without hidden lock-ins."
    },
    {
      q: "How does the AI Neural Coach work?",
      a: "The AI Coach privately evaluates your daily completion rhythms, focus session lengths, and habit streaks. It calculates optimal productivity windows and delivers actionable advice to prevent burnout and maximize high-leverage output."
    },
    {
      q: "Can I use DayFlow on mobile and tablet devices?",
      a: "Absolutely. DayFlow is engineered with a fully responsive progressive interface that adapts seamlessly to desktop, tablet, and mobile screens without sacrificing speed or aesthetics."
    },
    {
      q: "Is my personal workflow data secure and private?",
      a: "Your data is stored with industry-standard encryption, strict authentication safeguards, and zero third-party telemetry selling. Your routines and focus metrics remain strictly yours."
    }
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#09090b', 
      color: '#f4f4f5', 
      overflowX: 'hidden',
      position: 'relative',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      {/* Precision Grid Background (Non-blurry, ultra-crisp) */}
      <div style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        backgroundImage: `
          linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px',
        maskImage: 'radial-gradient(ellipse 80% 60% at 50% 10%, black 40%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 10%, black 40%, transparent 100%)'
      }} />

      {/* Top Ambient Glow Ring (Subtle & Crisp, no laggy blur) */}
      <div style={{
        position: 'absolute',
        top: -160,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 800,
        height: 380,
        background: 'radial-gradient(circle, rgba(124, 109, 250, 0.12) 0%, rgba(10, 132, 255, 0.04) 60%, transparent 80%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Navigation */}
      <nav style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        zIndex: 100,
        padding: '16px 24px',
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: 'rgba(9, 9, 11, 0.95)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.07)'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.03em', color: '#ffffff' }}>
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
        </div>

        {/* Center Nav Links (Hidden on small mobile) */}
        <div className="landing-desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <button 
            onClick={() => scrollToSection('features')} 
            style={{ background: 'none', border: 'none', color: '#a1a1aa', fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: 'color 0.2s' }}
            onMouseEnter={(e) => e.target.style.color = '#ffffff'}
            onMouseLeave={(e) => e.target.style.color = '#a1a1aa'}
          >
            Features
          </button>
          <button 
            onClick={() => scrollToSection('preview')} 
            style={{ background: 'none', border: 'none', color: '#a1a1aa', fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: 'color 0.2s' }}
            onMouseEnter={(e) => e.target.style.color = '#ffffff'}
            onMouseLeave={(e) => e.target.style.color = '#a1a1aa'}
          >
            App Preview
          </button>
          <button 
            onClick={() => scrollToSection('workflow')} 
            style={{ background: 'none', border: 'none', color: '#a1a1aa', fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: 'color 0.2s' }}
            onMouseEnter={(e) => e.target.style.color = '#ffffff'}
            onMouseLeave={(e) => e.target.style.color = '#a1a1aa'}
          >
            Workflow
          </button>
          <button 
            onClick={() => scrollToSection('faq')} 
            style={{ background: 'none', border: 'none', color: '#a1a1aa', fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: 'color 0.2s' }}
            onMouseEnter={(e) => e.target.style.color = '#ffffff'}
            onMouseLeave={(e) => e.target.style.color = '#a1a1aa'}
          >
            FAQ
          </button>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/login" style={{ 
            padding: '8px 16px', 
            borderRadius: 10, 
            fontSize: 13, 
            fontWeight: 600, 
            color: '#e4e4e7', 
            textDecoration: 'none',
            background: 'rgba(255,255,255,0.03)', 
            border: '1px solid rgba(255,255,255,0.08)',
            transition: 'all 0.2s ease'
          }}>
            Log In
          </Link>
          <Link to="/register" style={{ 
            padding: '8px 18px', 
            borderRadius: 10, 
            fontSize: 13, 
            fontWeight: 600, 
            color: '#ffffff', 
            textDecoration: 'none',
            background: 'linear-gradient(135deg, #7c6dfa 0%, #5850ec 100%)',
            boxShadow: '0 4px 14px rgba(124, 109, 250, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.2s ease'
          }}>
            <span>Get Started</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ 
        position: 'relative', 
        zIndex: 1, 
        paddingTop: 'clamp(120px, 16vh, 160px)', 
        paddingBottom: 'clamp(60px, 8vh, 100px)',
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        textAlign: 'center',
        paddingLeft: 20,
        paddingRight: 20,
        maxWidth: 1080,
        margin: '0 auto'
      }}>
        {/* Release Pill Badge */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 10, 
            padding: '6px 14px', 
            borderRadius: 100, 
            background: 'linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            marginBottom: 28,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)'
          }}
        >
          <span style={{ 
            width: 7, 
            height: 7, 
            borderRadius: '50%', 
            background: '#10b981', 
            boxShadow: '0 0 8px #10b981' 
          }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#e4e4e7', letterSpacing: '0.02em' }}>
            DayFlow 2.0 is live · Cognitive OS for Deep Focus
          </span>
          <ArrowRight size={13} color="#a1a1aa" />
        </motion.div>

        {/* Hero Headline */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{ 
            fontSize: 'clamp(40px, 6.5vw, 76px)', 
            fontWeight: 800, 
            lineHeight: 1.08,
            letterSpacing: '-0.04em',
            marginBottom: 24,
            maxWidth: 920,
            color: '#ffffff'
          }}
        >
          Master your time.<br/>
          <span style={{
            background: 'linear-gradient(135deg, #ffffff 30%, #a1a1aa 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Elevate your daily execution.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{ 
            fontSize: 'clamp(16px, 2vw, 19px)', 
            color: '#a1a1aa', 
            maxWidth: 680, 
            margin: '0 auto 36px',
            lineHeight: 1.6, 
            fontWeight: 400 
          }}
        >
          An executive productivity suite that harmonizes high-leverage tasks, habit streaks, Pomodoro deep focus sessions, and AI coaching inside a distraction-free command center.
        </motion.p>

        {/* Primary Call to Action */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 28 }}
        >
          <Link to="/register" style={{ 
            padding: '14px 28px', 
            borderRadius: 12, 
            fontSize: 15, 
            fontWeight: 700, 
            color: '#ffffff', 
            textDecoration: 'none',
            background: 'linear-gradient(135deg, #7c6dfa 0%, #5850ec 100%)',
            boxShadow: '0 8px 24px rgba(124, 109, 250, 0.35), inset 0 1px 0 rgba(255,255,255,0.25)',
            border: '1px solid rgba(255,255,255,0.15)',
            display: 'flex', 
            alignItems: 'center', 
            gap: 10,
            transition: 'transform 0.2s ease'
          }}>
            <span>Start Free Workspace</span>
            <ArrowRight size={18} />
          </Link>
          <Link to="/login" style={{ 
            padding: '14px 26px', 
            borderRadius: 12, 
            fontSize: 15, 
            fontWeight: 600, 
            color: '#e4e4e7', 
            textDecoration: 'none',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.09)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
            display: 'flex', 
            alignItems: 'center', 
            gap: 8,
            transition: 'background 0.2s ease'
          }}>
            <span>Explore Demo</span>
            <ExternalLink size={16} color="#a1a1aa" />
          </Link>
        </motion.div>

        {/* Proof / Assurance Strip */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 20, 
            color: '#71717a', 
            fontSize: 13, 
            fontWeight: 500,
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Check size={14} color="#10b981" /> No credit card required
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Check size={14} color="#10b981" /> Free tier forever
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Check size={14} color="#10b981" /> Sub-50ms interaction latency
          </span>
        </motion.div>
      </section>

      {/* Interactive App Command Center Mockup (The Showpiece) */}
      <section id="preview" style={{ 
        position: 'relative', 
        zIndex: 1, 
        maxWidth: 1120, 
        margin: '0 auto 80px',
        padding: '0 20px'
      }}>
        <div style={{
          background: 'linear-gradient(180deg, #121217 0%, #0d0d12 100%)',
          borderRadius: 20,
          border: '1px solid rgba(255, 255, 255, 0.09)',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
          overflow: 'hidden'
        }}>
          {/* Mockup Window Titlebar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            background: 'rgba(255, 255, 255, 0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#ff5f56', opacity: 0.8 }} />
              <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#ffbd2e', opacity: 0.8 }} />
              <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#27c93f', opacity: 0.8 }} />
              <span style={{ marginLeft: 12, fontSize: 12, color: '#71717a', fontWeight: 600 }}>
                DayFlow Command Center — Active Sprint
              </span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 12px',
              borderRadius: 6,
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              fontSize: 11,
              color: '#a1a1aa'
            }}>
              <span>⌘K Quick Switcher</span>
            </div>
          </div>

          {/* Mockup Inner Dashboard View */}
          <div style={{ padding: '24px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {/* Column 1: Today's High-Leverage Tasks */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: 14,
              border: '1px solid rgba(255, 255, 255, 0.05)',
              padding: 18,
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={15} color="#7c6dfa" /> Daily Execution
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: 4 }}>
                  4 of 5 Done
                </span>
              </div>

              {[
                { title: 'Architect DayFlow API layer', priority: 'High', done: true, tag: 'Engineering' },
                { title: '90-min Deep Work Sprint', priority: 'Focus', done: true, tag: 'Deep Work' },
                { title: 'Synthesize user telemetry feedback', priority: 'High', done: false, tag: 'Product' },
                { title: 'Review weekly habit heatmap', priority: 'Normal', done: false, tag: 'Ritual' },
              ].map((task, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: task.done ? 'rgba(255,255,255,0.015)' : 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.04)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 16, height: 16, borderRadius: 5,
                      border: task.done ? 'none' : '1.5px solid rgba(255,255,255,0.2)',
                      background: task.done ? '#10b981' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {task.done && <Check size={11} color="white" strokeWidth={3} />}
                    </div>
                    <span style={{ 
                      fontSize: 13, 
                      fontWeight: 500, 
                      color: task.done ? '#71717a' : '#f4f4f5',
                      textDecoration: task.done ? 'line-through' : 'none'
                    }}>
                      {task.title}
                    </span>
                  </div>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: task.priority === 'High' ? 'rgba(244, 63, 94, 0.15)' : 'rgba(124, 109, 250, 0.15)',
                    color: task.priority === 'High' ? '#fb7185' : '#a78bfa'
                  }}>
                    {task.tag}
                  </span>
                </div>
              ))}
            </div>

            {/* Column 2: Live Focus Engine */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: 14,
              border: '1px solid rgba(255, 255, 255, 0.05)',
              padding: 18,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 16
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Timer size={15} color="#f59e0b" /> Active Flow Interval
                  </span>
                  <span style={{ 
                    fontSize: 11, 
                    fontWeight: 700, 
                    color: '#f59e0b', 
                    background: 'rgba(245, 158, 11, 0.12)', 
                    padding: '2px 8px', 
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b' }} />
                    Focus Mode
                  </span>
                </div>

                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-0.03em', color: '#ffffff' }}>
                    24:18
                  </div>
                  <div style={{ fontSize: 12, color: '#71717a', fontWeight: 500, marginTop: 4 }}>
                    Cycle 3 of 4 · Deep Work Block
                  </div>
                </div>

                {/* Mini progress track */}
                <div style={{ width: '100%', height: 6, borderRadius: 10, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ width: '72%', height: '100%', background: 'linear-gradient(90deg, #f59e0b, #7c6dfa)', borderRadius: 10 }} />
                </div>
              </div>

              <div style={{ 
                padding: '12px', 
                borderRadius: 8, 
                background: 'rgba(124, 109, 250, 0.08)', 
                border: '1px solid rgba(124, 109, 250, 0.18)',
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}>
                <Flame size={18} color="#f59e0b" />
                <div style={{ fontSize: 12, color: '#e4e4e7', fontWeight: 500 }}>
                  <strong style={{ color: '#ffffff' }}>18 Day Streak</strong> · Zero interruptions logged today
                </div>
              </div>
            </div>

            {/* Column 3: AI Neural Coach Insight */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: 14,
              border: '1px solid rgba(255, 255, 255, 0.05)',
              padding: 18,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 16
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Cpu size={15} color="#0a84ff" /> AI Performance Audit
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#60a5fa', background: 'rgba(10, 132, 255, 0.12)', padding: '2px 8px', borderRadius: 4 }}>
                    SYNTHESIZED
                  </span>
                </div>

                <div style={{
                  padding: 14,
                  borderRadius: 10,
                  background: 'rgba(10, 132, 255, 0.04)',
                  border: '1px solid rgba(10, 132, 255, 0.15)',
                  fontSize: 12,
                  lineHeight: 1.6,
                  color: '#d4d4d8'
                }}>
                  <p style={{ margin: 0, marginBottom: 8, fontWeight: 600, color: '#ffffff' }}>
                    ⚡ Peak Velocity Detected
                  </p>
                  Your focus velocity is 34% higher during morning intervals. Complete the architecture review before 1:00 PM for maximum cognitive clarity.
                </div>
              </div>

              {/* Habit Heatmap Mini Row */}
              <div>
                <div style={{ fontSize: 11, color: '#71717a', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Weekly Consistency Pulse
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                    <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{
                        height: 22,
                        borderRadius: 5,
                        background: i < 5 ? '#10b981' : 'rgba(255,255,255,0.06)',
                        opacity: i === 4 ? 1 : i < 4 ? 0.75 : 0.3,
                        marginBottom: 4
                      }} />
                      <span style={{ fontSize: 9, color: '#71717a', fontWeight: 600 }}>{day}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics & Impact Strip */}
      <section style={{ 
        position: 'relative', 
        zIndex: 1, 
        maxWidth: 1120, 
        margin: '0 auto 100px', 
        padding: '0 20px' 
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
          gap: 16,
          background: 'rgba(255, 255, 255, 0.015)',
          padding: 24,
          borderRadius: 18,
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          {[
            { value: '3.4x', label: 'Faster Task Completion', sub: 'Measured against disjointed tools' },
            { value: '94%', label: 'Habit Consistency at 30 Days', sub: 'Driven by visual streak heatmaps' },
            { value: '< 45ms', label: 'Zero-Lag Response Time', sub: 'Instantaneous optimistic updates' },
            { value: '24/7', label: 'Neural AI Guidance', sub: 'Personalized focus diagnostics' }
          ].map((stat, i) => (
            <div key={i} style={{ padding: '8px 12px' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em', marginBottom: 4 }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#e4e4e7', marginBottom: 2 }}>
                {stat.label}
              </div>
              <div style={{ fontSize: 12, color: '#71717a', fontWeight: 400 }}>
                {stat.sub}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" style={{ 
        position: 'relative', 
        zIndex: 1, 
        maxWidth: 1120, 
        margin: '0 auto 120px', 
        padding: '0 20px' 
      }}>
        <div style={{ textAlign: 'center', marginBottom: 54 }}>
          <div style={{ 
            fontSize: 12, 
            fontWeight: 700, 
            textTransform: 'uppercase', 
            letterSpacing: '0.08em', 
            color: '#a78bfa',
            marginBottom: 10
          }}>
            Engineered Capabilities
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, letterSpacing: '-0.03em', color: '#ffffff', marginBottom: 14 }}>
            Everything you need for supreme focus.
          </h2>
          <p style={{ color: '#a1a1aa', fontSize: 16, maxWidth: 540, margin: '0 auto', lineHeight: 1.5 }}>
            Purpose-built modules designed to eliminate context switching and elevate your daily output.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          {[
            {
              icon: CheckCircle2,
              color: '#7c6dfa',
              title: 'Intelligent Task Architecture',
              desc: 'Organize high-leverage work with smart priority flags, recurring cadences, subtasks, and instant keyboard shortcuts.'
            },
            {
              icon: Activity,
              color: '#10b981',
              title: 'Habit Consistency Heatmaps',
              desc: 'Visualize your execution streaks with GitHub-grade heatmaps that turn daily repetition into non-negotiable momentum.'
            },
            {
              icon: Timer,
              color: '#f59e0b',
              title: 'Flow-State Pomodoro Engine',
              desc: 'Calibrated focus blocks with ambient ticking, customizable interval cycles, and distraction session recording.'
            },
            {
              icon: Cpu,
              color: '#0a84ff',
              title: 'Neural AI Performance Coach',
              desc: 'Synthesizes your completion velocity and habit adherence to deliver customized daily briefings and burn-out prevention.'
            },
            {
              icon: Calendar,
              color: '#ec4899',
              title: 'Dynamic Daily Timeline',
              desc: 'Timebox your day with synchronized schedule blocks that align your most demanding tasks to peak biological energy hours.'
            },
            {
              icon: BarChart3,
              color: '#8b5cf6',
              title: 'Retrospective Analytics',
              desc: 'Comprehensive charts detailing productivity trends, focus hours, completion ratios, and automated weekly digests.'
            }
          ].map((item, idx) => (
            <div 
              key={idx}
              style={{
                background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 18,
                padding: '28px 24px',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
                transition: 'border-color 0.2s, transform 0.2s'
              }}
              className="hover-card-elevation"
            >
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: `linear-gradient(135deg, ${item.color}22, ${item.color}08)`,
                border: `1px solid ${item.color}33`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20
              }}>
                <item.icon size={22} color={item.color} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#ffffff', marginBottom: 10, letterSpacing: '-0.01em' }}>
                {item.title}
              </h3>
              <p style={{ color: '#a1a1aa', fontSize: 14, lineHeight: 1.6, fontWeight: 400, margin: 0 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 3-Step Workflow Section */}
      <section id="workflow" style={{ 
        position: 'relative', 
        zIndex: 1, 
        maxWidth: 1040, 
        margin: '0 auto 120px', 
        padding: '0 20px' 
      }}>
        <div style={{ textAlign: 'center', marginBottom: 54 }}>
          <div style={{ 
            fontSize: 12, 
            fontWeight: 700, 
            textTransform: 'uppercase', 
            letterSpacing: '0.08em', 
            color: '#10b981',
            marginBottom: 10
          }}>
            Zero-Friction Methodology
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, letterSpacing: '-0.03em', color: '#ffffff', marginBottom: 12 }}>
            How DayFlow transforms your daily output.
          </h2>
          <p style={{ color: '#a1a1aa', fontSize: 16, maxWidth: 500, margin: '0 auto' }}>
            A disciplined cadence to capture, execute, and compound your results.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {[
            {
              step: '01',
              title: 'Capture & Prioritize',
              desc: 'Empty cognitive clutter into the unified inbox. Set high-impact priority flags and let DayFlow organize your daily queue.'
            },
            {
              step: '02',
              title: 'Execute in Flow State',
              desc: 'Lock in with the distraction-free Pomodoro timer. Track uninterrupted blocks and maintain biological momentum throughout the day.'
            },
            {
              step: '03',
              title: 'Reflect & Compound',
              desc: 'Let AI coaching and GitHub-style habit heatmaps reveal your velocity trends so you continuously compound your productivity.'
            }
          ].map((wf, idx) => (
            <div key={idx} style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: 16,
              padding: 28,
              position: 'relative',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.03)'
            }}>
              <div style={{ 
                fontSize: 32, 
                fontWeight: 900, 
                color: 'rgba(255,255,255,0.12)', 
                letterSpacing: '-0.04em',
                marginBottom: 16 
              }}>
                {wf.step}
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#ffffff', marginBottom: 10 }}>
                {wf.title}
              </h3>
              <p style={{ color: '#a1a1aa', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                {wf.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison: DayFlow vs Traditional Setup */}
      <section style={{ 
        position: 'relative', 
        zIndex: 1, 
        maxWidth: 960, 
        margin: '0 auto 120px', 
        padding: '0 20px' 
      }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 36px)', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em', marginBottom: 12 }}>
            Why builders switch to DayFlow
          </h2>
          <p style={{ color: '#a1a1aa', fontSize: 15 }}>
            Consolidate fragmented tools into one finely tuned command center.
          </p>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: 18,
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr 1fr',
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            background: 'rgba(255, 255, 255, 0.02)',
            fontSize: 13,
            fontWeight: 700,
            color: '#a1a1aa'
          }}>
            <div>CAPABILITY</div>
            <div>FRAGMENTED APPS</div>
            <div style={{ color: '#a78bfa' }}>DAYFLOW OS</div>
          </div>

          {[
            { feature: 'Tasks & Habits in One View', old: 'Requires 2-3 separate apps', modern: 'Unified single-pane dashboard' },
            { feature: 'Deep Work Pomodoro Integration', old: 'Standalone timer with no task link', modern: 'Direct 1-click focus session' },
            { feature: 'Visual Habit Consistency Heatmap', old: 'Basic checkbox list', modern: 'GitHub-grade streak matrix' },
            { feature: 'Productivity AI Coaching', old: 'No intelligence or advice', modern: 'Context-aware velocity audits' },
            { feature: 'Interaction Latency', old: 'Clunky web-view loading', modern: 'Sub-50ms instant execution' },
          ].map((row, idx) => (
            <div key={idx} style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 1fr 1fr',
              padding: '16px 20px',
              borderBottom: idx === 4 ? 'none' : '1px solid rgba(255, 255, 255, 0.04)',
              fontSize: 13,
              alignItems: 'center'
            }}>
              <div style={{ fontWeight: 600, color: '#f4f4f5' }}>{row.feature}</div>
              <div style={{ color: '#71717a' }}>{row.old}</div>
              <div style={{ color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCheck size={16} color="#10b981" /> {row.modern}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section id="faq" style={{ 
        position: 'relative', 
        zIndex: 1, 
        maxWidth: 820, 
        margin: '0 auto 120px', 
        padding: '0 20px' 
      }}>
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 36px)', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em', marginBottom: 10 }}>
            Frequently Asked Questions
          </h2>
          <p style={{ color: '#a1a1aa', fontSize: 15 }}>
            Everything you need to know about the DayFlow experience.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {faqs.map((faq, index) => {
            const isOpen = activeFaq === index;
            return (
              <div 
                key={index}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: 14,
                  overflow: 'hidden',
                  transition: 'background 0.2s ease'
                }}
              >
                <button
                  onClick={() => toggleFaq(index)}
                  style={{
                    width: '100%',
                    padding: '18px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'none',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: 15,
                    fontWeight: 600,
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp size={18} color="#a1a1aa" /> : <ChevronDown size={18} color="#a1a1aa" />}
                </button>
                {isOpen && (
                  <div style={{
                    padding: '0 20px 20px 20px',
                    color: '#a1a1aa',
                    fontSize: 14,
                    lineHeight: 1.6,
                    borderTop: '1px solid rgba(255,255,255,0.04)',
                    paddingTop: 14
                  }}>
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Final Call to Action Card */}
      <section style={{ 
        position: 'relative', 
        zIndex: 1, 
        maxWidth: 960, 
        margin: '0 auto 100px', 
        padding: '0 20px' 
      }}>
        <div style={{
          background: 'linear-gradient(145deg, rgba(124, 109, 250, 0.08) 0%, rgba(10, 132, 255, 0.04) 100%)',
          border: '1px solid rgba(124, 109, 250, 0.2)',
          borderRadius: 24,
          padding: 'clamp(40px, 6vw, 64px) 24px',
          textAlign: 'center',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em', marginBottom: 16 }}>
            Ready to operate at peak focus?
          </h2>
          <p style={{ color: '#d4d4d8', fontSize: 16, maxWidth: 540, margin: '0 auto 32px', lineHeight: 1.6 }}>
            Join professionals orchestrating their daily priorities, deep habits, and focused blocks inside DayFlow.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
            <Link to="/register" style={{ 
              padding: '14px 32px', 
              borderRadius: 12, 
              fontSize: 15, 
              fontWeight: 700, 
              color: '#ffffff', 
              textDecoration: 'none',
              background: 'linear-gradient(135deg, #7c6dfa 0%, #5850ec 100%)',
              boxShadow: '0 8px 24px rgba(124, 109, 250, 0.4), inset 0 1px 0 rgba(255,255,255,0.25)',
              border: '1px solid rgba(255,255,255,0.15)',
              display: 'flex', 
              alignItems: 'center', 
              gap: 10
            }}>
              <span>Get Started Now</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Pro Clean Footer */}
      <footer style={{ 
        position: 'relative', 
        zIndex: 1, 
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        padding: '50px 24px 32px',
        background: '#070709'
      }}>
        <div style={{ 
          maxWidth: 1120, 
          margin: '0 auto', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 20,
          marginBottom: 32
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ 
              width: 32, 
              height: 32, 
              borderRadius: 8, 
              background: 'linear-gradient(135deg, #7c6dfa, #0a84ff)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center'
            }}>
              <Zap size={18} color="white" fill="white" />
            </div>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em' }}>
              DayFlow
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 24, fontSize: 13, color: '#71717a' }}>
            <button onClick={() => scrollToSection('features')} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', fontSize: 13 }}>Features</button>
            <button onClick={() => scrollToSection('workflow')} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', fontSize: 13 }}>Workflow</button>
            <button onClick={() => scrollToSection('faq')} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', fontSize: 13 }}>FAQ</button>
            <Link to="/login" style={{ color: '#a1a1aa', textDecoration: 'none' }}>Log In</Link>
            <Link to="/register" style={{ color: '#a1a1aa', textDecoration: 'none' }}>Register</Link>
          </div>
        </div>

        <div style={{ 
          maxWidth: 1120, 
          margin: '0 auto', 
          borderTop: '1px solid rgba(255, 255, 255, 0.04)',
          paddingTop: 24,
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div style={{ fontSize: 12, color: '#52525b' }}>
            © {new Date().getFullYear()} DayFlow OS. High-precision productivity suite. All rights reserved.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#52525b' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
            <span>All systems operational</span>
          </div>
        </div>
      </footer>

      {/* Scoped CSS for Responsive & Non-blurry Hover Elevation */}
      <style>{`
        @media (max-width: 768px) {
          .landing-desktop-nav {
            display: none !important;
          }
        }
        .hover-card-elevation:hover {
          border-color: rgba(255, 255, 255, 0.14) !important;
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}
