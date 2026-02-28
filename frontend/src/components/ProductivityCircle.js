import React from 'react';
import { motion } from 'framer-motion';

const ProductivityCircle = ({ stats, totalSolved = 0 }) => {
    // stats expected: { tasks: N, habits: N, focus: N, schedule: N }
    const { tasks = 0, habits = 0, focus = 0, schedule = 0 } = stats || {};
    const categories = [
        { label: 'Tasks', count: tasks, color: '#f59e0b', bg: '#fef3c7' },    // Yellow/Hard
        { label: 'Habits', count: habits, color: '#22c55e', bg: '#dcfce7' },   // Green/Medium
        { label: 'Focus', count: focus, color: '#3b82f6', bg: '#dbeafe' },    // Blue/Easy
        { label: 'Routine', count: schedule, color: '#94a3b8', bg: '#f1f5f9' } // Grey/Schedule
    ];

    const total = tasks + habits + focus + schedule || 1; // avoid div by zero

    return (
        <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            width: '100%',
            maxWidth: 320,
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
        }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--muted)', margin: 0 }}>Productivity Output</h3>

            <div style={{ position: 'relative', width: 140, height: 140, margin: '0 auto' }}>
                <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                    {/* Background Circle */}
                    <circle cx="50" cy="50" r="45" fill="none" stroke="var(--border)" strokeWidth="6" />

                    {/* Categories Slices (Mocked visualization for now, simple layering) */}
                    <motion.circle
                        cx="50" cy="50" r="45"
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth="7"
                        strokeDasharray="283"
                        strokeDashoffset={283 * (1 - (total > 0 ? 0.7 : 0))}
                        strokeLinecap="round"
                    />
                </svg>

                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)' }}>{total}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>Items</div>
                </div>
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
                {categories.map((cat, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: cat.color }} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{cat.label}</span>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>
                            {cat.count} <span style={{ color: 'var(--muted)', fontSize: 10 }}>/ {total}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600 }}>
                    <span style={{ color: 'var(--muted)' }}>Consistency Rate</span>
                    <span style={{ color: 'var(--green)' }}>92.4%</span>
                </div>
            </div>
        </div>
    );
};

export default ProductivityCircle;
