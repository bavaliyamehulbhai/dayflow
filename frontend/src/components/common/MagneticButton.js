import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

const MagneticButton = ({ children, className, onClick, style, whileHover }) => {
  const ref = useRef(null);
  const [rect, setRect] = useState(null);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { type: 'spring', stiffness: 150, damping: 15, mass: 0.1 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const handleMouseEnter = () => {
    if (ref.current) setRect(ref.current.getBoundingClientRect());
  };

  const handleMouseMove = (e) => {
    if (!rect) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = rect;
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    
    // Magnetic pull (20% of distance)
    x.set((clientX - centerX) * 0.2);
    y.set((clientY - centerY) * 0.2);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setRect(null);
  };

  return (
    <motion.button
      ref={ref}
      className={className}
      onClick={onClick}
      style={{ 
        ...style, 
        position: 'relative',
        x: springX,
        y: springY,
        willChange: 'transform'
      }}
      whileHover={whileHover}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.button>
  );
};

export default MagneticButton;
