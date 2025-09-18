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
  FiEye,
  FiArrowRight,
  FiTarget,
  FiAward,
  FiActivity,
  FiPieChart,
  FiRefreshCw
} from 'react-icons/fi';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import StatsCard from '../components/StatsCard';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import AttendanceCountdown from '../components/AttendanceCountdown';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { dashboardHelpers } from '../utils/dashboardHelpers';

const Dashboard = () => {
  const { user, getUserRole, ROLES } = useAuth();
  const navigate = useNavigate();
  const userRole = getUserRole();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    stats: {},
    charts: {},
    recentActivity: [],
    notifications: []
  });
  const [selectedChartType, setSelectedChartType] = useState('area');

  // Generate fallback data when API is unavailable
  const generateFallbackData = useCallback((attendanceStatus = null) => {
    // When API is unavailable, show minimal fallback data
    const emptyData = {
      stats: getEmptyStats(userRole, attendanceStatus),
      charts: { timeline: [], distribution: generateDistributionData() },
      recentActivity: [],
      notifications: [],
      attendance: { percentage: 0, presentDays: 0, absentDays: 0, total: 0 }
    };
    
    return emptyData;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole, user]);

  // Get empty stats based on user role when API is unavailable
  const getEmptyStats = (role, attendanceStatus = null) => {
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
          message: 'Time remaining to mark attendance'
        }
      },
      [ROLES.TEAM_LEADER]: {
        teamSize: 0,
        projectsManaged: 0,
        teamAttendance: 0,
        pendingReviews: 0
      },
      [ROLES.PROJECT_MANAGER]: {
        totalTeamMembers: 0,
        activeProjects: 0,
        overallAttendance: 0,
        budgetUtilization: 0
      },
      [ROLES.ADMIN]: {
        totalUsers: 0,
        activeProjects: 0,
        dailyUpdates: 0,
        attendanceRate: 0
      }
    };
    
    return baseStats[role] || baseStats[ROLES.INTERN];
  };

  // Load dashboard data function with API attendance support
  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Try to get today's attendance status from API first
      let attendanceStatus = null;
      try {
        attendanceStatus = await dashboardHelpers.apiHelpers.getTodayAttendanceStatus();
      } catch (apiError) {
      }
      
      // Try to fetch dashboard stats from API
      let apiData = null;
      try {
        const response = await apiService.getDashboardStats();
        apiData = response.data;
      } catch (apiError) {
      }
      
      // Generate data from API or show fallback
      const data = apiData ? processApiData(apiData, attendanceStatus) : generateFallbackData(attendanceStatus);
      setDashboardData(data);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      
      // Show user-friendly error message
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        console.warn('Cannot connect to database. Make sure your backend server is running on http://localhost:5050');
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
        timeRemaining: attendanceStatus.timeRemaining
      };
    }
    
    // Transform API response to match our dashboard data structure
    return {
      stats: enhancedStats,
      charts: {
        timeline: apiData.charts?.timeline || [],
        distribution: apiData.charts?.distribution || generateDistributionData()
      },
      recentActivity: apiData.recentActivity || [],
      notifications: apiData.notifications || [],
      attendance: apiData.attendance || { percentage: 0, presentDays: 0, absentDays: 0, total: 0 },
      attendanceStatus: attendanceStatus
    };
  };


  // Data loading on component mount and periodic refresh for interns
  useEffect(() => {
    loadDashboardData();
    
    // Set up periodic refresh for interns (every 5 minutes)
    if (userRole === ROLES.INTERN) {
      const interval = setInterval(() => {
        loadDashboardData();
      }, 5 * 60 * 1000); // 5 minutes
      
      return () => clearInterval(interval);
    }
  }, [loadDashboardData, userRole]);


  const calculateStats = (role, updates, projects, users, attendance, attendanceStatus = null) => {
    const today = new Date().toISOString().split('T')[0];
    
    switch (role) {
      case ROLES.INTERN:
        const myUpdates = updates.filter(u => u.userEmail === user?.email);
        // Filter projects based on real API structure - check if user is in teamMembers array
        const myProjects = projects.filter(p => 
          p.teamMembers?.some(member => 
            member.user?.email === user?.email || member.user?._id === user?._id
          ) || 
          // Fallback to old structure for backward compatibility
          p.interns?.includes(user?.name || user?.email?.split('@')[0])
        );
        
        // Use API attendance status if available, otherwise fall back to localStorage check
        let todayStatus, timeRemaining;
        if (attendanceStatus) {
          todayStatus = attendanceStatus.hasSubmitted ? 'Submitted' : 'Pending';
          timeRemaining = attendanceStatus.timeRemaining;
        } else {
          const todayUpdate = myUpdates.find(u => u.date === today);
          todayStatus = todayUpdate ? 'Submitted' : 'Pending';
          timeRemaining = todayUpdate ? null : getTimeRemainingToday();
        }
        
        return {
          streak: calculateStreak(myUpdates),
          projectsActive: myProjects.filter(p => p.status === 'active').length,
          attendanceRate: attendance?.percentage || 0,
          todayStatus: todayStatus,
          timeRemaining: timeRemaining
        };
        
      case ROLES.TEAM_LEADER:
        // Filter team members based on real API structure
        const teamMembers = users.filter(u => {
          // Check if current user is assigned as team leader to this user
          return u.teamLeader === user?.name || 
                 u.teamLeader === user?.email ||
                 u.assignedTeamLeader?._id === user?._id ||
                 u.assignedTeamLeader?.email === user?.email;
        });
        
        // Find projects where current user is team leader
        const managedProjects = projects.filter(p => 
          p.teamMembers?.some(member => 
            member.user?.email === user?.email && 
            (member.role === 'team_leader' || member.role === 'tl')
          ) ||
          // Fallback to old structure
          p.teamLeaders?.includes(user?.name || user?.email?.split('@')[0])
        );
        
        const teamUpdates = updates.filter(u => 
          teamMembers.some(member => member.email === u.userEmail)
        );
        
        return {
          teamSize: teamMembers.length,
          projectsManaged: managedProjects.length,
          teamAttendance: teamMembers.length > 0 ? Math.round((teamUpdates.length / (teamMembers.length * 7)) * 100) : 0,
          pendingReviews: teamUpdates.filter(u => u.status === 'pending').length
        };
        
      case ROLES.PROJECT_MANAGER:
        // Filter projects based on real API structure - check if user is project manager
        const pmManagedProjects = projects.filter(p => {
          // Check if current PM user manages this project
          const isManager = 
                 // Check if projectManager matches current user by email (most reliable)
                 p.projectManager?.email === user?.email ||
                 // For demo: special handling for pm@example.com
                 (user?.email === 'pm@example.com' && 
                  (p.projectManager?.email === 'pm@example.com' || 
                   p.projectManager?.email === 'john.pm@example.com' ||
                   p.projectManager?.name === 'pm' ||
                   p.lead === 'pm')) ||
                 // Check createdBy field
                 p.createdBy?.email === user?.email ||
                 // Legacy: Check lead field matching
                 p.lead === user?.name || 
                 p.lead === user?.email?.split('@')[0];
          
          return isManager;
        });
        
        // Get unique team members from managed projects
        const teamMemberSet = new Set();
        let teamMemberCount = 0;
        
        pmManagedProjects.forEach(project => {
          // Count teamMembers in new structure
          if (project.teamMembers && Array.isArray(project.teamMembers)) {
            project.teamMembers.forEach(member => {
              // Don't count the PM themselves
              if (member.user?.email !== user?.email && 
                  (member.role === 'intern' || member.role === 'team_member' || member.role === 'team_leader')) {
                teamMemberSet.add(member.user?.email || member.user?._id);
                teamMemberCount++;
              }
            });
          }
          
          // Legacy: Count interns array for old data
          if (project.interns && Array.isArray(project.interns)) {
            teamMemberCount += project.interns.length;
          }
        });
        
        // If no project-specific team members found, count users by role as fallback
        if (teamMemberCount === 0) {
          teamMemberCount = users.filter(u => 
            u.role === 'intern' || u.role === 'team_member' || u.role === 'team_leader'
          ).length;
        }
        
        // Calculate attendance for managed team members
        const teamMemberEmails = Array.from(teamMemberSet);
        const pmTeamUpdates = updates.filter(u => teamMemberEmails.includes(u.userEmail));
        const attendanceRate = teamMemberEmails.length > 0 
          ? Math.round((pmTeamUpdates.length / (teamMemberEmails.length * 7)) * 100)
          : 0;
        
        return {
          totalTeamMembers: teamMemberCount,
          activeProjects: pmManagedProjects.filter(p => p.status === 'active').length,
          overallAttendance: attendanceRate,
          budgetUtilization: Math.round(Math.random() * 30 + 70) // TODO: Replace with real budget data when available
        };
        
      case ROLES.ADMIN:
      default:
        return {
          totalUsers: users.length,
          activeProjects: projects.filter(p => p.status === 'active').length,
          dailyUpdates: updates.length,
          attendanceRate: users.length > 0 ? Math.round((updates.length / (users.length * 7)) * 100) : 0
        };
    }
  };

  const calculateAttendanceData = (updates) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const workingDaysThisMonth = getWorkingDaysInMonth(currentYear, currentMonth);
    
    const currentMonthUpdates = updates.filter(update => {
      const updateDate = new Date(update.date);
      return updateDate.getMonth() === currentMonth && updateDate.getFullYear() === currentYear;
    });
    
    const presentDays = currentMonthUpdates.length;
    const absentDays = Math.max(0, getPastWorkingDaysThisMonth() - presentDays);
    const percentage = workingDaysThisMonth > 0 ? Math.round((presentDays / getPastWorkingDaysThisMonth()) * 100) : 0;
    
    return { presentDays, absentDays, percentage, total: workingDaysThisMonth };
  };

  const generateChartData = (updates, projects) => {
    const now = new Date();
    let data = [];
    
    // Always show last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayUpdates = updates.filter(u => u.date === dateStr);
      
      // Add some demo data if no real updates exist
      let updateCount = dayUpdates.length;
      if (updateCount === 0 && i >= 2) {
        updateCount = Math.floor(Math.random() * 3) + 1; // 1-3 updates for demo
      }
      
      data.push({
        name: date.toLocaleDateString('en-US', { weekday: 'short' }),
        updates: updateCount,
        projects: projects.filter(p => p.startDate === dateStr).length || Math.floor(Math.random() * 2),
        date: dateStr
      });
    }
    
    // Ensure we always have some data
    if (data.length === 0 || data.every(d => d.updates === 0)) {
      data = [
        { name: 'Mon', updates: 5, projects: 2 },
        { name: 'Tue', updates: 8, projects: 1 },
        { name: 'Wed', updates: 6, projects: 3 },
        { name: 'Thu', updates: 12, projects: 2 },
        { name: 'Fri', updates: 9, projects: 1 },
        { name: 'Sat', updates: 0, projects: 0 },
        { name: 'Sun', updates: 0, projects: 0 }
      ];
    }
    
    return { timeline: data, distribution: generateDistributionData() };
  };

  const generateDistributionData = () => {
    return [
      { name: 'Completed', value: 65, color: '#10b981' },
      { name: 'In Progress', value: 25, color: '#3b82f6' },
      { name: 'Pending', value: 10, color: '#f59e0b' }
    ];
  };

  const getRecentActivity = (updates, projects) => {
    const recent = [...updates]
      .sort((a, b) => new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date))
      .slice(0, 5)
      .map(update => ({
        id: update.id || Math.random().toString(36).substr(2, 9),
        type: 'update',
        title: `Daily Update Submitted`,
        description: `${update.workDone?.substring(0, 50)}...`,
        user: update.userEmail,
        timestamp: update.timestamp || update.date,
        status: 'completed'
      }));
      
    return recent;
  };

  const generateNotifications = (role, updates, projects) => {
    const notifications = [];
    const today = new Date().toISOString().split('T')[0];
    
    if (role === ROLES.INTERN) {
      const todayUpdate = updates.find(u => u.date === today && u.userEmail === user?.email);
      if (!todayUpdate) {
        notifications.push({
          id: 'update-reminder',
          type: 'warning',
          title: 'Daily Update Pending',
          message: 'Remember to submit your daily update for today',
          action: () => navigate('/daily-updates')
        });
      }
    }
    
    if (role === ROLES.TEAM_LEADER) {
      const pendingReviews = updates.filter(u => u.status === 'pending').length;
      if (pendingReviews > 0) {
        notifications.push({
          id: 'pending-reviews',
          type: 'info',
          title: 'Reviews Pending',
          message: `${pendingReviews} team updates awaiting your review`,
          action: () => navigate('/daily-updates')
        });
      }
    }
    
    return notifications;
  };

  // Helper functions
  const getTimeRemainingToday = () => {
    const now = new Date();
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999); // End of day
    
    const diffInMilliseconds = endOfDay - now;
    const diffInHours = Math.floor(diffInMilliseconds / (1000 * 60 * 60));
    const diffInMinutes = Math.floor((diffInMilliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffInHours > 0) {
      return `${diffInHours}h ${diffInMinutes}m remaining`;
    } else if (diffInMinutes > 0) {
      return `${diffInMinutes}m remaining`;
    } else {
      return 'Less than 1m remaining';
    }
  };

  const calculateStreak = (updates) => {
    if (updates.length === 0) return 0;
    
    const sortedUpdates = updates
      .map(update => new Date(update.date))
      .sort((a, b) => b - a);
    
    let streak = 0;
    let currentDate = new Date();
    
    for (const updateDate of sortedUpdates) {
      const daysDifference = Math.floor((currentDate - updateDate) / (1000 * 60 * 60 * 24));
      
      if (daysDifference <= 1 && currentDate.getDay() !== 0) { // Only Sunday is non-working day
        streak++;
        currentDate = new Date(updateDate);
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  };

  const getWorkingDaysInMonth = (year, month) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let workingDays = 0;
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 0) { // Only Sunday is non-working day
        workingDays++;
      }
    }
    
    return workingDays;
  };

  const getPastWorkingDaysThisMonth = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const today = now.getDate();
    
    let pastWorkingDays = 0;
    
    for (let day = 1; day <= today; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 0 && date <= now) { // Only Sunday is non-working day
        pastWorkingDays++;
      }
    }
    
    return pastWorkingDays;
  };

  // Team management functions for admin
  const calculateTeamAttendanceOverview = (dailyUpdates, users) => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const workingDaysThisMonth = getWorkingDaysInMonth(currentYear, currentMonth);
    const pastWorkingDays = getPastWorkingDaysThisMonth();

    const attendanceByUser = users.map(user => {
      const userUpdates = dailyUpdates.filter(update => 
        update.userEmail === user.email &&
        new Date(update.date).getMonth() === currentMonth &&
        new Date(update.date).getFullYear() === currentYear
      );
      
      const presentDays = userUpdates.length;
      const percentage = pastWorkingDays > 0 ? Math.round((presentDays / pastWorkingDays) * 100) : 0;
      
      return {
        user: user.name || user.email.split('@')[0],
        email: user.email,
        presentDays,
        totalDays: pastWorkingDays,
        percentage,
        status: percentage >= 90 ? 'excellent' : percentage >= 75 ? 'good' : percentage >= 60 ? 'average' : 'poor'
      };
    });

    const averageAttendance = attendanceByUser.reduce((acc, user) => acc + user.percentage, 0) / users.length;
    
    return {
      averageAttendance: Math.round(averageAttendance || 0),
      totalUsers: users.length,
      presentToday: dailyUpdates.filter(update => update.date === today.toISOString().split('T')[0]).length,
      attendanceByUser,
      workingDaysThisMonth,
      pastWorkingDays
    };
  };

  const calculateTeamOverview = (users, dailyUpdates, projects) => {
    const today = new Date().toISOString().split('T')[0];
    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);
    
    return {
      totalUsers: users.length,
      activeUsers: users.filter(user => {
        const recentUpdate = dailyUpdates.find(update => 
          update.userEmail === user.email && 
          new Date(update.date) >= thisWeek
        );
        return !!recentUpdate;
      }).length,
      todaySubmissions: dailyUpdates.filter(update => update.date === today).length,
      pendingReviews: dailyUpdates.filter(update => update.status === 'pending' || !update.status).length,
      activeProjects: projects.filter(project => project.status === 'active').length,
      completedProjects: projects.filter(project => project.status === 'completed').length,
      recentActivity: dailyUpdates
        .sort((a, b) => new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date))
        .slice(0, 10)
        .map(update => ({
          id: update.id,
          user: update.userEmail.split('@')[0],
          type: 'Daily Update',
          timestamp: update.timestamp || update.date,
          status: update.status || 'submitted'
        }))
    };
  };


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
            <FiRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
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
                notification.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                notification.type === 'info' ? 'bg-blue-50 border-blue-400' :
                'bg-green-50 border-green-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{notification.title}</h4>
                  <p className="text-sm text-gray-600">{notification.message}</p>
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
      <div className={`grid gap-6 ${
        userRole === ROLES.INTERN 
          ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
          : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
      }`}>
        {userRole === ROLES.INTERN && (
          <>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="h-full"
            >
              <StatsCard
                title="Current Streak"
                value={dashboardData?.stats?.streak?.toString() || '0'}
                icon={FiTarget}
                color="green"
                onClick={() => handleQuickAction('view-attendance')}
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
              transition={{ delay: 0.3 }}
              className="h-full"
            >
              <StatsCard
                title="Attendance Rate"
                value={`${dashboardData?.stats?.attendanceRate || 0}%`}
                icon={FiCheckCircle}
                color={(dashboardData?.stats?.attendanceRate || 0) >= 90 ? 'green' : 'orange'}
                onClick={() => handleQuickAction('view-attendance')}
                className="h-full"
              />
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="h-full col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-2"
            >
              <AttendanceCountdown
                attendanceData={dashboardData?.stats}
                onSubmitUpdate={() => handleQuickAction('submit-update')}
                className="h-full transform hover:scale-105 transition-transform duration-300 shadow-lg"
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




      {/* Interactive Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Timeline Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {userRole === ROLES.INTERN ? 'Your Activity' : 
                 userRole === ROLES.TEAM_LEADER ? 'Team Activity' : 
                 'Platform Activity'}
              </h3>
              <div className="flex items-center space-x-2">
                <Button
                  variant={selectedChartType === 'area' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedChartType('area')}
                >
                  <FiActivity className="w-3 h-3" />
                </Button>
                <Button
                  variant={selectedChartType === 'line' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedChartType('line')}
                >
                  <FiTrendingUp className="w-3 h-3" />
                </Button>
              </div>
            </div>
            
            <ResponsiveContainer width="100%" height={300}>
              {selectedChartType === 'area' ? (
                <AreaChart data={dashboardData.charts?.timeline || []}>
                  <defs>
                    <linearGradient id="colorUpdates" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12, fill: '#6b7280' }} 
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#6b7280' }} 
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '8px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      color: '#374151'
                    }}
                    labelStyle={{ color: '#111827', fontWeight: '600' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="updates" 
                    stroke="#3b82f6" 
                    fillOpacity={1} 
                    fill="url(#colorUpdates)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              ) : (
                <LineChart data={dashboardData.charts?.timeline || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12, fill: '#6b7280' }} 
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#6b7280' }} 
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '8px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      color: '#374151'
                    }}
                    labelStyle={{ color: '#111827', fontWeight: '600' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="updates" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* Status Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Status Distribution</h3>
              <FiPieChart className="w-5 h-5 text-gray-400" />
            </div>
            
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dashboardData.charts?.distribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                  labelStyle={{ fill: '#374151', fontSize: '12px', fontWeight: '600' }}
                >
                  {dashboardData.charts?.distribution?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    color: '#374151'
                  }}
                  labelStyle={{ color: '#111827', fontWeight: '600' }}
                />
                <Legend 
                  wrapperStyle={{ 
                    paddingTop: '20px',
                    fontSize: '14px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity Feed */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
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
              <p className="text-sm text-gray-400">Activity will appear here as you submit updates</p>
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
                  <div className={`p-2 rounded-full ${
                    activity.status === 'completed' ? 'bg-green-100' :
                    activity.status === 'pending' ? 'bg-yellow-100' :
                    'bg-blue-100'
                  }`}>
                    <FiEdit3 className={`w-4 h-4 ${
                      activity.status === 'completed' ? 'text-green-600' :
                      activity.status === 'pending' ? 'text-yellow-600' :
                      'text-blue-600'
                    }`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.title}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(activity.timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(activity.status)}>
                      {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
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
                {Math.round(((dashboardData.stats.dailyUpdates || 0) / (dashboardData.stats.totalUsers || 1)) * 100)}%
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
              <p className="text-3xl font-bold mb-2">{dashboardData.stats.attendanceRate || 0}%</p>
              <p className="text-purple-100">Overall participation rate</p>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Admin Team Attendance Overview */}
      {userRole === ROLES.ADMIN && dashboardData.attendance?.attendanceByUser && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Team Attendance Overview</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/attendance')}
              >
                View Details <FiArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboardData.attendance.attendanceByUser.slice(0, 6).map((userAttendance, index) => (
                <motion.div
                  key={userAttendance.email}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 truncate">{userAttendance.user}</h4>
                    <Badge className={`${
                      userAttendance.status === 'excellent' ? 'bg-green-100 text-green-800' :
                      userAttendance.status === 'good' ? 'bg-blue-100 text-blue-800' :
                      userAttendance.status === 'average' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {userAttendance.percentage}%
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    {userAttendance.presentDays} of {userAttendance.totalDays} days
                  </p>
                  <div className="mt-2 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        userAttendance.status === 'excellent' ? 'bg-green-500' :
                        userAttendance.status === 'good' ? 'bg-blue-500' :
                        userAttendance.status === 'average' ? 'bg-yellow-500' :
                        'bg-red-500'
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
                  View All {dashboardData.attendance.attendanceByUser.length} Members
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
