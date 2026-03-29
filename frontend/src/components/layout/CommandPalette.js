import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Command, LayoutDashboard, CheckCircle2,
    Calendar, RefreshCw, Timer, FileText, User,
    Settings, LogOut, Plus, ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { createPortal } from 'react-dom';

const ACTIONS = [
    { id: 'dash', label: 'Go to Dashboard', icon: LayoutDashboard, path: '/', section: 'Navigation' },
    { id: 'tasks', label: 'Manage Tasks', icon: CheckCircle2, path: '/tasks', section: 'Navigation' },
    { id: 'schedule', label: 'View Timeline', icon: Calendar, path: '/schedule', section: 'Navigation' },
    { id: 'habits', label: 'Track Rituals', icon: RefreshCw, path: '/habits', section: 'Navigation' },
    { id: 'focus', label: 'Pomodoro Timer', icon: Timer, path: '/pomodoro', section: 'Navigation' },
    { id: 'notes', label: 'Knowledge Base', icon: FileText, path: '/notes', section: 'Navigation' },
    { id: 'new-task', label: 'New Objective', icon: Plus, path: '/tasks', search: 'create', section: 'Quick Actions' },
    { id: 'new-note', label: 'New Essence', icon: Plus, path: '/notes', search: 'create', section: 'Quick Actions' },
    { id: 'profile', label: 'User Profile', icon: User, path: '/profile', section: 'Account' },
    { id: 'settings', label: 'Account Settings', icon: Settings, path: '/profile', section: 'Account' },
    { id: 'logout', label: 'Sign Out', icon: LogOut, action: 'logout', section: 'Danger' },
];

export default function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const { logout } = useAuth();
    const navigate = useNavigate();
    const inputRef = useRef(null);
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape') setIsOpen(false);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setActiveIndex(0);
            setTimeout(() => inputRef.current?.focus(), 10);
        }
    }, [isOpen]);

    const filteredActions = ACTIONS.filter(a =>
        a.label.toLowerCase().includes(query.toLowerCase()) ||
        a.section.toLowerCase().includes(query.toLowerCase())
    );

    const handleAction = (item) => {
        setIsOpen(false);
        if (item.path) {
            navigate(item.search ? `${item.path}?action=${item.search}` : item.path);
        }
        if (item.action === 'logout') logout();
    };

    const onKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => (prev + 1) % filteredActions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => (prev - 1 + filteredActions.length) % filteredActions.length);
        } else if (e.key === 'Enter') {
            if (filteredActions[activeIndex]) {
                handleAction(filteredActions[activeIndex]);
            }
        }
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        style={{
                            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
                            backdropFilter: 'blur(4px)', zIndex: 1000
                        }}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        style={{
                            position: 'fixed', top: isMobile ? '10%' : '20%', left: '50%', x: '-50%',
                            width: isMobile ? '92%' : '100%', maxWidth: 600, zIndex: 1001,
                            background: 'rgba(12, 12, 22, 0.9)', 
                            backdropFilter: 'blur(40px)', 
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: 24, 
                            boxShadow: '0 40px 100px rgba(0,0,0,0.8), 0 0 30px rgba(124, 109, 250, 0.1)',
                            overflow: 'hidden'
                        }}
                    >
                        <div className="aura-pulse" style={{ position: 'absolute', top: -50, right: -50, width: 150, height: 150, background: 'var(--grad-mesh-vibrant)', opacity: 0.05, zIndex: -1 }} />
                        
                        <div style={{ padding: isMobile ? '16px 20px' : '24px 28px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 16, position: 'relative' }}>
                            <Search size={isMobile ? 18 : 22} className="text-muted" style={{ opacity: 0.6 }} />
                            <input
                                ref={inputRef}
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                onKeyDown={onKeyDown}
                                placeholder="Quantum search commands..."
                                style={{
                                    flex: 1, background: 'none', border: 'none', outline: 'none',
                                    fontSize: isMobile ? 16 : 20, color: 'var(--text)', fontFamily: 'Syne, sans-serif',
                                    fontWeight: 700, letterSpacing: '-0.02em'
                                }}
                            />
                            {!isMobile && (
                              <div style={{ 
                                  display: 'flex', alignItems: 'center', gap: 6, 
                                  background: 'rgba(255,255,255,0.05)', padding: '6px 12px', 
                                  borderRadius: 8, fontSize: 11, fontWeight: 900, color: 'var(--muted)',
                                  border: '1px solid rgba(255,255,255,0.05)'
                              }}>
                                  <Command size={11} /> <span style={{ opacity: 0.8 }}>K</span>
                              </div>
                            )}
                        </div>

                        <div style={{ maxHeight: 400, overflowY: 'auto', padding: 8 }}>
                            {filteredActions.length === 0 ? (
                                <div style={{ padding: '32px 20px', textAlign: 'center' }}>
                                    <div style={{ fontSize: 24, marginBottom: 8 }}>🔍</div>
                                    <div style={{ fontSize: 14, fontWeight: 700 }}>No results found</div>
                                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Try searching for "Dashboard" or "Tasks"</div>
                                </div>
                            ) : (
                                <>
                                    {['Quick Actions', 'Navigation', 'Account', 'Danger'].map(section => {
                                        const sectionActions = filteredActions.filter(a => a.section === section);
                                        if (sectionActions.length === 0) return null;

                                        return (
                                            <div key={section} style={{ marginBottom: 8 }}>
                                                <div style={{ padding: '8px 12px', fontSize: 10, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                                                    {section}
                                                </div>
                                                {sectionActions.map((item) => {
                                                    const isSelected = filteredActions[activeIndex]?.id === item.id;
                                                    return (
                                                        <React.Fragment key={item.id}>
                                                            <style>{`
                                                                .palette-item-selected {
                                                                    background: linear-gradient(90deg, var(--accent) 0%, rgba(124, 109, 250, 0.4) 100%) !important;
                                                                    box-shadow: 0 10px 30px rgba(124, 109, 250, 0.2);
                                                                }
                                                            `}</style>
                                                            <motion.div
                                                                onClick={() => handleAction(item)}
                                                                onMouseEnter={() => setActiveIndex(filteredActions.indexOf(item))}
                                                                animate={isSelected ? { scale: 1.01, x: 4 } : { scale: 1, x: 0 }}
                                                                className={isSelected ? 'palette-item-selected holographic-shimmer' : ''}
                                                                style={{
                                                                    display: 'flex', alignItems: 'center', gap: 14, padding: isMobile ? '10px 12px' : '12px 16px',
                                                                    borderRadius: 16, cursor: 'pointer',
                                                                    background: isSelected ? 'var(--accent)' : 'transparent',
                                                                    color: isSelected ? 'white' : 'rgba(255,255,255,0.7)',
                                                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                                    margin: '2px 0',
                                                                    position: 'relative', overflow: 'hidden'
                                                                }}
                                                            >
                                                                <div className="btn-glint" style={{ opacity: isSelected ? 0.1 : 0 }} />
                                                                <div style={{
                                                                    width: 38, height: 38, borderRadius: 12,
                                                                    background: isSelected ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.03)',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                    border: '1px solid rgba(255,255,255,0.05)'
                                                                }}>
                                                                    <item.icon size={18} />
                                                                </div>
                                                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                                    <span style={{ fontSize: 15, fontWeight: 700 }}>{item.label}</span>
                                                                    {isSelected && item.path && (
                                                                        <span style={{ fontSize: 10, opacity: 0.7, fontWeight: 800, textTransform: 'uppercase' }}>
                                                                            Go to {item.path.replace('/', '') || 'Dashboard'}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {isSelected ? (
                                                                    <ArrowRight size={16} />
                                                                ) : (
                                                                    <div style={{ fontSize: 10, fontWeight: 900, opacity: 0.3, background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 4 }}>
                                                                        {item.id.toUpperCase()}
                                                                    </div>
                                                                )}
                                                            </motion.div>
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                                </>
                            )}
                        </div>

                        <div style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 16 }}>
                            {[
                                { key: 'Enter', label: 'Select' },
                                { key: '↑↓', label: 'Navigate' },
                                { key: 'Esc', label: 'Close' },
                            ].map(k => (
                                <div key={k.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--muted)', fontWeight: 700 }}>
                                    <kbd style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>{k.key}</kbd>
                                    <span>{k.label}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}
