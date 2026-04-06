import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { subMonths, eachDayOfInterval, startOfMonth, endOfMonth, eachMonthOfInterval, getDay, differenceInDays } from 'date-fns';
import { safeFormat } from '../utils/dateUtils';

const ActivityHeatmapYear = React.memo(({ data = [], isMobile = false, onSelectDay }) => {
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
                label: safeFormat(monthStart, 'MMM'),
                days: monthDays,
                startOffset: startDayOfWeek
            };
        });
    }, [today, startDate]);

    const handleSelect = (day, log) => {
        const dateStr = safeFormat(day, 'yyyy-MM-dd');
        setSelectedDay(dateStr);
        if (onSelectDay) onSelectDay(day, log);
    };

    const maxScore = useMemo(() => {
        const scores = data.map(l => l.score || 0).filter(s => s > 0);
        return scores.length > 0 ? Math.max(...scores) : 0;
    }, [data]);

    return (
        <div className="premium-card aura-iridescent hover-lift" style={{
            background: 'rgba(255,255,255,0.01)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 32,
            padding: isMobile ? '20px 16px' : '40px',
            width: '100%',
            color: 'var(--text)',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3), inset 0 0 40px rgba(255,255,255,0.02)'
        }}>
            <div className="aura-pulse" style={{ 
                position: 'absolute', top: '-20%', right: '-20%', 
                width: '60%', height: '60%', 
                background: 'var(--accent)', opacity: 0.05, 
                filter: 'blur(100px)', zIndex: 0 
            }} />
            <div className="btn-glint" style={{ opacity: 0.02 }} />

            {/* Header Stats */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'flex-start' : 'center',
                marginBottom: isMobile ? 32 : 40,
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? 24 : 24,
                position: 'relative',
                zIndex: 1
            }}>
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: isMobile ? 16 : 20,
                    width: isMobile ? '100%' : 'auto'
                }}>
                    <div style={{ 
                        width: isMobile ? 52 : 64, 
                        height: isMobile ? 52 : 64, 
                        borderRadius: isMobile ? 16 : 20, 
                        background: 'rgba(255,255,255,0.03)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1px solid rgba(255,255,255,0.05)',
                        boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
                        flexShrink: 0
                    }}>
                        <div style={{ fontSize: isMobile ? 24 : 32, fontWeight: 900, color: 'white', fontFamily: 'Syne' }}>{stats.totalSubmissions}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ fontSize: isMobile ? 12 : 13, color: 'white', fontWeight: 800, letterSpacing: -0.2 }}>SYNCHRONIZED EVENTS</div>
                        <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600 }}>Past {isMobile ? '90' : '365'} cycles</div>
                    </div>
                </div>

                <div style={{ 
                    display: 'flex', 
                    gap: isMobile ? 24 : 32, 
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: isMobile ? '100%' : 'auto'
                }}>
                    <div style={{ textAlign: isMobile ? 'left' : 'right' }}>
                        <div style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>Active Presence</div>
                        <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 800, color: 'var(--accent)', fontFamily: 'Syne' }}>{stats?.activeDays || 0}<span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 4, fontWeight: 600 }}>CYCLES</span></div>
                    </div>
                    <div style={{ textAlign: isMobile ? 'left' : 'right' }}>
                        <div style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>Peak Sequence</div>
                        <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 800, color: 'var(--red)', fontFamily: 'Syne' }}>{stats.maxStreak}<span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 4, fontWeight: 600 }}>DAYS</span></div>
                    </div>
                    <select className="glass haptic-tap" style={{
                        background: 'rgba(255,255,255,0.05)',
                        padding: isMobile ? '8px 12px' : '8px 16px',
                        borderRadius: 14,
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'var(--text)',
                        fontSize: 9,
                        fontWeight: 900,
                        cursor: 'pointer',
                        outline: 'none',
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                        appearance: 'none',
                        maxWidth: isMobile ? '80px' : 'none',
                        textAlign: 'center'
                    }}>
                        <option>CURR</option>
                        <option>2025</option>
                    </select>
                </div>
            </div>

            {/* Heatmap Grid Container */}
            <div style={{ overflowX: 'auto', paddingBottom: 10, scrollbarWidth: 'none', position: 'relative', zIndex: 1 }}>
                <div style={{ 
                    display: 'flex', 
                    gap: isMobile ? 10 : 8, 
                    minWidth: 'max-content'
                }}>
                    {monthsData.map((month, mIdx) => (
                        <div key={`month-${mIdx}-${month.label}`} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{
                                display: 'grid',
                                gridTemplateRows: `repeat(7, ${isMobile ? '14px' : '12px'})`,
                                gap: isMobile ? 5 : 4,
                                gridAutoFlow: 'column'
                            }}>
                                {/* Offset cells */}
                                {Array.from({ length: month.startOffset }).map((_, i) => (
                                    <div key={`offset-${i}`} style={{ width: isMobile ? 14 : 12, height: isMobile ? 14 : 12, visibility: 'hidden' }} />
                                ))}

                                {month.days.map((day) => {
                                    const dateStr = safeFormat(day, 'yyyy-MM-dd');
                                    const log = data.find(l => l.date === dateStr);
                                    const intensity = log ? (log.intensity || 0) : 0;
                                    const isFuture = day > today;
                                    const isToday = dateStr === safeFormat(today, 'yyyy-MM-dd');
                                    const isSelected = selectedDay === dateStr;
                                    const isRecord = log && log.score > 0 && log.score >= maxScore * 0.95 && maxScore > 0;

                                    return (
                                        <div key={dateStr} style={{ position: 'relative' }}>
                                            <motion.div
                                                whileHover={{ scale: 1.3, zIndex: 10 }}
                                                onClick={() => !isFuture && handleSelect(day, log)}
                                                onMouseEnter={() => setHoveredDay({ date: day, log, id: dateStr })}
                                                onMouseLeave={() => setHoveredDay(null)}
                                                initial={isToday ? { boxShadow: '0 0 0px var(--accent)' } : false}
                                                animate={isToday ? { boxShadow: ['0 0 0px var(--accent)', '0 0 10px var(--accent)', '0 0 0px var(--accent)'] } : false}
                                                transition={isToday ? { repeat: Infinity, duration: 2 } : false}
                                                style={{
                                                    width: isMobile ? 14 : 12,
                                                    height: isMobile ? 14 : 12,
                                                    borderRadius: 3,
                                                    background: intensityColors[intensity],
                                                    opacity: isFuture ? 0.1 : 1,
                                                    cursor: isFuture ? 'default' : 'pointer',
                                                    border: isSelected ? '1.5px solid white' : (isToday ? '1px solid var(--accent)' : 'none'),
                                                    position: 'relative',
                                                    boxShadow: isSelected ? '0 0 15px rgba(255,255,255,0.4)' : 'none'
                                                }}
                                            >
                                                {isRecord && (
                                                    <div style={{ position: 'absolute', top: -4, right: -4, fontSize: 8, zIndex: 11 }}>✨</div>
                                                )}
                                            </motion.div>

                                            <AnimatePresence>
                                                {hoveredDay && hoveredDay.id === dateStr && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                                        style={{
                                                            position: 'absolute',
                                                            bottom: '100%',
                                                            left: '50%',
                                                            transform: 'translateX(-50%)',
                                                            marginBottom: 12,
                                                            background: 'rgba(20, 20, 35, 0.95)',
                                                            border: '1px solid rgba(255,255,255,0.1)',
                                                            borderRadius: 20,
                                                            padding: '16px',
                                                            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                                                            zIndex: 100,
                                                            pointerEvents: 'none',
                                                            minWidth: 180,
                                                            backdropFilter: 'blur(20px)'
                                                        }}
                                                    >
                                                        <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                                                            {safeFormat(day, 'MMMM d, yyyy')}
                                                        </div>
                                                        <div style={{ fontSize: 18, fontWeight: 900, color: 'white', marginBottom: 12, fontFamily: 'Syne' }}>
                                                            {log?.score || 0} <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600 }}>COGNITIVE XP</span>
                                                        </div>
                                                        
                                                        <div style={{ display: 'grid', gap: 6, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12 }}>
                                                            {[
                                                                { label: 'Tactical Objectives', val: log?.tasksCompleted || 0, color: 'var(--accent)' },
                                                                { label: 'Neural Focus', val: `${log?.pomodoros || 0} sessions`, color: 'var(--green)' },
                                                                { label: 'Rituals Secured', val: log?.habitsCompleted || 0, color: 'var(--accent2)' },
                                                            ].map(item => (
                                                                <div key={item.label} style={{ fontSize: 10, display: 'flex', justifyContent: 'space-between' }}>
                                                                    <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{item.label}</span>
                                                                    <span style={{ fontWeight: 800, color: item.color }}>{item.val}</span>
                                                                </div>
                                                            ))}
                                                        </div>
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
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: 1
                            }}>
                                {month.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Visual Legend */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 24, justifyContent: 'flex-end', fontSize: 10, color: 'var(--muted)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1 }}>
                <span>Inert</span>
                <div style={{ display: 'flex', gap: 4 }}>
                    {intensityColors.map((color, i) => (
                        <div key={`intensity-${i}`} style={{ width: 12, height: 12, background: color, borderRadius: 3, border: i === 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }} />
                    ))}
                </div>
                <span>Zenith</span>
            </div>
        </div>
    );
});

export default ActivityHeatmapYear;
