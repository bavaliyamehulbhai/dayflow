import React from 'react';
import { motion } from 'framer-motion';

const AuraOrb = ({ color, size, top, left, delay, duration = 15 }) => (
  <motion.div
    animate={{
      x: [0, 50, -30, 0],
      y: [0, -40, 60, 0],
      scale: [1, 1.2, 0.9, 1],
      opacity: [0.1, 0.2, 0.1]
    }}
    transition={{
      duration,
      repeat: Infinity,
      ease: "easeInOut",
      delay
    }}
    style={{
      position: 'absolute',
      width: size,
      height: size,
      background: color,
      borderRadius: '50%',
      filter: 'blur(80px)',
      zIndex: -1,
      top,
      left,
      pointerEvents: 'none',
      willChange: 'transform, opacity'
    }}
  />
);

export default React.memo(AuraOrb);
