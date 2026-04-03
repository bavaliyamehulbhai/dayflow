import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authAPI } from '../../utils/api';
import { Laptop, Smartphone, Globe, Monitor, XCircle, Clock, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from '../../context/NotificationContext';
import ConfirmDialog from '../ConfirmDialog';

const getBrowserIcon = (ua = '') => {
    const uaLower = ua.toLowerCase();
    if (uaLower.includes('chrome')) return <Globe size={16} className="text-blue-400" />;
    if (uaLower.includes('firefox')) return <Globe size={16} className="text-orange-400" />;
    if (uaLower.includes('safari')) return <Globe size={16} className="text-blue-300" />;
    return <Globe size={16} className="text-slate-400" />;
};

const getDeviceIcon = (ua = '') => {
    const uaLower = ua.toLowerCase();
    if (uaLower.includes('mobile') || uaLower.includes('iphone') || uaLower.includes('android')) return <Smartphone size={20} />;
    if (uaLower.includes('macintosh') || uaLower.includes('windows') || uaLower.includes('linux')) return <Laptop size={20} />;
    return <Monitor size={20} />;
};

export default function SessionManager() {
    const queryClient = useQueryClient();
    const { addToast } = useNotifications();
    const [confirmDialog, setConfirmDialog] = useState({ open: false });
    const { data, isLoading } = useQuery({
        queryKey: ['sessions'],
        queryFn: () => authAPI.getSessions().then(res => res.data)
    });

    const revokeMutation = useMutation({
        mutationFn: (id) => authAPI.revokeSession(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['sessions']);
            addToast('Session neutralized successfully', 'success');
        },
        onError: (err) => {
            addToast(err.response?.data?.error || 'Failed to neutralize session', 'error');
        }
    });

    const revokeAllMutation = useMutation({
        mutationFn: () => authAPI.revokeAllSessions(),
        onSuccess: () => {
            queryClient.invalidateQueries(['sessions']);
            addToast('All other sessions neutralized! 🔐', 'success');
        },
        onError: (err) => {
            addToast(err.response?.data?.error || 'Failed to neutralize all sessions', 'error');
        }
    });

    if (isLoading) return <div className="p-4 text-center opacity-50">Loading sessions...</div>;

    const sessions = data?.sessions || [];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold uppercase tracking-wider text-muted flex items-center gap-2">
                    <Monitor size={14} /> Active Sessions
                </h4>
                <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full font-bold">
                    {sessions.length} DEVICES
                </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <AnimatePresence mode="popLayout">
                    {sessions.map((session) => {
                        const isCurrent = session.refreshToken === localStorage.getItem('dayflow_token');

                        return (
                            <motion.div
                                key={session._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                className="premium-card"
                                style={{
                                    padding: '24px',
                                    borderRadius: 20,
                                    border: `1px solid ${isCurrent ? 'rgba(124, 109, 250, 0.2)' : 'rgba(255,255,255,0.05)'}`,
                                    background: isCurrent ? 'rgba(124, 109, 250, 0.05)' : 'rgba(255,255,255,0.02)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 20,
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                {isCurrent && <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: 'var(--accent)' }} />}
                                <div style={{ 
                                    width: 56, height: 56, borderRadius: 16, 
                                    background: isCurrent ? 'rgba(124, 109, 250, 0.1)' : 'rgba(255,255,255,0.03)', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: isCurrent ? 'var(--accent)' : 'var(--muted)',
                                    border: '1px solid rgba(255,255,255,0.05)'
                                }}>
                                    {getDeviceIcon(session.userAgent)}
                                </div>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                        <span style={{ fontSize: 15, fontWeight: 800, color: 'white', fontFamily: 'Syne' }}>
                                            {session.os || 'Unknown Core'} • {session.browser || 'Interface'}
                                        </span>
                                        {isCurrent && (
                                            <span style={{ fontSize: 9, background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', padding: '2px 8px', borderRadius: 6, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                Active Host
                                            </span>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>
                                            {getBrowserIcon(session.userAgent)}
                                            <span style={{ fontFamily: 'DM Mono, monospace' }}>{session.ip || '0.0.0.0'}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>
                                            <Clock size={14} />
                                            <span>Seen {formatDistanceToNow(new Date(session.lastActive))} ago</span>
                                        </div>
                                    </div>
                                </div>

                                {!isCurrent && (
                                    <motion.button
                                        whileHover={{ scale: 1.1, background: 'rgba(248, 113, 113, 0.1)', color: '#f87171' }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => {
                                            setConfirmDialog({
                                                open: true,
                                                title: 'Neutralize Session',
                                                message: 'Banish this device from the network? Re-authentication will be required.',
                                                confirmText: 'Neutralize',
                                                onConfirm: () => {
                                                    revokeMutation.mutate(session._id);
                                                    setConfirmDialog({ open: false });
                                                }
                                            });
                                        }}
                                        disabled={revokeMutation.isPending}
                                        style={{ 
                                            width: 44, height: 44, 
                                            borderRadius: 14, background: 'rgba(255,255,255,0.03)', 
                                            border: '1px solid rgba(255,255,255,0.05)', display: 'flex', 
                                            alignItems: 'center', justifyContent: 'center', 
                                            color: 'var(--muted)', cursor: 'pointer' 
                                        }}
                                        title="Revoke Session"
                                    >
                                        <XCircle size={20} />
                                    </motion.button>
                                )}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {sessions.length > 1 && (
                <div className="mt-6 p-4 rounded-xl bg-red-400/5 border border-red-400/10 flex items-center gap-4">
                    <Shield className="text-red-400 animate-pulse" size={20} />
                    <div className="flex-1">
                        <p className="text-xs font-bold text-red-200">Suspicious activity?</p>
                        <p className="text-[10px] text-red-100/60 leading-tight">Revoke all other sessions to secure your account immediately.</p>
                    </div>
                    <button
                        className="btn btn-sm bg-red-500 hover:bg-red-600 text-white border-none px-4"
                        style={{ fontSize: 11, fontWeight: 800 }}
                        onClick={() => {
                            setConfirmDialog({
                                open: true,
                                title: 'Revoke All Sessions',
                                message: 'This will log you out from all other devices immediately. Proceed?',
                                onConfirm: () => {
                                    revokeAllMutation.mutate();
                                    setConfirmDialog({ open: false });
                                }
                            });
                        }}
                    >
                        Revoke All
                    </button>
                </div>
            )}
            <ConfirmDialog {...confirmDialog} onCancel={() => setConfirmDialog({ open: false })} />
        </div>
    );
}
