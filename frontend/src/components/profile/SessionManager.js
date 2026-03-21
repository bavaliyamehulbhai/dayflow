import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authAPI } from '../../utils/api';
import { Laptop, Smartphone, Globe, Monitor, XCircle, Clock, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
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
    const [confirmDialog, setConfirmDialog] = useState({ open: false });
    const { data, isLoading } = useQuery({
        queryKey: ['sessions'],
        queryFn: () => authAPI.getSessions().then(res => res.data)
    });

    const revokeMutation = useMutation({
        mutationFn: (id) => authAPI.revokeSession(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['sessions']);
            toast.success('Session revoked successfully');
        },
        onError: (err) => {
            toast.error(err.response?.data?.error || 'Failed to revoke session');
        }
    });

    const revokeAllMutation = useMutation({
        mutationFn: () => authAPI.revokeAllSessions(),
        onSuccess: () => {
            queryClient.invalidateQueries(['sessions']);
            toast.success('All other sessions revoked successfully! 🔐');
        },
        onError: (err) => {
            toast.error(err.response?.data?.error || 'Failed to revoke all sessions');
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

            <div className="flex flex-col gap-3">
                <AnimatePresence mode="popLayout">
                    {sessions.map((session) => {
                        const isCurrent = session.refreshToken === localStorage.getItem('dayflow_token'); // Simplified check

                        return (
                            <motion.div
                                key={session._id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`p-4 rounded-xl border flex items-center gap-4 transition-all ${isCurrent ? 'bg-accent/5 border-accent/20' : 'bg-surface2 border-border'
                                    }`}
                            >
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isCurrent ? 'bg-accent/10 text-accent' : 'bg-surface3 text-muted'
                                    }`}>
                                    {getDeviceIcon(session.userAgent)}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-sm truncate">
                                            {session.os || 'Unknown OS'} • {session.browser || 'Browser'}
                                        </span>
                                        {isCurrent && (
                                            <span className="text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">
                                                Current
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                                        <div className="flex items-center gap-1.5 text-xs text-muted">
                                            {getBrowserIcon(session.userAgent)}
                                            <span>{session.ip || 'Unknown IP'}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-muted">
                                            <Clock size={12} />
                                            <span>Active {formatDistanceToNow(new Date(session.lastActive))} ago</span>
                                        </div>
                                    </div>
                                </div>

                                {!isCurrent && (
                                    <button
                                        onClick={() => {
                                            setConfirmDialog({
                                                open: true,
                                                title: 'Revoke Session',
                                                message: 'Are you sure you want to revoke this session? The device will be logged out immediately.',
                                                onConfirm: () => {
                                                    revokeMutation.mutate(session._id);
                                                    setConfirmDialog({ open: false });
                                                }
                                            });
                                        }}
                                        disabled={revokeMutation.isPending}
                                        className="p-2 text-muted hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                        title="Revoke Session"
                                    >
                                        <XCircle size={18} />
                                    </button>
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
