import React from 'react';
import AICoach from '../AICoach';
import { Sparkles } from 'lucide-react';
import WidgetWrapper from './WidgetWrapper';

const AICoachWidget = () => {
  return (
    <WidgetWrapper title="AI Coach" icon={Sparkles}>
      <AICoach />
    </WidgetWrapper>
  );
};

export default AICoachWidget;
