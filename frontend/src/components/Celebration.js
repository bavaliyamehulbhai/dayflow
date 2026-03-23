import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Sparkles, Zap } from 'lucide-react';
import { createPortal } from 'react-dom';

const Celebration = ({ open, onClose, title = "System Synchronized", subtitle = "Milestone Reached" }) => {
    useEffect(() => {
        if (open) {
            const timer = setTimeout(onClose, 4000);
            return () => clearTimeout(timer);
        }
    }, [open, onClose]);

    if (!open) return null;

    return createPortal(
        <AnimatePresence>
            {open && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 2000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    pointerEvents: 'none', overflow: 'hidden'
                }}>
                    {/* Backdrop Blur Pulse */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'absolute', inset: 0,
                            background: 'radial-gradient(circle at center, rgba(124, 109, 250, 0.15) 0%, transparent 70%)',
                            backdropFilter: 'blur(8px)',
                        }}
                    />

                    {/* Concentric Signal Rings */}
                    {[...Array(3)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ scale: 0, opacity: 0.5 }}
                            animate={{ scale: 4, opacity: 0 }}
                            transition={{ duration: 2, repeat: Infinity, delay: i * 0.4, ease: "easeOut" }}
                            style={{
                                position: 'absolute', width: 200, height: 200,
                                borderRadius: '50%', border: '2px solid var(--accent)',
                                boxShadow: '0 0 30px var(--accent-glow)'
                            }}
                        />
                    ))}

                    {/* Floating Particles */}
                    {[...Array(20)].map((_, i) => (
                        <motion.div
                            key={`p-${i}`}
                            initial={{ 
                                x: 0, y: 0, scale: 0, opacity: 1 
                            }}
                            animate={{ 
                                x: (Math.random() - 0.5) * 800, 
                                y: (Math.random() - 0.5) * 800,
                                scale: Math.random() * 1.5,
                                opacity: 0
                            }}
                            transition={{ duration: 2, ease: "circOut" }}
                            style={{
                                position: 'absolute', width: 8, height: 8,
                                borderRadius: '50%', 
                                background: i % 2 === 0 ? 'var(--accent)' : 'var(--accent2)',
                                boxShadow: `0 0 10px ${i % 2 === 0 ? 'var(--accent)' : 'var(--accent2)'}`
                            }}
                        />
                    ))}

                    {/* Main Content Card */}
                    <motion.div
                        initial={{ scale: 0, rotate: -10, opacity: 0, y: 50 }}
                        animate={{ scale: 1, rotate: 0, opacity: 1, y: 0 }}
                        exit={{ scale: 0.5, opacity: 0, y: -50 }}
                        transition={{ 
                            type: 'spring', damping: 15, stiffness: 200,
                            duration: 0.6 
                        }}
                        style={{
                            background: 'rgba(13, 13, 22, 0.9)',
                            backdropFilter: 'blur(40px) saturate(200%)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: 40, padding: '40px 60px',
                            textAlign: 'center', position: 'relative',
                            boxShadow: '0 40px 100px rgba(0,0,0,0.8), inset 0 0 60px rgba(124, 109, 250, 0.1)'
                        }}
                    >
                        <motion.div
                            animate={{ 
                                scale: [1, 1.2, 1],
                                rotate: [0, 10, -10, 0]
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                            style={{ 
                                width: 100, height: 100, borderRadius: 30,
                                background: 'var(--grad-premium)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 24px',
                                boxShadow: '0 20px 40px rgba(124, 109, 250, 0.3)'
                            }}
                        >
                            <Trophy size={48} color="white" strokeWidth={2.5} />
                        </motion.div>

                        <div style={{
                            fontFamily: 'Syne, sans-serif', fontSize: 36, fontWeight: 900,
                            background: 'linear-gradient(180deg, #fff, var(--text2))',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                            letterSpacing: '-0.04em', marginBottom: 8, textTransform: 'uppercase'
                        }}>
                            {title}
                        </div>
                        
                        <div style={{
                            fontSize: 14, color: 'var(--accent)', fontWeight: 800,
                            letterSpacing: 4, textTransform: 'uppercase', opacity: 0.8
                        }}>
                            {subtitle}
                        </div>

                        <div style={{ 
                            marginTop: 32, display: 'flex', justifyContent: 'center', gap: 20,
                            color: 'var(--muted)', fontSize: 11, fontWeight: 900, letterSpacing: 2
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Star size={14} fill="var(--accent)" color="var(--accent)" /> EXCELLENCE
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Zap size={14} fill="var(--accent2)" color="var(--accent2)" /> MOMENTUM
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default Celebration;
