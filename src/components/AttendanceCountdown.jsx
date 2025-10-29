import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiXCircle,
  FiEdit3,
} from 'react-icons/fi';
import Button from './ui/Button';
import Badge from './ui/Badge';
import { dashboardHelpers } from '../utils/dashboardHelpers';

const AttendanceCountdown = ({
  attendanceData,
  onSubmitUpdate,
  className = '',
}) => {
  const [timeRemaining, setTimeRemaining] = useState('');
  const [status, setStatus] = useState('loading');
  const [isUrgent, setIsUrgent] = useState(false);

  // Update countdown every minute
  const updateCountdown = useCallback(() => {
    if (attendanceData?.attendanceTimeStatus) {
      const { status: apiStatus } = attendanceData.attendanceTimeStatus;

      if (apiStatus === 'submitted') {
        setStatus('submitted');
        setTimeRemaining('0h 0m');
        setIsUrgent(false);
      } else if (apiStatus === 'overdue') {
        setStatus('overdue');
        setTimeRemaining('0h 0m');
        setIsUrgent(true);
      } else {
        // Calculate real-time countdown
        const msRemaining = dashboardHelpers.getTimeRemainingMs();
        if (msRemaining <= 0) {
          setStatus('overdue');
          setTimeRemaining('0h 0m');
          setIsUrgent(true);
        } else {
          const hours = Math.floor(msRemaining / (1000 * 60 * 60));
          const minutes = Math.floor(
            (msRemaining % (1000 * 60 * 60)) / (1000 * 60)
          );

          setStatus('pending');
          setTimeRemaining(`${hours}h ${minutes}m`);
          setIsUrgent(hours < 4); // Mark as urgent if less than 4 hours remaining (after 8 PM)
        }
      }
    } else {
      // Fallback to local calculation
      const msRemaining = dashboardHelpers.getTimeRemainingMs();
      const deadlinePassed = dashboardHelpers.hasAttendanceDeadlinePassed();

      if (deadlinePassed || msRemaining <= 0) {
        setStatus('overdue');
        setTimeRemaining('0h 0m');
        setIsUrgent(true);
      } else {
        const hours = Math.floor(msRemaining / (1000 * 60 * 60));
        const minutes = Math.floor(
          (msRemaining % (1000 * 60 * 60)) / (1000 * 60)
        );

        setStatus('pending');
        setTimeRemaining(`${hours}h ${minutes}m`);
        setIsUrgent(hours < 4); // Match the API logic
      }
    }
  }, [attendanceData]);

  // Update countdown on mount and every minute
  useEffect(() => {
    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [updateCountdown]);

  const getStatusColor = () => {
    switch (status) {
      case 'submitted':
        return 'text-green-600';
      case 'overdue':
        return 'text-red-600';
      case 'pending':
        return isUrgent ? 'text-orange-600' : 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getBackgroundColor = () => {
    switch (status) {
      case 'submitted':
        return 'bg-green-50 border-green-200';
      case 'overdue':
        return 'bg-red-50 border-red-200';
      case 'pending':
        return isUrgent
          ? 'bg-orange-50 border-orange-200'
          : 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'submitted':
        return <FiCheckCircle className="w-5 h-5" />;
      case 'overdue':
        return <FiXCircle className="w-5 h-5" />;
      case 'pending':
        return isUrgent ? (
          <FiAlertCircle className="w-5 h-5" />
        ) : (
          <FiClock className="w-5 h-5" />
        );
      default:
        return <FiClock className="w-5 h-5" />;
    }
  };

  const getTitle = () => {
    switch (status) {
      case 'submitted':
        return 'Attendance Marked';
      case 'overdue':
        return 'Attendance Overdue';
      case 'pending':
        return 'Attendance Pending';
      default:
        return 'Attendance Status';
    }
  };

  const getMessage = () => {
    switch (status) {
      case 'submitted':
        return 'Well done! Your attendance is marked for today.';
      case 'overdue':
        return 'The attendance deadline has passed. Contact your supervisor.';
      case 'pending':
        return isUrgent
          ? `Urgent: Only ${timeRemaining} left to mark attendance!`
          : `${timeRemaining} remaining until midnight`;
      default:
        return 'Loading attendance status...';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`rounded-xl border-2 p-6 ${getBackgroundColor()} ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`${getStatusColor()}`}>{getIcon()}</div>
          <h3 className="text-lg font-semibold text-gray-900">{getTitle()}</h3>
        </div>

        <Badge
          className={`${
            status === 'submitted'
              ? 'bg-green-100 text-green-800'
              : status === 'overdue'
                ? 'bg-red-100 text-red-800'
                : isUrgent
                  ? 'bg-orange-100 text-orange-800'
                  : 'bg-blue-100 text-blue-800'
          }`}
        >
          {status === 'submitted'
            ? 'Complete'
            : status === 'overdue'
              ? 'Overdue'
              : isUrgent
                ? 'Urgent'
                : 'Pending'}
        </Badge>
      </div>

      {/* Countdown Display */}
      <AnimatePresence mode="wait">
        <motion.div
          key={timeRemaining}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="mb-4"
        >
          {status === 'pending' && (
            <div className="text-center">
              <div className={`text-4xl font-bold ${getStatusColor()} mb-2`}>
                {timeRemaining}
              </div>
              {isUrgent && (
                <motion.div
                  animate={{
                    scale: [1, 1.05, 1],
                    opacity: [0.7, 1, 0.7],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="text-orange-600 font-medium"
                >
                  ⚠️ URGENT
                </motion.div>
              )}
            </div>
          )}

          {status === 'submitted' && (
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">
                ✅ Done
              </div>
              <div className="text-green-700 font-medium">
                Attendance marked at{' '}
                {new Date().toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          )}

          {status === 'overdue' && (
            <div className="text-center">
              <div className="text-4xl font-bold text-red-600 mb-2">
                ❌ Missed
              </div>
              <div className="text-red-700 font-medium">
                Deadline: 12:00 AM (Midnight)
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Message */}
      <p className="text-sm text-gray-700 text-center mb-4">{getMessage()}</p>

      {/* Action Button */}
      {status === 'pending' && (
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={onSubmitUpdate}
            className={`w-full ${
              isUrgent
                ? 'bg-orange-600 hover:bg-orange-700 border-orange-600'
                : 'bg-blue-600 hover:bg-blue-700 border-blue-600'
            } text-white font-semibold py-3 transition-all duration-200`}
            size="lg"
          >
            <FiEdit3 className="w-4 h-4 mr-2" />
            {isUrgent ? 'Submit Now!' : 'Mark Attendance'}
          </Button>
        </motion.div>
      )}

      {/* Deadline Info */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Daily Deadline: 12:00 AM (Midnight)</span>
          <span>Updates count as attendance</span>
        </div>
      </div>
    </motion.div>
  );
};

export default AttendanceCountdown;
