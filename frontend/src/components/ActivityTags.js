import React from 'react';

const ActivityTags = ({ tags = [] }) => {
    // fallback tags mirroring LeetCode's categories
    const displayTags = tags.length > 0 ? tags : [
        { label: 'Deep Work', level: 'Advanced', color: '#f59e0b' },
        { label: 'Consistency', level: 'Intermediate', color: '#22c55e' },
        { label: 'Routine Planning', level: 'Master', color: '#3b82f6' },
        { label: 'Focus Sessions', level: 'Advanced', color: '#f59e0b' },
        { label: 'Habit Formation', level: 'Beginner', color: '#94a3b8' }
    ];

    return (
        <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: '24px',
            width: '100%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
        }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--muted)', marginBottom: 20 }}>Top Activity Skills</h3>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {displayTags.map((tag, idx) => (
                    <div
                        key={idx}
                        style={{
                            padding: '6px 14px',
                            background: 'var(--surface2)',
                            borderRadius: 20,
                            border: '1px solid var(--border)',
                            fontSize: 12,
                            fontWeight: 600,
                            color: 'var(--text)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <span style={{ color: tag.color }}>●</span>
                        {tag.label}
                        <span style={{
                            fontSize: 10,
                            color: 'var(--muted)',
                            background: 'var(--border)',
                            padding: '2px 6px',
                            borderRadius: 4,
                            marginLeft: 4
                        }}>
                            {tag.level}
                        </span>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: 20, fontSize: 11, color: 'var(--muted)', fontWeight: 500, fontStyle: 'italic' }}>
                Based on your last 30 days of activity data.
            </div>
        </div>
    );
};

export default ActivityTags;
