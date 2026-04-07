import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, X, Sparkles } from 'lucide-react';
import { authAPI } from '../../utils/api';

const GuidedTour = ({ steps, onComplete, onSkip, show }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [coords, setCoords] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const tourRef = useRef(null);

  const updateCoords = useCallback(() => {
    if (!show || steps.length === 0) return;
    
    const step = steps[currentStep];
    const element = document.querySelector(step.target);
    
    if (element) {
      const rect = element.getBoundingClientRect();
      const padding = 8;
      
      // Scroll element into view if needed
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Re-calculate after scroll might be needed, but for now:
      setCoords({
        top: rect.top + window.scrollY - padding,
        left: rect.left + window.scrollX - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
        rawTop: rect.top,
        rawLeft: rect.left,
        rawWidth: rect.width,
        rawHeight: rect.height
      });
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [currentStep, steps, show]);

  useEffect(() => {
    if (show) {
      // Small delay to ensure dashboard content is rendered
      const timer = setTimeout(updateCoords, 500);
      window.addEventListener('resize', updateCoords);
      window.addEventListener('scroll', updateCoords);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', updateCoords);
        window.removeEventListener('scroll', updateCoords);
      };
    }
  }, [show, updateCoords]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  if (!show || !coords) return null;

  const step = steps[currentStep];

  // Calculate tooltip position
  const tooltipWidth = 320;
  const isMobile = window.innerWidth <= 768;
  
  let tooltipTop = coords.top + coords.height + 16;
  let tooltipLeft = coords.left + (coords.width / 2) - (tooltipWidth / 2);

  // Keep within viewport
  if (tooltipLeft < 20) tooltipLeft = 20;
  if (tooltipLeft + tooltipWidth > window.innerWidth - 20) {
    tooltipLeft = window.innerWidth - tooltipWidth - 20;
  }

  // If too close to bottom, show above
  if (tooltipTop + 200 > window.scrollY + window.innerHeight) {
    tooltipTop = coords.top - 200 - 16;
  }

  return (
    <div className="guided-tour-overlay" style={{ 
      position: 'absolute', 
      top: 0, 
      left: 0, 
      width: '100%', 
      height: document.documentElement.scrollHeight,
      zIndex: 10000,
      pointerEvents: 'none'
    }}>
      {/* Spotlight / Masking */}
      <svg 
        width="100%" 
        height="100%" 
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'auto' }}
        onClick={onSkip}
      >
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            <motion.rect
              initial={false}
              animate={{
                x: coords.left,
                y: coords.top,
                width: coords.width,
                height: coords.height,
                rx: 20
              }}
              transition={{ type: 'spring', stiffness: 200, damping: 25 }}
              fill="black"
            />
          </mask>
        </defs>
        <rect 
          width="100%" 
          height="100%" 
          fill="rgba(0, 0, 0, 0.7)" 
          mask="url(#spotlight-mask)"
          style={{ backdropFilter: 'blur(4px)' }}
        />
      </svg>

      {/* Tooltip */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ 
            opacity: 1, 
            y: 0, 
            scale: 1,
            top: tooltipTop,
            left: tooltipLeft
          }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            position: 'absolute',
            width: isMobile ? window.innerWidth - 40 : tooltipWidth,
            background: 'var(--surface-solid)',
            backdropFilter: 'var(--glass)',
            border: '1px solid var(--border)',
            borderRadius: 24,
            padding: '24px',
            boxShadow: 'var(--shadow-xl)',
            pointerEvents: 'auto',
            zIndex: 10001
          }}
        >
          <div className="flex-between mb-4">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="tour-badge" style={{ 
                background: 'var(--accent)', 
                color: 'white', 
                fontSize: 10, 
                fontWeight: 900, 
                padding: '2px 8px', 
                borderRadius: 10 
              }}>
                STEP {currentStep + 1} OF {steps.length}
              </div>
              <Sparkles size={14} className="text-accent" />
            </div>
            <button 
              onClick={onSkip} 
              style={{ color: 'var(--muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}
              title="Skip Tour"
            >
              <X size={18} />
            </button>
          </div>

          <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: 'var(--text)' }}>
            {step.title}
          </h3>
          <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 24 }}>
            {step.content}
          </p>

          <div className="flex-between">
            <button 
              className="btn btn-sm btn-ghost" 
              onClick={handleBack}
              disabled={currentStep === 0}
              style={{ opacity: currentStep === 0 ? 0.3 : 1 }}
            >
              <ArrowLeft size={14} style={{ marginRight: 6 }} /> Back
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              {currentStep < steps.length - 1 ? (
                <button 
                  className="btn btn-sm btn-primary haptic-tap" 
                  onClick={handleNext}
                  style={{ borderRadius: 12, padding: '8px 16px' }}
                >
                  Next <ArrowRight size={14} style={{ marginLeft: 6 }} />
                </button>
              ) : (
                <button 
                  className="btn btn-sm haptic-tap" 
                  onClick={handleNext}
                  style={{ 
                    background: 'var(--grad-premium)', 
                    color: 'white', 
                    borderRadius: 12, 
                    padding: '8px 20px',
                    border: 'none',
                    fontWeight: 700
                  }}
                >
                  Finish
                </button>
              )}
            </div>
          </div>

          {/* Step Dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 20 }}>
            {steps.map((_, idx) => (
              <div 
                key={idx} 
                style={{ 
                  width: idx === currentStep ? 16 : 6, 
                  height: 6, 
                  borderRadius: 3, 
                  background: idx === currentStep ? 'var(--accent)' : 'var(--border)',
                  transition: 'width 0.3s ease'
                }} 
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default GuidedTour;
