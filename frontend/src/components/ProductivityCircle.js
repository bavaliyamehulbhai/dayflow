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
    const isMobile = window.innerWidth <= 768;
    const size = isMobile ? 140 : 160;
    const center = size / 2;
    const radius = isMobile ? 55 : 65;
    const strokeWidth = isMobile ? 10 : 12;
    const circumference = 2 * Math.PI * radius;

    let currentOffset = 0;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                width: '100%',
                position: 'relative'
            }}
        >
            <h3 style={{ fontSize: 11, fontWeight: 900, color: 'var(--muted)', margin: 0, textTransform: 'uppercase', letterSpacing: 2 }}>Output Distribution Protocol</h3>

            <div style={{ position: 'relative', width: size, height: size, margin: '10px auto' }}>
                <svg viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                    {/* Background Track */}
                    <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={strokeWidth} />

                    {total === 0 ? (
                        <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} strokeDasharray="4 4" />
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
                                    style={{ filter: `drop-shadow(0 0 12px ${cat.color}44)` }}
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
                        style={{ fontSize: 36, fontWeight: 800, color: 'white', fontFamily: 'Syne, sans-serif', letterSpacing: '-0.05em' }}
                    >
                        {total}
                    </motion.div>
                    <div style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1.5 }}>Aggregated Units</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {categories.map((cat, idx) => (
                    <div key={idx} style={{
                        padding: '12px 16px',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: 16,
                        border: '1px solid rgba(255,255,255,0.05)',
                        opacity: cat.count > 0 ? 1 : 0.3,
                        transition: 'all 0.3s ease'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: cat.color, boxShadow: `0 0 10px ${cat.color}` }} />
                            <span style={{ fontSize: 9, fontWeight: 900, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{cat.label}</span>
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: 'white', fontFamily: 'Syne' }}>{cat.count}</div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

export default ProductivityCircle;
