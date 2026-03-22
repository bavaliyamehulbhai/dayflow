import React from 'react';
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
    const isMobile = window.innerWidth <= 768;
    if (!open) return null;

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    key="confirm-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="modal-overlay"
                    style={{ zIndex: 1000, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center' }}
                    onClick={(e) => e.target === e.currentTarget && onCancel()}
                >
                    <motion.div
                        key="confirm-box"
                        initial={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.9, y: 30, filter: 'blur(10px)' }}
                        animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                        exit={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.9, y: 30, filter: 'blur(10px)' }}
                        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                        className="confirm-dialog glass-holographic"
                        style={isMobile ? { 
                            width: '100%', 
                            borderRadius: '24px 24px 0 0', 
                            padding: '32px 24px calc(24px + env(safe-area-inset-bottom))',
                            maxWidth: 'none',
                            margin: 0,
                            border: 'none'
                        } : {
                            border: 'none',
                            boxShadow: '0 40px 100px rgba(0,0,0,0.6)'
                        }}
                    >
                        <button className="modal-close" onClick={onCancel} style={{ position: 'absolute', top: 16, right: 16 }}>
                            <X size={18} />
                        </button>

                        <div className="confirm-icon" style={{ background: danger ? 'rgba(250,109,109,0.08)' : 'rgba(130,114,255,0.08)', borderColor: danger ? 'rgba(250,109,109,0.2)' : 'rgba(130,114,255,0.2)' }}>
                            <AlertTriangle size={22} style={{ color: danger ? 'var(--red)' : 'var(--accent)' }} />
                        </div>

                        <div className="confirm-title">{title}</div>
                        <div className="confirm-message">{message}</div>

                        <div className="confirm-actions">
                            <button className="btn btn-ghost" onClick={onCancel} style={{ flex: 1 }}>
                                Cancel
                            </button>
                            <button
                                className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
                                onClick={onConfirm}
                                style={{ flex: 1 }}
                                autoFocus
                            >
                                {confirmText}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
