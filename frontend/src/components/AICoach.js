import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { aiAPI } from '../utils/api';
import { Sparkles, AlertCircle, CheckCircle2, Zap, Brain, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AICoach = () => {
    const [selectedInsight, setSelectedInsight] = React.useState(null);
    const { data, isLoading } = useQuery({
        queryKey: ['aiCoach'],
        queryFn: () => aiAPI.getCoach().then(r => r.data),
        refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
    });

    const insights = data?.insights || [];

    const getIcon = (type) => {
        switch (type) {
            case 'motivation': return <Zap className="text-orange" size={18} />;
            case 'warning': return <AlertCircle className="text-red" size={18} />;
            case 'praise': return <CheckCircle2 className="text-green" size={18} />;
            case 'habit': return <Brain className="text-accent2" size={18} />;
            default: return <Sparkles className="text-accent" size={18} />;
        }
    };

    if (isLoading) return (
        <div className="card skeleton" style={{ height: 160, width: '100%' }}></div>
    );

    return (
        <>
            <div className="card" style={{
                background: 'linear-gradient(135deg, rgba(130, 114, 255, 0.08), rgba(255, 107, 139, 0.05))',
                border: '1px solid rgba(130, 114, 255, 0.2)',
                overflow: 'hidden',
                position: 'relative'
            }}>
                <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, background: 'var(--accent)', filter: 'blur(50px)', opacity: 0.1, pointerEvents: 'none' }}></div>

                <div className="card-title" style={{ color: 'var(--accent)', fontWeight: 800 }}>
                    <Sparkles size={14} /> AI Productivity Coach
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <AnimatePresence mode="popLayout">
                        {insights.map((insight, idx) => (
                            <motion.div
                                key={insight.title}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                whileHover={{ x: 4, background: 'rgba(255, 255, 255, 0.05)' }}
                                transition={{ delay: idx * 0.1 }}
                                onClick={() => setSelectedInsight(insight)}
                                style={{
                                    display: 'flex',
                                    gap: 14,
                                    padding: '12px',
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    borderRadius: 12,
                                    border: '1px solid rgba(255, 255, 255, 0.05)',
                                    cursor: 'pointer'
                                }}
                            >
                                <div style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 10,
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    {getIcon(insight.type)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        {insight.title}
                                        {insight.priority === 'high' && <span style={{ fontSize: 8, padding: '2px 6px', background: 'rgba(255, 107, 107, 0.15)', color: 'var(--red)', borderRadius: 10, textTransform: 'uppercase' }}>High Priority</span>}
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.4 }}>
                                        {insight.message}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', color: 'var(--muted)' }}>
                                    <ChevronRight size={14} />
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            <AnimatePresence>
                {selectedInsight && (
                    <div className="modal-overlay" onClick={() => setSelectedInsight(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="modal"
                            style={{ maxWidth: 500, overflow: 'hidden' }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                                <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{
                                        width: 32, height: 32, borderRadius: 8,
                                        background: 'var(--surface2)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        {getIcon(selectedInsight.type)}
                                    </div>
                                    Focus Briefing
                                </div>
                                <button className="modal-close" onClick={() => setSelectedInsight(null)}>
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="modal-body" style={{ paddingTop: 20 }}>
                                <div style={{ fontSize: 22, fontWeight: 900, fontFamily: 'Syne, sans-serif', marginBottom: 16, color: 'var(--text)' }}>
                                    {selectedInsight.title}
                                </div>
                                <div style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 24 }}>
                                    {selectedInsight.message}
                                    <br /><br />
                                    This insight was generated based on your recent activity patterns. By addressing this now, you can improve your productivity score and maintain your streak.
                                </div>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setSelectedInsight(null)}>
                                        Got it, thanks!
                                    </button>
                                </div>
                            </div>
                            <div style={{ height: 4, background: 'linear-gradient(90deg, var(--accent), var(--accent2))', width: '100%' }} />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AICoach;
