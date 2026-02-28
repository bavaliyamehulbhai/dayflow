import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subMonths, eachDayOfInterval, startOfMonth, endOfMonth, eachMonthOfInterval, getDay, differenceInDays } from 'date-fns';

const ActivityHeatmapYear = ({ data = [], isMobile = false, onSelectDay }) => {
    const [hoveredDay, setHoveredDay] = useState(null);
    const [selectedDay, setSelectedDay] = useState(null);

    const intensityColors = [
        '#f3f4f6',              // level 0 (empty)
        '#dcfce7',              // level 1 (light green)
        '#86efac',              // level 2 
        '#22c55e',              // level 3
        '#166534'               // level 4 (vibrant green)
    ];

    const today = new Date();
    const yearAgo = subMonths(today, 11);

    // Stats calculations
    const stats = useMemo(() => {
        let totalSubmissions = 0;
        let activeDays = 0;
        let maxStreak = 0;
        let currentStreak = 0;

        // Sort data by date for streak calculation
        const sortedLogs = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));

        data.forEach(log => {
            totalSubmissions += (log.tasksCompleted || 0) + (log.habitsCompleted || 0) + (log.scheduleEventsCompleted || 0) + (log.pomodoros || 0);
            if (log.score > 0) activeDays++;
        });

        let lastDate = null;
        sortedLogs.forEach(log => {
            if (log.score > 0) {
                const logDate = new Date(log.date);
                if (lastDate && differenceInDays(logDate, lastDate) === 1) {
                    currentStreak++;
                } else {
                    currentStreak = 1;
                }
                maxStreak = Math.max(maxStreak, currentStreak);
                lastDate = logDate;
            } else {
                currentStreak = 0;
            }
        });

        return { totalSubmissions, activeDays, maxStreak };
    }, [data]);

    // Group days by month
    const monthsData = useMemo(() => {
        const interval = eachMonthOfInterval({ start: startOfMonth(yearAgo), end: today });
        return interval.map(monthStart => {
            const mStart = startOfMonth(monthStart);
            const mEnd = endOfMonth(monthStart);
            const monthDays = eachDayOfInterval({ start: mStart, end: mEnd });
            const startDayOfWeek = getDay(mStart);

            return {
                label: format(monthStart, 'MMM'),
                days: monthDays,
                startOffset: startDayOfWeek
            };
        });
    }, [today, yearAgo]);

    const handleSelect = (day, log) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        setSelectedDay(dateStr);
        if (onSelectDay) onSelectDay(day, log);
    };

    const maxScore = useMemo(() => {
        const scores = data.map(l => l.score || 0).filter(s => s > 0);
        return scores.length > 0 ? Math.max(...scores) : 0;
    }, [data]);

    return (
        <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: '24px',
            width: '100%',
            color: 'var(--text)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
        }}>
            {/* Header Stats */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 24,
                flexWrap: 'wrap',
                gap: 16
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>{stats.totalSubmissions}</span>
                    <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500 }}>submissions in the past one year</span>
                    <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: 'var(--muted)', cursor: 'help' }}>i</div>
                </div>

                <div style={{ display: 'flex', gap: 24, fontSize: 13, color: 'var(--muted)', fontWeight: 500, alignItems: 'center' }}>
                    <div>Total active days: <span style={{ color: 'var(--text)', fontWeight: 700 }}>{stats.activeDays}</span></div>
                    <div>Max streak: <span style={{ color: 'var(--text)', fontWeight: 700 }}>{stats.maxStreak}</span></div>
                    <select style={{
                        background: 'var(--surface2)',
                        padding: '4px 12px',
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                        color: 'var(--text)',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        outline: 'none'
                    }}>
                        <option>Current Year</option>
                        <option>2025</option>
                        <option>2024</option>
                    </select>
                </div>
            </div>

            {/* Heatmap Grid Container */}
            <div style={{ overflowX: 'auto', paddingBottom: 10, scrollbarWidth: 'none' }}>
                <div style={{ display: 'flex', gap: 6, minWidth: 'max-content' }}>
                    {monthsData.map((month, mIdx) => (
                        <div key={mIdx} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div style={{
                                display: 'grid',
                                gridTemplateRows: 'repeat(7, 10px)',
                                gap: 3,
                                gridAutoFlow: 'column'
                            }}>
                                {/* Offset cells */}
                                {Array.from({ length: month.startOffset }).map((_, i) => (
                                    <div key={`offset-${i}`} style={{ width: 10, height: 10, visibility: 'hidden' }} />
                                ))}

                                {month.days.map((day) => {
                                    const dateStr = format(day, 'yyyy-MM-dd');
                                    const log = data.find(l => l.date === dateStr);
                                    const intensity = log ? (log.intensity || 0) : 0;
                                    const isFuture = day > today;
                                    const isSelected = selectedDay === dateStr;
                                    const isRecord = log && log.score > 0 && log.score >= maxScore * 0.95 && maxScore > 0;

                                    return (
                                        <div key={dateStr} style={{ position: 'relative' }}>
                                            <motion.div
                                                whileHover={{ scale: 1.2, zIndex: 10 }}
                                                onClick={() => !isFuture && handleSelect(day, log)}
                                                onMouseEnter={() => setHoveredDay({ date: day, log, id: dateStr })}
                                                onMouseLeave={() => setHoveredDay(null)}
                                                style={{
                                                    width: 10,
                                                    height: 10,
                                                    borderRadius: 2,
                                                    background: intensityColors[intensity],
                                                    opacity: isFuture ? 0.2 : 1,
                                                    cursor: isFuture ? 'default' : 'pointer',
                                                    boxShadow: isSelected ? '0 0 0 2px var(--accent)' : 'none',
                                                    position: 'relative',
                                                    border: intensity === 0 ? '1px solid var(--border)' : 'none'
                                                }}
                                            >
                                                {isRecord && (
                                                    <motion.div
                                                        animate={{ opacity: [0.4, 1, 0.4] }}
                                                        transition={{ repeat: Infinity, duration: 2 }}
                                                        style={{
                                                            position: 'absolute',
                                                            top: -3, right: -3,
                                                            fontSize: 6,
                                                            zIndex: 11
                                                        }}
                                                    >
                                                        ✨
                                                    </motion.div>
                                                )}
                                            </motion.div>

                                            <AnimatePresence>
                                                {hoveredDay && hoveredDay.id === dateStr && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                                        style={{
                                                            position: 'absolute',
                                                            bottom: '100%',
                                                            left: '50%',
                                                            transform: 'translateX(-50%)',
                                                            marginBottom: 8,
                                                            background: 'var(--surface)',
                                                            border: '1px solid var(--border)',
                                                            borderRadius: 12,
                                                            padding: '12px',
                                                            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
                                                            zIndex: 100,
                                                            pointerEvents: 'none',
                                                            minWidth: 160,
                                                            backdropFilter: 'blur(10px)'
                                                        }}
                                                    >
                                                        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text)' }}>
                                                            {((log?.tasksCompleted || 0) + (log?.habitsCompleted || 0) + (log?.scheduleEventsCompleted || 0))} submissions
                                                        </div>
                                                        <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 8, fontWeight: 600 }}>
                                                            on {format(day, 'MMM d, yyyy')}
                                                        </div>
                                                        <div style={{ display: 'grid', gap: 4, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                                                            <div style={{ fontSize: 10, display: 'flex', justifyContent: 'space-between' }}>
                                                                <span style={{ color: 'var(--muted)', fontWeight: 600 }}>Deep Work Sessions</span>
                                                                <span style={{ fontWeight: 800, color: 'var(--accent)' }}>{log?.pomodoros || 0}</span>
                                                            </div>
                                                            <div style={{ fontSize: 10, display: 'flex', justifyContent: 'space-between' }}>
                                                                <span style={{ color: 'var(--muted)', fontWeight: 600 }}>Focus Time</span>
                                                                <span style={{ fontWeight: 800, color: 'var(--accent)' }}>{log?.focusMinutes || 0}m</span>
                                                            </div>
                                                        </div>
                                                        {isRecord && (
                                                            <div style={{ marginTop: 8, fontSize: 9, color: 'gold', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                ✨ PERSONAL BEST
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Month Label */}
                            <div style={{
                                textAlign: 'center',
                                fontSize: 10,
                                color: 'var(--muted)',
                                fontWeight: 600,
                                marginTop: 6
                            }}>
                                {month.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Visual Legend */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 16, justifyContent: 'flex-end', fontSize: 11, color: 'var(--muted)', fontWeight: 500 }}>
                <span>Less</span>
                {intensityColors.map((color, i) => (
                    <div key={i} style={{ width: 10, height: 10, background: color, borderRadius: 2, border: i === 0 ? '1px solid var(--border)' : 'none' }} />
                ))}
                <span>More</span>
            </div>
        </div>
    );
};

export default ActivityHeatmapYear;
