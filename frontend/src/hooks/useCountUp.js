import { useState, useEffect, useRef } from 'react';

export function useCountUp(target, duration = 800) {
  const [value, setValue] = useState(0);
  const prevTarget = useRef(null);

  useEffect(() => {
    if (prevTarget.current === target) return;
    prevTarget.current = target;
    const numTarget = parseFloat(target) || 0;
    if (numTarget === 0) { setValue(0); return; }
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      if (progress < 1) {
        setValue(Math.round(eased * numTarget));
        requestAnimationFrame(tick);
      } else {
        setValue(numTarget);
      }
    };
    requestAnimationFrame(tick);
  }, [target, duration]);

  return value;
}
