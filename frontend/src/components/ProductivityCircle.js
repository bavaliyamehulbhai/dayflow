import React from 'react';
import { motion } from 'framer-motion';

const ProductivityCircle = ({ stats }) => {
    // stats expected: { tasks: N, habits: N, focus: N, schedule: N }
    const { tasks = 0, habits = 0, focus = 0, schedule = 0 } = stats || {};

    const categories = [
        { label: 'Tasks', count: tasks, color: '#ffd700', active: tasks > 0 },    // Gold
        { label: 'Habits', count: habits, color: '#22c55e', active: habits > 0 },   // Green
        { label: 'Focus', count: focus, color: '#3b82f6', active: focus > 0 },      // Blue
        { label: 'Routine', count: schedule, color: '#94a3b8', active: schedule > 0 } // Grey
    ];

    const total = tasks + habits + focus + schedule;
    const size = 160;
    const center = size / 2;
    const radius = 65;
    const strokeWidth = 12;
    const circumference = 2 * Math.PI * radius;

    let currentOffset = 0;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card glass-card"
            style={{
                borderRadius: 24,
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: 24,
                width: '100%',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border)',
                backdropFilter: 'blur(12px)'
            }}
        >
            <h3 style={{ fontSize: 12, fontWeight: 800, color: 'var(--muted)', margin: 0, textTransform: 'uppercase', letterSpacing: 1 }}>Output Distribution</h3>

            <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
                <svg viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                    {/* Background Track */}
                    <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} />

                    {total === 0 ? (
                        <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--border)" strokeWidth={strokeWidth} strokeDasharray="4 4" />
                    ) : (
                        categories.map((cat, i) => {
                            if (cat.count === 0) return null;
                            const percentage = cat.count / total;
                            const strokeDasharray = `${percentage * circumference} ${circumference}`;
                            const strokeDashoffset = -currentOffset;
                            currentOffset += percentage * circumference;

                            return (
                                <motion.circle
                                    key={i}
                                    cx={center} cy={center} r={radius}
                                    fill="none"
                                    stroke={cat.color}
                                    strokeWidth={strokeWidth}
                                    strokeDasharray={strokeDasharray}
                                    strokeDashoffset={strokeDashoffset}
                                    strokeLinecap="round"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 1.5, ease: "circOut", delay: 0.2 }}
                                    style={{ filter: `drop-shadow(0 0 8px ${cat.color}66)` }}
                                />
                            );
                        })
                    )}
                </svg>

                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center'
                }}>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ fontSize: 32, fontWeight: 900, color: 'var(--text)', fontFamily: 'Syne, sans-serif' }}
                    >
                        {total}
                    </motion.div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2 }}>Total Unit</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {categories.map((cat, idx) => (
                    <div key={idx} style={{
                        padding: '10px 12px',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: 14,
                        border: '1px solid rgba(255,255,255,0.05)',
                        opacity: cat.count > 0 ? 1 : 0.4
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: cat.color, boxShadow: `0 0 6px ${cat.color}` }} />
                            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>{cat.label}</span>
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 800 }}>{cat.count}</div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

export default ProductivityCircle;
