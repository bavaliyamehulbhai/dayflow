import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

/**
 * A premium styled, in-page confirmation dialog.
 * Replaces native window.confirm() for destructive actions.
 *
 * Props:
 *   open        - boolean
 *   title       - string
 *   message     - string
 *   confirmText - string (default: "Delete")
 *   onConfirm   - () => void
 *   onCancel    - () => void
 *   danger      - boolean (red confirm button)
 */
export default function ConfirmDialog({ open, title, message, confirmText = 'Delete', onConfirm, onCancel, danger = true }) {
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;


    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div
                    key="confirm-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="modal-overlay"
                    style={{ zIndex: 99999, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center' }}
                    onClick={(e) => e.target === e.currentTarget && onCancel()}
                >
                    <motion.div
                        key="confirm-box"
                        initial={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.94, y: 20 }}
                        animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
                        exit={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.94, y: 20 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                        className="confirm-dialog premium-card aura-iridescent"
                        style={isMobile ? { 
                            width: '100%', 
                            borderRadius: '32px 32px 0 0', 
                            padding: '40px 24px calc(24px + env(safe-area-inset-bottom))',
                            maxWidth: 'none',
                            margin: 0,
                            border: 'none',
                            position: 'relative',
                            background: 'rgba(13, 13, 22, 0.95)',
                            backdropFilter: 'blur(30px)'
                        } : {
                            width: '100%',
                            maxWidth: 420,
                            padding: '32px',
                            borderRadius: '24px',
                            border: '1px solid rgba(255,255,255,0.06)',
                            position: 'relative',
                            boxShadow: '0 40px 120px rgba(0,0,0,0.8)',
                            background: 'rgba(13, 13, 22, 0.7)',
                            backdropFilter: 'blur(40px) saturate(180%)'
                        }}
                    >
                        <button className="modal-close haptic-tap" onClick={onCancel} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.03)', padding: 8, borderRadius: 12 }}>
                            <X size={18} />
                        </button>
 
                        <div className="confirm-icon aura-float" style={{ 
                            background: danger ? 'rgba(248, 113, 113, 0.1)' : 'rgba(124, 109, 250, 0.1)', 
                            border: `1.5px solid ${danger ? 'rgba(248, 113, 113, 0.2)' : 'rgba(124, 109, 250, 0.2)'}`, 
                            width: 52, height: 52, borderRadius: 16, 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
                            boxShadow: `0 0 20px ${danger ? 'rgba(248, 113, 113, 0.1)' : 'rgba(124, 109, 250, 0.1)'}`
                        }}>
                            <AlertTriangle size={24} style={{ color: danger ? 'var(--red)' : 'var(--accent)' }} />
                        </div>
 
                        <div className="confirm-title" style={{ fontFamily: 'Syne', fontSize: 24, fontWeight: 800, marginBottom: 12, letterSpacing: '-0.03em' }}>{title}</div>
                        <div className="confirm-message" style={{ fontSize: 15, color: 'var(--muted)', marginBottom: 32, lineHeight: 1.6, fontWeight: 500 }}>{message}</div>
 
                        <div className="confirm-actions" style={{ display: 'flex', gap: 12 }}>
                            <button className="btn btn-ghost haptic-tap" onClick={onCancel} style={{ flex: 1, height: 52, borderRadius: 14, fontWeight: 700 }}>
                                Abort
                            </button>
                            <button
                                className={`btn ${danger ? 'btn-danger' : 'btn-primary'} haptic-tap`}
                                onClick={onConfirm}
                                style={{ flex: 1, height: 52, borderRadius: 14, fontWeight: 800, boxShadow: danger ? '0 8px 25px rgba(248, 113, 113, 0.25)' : '0 8px 25px rgba(124, 109, 250, 0.25)' }}
                                autoFocus
                            >
                                <div className="btn-glint" />
                                {confirmText}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
