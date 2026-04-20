import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiCalendar,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiEye,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import { useAuth } from "../../contexts/AuthContext";
import { apiService } from "../../services/api";

const AttendanceHistory = ({ viewMode = "table" }) => {
  const { user } = useAuth();
  const [attendanceData, setAttendanceData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const loadAttendanceData = async () => {
    try {
      // Fetch user's daily updates from MongoDB API
      const response = await apiService.getMyUpdates();
      const dailyUpdates = response.data.updates || [];

      const data = generateAttendanceData(dailyUpdates);
      setAttendanceData(data);
    } catch (error) {
      console.error("Error loading attendance data:", error);
      // Generate empty attendance data for the month if API fails
      const data = generateAttendanceData([]);
      setAttendanceData(data);
    }
  };

  useEffect(() => {
    if (user?.email) {
      loadAttendanceData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear, user?.email]);

  const generateAttendanceData = (dailyUpdates) => {
    const data = [];
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(selectedYear, selectedMonth, day);
      const dateString = date.toISOString().split("T")[0];
      const dayOfWeek = date.getDay();

      // Skip Sunday for attendance calculation (Saturday is now a working day)
      if (dayOfWeek === 0) {
        continue;
      }

      // Check if there's a daily update for this date
      const update = dailyUpdates.find((update) => {
        const updateDate = new Date(update.date).toISOString().split("T")[0];
        return updateDate === dateString;
      });

      const hasUpdate = !!update;

      // Only mark as absent for past dates
      const isToday = date.toDateString() === new Date().toDateString();
      const isPast = date < new Date() && !isToday;

      let status = "pending";
      if (isPast) {
        status = hasUpdate ? "present" : "absent";
      } else if (isToday) {
        status = hasUpdate ? "present" : "pending";
      }

      data.push({
        date: dateString,
        day: day,
        dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
        status: status,
        hasUpdate: hasUpdate,
        update: update || null,
        timestamp: update?.createdAt || null,
      });
    }

    return data.reverse(); // Show most recent first
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "present":
        return <FiCheckCircle className="w-4 h-4 text-green-600" />;
      case "absent":
        return <FiXCircle className="w-4 h-4 text-red-600" />;
      case "pending":
        return <FiClock className="w-4 h-4 text-yellow-600" />;
      default:
        return <FiClock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "present":
        return "bg-green-100 text-green-800";
      case "absent":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getAttendanceStats = () => {
    const total = attendanceData.filter(
      (record) => record.status !== "pending"
    ).length;
    const present = attendanceData.filter(
      (record) => record.status === "present"
    ).length;
    const absent = attendanceData.filter(
      (record) => record.status === "absent"
    ).length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    return { total, present, absent, percentage };
  };

  const navigateMonth = (direction) => {
    if (direction === "prev") {
      if (selectedMonth === 0) {
        setSelectedMonth(11);
        setSelectedYear(selectedYear - 1);
      } else {
        setSelectedMonth(selectedMonth - 1);
      }
    } else {
      if (selectedMonth === 11) {
        setSelectedMonth(0);
        setSelectedYear(selectedYear + 1);
      } else {
        setSelectedMonth(selectedMonth + 1);
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const stats = getAttendanceStats();
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Attendance History
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Your daily update submission record
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge
            className={`${stats.percentage >= 90
              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
              : stats.percentage >= 75
                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
              }`}
          >
            {stats.percentage}% Present
          </Badge>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateMonth("prev")}
        >
          <FiChevronLeft className="w-4 h-4" />
        </Button>

        <h4 className="text-lg font-medium text-gray-900 dark:text-white">
          {monthNames[selectedMonth]} {selectedYear}
        </h4>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateMonth("next")}
          disabled={
            selectedYear === new Date().getFullYear() &&
            selectedMonth >= new Date().getMonth()
          }
        >
          <FiChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.present}</p>
          <p className="text-xs text-green-700 dark:text-green-300">Present</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.absent}</p>
          <p className="text-xs text-red-700 dark:text-red-300">Absent</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</p>
          <p className="text-xs text-blue-700 dark:text-blue-300">Total Days</p>
        </div>
      </div>

      {/* Attendance Records */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {attendanceData.length === 0 ? (
          <div className="text-center py-8">
            <FiCalendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              No attendance records for this month
            </p>
          </div>
        ) : (
          attendanceData.map((record, index) => (
            <motion.div
              key={record.date}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.02 }}
              className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                {getStatusIcon(record.status)}
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatDate(record.date)}
                  </p>
                  {record.timestamp && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Submitted at {formatTime(record.timestamp)}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Badge className={getStatusColor(record.status)}>
                  {record.status.charAt(0).toUpperCase() +
                    record.status.slice(1)}
                </Badge>

                {record.hasUpdate && record.update && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Replace native alert with UI toast showing details (info)
                      const message = `Update Details:\n\nWork Done: ${record.update.workDone || 'N/A'}\n\nChallenges: ${record.update.challenges || 'N/A'}\n\nPlan Tomorrow: ${record.update.planForTomorrow || 'N/A'}`;
                      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message, type: 'info', duration: 8000 } }));
                    }}
                  >
                    <FiEye className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center space-x-6 text-xs">
          <div className="flex items-center space-x-1">
            <FiCheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
            <span className="text-gray-600 dark:text-gray-400">Present (Update Submitted)</span>
          </div>
          <div className="flex items-center space-x-1">
            <FiXCircle className="w-3 h-3 text-red-600 dark:text-red-400" />
            <span className="text-gray-600 dark:text-gray-400">Absent (No Update)</span>
          </div>
          <div className="flex items-center space-x-1">
            <FiClock className="w-3 h-3 text-yellow-600 dark:text-yellow-400" />
            <span className="text-gray-600 dark:text-gray-400">Pending</span>
          </div>
        </div>
        <div className="mt-2 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Working days: Monday to Sunday
          </p>
        </div>
      </div>
    </Card>
  );
};

export default AttendanceHistory;
