import { createContext, useContext, useState, useCallback } from 'react';
import Toast from './Toast';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', options = {}) => {
    const id = Date.now() + Math.random();
    const toast = {
      id,
      message,
      type,
      title: options.title,
      duration: options.duration || 3000,
      autoClose: options.autoClose !== false,
    };
    setToasts((prev) => [...prev, toast]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback((message, options) => showToast(message, 'success', options), [showToast]);
  const error = useCallback((message, options) => showToast(message, 'error', options), [showToast]);
  const warning = useCallback((message, options) => showToast(message, 'warning', options), [showToast]);
  const info = useCallback((message, options) => showToast(message, 'info', options), [showToast]);

  return (
    <ToastContext.Provider value={{ success, error, warning, info, showToast }}>
      {children}
      <div className="pointer-events-none fixed left-4 right-4 top-4 z-[9999] flex flex-col gap-2 sm:left-auto sm:right-4 sm:max-w-md">        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast toast={toast} onClose={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
