import React from 'react';
import { useSecurity } from '../../context/SecurityGuard';

const SensitivityShield = ({ children, className = "" }) => {
  const { isSecureMode } = useSecurity();
  return (
    <div className={`${isSecureMode ? 'sensitive-content' : ''} ${className}`}>
      {children}
    </div>
  );
};

export default SensitivityShield;
