import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 5000, customIcon = null) => {
    const id = Math.random().toString(36).slice(2, 11);
    setToasts(prev => [...prev.slice(-4), { id, message, type, duration, customIcon }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ addToast, removeToast, toasts }}>
      {children}
    </NotificationContext.Provider>
  );
};
