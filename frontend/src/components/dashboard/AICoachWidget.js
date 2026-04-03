import React from 'react';
import AICoach from '../AICoach';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

// AI Coach is already a component, so we just wrap it carefully
// or just export it as a widget
const AICoachWidget = () => {
  return (
    <div className="aura-float" style={{ height: '100%' }}>
      <AICoach />
    </div>
  );
};

export default AICoachWidget;
