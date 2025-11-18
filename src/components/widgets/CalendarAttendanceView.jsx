import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiChevronLeft,
  FiChevronRight,
  FiEye,
} from 'react-icons/fi';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Portal from '../ui/Portal';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';

const CalendarAttendanceView = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [attendanceData, setAttendanceData] = useState({});
  const [timeRemaining, setTimeRemaining] = useState('');

  // Update time remaining every minute (until midnight)
  useEffect(() => {
    const updateTimeRemaining = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setDate(midnight.getDate() + 1);
      midnight.setHours(0, 0, 0, 0);

      const diffInMilliseconds = midnight - now;
      const diffInHours = Math.floor(diffInMilliseconds / (1000 * 60 * 60));
      const diffInMinutes = Math.floor(
        (diffInMilliseconds % (1000 * 60 * 60)) / (1000 * 60)
      );

      if (diffInHours > 0) {
        setTimeRemaining(
          `${diffInHours}h ${diffInMinutes}m remaining until midnight`
        );
      } else if (diffInMinutes > 0) {
        setTimeRemaining(`${diffInMinutes}m remaining until midnight`);
      } else {
        setTimeRemaining('Less than 1m remaining until midnight');
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Helpers to produce/parse local YYYY-MM-DD strings (avoids UTC timezone shifts)
  const formatLocalDate = (date) => {
    const d = new Date(date);
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const parseLocalDateString = (s) => {
    const [y, m, d] = s.split('-').map((v) => parseInt(v, 10));
    return new Date(y, m - 1, d);
  };
  useEffect(() => {
    loadAttendanceData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, user]);

  const loadAttendanceData = async () => {
    try {
      // Use attendance API instead of daily updates
      const response = await apiService.getMyAttendance();
      if (response.data && response.data.success) {
        processAttendanceData(response.data.attendance);
      } else {
        throw new Error('Failed to load attendance data');
      }
    } catch (error) {
      console.error('Error loading attendance data:', error);
      processAttendanceData([]);
    }
  };

  const processAttendanceData = (attendanceRecords) => {
    const attendanceMap = {};

    // Get calendar bounds for current month view
    const firstDayOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    const lastDayOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );

  // Month bounds (used for debugging): firstDayOfMonth, lastDayOfMonth
    const startCalendar = new Date(firstDayOfMonth);
    startCalendar.setDate(startCalendar.getDate() - firstDayOfMonth.getDay());
    const endCalendar = new Date(lastDayOfMonth);
    endCalendar.setDate(endCalendar.getDate() + (6 - lastDayOfMonth.getDay()));

    // Process each day in the calendar view
    for (
      let d = new Date(startCalendar);
      d <= endCalendar;
      d.setDate(d.getDate() + 1)
    ) {
      // Use local date string to avoid UTC offset causing previous/next day
      const dateString = formatLocalDate(d);
      const dayOfWeek = d.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday (0) and Saturday (6) are weekends
      const isCurrentMonth = d.getMonth() === currentDate.getMonth();

      // Find attendance record for this date
      const attendanceRecord = attendanceRecords.find((record) => {
        const recordDate = formatLocalDate(new Date(record.date));
        return recordDate === dateString;
      });

      let status = 'none'; // Default for weekends and future dates

      if (!isWeekend && isCurrentMonth) {
        const today = new Date();
        const isToday = d.toDateString() === today.toDateString();
        const isPast = d < today && !isToday;

        if (attendanceRecord) {
          // Use the attendance record status
          status = attendanceRecord.status; // 'present', 'absent', 'leave', 'holiday'
        } else if (isPast) {
          // If no record exists for a past working day, consider it absent
          status = 'absent';
        } else if (isToday) {
          status = 'pending';
        } else {
          status = 'future';
        }
      }

      attendanceMap[dateString] = {
        date: dateString,
        status,
        isCurrentMonth,
        isWeekend,
        attendanceRecord,
        day: d.getDate(),
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

    let classes =
      'w-12 h-12 flex items-center justify-center rounded-xl cursor-pointer transition-all duration-200 text-sm font-medium relative ';

    if (!dayData.isCurrentMonth) {
      classes += 'text-gray-300 hover:bg-gray-50';
    } else if (dayData.isWeekend) {
      classes += 'text-gray-400 bg-gray-50 cursor-default';
    } else {
      switch (dayData.status) {
        case 'present':
          classes +=
            'bg-gradient-to-br from-green-100 to-green-200 text-green-800 hover:from-green-200 hover:to-green-300 shadow-sm hover:shadow-md';
          break;
        case 'absent':
          classes +=
            'bg-gradient-to-br from-red-100 to-red-200 text-red-800 hover:from-red-200 hover:to-red-300 shadow-sm hover:shadow-md';
          break;
        case 'pending':
          classes +=
            'bg-gradient-to-br from-yellow-100 to-yellow-200 text-yellow-800 hover:from-yellow-200 hover:to-yellow-300 ring-2 ring-yellow-300 shadow-sm hover:shadow-md animate-pulse';
          break;
        case 'future':
          classes +=
            'text-gray-600 hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-100 hover:shadow-sm';
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

  // Modal state for viewing an inline daily update
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewModalData, setViewModalData] = useState(null);
  const [listModalOpen, setListModalOpen] = useState(false);
  const [listModalUpdates, setListModalUpdates] = useState([]);

  const handleViewDetails = async (attendanceRecord) => {
    try {
      // If the attendance record already includes a populated dailyUpdate, use it directly
      if (attendanceRecord?.dailyUpdate) {
        const du = attendanceRecord.dailyUpdate;
        const mappedDirect = {
          id: du._id || du.id || null,
          projectName: (du.project && du.project.name) || 'No Project Assigned',
          date: du.date || attendanceRecord.date || null,
          timestamp: du.createdAt || du.updatedAt || null,
          workDone: du.workDone || 'No details provided',
          challenges: du.challenges || '',
          planForTomorrow: du.planForTomorrow || '',
          user: du.user || null,
        };
        setViewModalData(mappedDirect);
        setViewModalOpen(true);
        return;
      }

      // If project-specific attendance contains a linked dailyUpdate, use that
      if (attendanceRecord?.projectAttendance && attendanceRecord.projectAttendance.length > 0) {
        const paWithUpdate = attendanceRecord.projectAttendance.find((pa) => pa.dailyUpdate);
        if (paWithUpdate && paWithUpdate.dailyUpdate) {
          const du = paWithUpdate.dailyUpdate;
          const mappedPA = {
            id: du._id || du.id || null,
            projectName: (paWithUpdate.project && paWithUpdate.project.name) || 'No Project Assigned',
            date: du.date || attendanceRecord.date || null,
            timestamp: du.createdAt || du.updatedAt || null,
            workDone: du.workDone || 'No details provided',
            challenges: du.challenges || '',
            planForTomorrow: du.planForTomorrow || '',
            user: du.user || null,
          };
          setViewModalData(mappedPA);
          setViewModalOpen(true);
          return;
        }
      }
      // attendanceRecord.dailyUpdate may be an id or an object
      const updateId =
        attendanceRecord?.dailyUpdate?._id || attendanceRecord?.dailyUpdate;

      console.debug('handleViewDetails called with attendanceRecord:', attendanceRecord);
      console.debug('Derived updateId:', updateId);

      let resp;

      if (updateId) {
        // If we have an explicit id, fetch that update
        resp = await apiService.getUpdate(updateId);
        console.debug('Fetched update by id response:', resp);
      } else {
        // Fallback: try to fetch the user's updates for that date (do not redirect)
        try {
          if (attendanceRecord?.date) {
            const dateOnly = formatLocalDate(attendanceRecord.date);
            console.debug('Attempting fallback getMyUpdates for date:', dateOnly);
            const listResp = await apiService.getMyUpdates({ startDate: dateOnly, endDate: dateOnly, limit: 10 });
            console.debug('getMyUpdates fallback response:', listResp);

            if (listResp.data && listResp.data.success && listResp.data.updates && listResp.data.updates.length > 0) {
              // If there's a single update, open it inline; if multiple, show a small list modal
              if (listResp.data.updates.length === 1) {
                resp = { data: { success: true, update: listResp.data.updates[0] } };
              } else {
                setListModalUpdates(listResp.data.updates);
                setListModalOpen(true);
                resp = null;
              }
            } else {
              resp = null;
            }
          } else {
            // As a last resort ask for today's update
            console.debug('No date on attendanceRecord; trying getTodayUpdate fallback');
            const todayResp = await apiService.getTodayUpdate();
            console.debug('getTodayUpdate response:', todayResp);
            if (todayResp.data && todayResp.data.success && todayResp.data.update) {
              resp = { data: { success: true, update: todayResp.data.update } };
            } else {
              resp = null;
            }
          }
        } catch (innerErr) {
          console.error('Fallback fetch failed:', innerErr);
          resp = null;
        }
      }

      if (!resp || !resp.data) {
        // No single update available to open inline. If list modal was opened, just return.
        if (listModalOpen) return;
        // Otherwise show a friendly message inside a modal
        setViewModalData({
          projectName: 'Daily update submitted',
          user: null,
          date: attendanceRecord?.date || selectedDate || formatLocalDate(new Date()),
          timestamp: null,
          workDone: 'Daily update was submitted but details are not available.',
          challenges: '',
          planForTomorrow: '',
        });
        setViewModalOpen(true);
        return;
      }
      if (resp.data && resp.data.success && resp.data.update) {
        const u = resp.data.update;
        const mapped = {
          id: u._id,
          projectName: u.project?.name || 'No Project Assigned',
          date: u.date,
          timestamp: u.createdAt,
          workDone: u.workDone,
          challenges: u.challenges,
          planForTomorrow: u.planForTomorrow,
          user: u.user || null,
        };
        setViewModalData(mapped);
        setViewModalOpen(true);
      } else {
        // Fallback: show friendly placeholder modal
        setViewModalData({
          projectName: 'Daily update submitted',
          user: null,
          date: attendanceRecord?.date || selectedDate || formatLocalDate(new Date()),
          timestamp: null,
          workDone: 'Daily update was submitted but details are not available.',
          challenges: '',
          planForTomorrow: '',
        });
        setViewModalOpen(true);
      }
    } catch (err) {
      console.error('Failed to fetch update details:', err);
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Failed to load update details', type: 'error' } }));
    }
  };

  const getMonthlyStats = () => {
    // Filter for current month working days only
    const monthData = Object.values(attendanceData).filter(
      (day) => day.isCurrentMonth && !day.isWeekend
    );

    // Calculate working days until today in current month
    const today = new Date();
    const firstOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const workingDaysUntilToday = getWorkingDaysUntilToday(firstOfMonth, today);
    
    const present = monthData.filter((day) => day.status === 'present').length;
    const absent = monthData.filter((day) => day.status === 'absent').length;
    const leaves = monthData.filter((day) => day.status === 'leave').length;
    const pending = monthData.filter((day) => day.status === 'pending').length;
    
    // Total should be working days until today, not all working days in month
    const total = workingDaysUntilToday;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    return { total, present, absent, leaves, pending, percentage };
  };

  // Helper function to calculate working days until today
  const getWorkingDaysUntilToday = (startDate, endDate) => {
    let workingDays = 0;
    let currentDate = new Date(startDate);
    const end = new Date(endDate);
    
    // Ensure we're counting up to and including today
    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return workingDays;
  };

  const generateCalendarDays = () => {
    const firstDayOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
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
  const selectedLocalDate = selectedDate ? parseLocalDateString(selectedDate) : null;
  const stats = getMonthlyStats();
  const calendarDays = generateCalendarDays();

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Attendance Calendar
        </h3>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
          className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center border border-blue-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-center mb-2">
            <div className="w-5 h-5 bg-blue-600 rounded-full mr-2"></div>
            <p className="text-2xl font-bold text-blue-700">
              {stats.total}
            </p>
          </div>
          <p className="text-sm font-medium text-blue-600">
            Working Days Until Today
          </p>
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
                index === 0 || index === 6
                  ? 'text-gray-400 bg-gray-50'  // Sunday and Saturday
                  : 'text-gray-700 bg-blue-50' // Monday to Friday
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2 p-4 bg-gray-50 rounded-2xl">
          {calendarDays.map((day, index) => {
            const dateString = formatLocalDate(day);
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
                title={
                  dayData?.isCurrentMonth && !dayData?.isWeekend
                    ? `${day.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} - ${status?.charAt(0).toUpperCase() + status?.slice(1) || 'No status'}`
                    : undefined
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
                {selectedLocalDate
                  ? selectedLocalDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : ''}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                Click on any working day to see details
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Badge
                className={`px-3 py-1 text-sm font-medium ${
                  selectedDayData.status === 'present'
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : selectedDayData.status === 'absent'
                      ? 'bg-red-100 text-red-800 border border-red-200'
                      : selectedDayData.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                        : 'bg-gray-100 text-gray-800 border border-gray-200'
                }`}
              >
                {selectedDayData.status.charAt(0).toUpperCase() +
                  selectedDayData.status.slice(1)}
              </Badge>

              {/* Always show View Details when an attendanceRecord exists or status is present */}
              {(selectedDayData.attendanceRecord || selectedDayData.status === 'present') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewDetails(selectedDayData.attendanceRecord || {})}
                  className="bg-white hover:bg-gray-50 border-gray-300"
                >
                  <FiEye className="w-3 h-3 mr-1" />
                  View Details
                </Button>
              )}
            </div>
          </div>

          {selectedDayData.attendanceRecord && (selectedDayData.attendanceRecord.dailyUpdate || selectedDayData.attendanceRecord.hasSubmittedUpdate) && (
            <div className="bg-white rounded-lg p-4 space-y-3 border border-blue-100">
                  <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <p className="text-sm text-gray-600 font-medium">
                    Daily update submitted
                    {selectedDayData.attendanceRecord.checkInTime && 
                      ` at ${new Date(selectedDayData.attendanceRecord.checkInTime).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}`
                    }
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewDetails(selectedDayData.attendanceRecord)}
                  className="bg-white hover:bg-gray-50 border-gray-300"
                >
                  <FiEye className="w-3 h-3 mr-1" />
                  View Details
                </Button>
              </div>
            </div>
          )}

          {/* Inline Update Details Modal */}
          {viewModalOpen && viewModalData && (
            <Portal>
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Daily Update Details</h2>
                    <button
                      onClick={() => { setViewModalOpen(false); setViewModalData(null); }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <FiEye className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{viewModalData.projectName}</h3>
                        <p className="text-sm text-gray-500">
                          {viewModalData.user?.email || ''}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-gray-400">
                          <span>
                            {viewModalData.date ? new Date(viewModalData.date).toLocaleDateString() : ''}
                          </span>
                          <span>•</span>
                          <span>
                            {viewModalData.timestamp ? new Date(viewModalData.timestamp).toLocaleTimeString() : ''}
                          </span>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Submitted</Badge>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">What was accomplished:</h4>
                      <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{viewModalData.workDone || 'No details provided'}</p>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Challenges faced:</h4>
                      <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{viewModalData.challenges || 'None mentioned'}</p>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Plan for tomorrow:</h4>
                      <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{viewModalData.planForTomorrow || 'No plan provided'}</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </Portal>
          )}

          {/* List modal when multiple updates exist for same date */}
          {listModalOpen && listModalUpdates && (
            <Portal>
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Select an update</h2>
                    <button
                      onClick={() => { setListModalOpen(false); setListModalUpdates([]); }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  </div>

                  <div className="space-y-3">
                    {listModalUpdates.map((u) => (
                      <div key={u._id} className="border border-gray-200 rounded-lg p-3 flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{u.project?.name || 'No Project'}</div>
                          <div className="text-xs text-gray-500">{u.user ? `${u.user.firstName} ${u.user.lastName}` : u.user?.email}</div>
                          <div className="text-xs text-gray-400">{new Date(u.date).toLocaleDateString()} • {new Date(u.createdAt || u.date).toLocaleTimeString()}</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            className="px-3 py-1 bg-blue-600 text-white rounded"
                            onClick={() => {
                              const mapped = {
                                id: u._id,
                                projectName: u.project?.name || 'No Project Assigned',
                                date: u.date,
                                timestamp: u.createdAt,
                                workDone: u.workDone,
                                challenges: u.challenges,
                                planForTomorrow: u.planForTomorrow,
                                user: u.user || null,
                              };
                              setViewModalData(mapped);
                              setViewModalOpen(true);
                              setListModalOpen(false);
                              setListModalUpdates([]);
                            }}
                          >
                            View
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </Portal>
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
                  onClick={() =>
                    (window.location.href = '/daily-updates/submit')
                  }
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
                  This is a future date. Daily updates can only be submitted on
                  or before the current date.
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
            <span className="text-gray-600">Pending (Today)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-100 rounded"></div>
            <span className="text-gray-600">Future/Weekend</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-center text-xs text-gray-500">
            Working days: Monday to Friday • Saturday and Sunday are off
          </p>
        </div>
      </div>
    </Card>
  );
};

export default CalendarAttendanceView;
