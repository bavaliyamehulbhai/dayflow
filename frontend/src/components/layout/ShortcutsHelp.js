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

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
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
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="modal"
                        style={{ maxWidth: 600, width: '90%' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Keyboard size={20} className="text-accent" />
                                Power Shortcuts
                            </div>
                            <button className="modal-close" onClick={() => setIsOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="grid-2">
                                {SHORTCUTS.map((s, i) => (
                                    <div key={i} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '12px 16px',
                                        background: 'var(--surface2)',
                                        borderRadius: 12,
                                        border: '1px solid var(--border)'
                                    }}>
                                        <span style={{ fontSize: 13, color: 'var(--text)' }}>{s.label}</span>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            {s.key.split(' + ').map((k, j) => (
                                                <kbd key={j} style={{
                                                    background: 'var(--surface)',
                                                    padding: '2px 8px',
                                                    borderRadius: 6,
                                                    border: '1px solid var(--border2)',
                                                    fontSize: 11,
                                                    fontFamily: 'DM Mono, monospace',
                                                    color: 'var(--accent)',
                                                    minWidth: 24,
                                                    textAlign: 'center',
                                                    boxShadow: '0 2px 0 var(--border)'
                                                }}>
                                                    {k}
                                                </kbd>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginTop: 24, padding: 16, background: 'rgba(130, 114, 255, 0.05)', borderRadius: 12, border: '1px solid rgba(130, 114, 255, 0.1)', display: 'flex', gap: 12, alignItems: 'center' }}>
                                <Command size={18} className="text-accent" />
                                <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.4 }}>
                                    Combine <strong>G</strong> with other keys for rapid "Go to" navigation. These shortcuts are active whenever you are not typing in a field.
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
