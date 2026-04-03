import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function MobileBottomSheet({ 
  isOpen, 
  onClose, 
  title, 
  children,
  headerAction 
}) {
  // Prevent scrolling when bottom sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div 
            className="fixed inset-0 bg-black/60 z-[1999] backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Bottom Sheet */}
          <motion.div
            className="bottom-sheet active z-[2000] flex flex-col"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ 
              type: 'spring', 
              damping: 25, 
              stiffness: 200,
              mass: 0.8
            }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.4}
            onDragEnd={(e, info) => {
              if (info.offset.y > 100) onClose();
            }}
          >
            <div className="bottom-sheet-handle" />
            
            <header className="flex items-center justify-between px-6 pb-4 border-b border-white/5">
              <h3 className="text-xl font-bold font-syne text-white tracking-tight">
                {title}
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
