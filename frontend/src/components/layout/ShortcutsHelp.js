import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard, Command } from 'lucide-react';

const SHORTCUTS = [
    { key: '?', label: 'Open Shortcuts Help', category: 'Global' },
    { key: 'Ctrl + K', label: 'Open Command Palette', category: 'Global' },
    { key: '/', label: 'Search Tasks / Notes', category: 'Navigation' },
    { key: 'N', label: 'Quick Add Task', category: 'Tasks' },
    { key: 'Esc', label: 'Close Modal / Cancel', category: 'Global' },
    { key: 'G + D', label: 'Go to Dashboard', category: 'Navigation' },
    { key: 'G + T', label: 'Go to Tasks', category: 'Navigation' },
    { key: 'G + N', label: 'Go to Notes', category: 'Navigation' },
    { key: 'P', label: 'Start Pomodoro', category: 'Focus' },
];

const ShortcutsHelp = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        
        const handleKeyDown = (e) => {
            if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    return (
        <AnimatePresence>
            {isOpen && (
                <div
                    className="modal-overlay"
                    style={{ zIndex: 3000 }}
                    onClick={() => setIsOpen(false)}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 30 }}
                        className={`premium-card aura-iridescent ${isMobile ? 'bottom-sheet' : ''}`}
                        style={{
                            maxWidth: 700,
                            width: '100%',
                            padding: 0,
                            borderRadius: isMobile ? '32px 32px 0 0' : 32,
                            overflow: 'hidden',
                            border: '1px solid rgba(255,255,255,0.05)',
                            boxShadow: '0 20px 80px rgba(0,0,0,0.5)',
                            margin: isMobile ? 0 : '20px'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ padding: '32px 40px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div className="auth-logo-icon" style={{ width: 44, height: 44, marginBottom: 0 }}>
                                    <Keyboard size={22} color="white" />
                                </div>
                                <div>
                                    <div style={{ fontFamily: 'Syne', fontSize: 24, fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>Power Shortcuts</div>
                                    <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Neural Interface Commands</div>
                                </div>
                            </div>
                            <button className="modal-close haptic-tap" onClick={() => setIsOpen(false)} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 8 }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ padding: '40px', maxHeight: '70vh', overflowY: 'auto' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 16 }}>
                                {SHORTCUTS.map((s, i) => (
                                    <motion.div 
                                        key={i} 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '16px 20px',
                                            background: 'rgba(255,255,255,0.02)',
                                            borderRadius: 16,
                                            border: '1px solid rgba(255,255,255,0.05)'
                                        }}
                                    >
                                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{s.label}</span>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            {s.key.split(' + ').map((k, j) => (
                                                <kbd key={j} style={{
                                                    background: 'rgba(255,255,255,0.05)',
                                                    padding: '4px 10px',
                                                    borderRadius: 8,
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    fontSize: 10,
                                                    fontFamily: 'DM Mono, monospace',
                                                    color: 'var(--accent)',
                                                    minWidth: 28,
                                                    textAlign: 'center',
                                                    fontWeight: 900,
                                                    boxShadow: '0 4px 0 rgba(0,0,0,0.3)'
                                                }}>
                                                    {k}
                                                </kbd>
                                            ))}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <div style={{ 
                                marginTop: 32, padding: '24px', 
                                background: 'linear-gradient(135deg, rgba(130, 114, 255, 0.05), transparent)', 
                                borderRadius: 20, border: '1px solid rgba(130, 114, 255, 0.1)', 
                                display: 'flex', gap: 16, alignItems: 'center' 
                            }}>
                                <Command size={20} className="text-accent" />
                                <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6, fontWeight: 600 }}>
                                    Combine <strong style={{ color: 'var(--accent)' }}>G</strong> with other keys for rapid "Go to" navigation. These shortcuts are active whenever you are not typing in a field.
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ShortcutsHelp;
