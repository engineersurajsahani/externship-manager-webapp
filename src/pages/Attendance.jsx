import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  FiCalendar,
  FiTrendingUp,
  FiTarget,
  FiUsers,
  FiCheck,
  FiCheckCircle,
  FiX,
  FiEye,
  FiFolder,
} from 'react-icons/fi';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import AttendanceHistory from '../components/widgets/AttendanceHistory';
import CalendarAttendanceView from '../components/widgets/CalendarAttendanceView';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

const Attendance = () => {
  const { user, getUserRole, ROLES } = useAuth();
  const userRole = getUserRole();
  const [selectedProject, setSelectedProject] = useState(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Calculate attendance statistics from daily updates
  const calculateAttendanceStats = useCallback((updates) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Get total working days in current month (exclude Sundays)
    const totalWorkingDays = getWorkingDaysInMonth(currentYear, currentMonth);

    // Filter updates for current month
    const monthlyUpdates = updates.filter((update) => {
      const updateDate = new Date(update.date);
      return (
        updateDate.getMonth() === currentMonth &&
        updateDate.getFullYear() === currentYear
      );
    });

    const presentDays = monthlyUpdates.length;
    const today = new Date();
    const passedWorkingDays = getWorkingDaysPassed(
      currentYear,
      currentMonth,
      today.getDate()
    );
    const absentDays = Math.max(0, passedWorkingDays - presentDays);
    const attendanceRate =
      passedWorkingDays > 0
        ? Math.round((presentDays / passedWorkingDays) * 100)
        : 0;

    // Calculate streak
    const streak = calculateStreak(updates);

    return {
      totalWorkingDays,
      presentDays,
      absentDays,
      attendanceRate,
      streak,
    };
  }, []);

  // Helper function to get total working days in a month (exclude Sundays and Saturdays)
  const getWorkingDaysInMonth = (year, month) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let workingDays = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Exclude Sundays and Saturdays
        workingDays++;
      }
    }

    return workingDays;
  };

  // Helper function to get working days that have passed in current month
  const getWorkingDaysPassed = (year, month, currentDay) => {
    let workingDays = 0;

    for (let day = 1; day <= currentDay; day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Exclude Sundays and Saturdays
        workingDays++;
      }
    }

    return workingDays;
  };

  // Calculate consecutive days streak
  const calculateStreak = (updates) => {
    if (!updates || updates.length === 0) return 0;

    // Sort updates by date descending (most recent first)
    const sortedUpdates = updates.sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    let streak = 0;
    const today = new Date();
    let checkDate = new Date(today);

    // Start checking from today or yesterday if today hasn't passed yet
    const todayUpdate = sortedUpdates.find((update) => {
      const updateDate = new Date(update.date);
      return updateDate.toDateString() === today.toDateString();
    });

    if (!todayUpdate) {
      // If no update today, start checking from yesterday
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Count consecutive days with updates (skip Sundays)
    while (true) {
      const dayOfWeek = checkDate.getDay();

      if (dayOfWeek === 0) {
        // Skip Sundays
        checkDate.setDate(checkDate.getDate() - 1);
        continue;
      }

      const hasUpdate = sortedUpdates.some((update) => {
        const updateDate = new Date(update.date);
        return updateDate.toDateString() === checkDate.toDateString();
      });

      if (hasUpdate) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }

      // Prevent infinite loop - max 30 days
      if (streak >= 30) break;
    }

    return streak;
  };

  // Load attendance data from API
  useEffect(() => {
    const loadAttendanceData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (userRole === ROLES.ADMIN || userRole === ROLES.PROJECT_MANAGER) {
          // Admin: fetch team & per-project attendance stats for selected date
          const resp = await apiService.getAttendanceStats({ date: new Date(selectedDate).toISOString() });
          if (resp.data && resp.data.success) {
            const data = resp.data;
            setAttendanceData({
              totalUsers: data.totalUsers || 0,
              teamAttendanceRate: data.teamAttendanceRate || 0,
              todaySubmissions: data.todaySubmissions || 0,
              projects: data.projects || [],
            });
          } else {
            throw new Error(resp.data?.message || 'Failed to load attendance stats');
          }
        } else {
          // Other roles get their personal attendance from daily updates
          const response = await apiService.getMyUpdates();
          if (response.data.success) {
            const updates = response.data.updates || [];
            const calculatedData = calculateAttendanceStats(updates);
            setAttendanceData(calculatedData);
          } else {
            throw new Error(
              response.data.message || 'Failed to load daily updates'
            );
          }
        }
      } catch (error) {
        console.error('Failed to load attendance data:', error);
        console.error('Request URL:', error.config?.url);

        // Don't block the UI with a full page error - use fallback data and show toast
        window.dispatchEvent(new CustomEvent('app-toast', {
          detail: {
            message: `Could not load latest attendance data. Showing empty state. (${error.message})`,
            type: 'error'
          }
        }));

        // Set fallback data so the page renders
        const fallbackData =
          userRole === ROLES.ADMIN || userRole === ROLES.PROJECT_MANAGER
            ? {
              totalUsers: 0,
              teamAttendanceRate: 0,
              todaySubmissions: 0,
              projects: [],
            }
            : {
              totalWorkingDays: 0,
              presentDays: 0,
              absentDays: 0,
              attendanceRate: 0,
              streak: 0,
            };
        setAttendanceData(fallbackData);
        // Do NOT set error state to avoid locking the UI
        // setError(error.message); 
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadAttendanceData();
    }
  }, [user, userRole, selectedDate, ROLES.ADMIN, ROLES.PROJECT_MANAGER, calculateAttendanceStats]);

  const handleProjectClick = (project) => {
    setSelectedProject(project);
    setShowProjectModal(true);
  };

  const handleCloseModal = () => {
    setShowProjectModal(false);
    setSelectedProject(null);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <Card className="p-6 text-center">
          <div className="text-red-600 mb-4">
            <FiX className="w-12 h-12 mx-auto mb-2" />
            <p className="text-lg font-semibold">
              Error Loading Attendance Data
            </p>
            <p className="text-sm">{error}</p>
          </div>
          <Button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  const overview = attendanceData || {};
  const projectAttendanceData = attendanceData?.projects || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-100 rounded-full">
            <FiCalendar className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {userRole === ROLES.ADMIN || userRole === ROLES.PROJECT_MANAGER
                ? 'Team Attendance Management'
                : 'Attendance Tracking'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {userRole === ROLES.ADMIN || userRole === ROLES.PROJECT_MANAGER
                ? 'Monitor team attendance and daily update submissions across all users'
                : 'Monitor your daily update submissions and attendance record'}
            </p>
          </div>
        </div>

        {/* Date Filter for Admin/PM */}
        {(userRole === ROLES.ADMIN || userRole === ROLES.PROJECT_MANAGER) && (
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <FiCalendar className="w-4 h-4 text-black dark:text-white transition-colors duration-300" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            >
              Today
            </Button>
          </div>
        )}
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {userRole === ROLES.ADMIN || userRole === ROLES.PROJECT_MANAGER ? (
          // Admin Team Stats
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Total Users
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {overview.totalUsers}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Registered users</p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <FiCalendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Team Attendance
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {overview.teamAttendanceRate}%
                    </p>
                    <p
                      className={`text-sm ${overview.teamAttendanceRate >= 90
                        ? 'text-green-600'
                        : overview.teamAttendanceRate >= 75
                          ? 'text-yellow-600'
                          : 'text-red-600'
                        }`}
                    >
                      {overview.teamAttendanceRate >= 90
                        ? 'Excellent'
                        : overview.teamAttendanceRate >= 75
                          ? 'Good'
                          : 'Needs Improvement'}
                    </p>
                  </div>
                  <div
                    className={`p-3 rounded-full ${overview.teamAttendanceRate >= 90
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : overview.teamAttendanceRate >= 75
                        ? 'bg-yellow-100 dark:bg-yellow-900/30'
                        : 'bg-red-100 dark:bg-red-900/30'
                      }`}
                  >
                    <FiTrendingUp
                      className={`w-6 h-6 ${overview.teamAttendanceRate >= 90
                        ? 'text-green-600 dark:text-green-400'
                        : overview.teamAttendanceRate >= 75
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-red-600 dark:text-red-400'
                        }`}
                    />
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Today Submitted
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {overview.todaySubmissions}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Updates received</p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                    <FiCheckCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </Card>
            </motion.div>
          </>
        ) : userRole === ROLES.INTERN ? (
          // Intern Stats (3 cards only)
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      This Month
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {overview.presentDays}/{overview.totalWorkingDays}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <FiCalendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Attendance Rate
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {overview.attendanceRate}%
                    </p>
                  </div>
                  <div
                    className={`p-3 rounded-full ${overview.attendanceRate >= 90
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : overview.attendanceRate >= 75
                        ? 'bg-yellow-100 dark:bg-yellow-900/30'
                        : 'bg-red-100 dark:bg-red-900/30'
                      }`}
                  >
                    <FiTrendingUp
                      className={`w-6 h-6 ${overview.attendanceRate >= 90
                        ? 'text-green-600 dark:text-green-400'
                        : overview.attendanceRate >= 75
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-red-600 dark:text-red-400'
                        }`}
                    />
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Current Streak
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {overview.streak}   days
                    </p>

                  </div>
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                    <FiTarget className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </Card>
            </motion.div>
          </>
        ) : (
          // Personal Stats for Team Leaders and Project Managers (4 cards)
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      This Month
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {overview.presentDays}/{overview.totalWorkingDays}
                    </p>
                    <p className="text-sm text-gray-500">Days present</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <FiCalendar className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Attendance Rate
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {overview.attendanceRate}%
                    </p>
                    <p
                      className={`text-sm ${overview.attendanceRate >= 90
                        ? 'text-green-600'
                        : overview.attendanceRate >= 75
                          ? 'text-yellow-600'
                          : 'text-red-600'
                        }`}
                    >
                      {overview.attendanceRate >= 90
                        ? 'Excellent'
                        : overview.attendanceRate >= 75
                          ? 'Good'
                          : 'Needs Improvement'}
                    </p>
                  </div>
                  <div
                    className={`p-3 rounded-full ${overview.attendanceRate >= 90
                      ? 'bg-green-100'
                      : overview.attendanceRate >= 75
                        ? 'bg-yellow-100'
                        : 'bg-red-100'
                      }`}
                  >
                    <FiTrendingUp
                      className={`w-6 h-6 ${overview.attendanceRate >= 90
                        ? 'text-green-600'
                        : overview.attendanceRate >= 75
                          ? 'text-yellow-600'
                          : 'text-red-600'
                        }`}
                    />
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Current Streak
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {overview.streak}
                    </p>
                    <p className="text-sm text-gray-500">Consecutive days</p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <FiTarget className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </Card>
            </motion.div>
          </>
        )}
      </div>

      {/* Project Attendance View for Admin/PM */}
      {userRole === ROLES.ADMIN || userRole === ROLES.PROJECT_MANAGER ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Project Attendance Overview
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Today's attendance by project
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projectAttendanceData.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => handleProjectClick(project)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <FiFolder className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {project.name}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {project.totalMembers} members
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={`${project.attendanceRate >= 80
                        ? 'bg-green-100 text-green-800'
                        : project.attendanceRate >= 60
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                        }`}
                    >
                      {project.attendanceRate}%
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-2 mb-1">
                        <FiCheck className="w-4 h-4 text-green-600" />
                        <span className="text-lg font-bold text-green-600">
                          {project.presentCount}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">Present</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-2 mb-1">
                        <FiX className="w-4 h-4 text-red-600" />
                        <span className="text-lg font-bold text-red-600">
                          {project.absentCount}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">Absent</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Click to view details
                      </span>
                      <FiEye className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {projectAttendanceData.length === 0 && (
              <div className="text-center py-8">
                <FiFolder className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No projects found</p>
                <p className="text-sm text-gray-400">
                  Create projects to track team attendance
                </p>
              </div>
            )}
          </Card>
        </motion.div>
      ) : (
        /* Attendance View for non-admin roles */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          {/* Show calendar for interns and team leaders; hide table history for team leaders */}
          {userRole === ROLES.INTERN || userRole === ROLES.TEAM_LEADER ? (
            <CalendarAttendanceView />
          ) : (
            <AttendanceHistory viewMode="table" />
          )}
        </motion.div>
      )}

      {/* Project Detail Modal */}
      {showProjectModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <FiFolder className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {selectedProject.name}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Attendance: {selectedProject.attendanceRate}% •{' '}
                    {selectedProject.totalMembers} total members
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Present Members */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <FiCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Present Today ({selectedProject.presentCount})
                  </h3>
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {selectedProject.presentMembers.length > 0 ? (
                    selectedProject.presentMembers.map((member, index) => (
                      <div
                        key={member.email}
                        className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
                      >
                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                          <FiUsers className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {member.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {member.department} • {member.role}
                          </p>
                        </div>
                        <div className="p-1 bg-green-100 rounded-full">
                          <FiCheck className="w-4 h-4 text-green-600" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <FiCheck className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                      <p className="text-gray-500 dark:text-gray-400">No members present today</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Absent Members */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <FiX className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Absent Today ({selectedProject.absentCount})
                  </h3>
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {selectedProject.absentMembers.length > 0 ? (
                    selectedProject.absentMembers.map((member, index) => (
                      <div
                        key={member.email}
                        className="flex items-center space-x-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg"
                      >
                        <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                          <FiUsers className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {member.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {member.department} • {member.role}
                          </p>
                        </div>
                        <div className="p-1 bg-red-100 dark:bg-red-900/30 rounded-full">
                          <FiX className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <FiX className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                      <p className="text-gray-500 dark:text-gray-400">
                        All members are present today!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-end">
                <Button onClick={handleCloseModal}>Close</Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Attendance;