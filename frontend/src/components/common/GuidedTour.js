import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, X, Sparkles } from 'lucide-react';

const GuidedTour = ({ steps, onComplete, onSkip, show }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [coords, setCoords] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Reset dismissed state whenever show prop changes to true
  useEffect(() => {
    if (show) {
      setDismissed(false);
    }
  }, [show]);

  const updateCoords = useCallback(() => {
    if (!show || dismissed || !steps || steps.length === 0) return;
    
    const step = steps[currentStep];
    if (!step) return;
    const element = document.querySelector(step.target);
    
    if (element) {
      const rect = element.getBoundingClientRect();
      const padding = 8;
      
      // Smoothly bring element into view if not fully visible
      if (rect.top < 0 || rect.bottom > window.innerHeight) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      
      // Use client viewport coordinates for fixed position
      setCoords({
        top: Math.max(0, rect.top - padding),
        left: Math.max(0, rect.left - padding),
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      });
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [currentStep, steps, show, dismissed]);

  useEffect(() => {
    if (show && !dismissed) {
      const timer = setTimeout(updateCoords, 300);
      window.addEventListener('resize', updateCoords, { passive: true });
      window.addEventListener('scroll', updateCoords, { passive: true });
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', updateCoords);
        window.removeEventListener('scroll', updateCoords);
      };
    }
  }, [show, dismissed, updateCoords]);

  const handleNext = (e) => {
    e?.stopPropagation?.();
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setDismissed(true);
      onComplete?.();
    }
  };

  const handleBack = (e) => {
    e?.stopPropagation?.();
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleDismiss = (e) => {
    e?.stopPropagation?.();
    setDismissed(true);
    onSkip?.();
  };

  if (!show || dismissed || !coords || !isVisible) return null;

  const step = steps[currentStep];
  if (!step) return null;

  // Calculate safe tooltip position relative to viewport
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;
  const tooltipWidth = Math.min(340, viewportW - 32);

  // Center horizontally relative to target element, then clamp firmly within viewport
  let tooltipLeft = coords.left + (coords.width / 2) - (tooltipWidth / 2);
  if (tooltipLeft < 16) tooltipLeft = 16;
  if (tooltipLeft + tooltipWidth > viewportW - 16) {
    tooltipLeft = viewportW - tooltipWidth - 16;
  }

  // Vertical placement: prefer below, flip above if overflowing bottom
  const approxTooltipHeight = 220;
  let tooltipTop = coords.top + coords.height + 14;
  if (tooltipTop + approxTooltipHeight > viewportH - 16) {
    tooltipTop = Math.max(16, coords.top - approxTooltipHeight - 14);
  }

  const tourContent = (
    <div 
      className="guided-tour-portal" 
      style={{ 
        position: 'fixed', 
        inset: 0, 
        width: '100vw', 
        height: '100vh',
        zIndex: 99999,
        pointerEvents: 'none'
      }}
    >
      {/* Darkened Spotlight SVG Cutout */}
      <svg 
        width="100%" 
        height="100%" 
        style={{ position: 'absolute', inset: 0, pointerEvents: 'auto' }}
        onClick={handleDismiss}
      >
        <defs>
          <mask id="spotlight-mask-portal">
            <rect width="100%" height="100%" fill="white" />
            <motion.rect
              initial={false}
              animate={{
                x: coords.left,
                y: coords.top,
                width: coords.width,
                height: coords.height,
                rx: 14
              }}
              transition={{ type: 'spring', stiffness: 240, damping: 28 }}
              fill="black"
            />
          </mask>
        </defs>
        <rect 
          width="100%" 
          height="100%" 
          fill="rgba(0, 0, 0, 0.65)" 
          mask="url(#spotlight-mask-portal)"
          style={{ backdropFilter: 'blur(3px)' }}
        />
      </svg>

      {/* Floating Tour Guide Tooltip */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ 
            opacity: 1, 
            y: 0, 
            scale: 1,
            top: tooltipTop,
            left: tooltipLeft
          }}
          exit={{ opacity: 0, y: -10, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          style={{
            position: 'fixed',
            width: tooltipWidth,
            maxWidth: 'calc(100vw - 32px)',
            background: '#18181b',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 18,
            padding: '20px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(124, 109, 250, 0.25)',
            pointerEvents: 'auto',
            zIndex: 100000,
            color: '#f4f4f5'
          }}
        >
          {/* Header Badge & Close Button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ 
                background: 'linear-gradient(135deg, #7c6dfa 0%, #5850ec 100%)', 
                color: '#ffffff', 
                fontSize: 10, 
                fontWeight: 800, 
                padding: '3px 8px', 
                borderRadius: 6,
                letterSpacing: '0.04em'
              }}>
                STEP {currentStep + 1} OF {steps.length}
              </span>
              <Sparkles size={14} color="#a78bfa" />
            </div>
            <button 
              type="button"
              onClick={handleDismiss} 
              style={{ 
                color: '#a1a1aa', 
                background: 'rgba(255, 255, 255, 0.05)', 
                border: 'none', 
                borderRadius: 6,
                padding: 4,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Close Tour"
            >
              <X size={16} />
            </button>
          </div>

          {/* Title & Description */}
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 6, color: '#ffffff', letterSpacing: '-0.02em' }}>
            {step.title}
          </h3>
          <p style={{ fontSize: 13, color: '#a1a1aa', lineHeight: 1.5, marginBottom: 18 }}>
            {step.content}
          </p>

          {/* Action Navigation Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button 
              type="button"
              onClick={handleBack}
              disabled={currentStep === 0}
              style={{ 
                background: 'transparent',
                border: 'none',
                color: currentStep === 0 ? '#52525b' : '#a1a1aa',
                cursor: currentStep === 0 ? 'default' : 'pointer',
                fontSize: 12,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 8px'
              }}
            >
              <ArrowLeft size={13} /> Back
            </button>
            
            <div style={{ display: 'flex', gap: 8 }}>
              {currentStep < steps.length - 1 ? (
                <button 
                  type="button"
                  onClick={handleNext}
                  style={{ 
                    borderRadius: 8, 
                    padding: '7px 14px',
                    fontSize: 12,
                    fontWeight: 700,
                    background: '#7c6dfa',
                    color: '#ffffff',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    boxShadow: '0 2px 8px rgba(124, 109, 250, 0.35)'
                  }}
                >
                  Next <ArrowRight size={13} />
                </button>
              ) : (
                <button 
                  type="button"
                  onClick={handleNext}
                  style={{ 
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                    color: '#ffffff', 
                    borderRadius: 8, 
                    padding: '7px 16px',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)'
                  }}
                >
                  Got it! ✓
                </button>
              )}
            </div>
          </div>

          {/* Dots Indicator */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginTop: 14 }}>
            {steps.map((_, idx) => (
              <div 
                key={idx} 
                style={{ 
                  width: idx === currentStep ? 14 : 5, 
                  height: 5, 
                  borderRadius: 3, 
                  background: idx === currentStep ? '#7c6dfa' : 'rgba(255, 255, 255, 0.15)',
                  transition: 'all 0.25s ease'
                }} 
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(tourContent, document.body) : null;
};

export default GuidedTour;
