import React from 'react';
import WidgetWrapper from './WidgetWrapper';
import { FileText } from 'lucide-react';
import { safeFormat } from '../../utils/dateUtils';
import { getSafeId } from '../../utils/idUtils';

const NotesWidget = ({ data, navigate }) => {
  return (
    <WidgetWrapper title="Knowledge Base" icon={FileText}>
      {data?.notes?.recent?.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {data.notes.recent.slice(0, 3).map((n, index) => {
            const nid = getSafeId(n, `note-${index}`);
            return (
              <div key={nid} style={{
              padding: '14px 16px',
              background: 'var(--surface2)',
              borderRadius: 14,
              cursor: 'pointer',
              borderLeft: `4px solid ${n.color || 'var(--accent)'}`,
              transition: 'all 0.2s ease',
              position: 'relative',
              overflow: 'hidden'
            }} className="hover-lift" onClick={() => navigate('/notes')}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{n.title}</div>
              <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4, fontWeight: 600 }}>
                SYNCED {safeFormat(n.updatedAt, 'MMM do', 'JUST NOW')}
              </div>
            </div>
            )
          })}
          <button className="btn btn-sm btn-ghost mt-2" onClick={() => navigate('/notes')} style={{ fontSize: 11, fontWeight: 800 }}>
            ACCESS ALL NOTES
          </button>
        </div>
      ) : (
        <div className="empty-state" style={{ padding: '40px 24px', opacity: 0.8 }}>
          <div className="empty-icon" style={{ fontSize: 32, marginBottom: 12 }}>📔</div>
          <div className="empty-title" style={{ fontSize: 14, fontWeight: 700 }}>Empty Knowledge</div>
          <div className="empty-desc" style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Capture fragments of your thoughts.</div>
        </div>
      )}
    </WidgetWrapper>
  );
};

export default NotesWidget;
