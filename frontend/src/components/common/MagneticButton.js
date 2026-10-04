import React from 'react';
import { motion } from 'framer-motion';

const MagneticButton = ({ children, className, onClick, style, whileHover }) => {
  return (
    <motion.button
      className={className}
      onClick={onClick}
      style={{
        ...style,
        position: 'relative'
      }}
      whileHover={whileHover || { scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
    >
      {children}
    </motion.button>
  );
};

export default React.memo(MagneticButton);
