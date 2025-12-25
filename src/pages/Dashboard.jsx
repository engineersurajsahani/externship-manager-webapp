import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiBriefcase,
  FiUsers,
  FiClock,
  FiTrendingUp,
  FiEdit3,
  FiCheckCircle,
  FiArrowRight,
  FiAward,
  FiActivity,
  FiRefreshCw,
  FiCalendar,
  FiEye,
  FiX,
  FiTarget,
} from 'react-icons/fi';
import Portal from '../components/ui/Portal';
import UpcomingDeadlinesModal from '../components/modals/UpcomingDeadlinesModal';

import StatsCard from '../components/StatsCard';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { dashboardHelpers } from '../utils/dashboardHelpers';

const Dashboard = () => {
  const { getUserRole, ROLES, user } = useAuth();
  const navigate = useNavigate();
  const userRole = getUserRole();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    stats: {},
    charts: {},
    recentActivity: [],
    notifications: [],
  });
  const [showUpcomingDeadlines, setShowUpcomingDeadlines] = useState(false);
  const [weeklyGoal, setWeeklyGoal] = useState(null);

  const [weeklyGoalProject, setWeeklyGoalProject] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [fullActivityDetails, setFullActivityDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);


  const getEmptyStats = useCallback(
    (role, attendanceStatus = null) => {
      const baseStats = {
        [ROLES.INTERN]: {
          streak: 0,
          projectsActive: 0,
          attendanceRate: 0,
          todayStatus: attendanceStatus?.hasSubmitted ? 'Submitted' : 'Pending',
          timeRemaining: attendanceStatus?.timeRemaining || null,
          attendanceTimeStatus: attendanceStatus || {
            status: 'pending',
            timeRemaining: dashboardHelpers.getTimeRemainingToday(),
            message: 'Time remaining to mark attendance',
          },
        },
        [ROLES.TEAM_LEADER]: {
          teamSize: 0,
          teamAttendance: 0,
        },
        [ROLES.PROJECT_MANAGER]: {
          totalTeamMembers: 0,
          activeProjects: 0,
          overallAttendance: 0,
          budgetUtilization: 0,
        },
        [ROLES.ADMIN]: {
          totalUsers: 0,
          activeProjects: 0,
          dailyUpdates: 0,
          attendanceRate: 0,
        },
      };

      return baseStats[role] || baseStats[ROLES.INTERN];
    },
    [ROLES]
  );

  const generateFallbackData = useCallback(
    (attendanceStatus = null) => {
      // When API is unavailable, show minimal fallback data
      const emptyData = {
        stats: getEmptyStats(userRole, attendanceStatus),
        charts: { timeline: [] },
        recentActivity: [],
        notifications: [],
        attendance: { percentage: 0, presentDays: 0, absentDays: 0, total: 0 },
      };

      return emptyData;
    },
    [userRole, getEmptyStats]
  );

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      let attendanceStatus = null;
      try {
        attendanceStatus = await dashboardHelpers.apiHelpers.getTodayAttendanceStatus();
      } catch (e) { }

      let apiData = null;
      let attendanceRate = 0;
      try {
        const response = await apiService.getDashboardStats();
        apiData = response.data;

        if (userRole === ROLES.INTERN) {
          const updatesResponse = await apiService.getMyUpdates();
          if (updatesResponse.data.success) {
            const updates = updatesResponse.data.updates || [];
            const stats = calculateAttendanceStats(updates);
            attendanceRate = stats.attendanceRate;
          }
        } else {
          attendanceRate = apiData.stats?.attendanceRate || 0;
        }

      } catch (e) { }

      const data = apiData ? processApiData(apiData, attendanceStatus, attendanceRate) : generateFallbackData(attendanceStatus);
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);

      // Show user-friendly error message
      if (
        error.code === 'ECONNREFUSED' ||
        error.message.includes('Network Error')
      ) {
        console.warn(
          'Cannot connect to database. Make sure your backend server is running on http://localhost:5050'
        );
      }

      // Set fallback data on error
      const fallbackData = generateFallbackData();
      setDashboardData(fallbackData);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generateFallbackData]);

  const processApiData = (apiData, attendanceStatus = null, customAttendanceRate = null) => {
    // If we have attendance status from API, use it to enhance the data
    let enhancedStats = apiData.stats || {};
    if (attendanceStatus && userRole === ROLES.INTERN) {
      enhancedStats = {
        ...enhancedStats,
        todayStatus: attendanceStatus.hasSubmitted ? 'Submitted' : 'Pending',
        timeRemaining: attendanceStatus.timeRemaining,
        attendanceRate: customAttendanceRate !== null ? customAttendanceRate : enhancedStats.attendanceRate,
      };
    }

    let rawRecent =
      (apiData.stats && (apiData.stats.recentActivity || apiData.stats.recentUpdates)) ||
      apiData.recentActivity || [];

    // For interns and team leaders, only show their submitted work
    // Client-side filtering removed to trust backend response


    // Map backend activity shape to frontend expected shape
    const recentActivity = (rawRecent || [])
      .map((a, idx) => {
        // Normalize varying backend shapes
        const timestamp = a.timestamp || a.date || a.createdAt || a.time || null;

        // Enhance title with project name if available
        let title = a.title || a.message;
        if (!title) {
          if (a.type === 'update') {
            title = (a.project || a.projectName)
              ? `Daily update - ${a.project || a.projectName}`
              : 'Daily update';
          } else {
            title = a.type || 'Activity';
          }
        }

        // Use workDone as description if available, otherwise fall back
        const description = a.workDone || a.description || a.messageDetail || a.message || '';
        const isUpdateLike =
          a.type === 'update' ||
          !!a.user || 
          !!a.userName ||
          !!a.project ||
          !!a.projectName ||
          !!a.workDone ||
          (typeof a.message === 'string' && a.message.toLowerCase().includes('submit'));

        const status = a.status || (isUpdateLike ? 'completed' : 'pending');
        const user = a.user || a.email || a.by || null;

        return {
          id: a.id || a._id || `${timestamp || Date.now()}-${idx}`,
          title,
          description,
          timestamp,
          status,
          user,
          raw: a,
        };
      })
      .slice(0, 3); // only show the most recent 3 activities

    // Transform API response to match our dashboard data structure
    return {
      stats: enhancedStats,
      charts: {
        timeline: apiData.charts?.timeline || [],
      },
      recentActivity,
      notifications: apiData.notifications || [],
      attendance: apiData.attendance || {
        percentage: 0,
        presentDays: 0,
        absentDays: 0,
        total: 0,
      },
      attendanceStatus: attendanceStatus,
    };
  };

  useEffect(() => {
    loadDashboardData();

    // Set up periodic refresh for interns (every 5 minutes)
    if (userRole === ROLES.INTERN) {
      const interval = setInterval(
        () => {
          loadDashboardData();
        },
        5 * 60 * 1000
      ); // 5 minutes

      return () => clearInterval(interval);
    }
  }, [loadDashboardData, userRole, ROLES.INTERN]);

  // Load weekly goal for interns and team leaders
  useEffect(() => {
    const loadWeeklyGoal = async () => {
      if (userRole !== ROLES.INTERN && userRole !== ROLES.TEAM_LEADER) return;

      try {
        const resp = await apiService.getMyProjects();
        if (resp.data && resp.data.success && resp.data.projects) {
          const projects = resp.data.projects;
          let found = false;

          // Helper to check if a date is in the current week (Mon-Sun)
          const isDateInCurrentWeek = (dateString) => {
            const date = new Date(dateString);
            const now = new Date();

            // Adjust to local start of week (Monday)
            const dayOfWeek = now.getDay(); // 0 (Sun) - 6 (Sat)
            const diffToMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

            const startOfWeek = new Date(now);
            startOfWeek.setHours(0, 0, 0, 0);
            startOfWeek.setDate(now.getDate() - diffToMon);

            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);

            return date >= startOfWeek && date <= endOfWeek;
          };

          for (const project of projects) {
            const goals = project.weeklyGoals || project.weeklyGoals?.length ? project.weeklyGoals : project.weeklyGoals || [];
            if (goals && goals.length > 0) {
              // Sort goals by creation date (newest first)
              const sortedGoals = [...goals].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

              // Find the first goal that is 'current' AND created this week
              const current = sortedGoals.find((g) =>
                g.status === 'current' && isDateInCurrentWeek(g.createdAt)
              );

              if (current) {
                setWeeklyGoal(current);
                setWeeklyGoalProject(project.name || project.title || 'Project');
                found = true;
                break;
              }
            }
          }

          if (!found) {
            setWeeklyGoal(null);
            setWeeklyGoalProject(null);
          }
        }
      } catch (err) {
        console.error('Error loading weekly goal:', err);
        setWeeklyGoal(null);
        setWeeklyGoalProject(null);
      }
    };

    loadWeeklyGoal();
  }, [userRole, ROLES]);



  const handleQuickAction = (action) => {
    switch (action) {
      case 'submit-update':
        navigate('/daily-updates');
        break;
      case 'view-attendance':
        navigate('/attendance');
        break;
      case 'manage-projects':
        navigate('/projects');
        break;
      case 'manage-users':
        navigate('/users');
        break;
      default:
        break;
    }
  };

  const handleViewActivity = async (activity) => {
    setSelectedActivity(activity);
    setShowActivityModal(true);
    setFullActivityDetails(null);

    // If it's an update, fetch full details to get non-truncated text
    if (activity.raw && (activity.raw.type === 'update' || activity.raw.workDone)) {
      setLoadingDetails(true);
      try {
        const response = await apiService.getUpdate(activity.id);
        if (response.data && response.data.success) {
          setFullActivityDetails(response.data.update);
        }
      } catch (error) {
        console.error("Failed to fetch full update details", error);
      } finally {
        setLoadingDetails(false);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Present':
      case 'Submitted':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'Late':
      case 'Pending':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Absent':
      case 'Missing':
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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

  const calculateAttendanceStats = useCallback((updates) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

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
    const attendanceRate =
      passedWorkingDays > 0
        ? Math.round((presentDays / passedWorkingDays) * 100)
        : 0;

    return {
      attendanceRate,
    };
  }, []);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80 bg-gray-200 rounded-xl"></div>
            <div className="h-80 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header with Real-time Status */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        </div>

        {/* Weekly Goal (Interns / Team Leaders) */}
        {/* (Weekly goal moved into the stats grid for better alignment) */}
        <div className="flex items-center space-x-4 mt-4 lg:mt-0">
          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboardData}
            disabled={isLoading}
          >
            <FiRefreshCw
              className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
            />
          </Button>
        </div>
      </motion.div>

      {/* Notifications Bar */}
      {dashboardData?.notifications?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          {(dashboardData?.notifications || []).map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg border-l-4 ${notification.type === 'warning'
                ? 'bg-yellow-50 border-yellow-400'
                : notification.type === 'info'
                  ? 'bg-blue-50 border-blue-400'
                  : 'bg-green-50 border-green-400'
                }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">
                    {notification.title}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {notification.message}
                  </p>
                </div>
                {notification.action && (
                  <Button size="sm" onClick={notification.action}>
                    Take Action
                  </Button>
                )}
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Upcoming Deadlines Modal */}
      {showUpcomingDeadlines && (
        <UpcomingDeadlinesModal
          projects={dashboardData.stats?.upcomingDeadlineProjects || []}
          onClose={() => setShowUpcomingDeadlines(false)}
        />
      )}

      {/* Role-based Stats Grid */}
      <div
        className={`grid gap-6 ${userRole === ROLES.INTERN
          ? 'grid-cols-1 md:grid-cols-4 lg:grid-cols-4'
          : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
          }`}
      >
        {userRole === ROLES.INTERN && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="h-full"
            >
              <Card className="p-4 h-full">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold">Weekly Goal</h4>
                  {weeklyGoalProject && (
                    <div className="text-xs text-gray-400">{weeklyGoalProject}</div>
                  )}
                </div>
                {weeklyGoal ? (
                  <div className="text-sm text-gray-700">
                    {weeklyGoal.goal || weeklyGoal.title}
                    {weeklyGoal.week && (
                      <div className="text-xs text-gray-500 mt-2">{weeklyGoal.week}</div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No weekly goal set</div>
                )}
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="h-full"
            >
              <StatsCard
                title="Active Projects"
                value={dashboardData?.stats?.projectsActive?.toString() || '0'}
                icon={FiBriefcase}
                color="blue"
                onClick={() => handleQuickAction('manage-projects')}
                className="h-full"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="h-full"
            >
              <StatsCard
                title="Attendance Rate"
                value={`${dashboardData?.stats?.attendanceRate || 0}%`}
                icon={FiCheckCircle}
                color={
                  (dashboardData?.stats?.attendanceRate || 0) >= 90
                    ? 'green'
                    : 'orange'
                }
                onClick={() => handleQuickAction('view-attendance')}
                className="h-full"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="h-full"
            >
              <StatsCard
                title="Today's Status"
                value={
                  dashboardData?.stats?.todayStatus === 'Submitted'
                    ? 'Done'
                    : dashboardData?.stats?.timeRemaining
                      ? dashboardHelpers.getTimeRemainingToday()
                      : 'Pending'
                }
                icon={
                  dashboardData?.stats?.todayStatus === 'Submitted'
                    ? FiCheckCircle
                    : FiClock
                }
                color={
                  dashboardData?.stats?.todayStatus === 'Submitted'
                    ? 'green'
                    : 'orange'
                }
                onClick={() => handleQuickAction('submit-update')}
                className="h-full"
                subtitle={
                  dashboardData?.stats?.todayStatus === 'Submitted'
                    ? ''
                    : ''
                }
              />
            </motion.div>
          </>
        )}

        {userRole === ROLES.TEAM_LEADER && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="h-full"
            >
              <Card className="p-4 h-full">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold">Weekly Goal</h4>
                  {weeklyGoalProject && (
                    <div className="text-xs text-gray-400">{weeklyGoalProject}</div>
                  )}
                </div>
                {weeklyGoal ? (
                  <div className="text-sm text-gray-700">
                    {weeklyGoal.goal || weeklyGoal.title}
                    {weeklyGoal.week && (
                      <div className="text-xs text-gray-500 mt-2">{weeklyGoal.week}</div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No weekly goal set</div>
                )}
              </Card>
            </motion.div>
            <StatsCard
              title="Team Size"
              value={dashboardData?.stats?.teamSize?.toString() || '0'}
              icon={FiUsers}
              color="blue"
              delay={0.1}
            />
            <StatsCard
              title="Attendance Rate"
              value={`${dashboardData?.attendance?.percentage ?? dashboardData?.stats?.teamAttendance ?? 0}%`}
              icon={FiCheckCircle}
              color={
                (dashboardData?.attendance?.percentage ?? dashboardData?.stats?.teamAttendance ?? 0) >= 90
                  ? 'green'
                  : 'orange'
              }
              delay={0.2}
            />
            <StatsCard
              title="Today's Status"
              value={
                dashboardData?.attendanceStatus?.hasSubmitted
                  ? 'Done'
                  : dashboardData?.attendanceStatus?.timeRemaining
                    ? dashboardHelpers.getTimeRemainingToday()
                    : 'Pending'
              }
              icon={
                dashboardData?.attendanceStatus?.hasSubmitted ? FiCheckCircle : FiClock
              }
              color={
                dashboardData?.attendanceStatus?.hasSubmitted
                  ? 'green'
                  : 'orange'
              }
              delay={0.4}
            />
          </>
        )}

        {userRole === ROLES.PROJECT_MANAGER && (
          <>
            <StatsCard
              title="Total Team Members"
              value={dashboardData?.stats?.totalTeamMembers?.toString() || '0'}
              icon={FiUsers}
              color="blue"
              delay={0.1}
            />
            <StatsCard
              title="Active Projects"
              value={dashboardData?.stats?.activeProjects?.toString() || '0'}
              icon={FiBriefcase}
              color="purple"
              delay={0.2}
            />
            <StatsCard
              title="Overall Attendance"
              value={`${dashboardData?.stats?.overallAttendance || 0}%`}
              icon={FiCheckCircle}
              color="green"
              delay={0.3}
            />

          </>
        )}

        {userRole === ROLES.ADMIN && (
          <>
            <StatsCard
              title="Total Users"
              value={dashboardData?.stats?.totalUsers?.toString() || '0'}
              icon={FiUsers}
              color="blue"
              delay={0.1}
            />
            <StatsCard
              title="Active Projects"
              value={dashboardData?.stats?.activeProjects?.toString() || '0'}
              icon={FiBriefcase}
              color="purple"
              delay={0.2}
            />
            <StatsCard
              title="Daily Updates"
              value={dashboardData?.stats?.dailyUpdates?.toString() || '0'}
              icon={FiEdit3}
              color="green"
              delay={0.3}
            />
            <StatsCard
              title="Attendance Rate"
              value={`${dashboardData?.stats?.attendanceRate || 0}%`}
              icon={FiClock}
              color="orange"
              delay={0.4}
            />
          </>
        )}
      </div>



      {/* Recent Activity Feed */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Activity
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/daily-updates')}
            >
              View All <FiArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {dashboardData.recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <FiActivity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No recent activity to show</p>
              <p className="text-sm text-gray-400">
                Activity will appear here as you submit updates
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {dashboardData.recentActivity.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div
                    className={`p-2 rounded-full ${activity.status === 'completed'
                      ? 'bg-green-100'
                      : activity.status === 'pending'
                        ? 'bg-yellow-100'
                        : 'bg-blue-100'
                      }`}
                  >
                    <FiEdit3
                      className={`w-4 h-4 ${activity.status === 'completed'
                        ? 'text-green-600'
                        : activity.status === 'pending'
                          ? 'text-yellow-600'
                          : 'text-blue-600'
                        }`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.title}
                    </p>
                    <p className="text-xs text-gray-400">
                      {activity.timestamp
                        ? new Date(activity.timestamp).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                        : ''}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewActivity(activity)}
                    className="ml-2"
                  >
                    <FiEye className="w-4 h-4 text-gray-500 hover:text-blue-600" />
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      </motion.div>

      {/* Activity Detail Modal */}
      {showActivityModal && selectedActivity && (
        <Portal>
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Daily Update Details
                </h2>
                <button
                  onClick={() => setShowActivityModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <FiTarget className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {fullActivityDetails?.project?.name || selectedActivity.raw?.project?.name || selectedActivity.raw?.project || selectedActivity.raw?.projectName || 'Project Update'}
                    </h3>
                    <p className="text-sm text-gray-500">Project Update</p>
                    <div className="flex items-center space-x-2 text-xs text-gray-400">
                      <FiCalendar className="w-3 h-3" />
                      <span>
                        {selectedActivity.timestamp ? new Date(selectedActivity.timestamp).toLocaleDateString() : 'N/A'}
                      </span>
                      <span>•</span>
                      <FiClock className="w-3 h-3" />
                      <span>
                        {selectedActivity.timestamp ? new Date(selectedActivity.timestamp).toLocaleTimeString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <Badge className={getStatusColor(selectedActivity.status)}>
                    {selectedActivity.status.charAt(0).toUpperCase() +
                      selectedActivity.status.slice(1)}
                  </Badge>
                </div>

                {loadingDetails ? (
                  <div className="flex justify-center py-4">
                    <FiRefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                  </div>
                ) : (
                  <>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">
                        What was accomplished:
                      </h4>
                      <p className="text-gray-600 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                        {fullActivityDetails?.workDone || selectedActivity.raw?.workDone || selectedActivity.description || 'No details provided'}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">
                        Challenges faced:
                      </h4>
                      <p className="text-gray-600 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                        {fullActivityDetails?.challenges || selectedActivity.raw?.challenges || 'None mentioned'}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">
                        Plan for tomorrow:
                      </h4>
                      <p className="text-gray-600 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                        {fullActivityDetails?.planForTomorrow || selectedActivity.raw?.planForTomorrow || 'No plan provided'}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </Portal>
      )}

      {/* Performance Overview for Managers/Admins */}
      {(userRole === ROLES.PROJECT_MANAGER || userRole === ROLES.ADMIN) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.1 }}
          >
            <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Submission Rate</h3>
                <FiTrendingUp className="w-6 h-6" />
              </div>
              <p className="text-3xl font-bold mb-2">
                {Math.round(
                  ((dashboardData.stats.dailyUpdates || 0) /
                    (dashboardData.stats.totalUsers || 1)) *
                  100
                )}
                %
              </p>
              <p className="text-blue-100">Average daily submissions</p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2 }}
          >
            <Card
              className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white cursor-pointer"
              onClick={() => setShowUpcomingDeadlines(true)}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Upcoming Deadlines</h3>
                <FiCalendar className="w-6 h-6" />
              </div>
              <p className="text-3xl font-bold mb-2">
                {dashboardData.stats?.upcomingDeadlines ?? 0}
              </p>
              <p className="text-green-100">Projects due this week</p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.3 }}
          >
            <Card className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Team Engagement</h3>
                <FiAward className="w-6 h-6" />
              </div>
              <p className="text-3xl font-bold mb-2">
                {dashboardData.stats.attendanceRate || 0}%
              </p>
              <p className="text-purple-100">Overall participation rate</p>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Admin team attendance overview removed */}
    </div>
  );
};

export default Dashboard;
