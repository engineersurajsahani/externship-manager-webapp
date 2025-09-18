import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiCheckCircle, 
  FiXCircle, 
  FiClock, 
  FiChevronLeft,
  FiChevronRight,
  FiEye
} from 'react-icons/fi';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';

const CalendarAttendanceView = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [attendanceData, setAttendanceData] = useState({});
  const [timeRemaining, setTimeRemaining] = useState('');

  // Update time remaining every minute
  useEffect(() => {
    const updateTimeRemaining = () => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      
      const diffInMilliseconds = endOfDay - now;
      const diffInHours = Math.floor(diffInMilliseconds / (1000 * 60 * 60));
      const diffInMinutes = Math.floor((diffInMilliseconds % (1000 * 60 * 60)) / (1000 * 60));
      
      if (diffInHours > 0) {
        setTimeRemaining(`${diffInHours}h ${diffInMinutes}m remaining`);
      } else if (diffInMinutes > 0) {
        setTimeRemaining(`${diffInMinutes}m remaining`);
      } else {
        setTimeRemaining('Less than 1m remaining');
      }
    };
    
    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  useEffect(() => {
    loadAttendanceData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, user]);

  const loadAttendanceData = async () => {
    try {
      const response = await apiService.getMyDailyUpdates();
      const userUpdates = response.data.updates || [];
      processAttendanceData(userUpdates);
    } catch (error) {
      console.error('Error loading attendance data:', error);
      processAttendanceData([]);
    }
  };

  const processAttendanceData = (userUpdates) => {
    
    const attendanceMap = {};
    
    // Get calendar bounds for current month view
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startCalendar = new Date(firstDayOfMonth);
    startCalendar.setDate(startCalendar.getDate() - firstDayOfMonth.getDay());
    const endCalendar = new Date(lastDayOfMonth);
    endCalendar.setDate(endCalendar.getDate() + (6 - lastDayOfMonth.getDay()));

    // Process each day in the calendar view
    for (let d = new Date(startCalendar); d <= endCalendar; d.setDate(d.getDate() + 1)) {
      const dateString = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay();
      const isWeekend = dayOfWeek === 0; // Only Sunday is weekend now
      const isCurrentMonth = d.getMonth() === currentDate.getMonth();
      
      // Find update for this date
      const update = userUpdates.find(update => {
        const updateDate = new Date(update.date).toISOString().split('T')[0];
        return updateDate === dateString;
      });
      
      let status = 'none'; // Default for weekends and future dates
      
      if (!isWeekend && isCurrentMonth) {
        const today = new Date();
        const isToday = d.toDateString() === today.toDateString();
        const isPast = d < today && !isToday;
        
        if (isPast) {
          status = update ? 'present' : 'absent';
        } else if (isToday) {
          status = update ? 'present' : 'pending';
        } else {
          status = 'future';
        }
      }

      attendanceMap[dateString] = {
        date: dateString,
        status,
        isCurrentMonth,
        isWeekend,
        update,
        day: d.getDate()
      };
    }
    
    setAttendanceData(attendanceMap);
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
    setSelectedDate(null); // Clear selection when navigating
  };

  const getDayStatus = (dateString) => {
    const dayData = attendanceData[dateString];
    if (!dayData || dayData.isWeekend || !dayData.isCurrentMonth) return null;
    return dayData.status;
  };

  const getDayClasses = (dateString) => {
    const dayData = attendanceData[dateString];
    if (!dayData) return 'text-gray-300';

    let classes = 'w-12 h-12 flex items-center justify-center rounded-xl cursor-pointer transition-all duration-200 text-sm font-medium relative ';
    
    if (!dayData.isCurrentMonth) {
      classes += 'text-gray-300 hover:bg-gray-50';
    } else if (dayData.isWeekend) {
      classes += 'text-gray-400 bg-gray-50 cursor-default';
    } else {
      switch (dayData.status) {
        case 'present':
          classes += 'bg-gradient-to-br from-green-100 to-green-200 text-green-800 hover:from-green-200 hover:to-green-300 shadow-sm hover:shadow-md';
          break;
        case 'absent':
          classes += 'bg-gradient-to-br from-red-100 to-red-200 text-red-800 hover:from-red-200 hover:to-red-300 shadow-sm hover:shadow-md';
          break;
        case 'pending':
          classes += 'bg-gradient-to-br from-yellow-100 to-yellow-200 text-yellow-800 hover:from-yellow-200 hover:to-yellow-300 ring-2 ring-yellow-300 shadow-sm hover:shadow-md animate-pulse';
          break;
        case 'future':
          classes += 'text-gray-600 hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-100 hover:shadow-sm';
          break;
        default:
          classes += 'text-gray-500 hover:bg-gray-50';
      }
    }

    if (selectedDate === dateString) {
      classes += ' ring-2 ring-blue-500 ring-offset-2 shadow-lg';
    }

    return classes;
  };

  const handleDateClick = (dateString) => {
    const dayData = attendanceData[dateString];
    if (dayData && dayData.isCurrentMonth && !dayData.isWeekend) {
      setSelectedDate(selectedDate === dateString ? null : dateString);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return <FiCheckCircle className="w-3 h-3" />;
      case 'absent':
        return <FiXCircle className="w-3 h-3" />;
      case 'pending':
        return <FiClock className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getMonthlyStats = () => {
    const monthData = Object.values(attendanceData).filter(
      day => day.isCurrentMonth && !day.isWeekend
    );
    
    // Calculate actual working days in the month
    const totalWorkingDays = getWorkingDaysInMonth(
      currentDate.getFullYear(), 
      currentDate.getMonth()
    );
    
    const total = monthData.filter(day => ['present', 'absent'].includes(day.status)).length;
    const present = monthData.filter(day => day.status === 'present').length;
    const absent = monthData.filter(day => day.status === 'absent').length;
    const pending = monthData.filter(day => day.status === 'pending').length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    
    return { total, present, absent, pending, percentage, totalWorkingDays };
  };

  // Helper function to calculate working days in a month
  const getWorkingDaysInMonth = (year, month) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let workingDays = 0;
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 0) { // Only Sunday is non-working day (Saturday is working)
        workingDays++;
      }
    }
    
    return workingDays;
  };

  const generateCalendarDays = () => {
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startCalendar = new Date(firstDayOfMonth);
    startCalendar.setDate(startCalendar.getDate() - firstDayOfMonth.getDay());
    
    const days = [];
    const current = new Date(startCalendar);
    
    // Generate 6 weeks (42 days) for consistent calendar layout
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const selectedDayData = selectedDate ? attendanceData[selectedDate] : null;
  const stats = getMonthlyStats();
  const calendarDays = generateCalendarDays();

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Attendance Calendar</h3>
          <p className="text-sm text-gray-600">
            Track your daily update submissions with an interactive calendar view
          </p>
          
          {/* Progress Bar */}
          <div className="mt-3 w-full max-w-md">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">Monthly Progress</span>
              <span className="text-xs font-medium text-gray-700">{stats.percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  stats.percentage >= 90 ? 'bg-gradient-to-r from-green-400 to-green-500' :
                  stats.percentage >= 75 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                  stats.percentage >= 50 ? 'bg-gradient-to-r from-orange-400 to-orange-500' :
                  'bg-gradient-to-r from-red-400 to-red-500'
                }`}
                style={{ width: `${stats.percentage}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        <Badge className={`px-4 py-2 text-sm font-semibold ${
          stats.percentage >= 90 ? 'bg-green-100 text-green-800 border border-green-300' : 
          stats.percentage >= 75 ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' : 
          'bg-red-100 text-red-800 border border-red-300'
        }`}>
          {stats.percentage >= 90 ? '🎉 Excellent' :
           stats.percentage >= 75 ? '👍 Good' :
           stats.percentage >= 50 ? '⚠️ Fair' : '🔴 Needs Improvement'}
        </Badge>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateMonth('prev')}
        >
          <FiChevronLeft className="w-4 h-4" />
        </Button>
        
        <h4 className="text-xl font-semibold text-gray-900">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h4>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateMonth('next')}
          disabled={
            currentDate.getFullYear() === new Date().getFullYear() && 
            currentDate.getMonth() >= new Date().getMonth()
          }
        >
          <FiChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Monthly Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center border border-green-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-center mb-2">
            <FiCheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <p className="text-2xl font-bold text-green-700">{stats.present}</p>
          </div>
          <p className="text-sm font-medium text-green-600">Present Days</p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 text-center border border-red-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-center mb-2">
            <FiXCircle className="w-5 h-5 text-red-600 mr-2" />
            <p className="text-2xl font-bold text-red-700">{stats.absent}</p>
          </div>
          <p className="text-sm font-medium text-red-600">Absent Days</p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 text-center border border-yellow-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-center mb-2">
            <FiClock className="w-5 h-5 text-yellow-600 mr-2" />
            <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
          </div>
          <p className="text-sm font-medium text-yellow-600">Pending Today</p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center border border-blue-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-center mb-2">
            <div className="w-5 h-5 bg-blue-600 rounded-full mr-2"></div>
            <p className="text-2xl font-bold text-blue-700">{stats.totalWorkingDays}</p>
          </div>
          <p className="text-sm font-medium text-blue-600">Total Working Days</p>
        </motion.div>
      </div>

      {/* Calendar Grid */}
      <div className="mb-6">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {dayNames.map((day, index) => (
            <div 
              key={day} 
              className={`p-3 text-center text-sm font-semibold rounded-lg ${
                index === 0 
                  ? 'text-gray-400 bg-gray-50' 
                  : index === 6 
                    ? 'text-blue-700 bg-blue-100' 
                    : 'text-gray-700 bg-blue-50'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2 p-4 bg-gray-50 rounded-2xl">
          {calendarDays.map((day, index) => {
            const dateString = day.toISOString().split('T')[0];
            const status = getDayStatus(dateString);
            const dayData = attendanceData[dateString];
            const isToday = new Date().toDateString() === day.toDateString();
            
            return (
              <motion.div
                key={dateString}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.01 }}
                className={`${getDayClasses(dateString)} ${isToday ? 'ring-2 ring-blue-400 ring-offset-2' : ''}`}
                onClick={() => handleDateClick(dateString)}
                title={dayData?.isCurrentMonth && !dayData?.isWeekend ? 
                  `${day.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} - ${status?.charAt(0).toUpperCase() + status?.slice(1) || 'No status'}` : 
                  undefined
                }
              >
                <div className="relative flex flex-col items-center justify-center">
                  <span className={`${isToday ? 'font-bold' : ''}`}>
                    {day.getDate()}
                  </span>
                  {status && (
                    <div className="absolute -top-1 -right-1 transform scale-75">
                      {getStatusIcon(status)}
                    </div>
                  )}
                  {isToday && (
                    <div className="absolute -bottom-1 w-1 h-1 bg-blue-500 rounded-full"></div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details */}
      {selectedDayData && selectedDayData.isCurrentMonth && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border border-blue-100 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-semibold text-gray-900 text-lg">
                {new Date(selectedDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                Click on any working day to see details
              </p>
            </div>
            <Badge className={`px-3 py-1 text-sm font-medium ${
              selectedDayData.status === 'present' ? 'bg-green-100 text-green-800 border border-green-200' :
              selectedDayData.status === 'absent' ? 'bg-red-100 text-red-800 border border-red-200' :
              selectedDayData.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
              'bg-gray-100 text-gray-800 border border-gray-200'
            }`}>
              {selectedDayData.status.charAt(0).toUpperCase() + selectedDayData.status.slice(1)}
            </Badge>
          </div>

          {selectedDayData.update && (
            <div className="bg-white rounded-lg p-4 space-y-3 border border-blue-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <p className="text-sm text-gray-600 font-medium">
                    Daily update submitted at {new Date(selectedDayData.update.timestamp).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const update = selectedDayData.update;
                    alert(`Daily Update Details:\n\nWork Done:\n${update.workDone}\n\nChallenges:\n${update.challenges}\n\nPlan for Tomorrow:\n${update.planTomorrow}`);
                  }}
                  className="bg-white hover:bg-gray-50 border-gray-300"
                >
                  <FiEye className="w-3 h-3 mr-1" />
                  View Details
                </Button>
              </div>
            </div>
          )}

          {selectedDayData.status === 'pending' && (
            <div className="bg-white rounded-lg p-4 border border-yellow-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  <p className="text-sm text-gray-700 font-medium">
                    Daily update is pending for today
                  </p>
                </div>
                <Button
                  onClick={() => window.location.href = '/daily-updates/submit'}
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                  size="sm"
                >
                  Submit Update
                </Button>
              </div>
              {timeRemaining && (
                <div className="flex items-center space-x-2 pt-2 border-t border-yellow-100">
                  <FiClock className="w-3 h-3 text-yellow-600" />
                  <p className="text-xs text-yellow-700 font-medium">
                    ⏰ {timeRemaining} to mark attendance
                  </p>
                </div>
              )}
            </div>
          )}

          {selectedDayData.status === 'absent' && (
            <div className="bg-white rounded-lg p-4 border border-red-200">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <p className="text-sm text-red-700 font-medium">
                  No daily update was submitted on this day.
                </p>
              </div>
            </div>
          )}

          {selectedDayData.status === 'future' && (
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <p className="text-sm text-gray-600 font-medium">
                  This is a future date. Daily updates can only be submitted on or before the current date.
                </p>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Legend */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-100 rounded flex items-center justify-center">
              <FiCheckCircle className="w-2 h-2 text-green-600" />
            </div>
            <span className="text-gray-600">Present (Update Submitted)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-100 rounded flex items-center justify-center">
              <FiXCircle className="w-2 h-2 text-red-600" />
            </div>
            <span className="text-gray-600">Absent (No Update)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-100 rounded flex items-center justify-center">
              <FiClock className="w-2 h-2 text-yellow-600" />
            </div>
            <span className="text-gray-600">Pending Today</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-100 rounded"></div>
            <span className="text-gray-600">Future/Sunday</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-center text-xs text-gray-500">
            Working days: Monday to Saturday • Sunday is off
          </p>
        </div>
      </div>
    </Card>
  );
};

export default CalendarAttendanceView;