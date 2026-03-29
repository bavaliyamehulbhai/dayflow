import React from 'react';

const Skeleton = ({ width, height, borderRadius = 12, className = "" }) => {
  return (
    <div 
      className={`skeleton ${className}`} 
      style={{ 
        width: width || '100%', 
        height: height || '20px', 
        borderRadius,
        opacity: 0.6
      }}
    />
  );
};

export const CardSkeleton = () => (
    <div className="card glass-card" style={{ padding: 'var(--space-6)', height: 200, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Skeleton width="40%" height="24px" />
        <Skeleton width="100%" height="16px" />
        <Skeleton width="100%" height="16px" />
        <div style={{ marginTop: 'auto', display: 'flex', gap: 10 }}>
            <Skeleton width="60px" height="24px" borderRadius={50} />
            <Skeleton width="80px" height="24px" borderRadius={50} />
        </div>
    </div>
);

export const ListSkeleton = ({ count = 3 }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <Skeleton width="24px" height="24px" borderRadius={6} />
                <div style={{ flex: 1 }}>
                    <Skeleton width="60%" height="14px" style={{ marginBottom: 6 }} />
                    <Skeleton width="30%" height="10px" />
                </div>
            </div>
        ))}
    </div>
);

export default Skeleton;
