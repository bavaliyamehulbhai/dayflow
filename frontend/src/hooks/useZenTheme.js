import { useState, useEffect } from 'react';

const THEME_KEY = 'dayflow_zen_accent';

export const useZenTheme = () => {
    const [accent, setAccent] = useState(() => {
        return localStorage.getItem(THEME_KEY) || '#8272ff'; // Default accent
    });

    useEffect(() => {
        const root = document.documentElement;

        // Update CSS Variables
        root.style.setProperty('--accent', accent);

        // Calculate and update related glow/hover states
        // We'll use more subtle logic for hover to keep it premium
        root.style.setProperty('--accent-glow', `${accent}66`); // 40% opacity
        root.style.setProperty('--shadow-accent', `0 8px 24px ${accent}33`); // 20% opacity

        localStorage.setItem(THEME_KEY, accent);
    }, [accent]);

    return [accent, setAccent];
};
