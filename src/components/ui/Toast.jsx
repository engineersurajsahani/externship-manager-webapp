import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX,
  FiCheck,
  FiInfo,
  FiAlertTriangle,
  FiAlertCircle,
} from 'react-icons/fi';

const Toast = ({
  id,
  message,
  type = 'info',
  duration = 5000,
  onClose,
  position = 'top-right',
}) => {
  const types = {
    success: {
      icon: FiCheck,
      bgColor: 'bg-green-500',
      textColor: 'text-white',
      progressColor: 'bg-green-300',
    },
    error: {
      icon: FiAlertCircle,
      bgColor: 'bg-red-500',
      textColor: 'text-white',
      progressColor: 'bg-red-300',
    },
    warning: {
      icon: FiAlertTriangle,
      bgColor: 'bg-yellow-500',
      textColor: 'text-white',
      progressColor: 'bg-yellow-300',
    },
    info: {
      icon: FiInfo,
      bgColor: 'bg-blue-500',
      textColor: 'text-white',
      progressColor: 'bg-blue-300',
    },
  };

  const currentType = types[type];
  const Icon = currentType.icon;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, id, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`
        relative max-w-md w-full ${currentType.bgColor} shadow-xl rounded-xl p-4 mb-4
        backdrop-blur-md border border-white/20 overflow-hidden
      `}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-20 pointer-events-none z-0">
        <div className="absolute -right-4 -top-4 w-16 h-16 bg-white rounded-full" />
        <div className="absolute -left-4 -bottom-4 w-8 h-8 bg-white rounded-full" />
      </div>

      {/* Content */}
      <div className="relative flex items-start z-10">
        <div className="flex-shrink-0">
          <Icon className={`w-5 h-5 ${currentType.textColor}`} />
        </div>
        <div className="ml-3 flex-1 min-w-0">
          <p className={`text-sm font-medium ${currentType.textColor} break-words whitespace-normal`}>
            {message}
          </p>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            className={`
              inline-flex ${currentType.textColor} hover:bg-white/20 
              focus:outline-none focus:ring-2 focus:ring-white/50 rounded-md p-1
              transition-colors duration-200
            `}
            onClick={() => onClose(id)}
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {duration > 0 && (
        <motion.div
          className={`absolute bottom-0 left-0 h-1 ${currentType.progressColor} rounded-b-xl`}
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: duration / 1000, ease: 'linear' }}
        />
      )}
    </motion.div>
  );
};

// Toast Container
const ToastContainer = ({ toasts, position = 'top-right', onClose }) => {
  const positions = {
    'top-right': 'fixed top-4 right-4 z-50',
    'top-left': 'fixed top-4 left-4 z-50',
    'bottom-right': 'fixed bottom-4 right-4 z-50',
    'bottom-left': 'fixed bottom-4 left-4 z-50',
    'top-center': 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50',
    'bottom-center': 'fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50',
  };

  return (
    <div className={positions[position]}>
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            {...toast}
            position={position}
            onClose={onClose}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

// Hook for using toasts
export const useToast = () => {
  const [toasts, setToasts] = React.useState([]);

  const addToast = ({ message, type = 'info', duration = 5000 }) => {
    const id = Date.now() + Math.random();
    const toast = {
      id,
      message,
      type,
      duration,
    };

    setToasts((prev) => [...prev, toast]);
    return id;
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const success = (message, duration) =>
    addToast({ message, type: 'success', duration });
  const error = (message, duration) =>
    addToast({ message, type: 'error', duration });
  const warning = (message, duration) =>
    addToast({ message, type: 'warning', duration });
  const info = (message, duration) =>
    addToast({ message, type: 'info', duration });

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
    ToastContainer: ({ position }) => (
      <ToastContainer
        toasts={toasts}
        position={position}
        onClose={removeToast}
      />
    ),
  };
};

export { Toast, ToastContainer };
export default Toast;
