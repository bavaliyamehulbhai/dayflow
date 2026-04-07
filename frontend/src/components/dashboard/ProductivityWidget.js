import React from 'react';
import ProductivityCircle from '../ProductivityCircle';
import WidgetWrapper from './WidgetWrapper';
import { Layers } from 'lucide-react';

const ProductivityWidget = ({ data }) => {
  const stats = {
    tasks: data?.tasks?.summary?.completed || 0,
    habits: data?.habits?.completedToday || 0,
    focus: data?.pomodoro?.todayMinutes ? Math.round(data.pomodoro.todayMinutes / 25) : 0,
    schedule: data?.schedule?.today?.length || 0
  };

  return (
    <WidgetWrapper title="Productivity Matrix" icon={Layers}>
      <ProductivityCircle stats={stats} />
    </WidgetWrapper>
  );
};

export default ProductivityWidget;
