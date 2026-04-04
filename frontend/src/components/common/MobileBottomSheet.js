import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function MobileBottomSheet({ 
  isOpen, 
  onClose, 
  title, 
  children,
  headerAction,
  variant = 'centered' // 'centered' or 'full'
}) {
  // Prevent scrolling and manage global focus when bottom sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.setAttribute('data-bottom-sheet-active', 'true');
    } else {
      document.body.style.overflow = 'unset';
      document.body.removeAttribute('data-bottom-sheet-active');
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.removeAttribute('data-bottom-sheet-active');
    };
  }, [isOpen]);

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  const modalVariants = {
    centered: {
      initial: { opacity: 0, scale: 0.9, x: '-50%', y: '-48%' },
      animate: { opacity: 1, scale: 1, x: '-50%', y: '-50%' },
      exit: { opacity: 0, scale: 0.9, x: '-50%', y: '-48%' }
    },
    full: isMobile ? {
      initial: { x: '100%' },
      animate: { x: 0 },
      exit: { x: '100%' }
    } : {
      initial: { opacity: 0, scale: 0.9, x: '-50%', y: '-48%' },
      animate: { opacity: 1, scale: 1, x: '-50%', y: '-50%' },
      exit: { opacity: 0, scale: 0.9, x: '-50%', y: '-48%' }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay - Deeper Immersion */}
          <motion.div 
            className="fixed inset-0 bg-black/85 z-[1999] backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Centered Focused Modal or Full Immersion */}
          <motion.div
            className={`bottom-sheet active z-[2000] flex flex-col ${variant === 'full' ? 'full-screen-immersion' : ''}`}
            initial={modalVariants[variant].initial}
            animate={modalVariants[variant].animate}
            exit={modalVariants[variant].exit}
            transition={{ 
              type: 'spring', 
              damping: 25, 
              stiffness: 300,
              mass: 0.8
            }}
          >
            {/* Handle intentionally removed for centered style */}

            
            <header className="flex items-center justify-between px-6 pb-4 border-b border-white/5">
              <h3 className="text-xl font-bold font-syne text-white tracking-tight">
                {(!isMobile || variant !== 'full') && title}
              </h3>

              <div className="flex items-center gap-3">
                {headerAction}
                <button 
                  onClick={onClose}
                  className="p-2 rounded-full bg-white/5 text-muted hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar max-h-[80vh]">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
