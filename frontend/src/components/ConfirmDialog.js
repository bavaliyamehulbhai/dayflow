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
                    style={{ zIndex: 1000 }}
                    onClick={(e) => e.target === e.currentTarget && onCancel()}
                >
                    <motion.div
                        key="confirm-box"
                        initial={{ opacity: 0, scale: 0.92, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 16 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                        className="confirm-dialog"
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
