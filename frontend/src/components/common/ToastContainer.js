import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useNotifications } from '../../context/NotificationContext';
import Toast from './Toast';

const ToastContainer = () => {
  const { toasts, removeToast } = useNotifications();

  return (
    <div
      style={{
        position: 'fixed',
        bottom: window.innerWidth <= 768 ? 130 : 24,
        right: window.innerWidth <= 768 ? '20px' : '24px',
        left: window.innerWidth <= 768 ? '20px' : 'auto',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: window.innerWidth <= 768 ? 'center' : 'flex-end',
        pointerEvents: 'none',
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;
