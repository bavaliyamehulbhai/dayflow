import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subMonths, eachDayOfInterval, startOfMonth, endOfMonth, eachMonthOfInterval, getDay, differenceInDays } from 'date-fns';

const ActivityHeatmapYear = ({ data = [], isMobile = false, onSelectDay }) => {
    const [hoveredDay, setHoveredDay] = useState(null);
    const [selectedDay, setSelectedDay] = useState(null);

    const intensityColors = [
        'rgba(255,255,255,0.03)', // level 0
        '#7c6dfa',              // level 1 (Indigo)
        '#00f2fe',              // level 2 (Cyan)
        '#ff4d7d',              // level 3 (Rose)
        '#fa6d8a'               // level 4 (Vibrant)
    ];

    const today = new Date();
    const monthsToShow = isMobile ? 3 : 12;
    const startDate = subMonths(today, monthsToShow - 1);

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
        const interval = eachMonthOfInterval({ start: startOfMonth(startDate), end: today });
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
    }, [today, startDate]);

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
        <div className="premium-card aura-iridescent" style={{
            background: 'rgba(255,255,255,0.01)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 24,
            padding: '32px',
            width: '100%',
            color: 'var(--text)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div className="btn-glint" style={{ opacity: 0.02 }} />
            {/* Header Stats */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 32,
                flexWrap: 'wrap',
                gap: 20
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: 'white', fontFamily: 'Syne', letterSpacing: '-0.04em' }}>{stats.totalSubmissions}</div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1.5 }}>Synchronized Events</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>Past {isMobile ? '90 cycles' : '365 cycles'}</div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 24, fontSize: 11, color: 'var(--muted)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)' }} />
                        Active Days: <span style={{ color: 'white' }}>{stats.activeDays}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--red)' }} />
                        Max Streak: <span style={{ color: 'white' }}>{stats.maxStreak}</span>
                    </div>
                    <select className="glass" style={{
                        background: 'rgba(255,255,255,0.05)',
                        padding: '6px 12px',
                        borderRadius: 10,
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'var(--text)',
                        fontSize: 10,
                        fontWeight: 900,
                        cursor: 'pointer',
                        outline: 'none',
                        textTransform: 'uppercase',
                        letterSpacing: 1
                    }}>
                        <option>Current Era</option>
                        <option>2025 Cycle</option>
                        <option>2024 Cycle</option>
                    </select>
                </div>
            </div>

            {/* Heatmap Grid Container */}
            <div style={{ overflowX: 'auto', paddingBottom: 10, scrollbarWidth: 'none' }}>
                <div style={{ 
                    display: 'flex', 
                    gap: isMobile ? 8 : 6, 
                    minWidth: 'max-content',
                    padding: isMobile ? '0 4px' : 0 
                }}>
                    {monthsData.map((month, mIdx) => (
                        <div key={mIdx} style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 10 : 8 }}>
                            <div style={{
                                display: 'grid',
                                gridTemplateRows: `repeat(7, ${isMobile ? '12px' : '10px'})`,
                                gap: isMobile ? 4 : 3,
                                gridAutoFlow: 'column'
                            }}>
                                {/* Offset cells */}
                                {Array.from({ length: month.startOffset }).map((_, i) => (
                                    <div key={`offset-${i}`} style={{ width: isMobile ? 12 : 10, height: isMobile ? 12 : 10, visibility: 'hidden' }} />
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
                                                    width: isMobile ? 12 : 10,
                                                    height: isMobile ? 12 : 10,
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
                                                                <span style={{ color: 'var(--muted)', fontWeight: 600 }}>Tasks Completed</span>
                                                                <span style={{ fontWeight: 800, color: 'var(--accent)' }}>{log?.tasksCompleted || 0}</span>
                                                            </div>
                                                            <div style={{ fontSize: 10, display: 'flex', justifyContent: 'space-between' }}>
                                                                <span style={{ color: 'var(--muted)', fontWeight: 600 }}>Habits & Events</span>
                                                                <span style={{ fontWeight: 800, color: 'var(--accent)' }}>{(log?.habitsCompleted || 0) + (log?.scheduleEventsCompleted || 0)}</span>
                                                            </div>
                                                            <div style={{ fontSize: 10, display: 'flex', justifyContent: 'space-between' }}>
                                                                <span style={{ color: 'var(--muted)', fontWeight: 600 }}>Deep Work Sessions</span>
                                                                <span style={{ fontWeight: 800, color: 'var(--accent)' }}>{log?.pomodoros || 0}</span>
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
