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
  FiAlertCircle,
  FiArrowRight,
  FiAward,
  FiActivity,
  FiRefreshCw,
} from 'react-icons/fi';

import StatsCard from '../components/StatsCard';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { dashboardHelpers } from '../utils/dashboardHelpers';

const Dashboard = () => {
  const { getUserRole, ROLES } = useAuth();
  const navigate = useNavigate();
  const userRole = getUserRole();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    stats: {},
    charts: {},
    recentActivity: [],
    notifications: [],
  });


  // Get empty stats based on user role when API is unavailable
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
          projectsManaged: 0,
          teamAttendance: 0,
          pendingReviews: 0,
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

  // Generate fallback data when API is unavailable
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

  // Load dashboard data function with API attendance support
  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Try to get today's attendance status from API first
      let attendanceStatus = null;
      try {
        attendanceStatus =
          await dashboardHelpers.apiHelpers.getTodayAttendanceStatus();
      } catch (apiError) {}

      // Try to fetch dashboard stats from API
      let apiData = null;
      try {
        const response = await apiService.getDashboardStats();
        apiData = response.data;
      } catch (apiError) {}

      // Generate data from API or show fallback
      const data = apiData
        ? processApiData(apiData, attendanceStatus)
        : generateFallbackData(attendanceStatus);
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

  // Process API data into dashboard format
  const processApiData = (apiData, attendanceStatus = null) => {
    // If we have attendance status from API, use it to enhance the data
    let enhancedStats = apiData.stats || {};
    if (attendanceStatus && userRole === ROLES.INTERN) {
      enhancedStats = {
        ...enhancedStats,
        todayStatus: attendanceStatus.hasSubmitted ? 'Submitted' : 'Pending',
        timeRemaining: attendanceStatus.timeRemaining,
      };
    }

    // Transform API response to match our dashboard data structure
    return {
      stats: enhancedStats,
      charts: {
        timeline: apiData.charts?.timeline || [],
      },
      recentActivity: apiData.recentActivity || [],
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

  // Data loading on component mount and periodic refresh for interns
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
              className={`p-4 rounded-lg border-l-4 ${
                notification.type === 'warning'
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

      {/* Role-based Stats Grid */}
      <div
        className={`grid gap-6 ${
          userRole === ROLES.INTERN
            ? 'grid-cols-1 md:grid-cols-3 lg:grid-cols-3'
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
        }`}
      >
        {userRole === ROLES.INTERN && (
          <>
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
                    ? 'Attendance marked'
                    : 'Click to submit'
                }
              />
            </motion.div>
          </>
        )}

        {userRole === ROLES.TEAM_LEADER && (
          <>
            <StatsCard
              title="Team Size"
              value={dashboardData?.stats?.teamSize?.toString() || '0'}
              icon={FiUsers}
              color="blue"
              delay={0.1}
            />
            <StatsCard
              title="Projects Managed"
              value={dashboardData?.stats?.projectsManaged?.toString() || '0'}
              icon={FiBriefcase}
              color="purple"
              delay={0.2}
            />
            <StatsCard
              title="Team Attendance"
              value={`${dashboardData?.stats?.teamAttendance || 0}%`}
              icon={FiCheckCircle}
              color="green"
              delay={0.3}
            />
            <StatsCard
              title="Pending Reviews"
              value={dashboardData?.stats?.pendingReviews?.toString() || '0'}
              icon={FiAlertCircle}
              color="orange"
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
            <StatsCard
              title="Budget Utilization"
              value={`${dashboardData?.stats?.budgetUtilization || 0}%`}
              icon={FiTrendingUp}
              color="orange"
              delay={0.4}
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
                    className={`p-2 rounded-full ${
                      activity.status === 'completed'
                        ? 'bg-green-100'
                        : activity.status === 'pending'
                          ? 'bg-yellow-100'
                          : 'bg-blue-100'
                    }`}
                  >
                    <FiEdit3
                      className={`w-4 h-4 ${
                        activity.status === 'completed'
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
                    <p className="text-xs text-gray-500 truncate">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(activity.timestamp).toLocaleDateString(
                        'en-US',
                        {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        }
                      )}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(activity.status)}>
                      {activity.status.charAt(0).toUpperCase() +
                        activity.status.slice(1)}
                    </Badge>
                    {activity.user && (
                      <span className="text-xs text-gray-500">
                        by {activity.user.split('@')[0]}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      </motion.div>

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
            <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Project Progress</h3>
                <FiBriefcase className="w-6 h-6" />
              </div>
              <p className="text-3xl font-bold mb-2">78%</p>
              <p className="text-green-100">Average completion rate</p>
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

      {/* Admin Team Attendance Overview */}
      {userRole === ROLES.ADMIN &&
        dashboardData.attendance?.attendanceByUser && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Team Attendance Overview
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/attendance')}
                >
                  View Details <FiArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dashboardData.attendance.attendanceByUser
                  .slice(0, 6)
                  .map((userAttendance, index) => (
                    <motion.div
                      key={userAttendance.email}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 truncate">
                          {userAttendance.user}
                        </h4>
                        <Badge
                          className={`${
                            userAttendance.status === 'excellent'
                              ? 'bg-green-100 text-green-800'
                              : userAttendance.status === 'good'
                                ? 'bg-blue-100 text-blue-800'
                                : userAttendance.status === 'average'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {userAttendance.percentage}%
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {userAttendance.presentDays} of{' '}
                        {userAttendance.totalDays} days
                      </p>
                      <div className="mt-2 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            userAttendance.status === 'excellent'
                              ? 'bg-green-500'
                              : userAttendance.status === 'good'
                                ? 'bg-blue-500'
                                : userAttendance.status === 'average'
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                          }`}
                          style={{ width: `${userAttendance.percentage}%` }}
                        ></div>
                      </div>
                    </motion.div>
                  ))}
              </div>

              {dashboardData.attendance.attendanceByUser.length > 6 && (
                <div className="mt-4 text-center">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/attendance')}
                  >
                    View All {dashboardData.attendance.attendanceByUser.length}{' '}
                    Members
                  </Button>
                </div>
              )}
            </Card>
          </motion.div>
        )}
    </div>
  );
};

export default Dashboard;
