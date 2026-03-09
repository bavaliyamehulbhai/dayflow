import { useCallback } from 'react';

const useFeedback = () => {
    const playSound = useCallback((type) => {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        try {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            const now = ctx.currentTime;

            if (type === 'success') {
                // Happy "bling" sound
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);

                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(0.1, now + 0.05);
                gain.gain.linearRampToValueAtTime(0, now + 0.3);

                osc.start(now);
                osc.stop(now + 0.3);
            } else if (type === 'complete') {
                // Deeper satisfaction sound
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.exponentialRampToValueAtTime(600, now + 0.05);
                osc.frequency.exponentialRampToValueAtTime(400, now + 0.2);

                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(0.15, now + 0.05);
                gain.gain.linearRampToValueAtTime(0, now + 0.4);

                osc.start(now);
                osc.stop(now + 0.4);
            } else if (type === 'click') {
                // Subtle tap
                osc.type = 'sine';
                osc.frequency.setValueAtTime(1200, now);

                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(0.05, now + 0.01);
                gain.gain.linearRampToValueAtTime(0, now + 0.05);

                osc.start(now);
                osc.stop(now + 0.05);
            }
        } catch (e) {
            console.warn('Audio feedback failed', e);
        }
    }, []);

    const triggerHaptic = useCallback((style = 'light') => {
        if (window.navigator?.vibrate) {
            if (style === 'light') window.navigator.vibrate(10);
            else if (style === 'medium') window.navigator.vibrate(25);
            else if (style === 'heavy') window.navigator.vibrate([30, 10, 30]);
        }
    }, []);

    const feedback = useCallback((type) => {
        if (type === 'success') {
            playSound('success');
            triggerHaptic('medium');
        } else if (type === 'complete') {
            playSound('complete');
            triggerHaptic('heavy');
        } else if (type === 'click') {
            playSound('click');
            triggerHaptic('light');
        }
    }, [playSound, triggerHaptic]);

    return feedback;
};

export default useFeedback;
