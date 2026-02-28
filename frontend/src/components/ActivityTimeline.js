import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { CheckCircle2, Timer, Flame, BookOpen } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

const ActivityTimeline = ({ selectedDay, data, isMobile = false }) => {
    if (!selectedDay) {
        return (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
                <span style={{ fontSize: 13 }}>Click a day on the heatmap to see activity details</span>
            </div>
        );
    }

    const dateStr = format(selectedDay, 'MMMM d, yyyy');

    const activities = [
        { id: 'tasks', label: 'Output (Tasks)', value: data?.tasksCompleted || 0, icon: CheckCircle2, color: 'var(--accent)' },
        { id: 'focus', label: 'Energy (Minutes)', value: data?.focusMinutes || 0, icon: Timer, color: 'var(--green)' },
        { id: 'habits', label: 'Ritual (Habits)', value: data?.habitsCompleted || 0, icon: Flame, color: 'var(--orange)' },
        { id: 'notes', label: 'Cortex (Notes)', value: data?.notesCreated || 0, icon: BookOpen, color: 'var(--green)' },
    ].filter(a => a.value > 0);

    // Prepare data for Radar Chart
    const radarData = [
        { subject: 'Output', A: Math.min(100, (data?.tasksCompleted || 0) * 20), fullMark: 100 },
        { subject: 'Energy', A: Math.min(100, (data?.focusMinutes || 0) / 1.5), fullMark: 100 },
        { subject: 'Ritual', A: Math.min(100, (data?.habitsCompleted || 0) * 33), fullMark: 100 },
        { subject: 'Cortex', A: Math.min(100, (data?.notesCreated || 0) * 50), fullMark: 100 },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginTop: 20 }}
        >
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 220px', gap: 24 }}>
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Activity on {dateStr}</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                        {activities.length === 0 ? (
                            <div style={{ padding: 24, background: 'var(--surface2)', borderRadius: 12, border: '1px solid var(--border)', textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>
                                No specific metrics logged for this date.
                            </div>
                        ) : (
                            activities.map((activity, i) => (
                                <motion.div
                                    key={activity.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    style={{
                                        padding: '12px 16px',
                                        background: 'var(--surface2)',
                                        borderRadius: 10,
                                        border: '1px solid var(--border)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 12
                                    }}
                                >
                                    <div style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 8,
                                        background: `${activity.color}11`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: activity.color
                                    }}>
                                        <activity.icon size={16} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 800 }}>{activity.value}{activity.id === 'focus' ? 'm' : ''}</div>
                                        <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>{activity.label}</div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>

                    {activities.length > 0 && (
                        <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: 'rgba(46, 204, 113, 0.05)', border: '1px dashed rgba(46, 204, 113, 0.2)', fontSize: 11, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Flame size={12} />
                            <span>Great job! You maintained your consistency on this day.</span>
                        </div>
                    )}
                </div>

                {activities.length > 0 && !isMobile && (
                    <div style={{
                        height: 220,
                        background: 'var(--surface2)',
                        borderRadius: 12,
                        padding: '20px 10px',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 1.5 }}>Activity Mix</div>
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                                <PolarGrid stroke="var(--border)" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--muted)', fontSize: 9, fontWeight: 700 }} />
                                <Radar
                                    name="Power"
                                    dataKey="A"
                                    stroke="var(--green)"
                                    fill="var(--green)"
                                    fillOpacity={0.4}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default ActivityTimeline;
