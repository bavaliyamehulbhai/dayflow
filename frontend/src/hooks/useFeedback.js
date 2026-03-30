import { useCallback } from 'react';

let globalAudioCtx = null;

const useFeedback = () => {
    const playSound = useCallback((type) => {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        try {
            if (!globalAudioCtx) {
                globalAudioCtx = new AudioContext();
            }
            if (globalAudioCtx.state === 'suspended') {
                globalAudioCtx.resume();
            }
            const ctx = globalAudioCtx;
            const now = ctx.currentTime;

            const createLayer = (freq, type, gainValue, delay, duration, rampFreq) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = type;
                osc.frequency.setValueAtTime(freq, now + delay);
                if (rampFreq) osc.frequency.exponentialRampToValueAtTime(rampFreq, now + delay + duration);
                
                gain.gain.setValueAtTime(0, now + delay);
                gain.gain.linearRampToValueAtTime(gainValue, now + delay + 0.02);
                gain.gain.linearRampToValueAtTime(0, now + delay + duration);
                
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + delay);
                osc.stop(now + delay + duration);
            };

            if (type === 'success') {
                // Harmonic "Bling" - Layered harmonic resonances
                createLayer(880, 'sine', 0.08, 0, 0.4, 1320);
                createLayer(1760, 'sine', 0.04, 0.05, 0.3);
            } else if (type === 'complete') {
                // Deep Satisfaction - Fundamental + sub-bass texture
                createLayer(220, 'triangle', 0.12, 0, 0.6, 110);
                createLayer(440, 'sine', 0.06, 0.02, 0.4);
            } else if (type === 'click') {
                // Tactile Tap - High freq transient + mid-body
                createLayer(2000, 'sine', 0.04, 0, 0.03);
                createLayer(400, 'sine', 0.02, 0, 0.05);
            }
        } catch (e) {
            console.warn('Sonic feedback failed', e);
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
