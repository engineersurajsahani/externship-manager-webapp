import React, { useEffect } from 'react';
import { useToast } from './Toast';

// A small global listener so legacy code can trigger toasts with
// `window.dispatchEvent(new CustomEvent('app-toast', { detail: { message, type, duration } }))`.
const ToastListener = ({ position = 'top-right' }) => {
  const { ToastContainer, success, error, info, warning } = useToast();

  useEffect(() => {
    const handler = (e) => {
      const { message = '', type = 'info', duration = 5000 } = e.detail || {};
      // Choose convenience helpers for common types
      if (type === 'success') success(message, duration);
      else if (type === 'error') error(message, duration);
      else if (type === 'warning') warning(message, duration);
      else info(message, duration);
    };

    window.addEventListener('app-toast', handler);
    return () => window.removeEventListener('app-toast', handler);
  }, [success, error, info, warning]);

  return <ToastContainer position={position} />;
};

export default ToastListener;