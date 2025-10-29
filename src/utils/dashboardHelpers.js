import { apiService } from '../services/api';

// Dashboard utility functions
export const dashboardHelpers = {
  // Generate sample data for demonstration
  generateSampleData: (userRole, userEmail) => {
    const sampleProjects = [
      {
        id: 1,
        name: 'E-commerce Platform',
        status: 'active',
        startDate: '2024-01-10',
        interns: ['John Doe'],
      },
      {
        id: 2,
        name: 'Mobile App Development',
        status: 'active',
        startDate: '2024-01-15',
        interns: ['Jane Smith'],
      },
      {
        id: 3,
        name: 'Data Analytics Dashboard',
        status: 'completed',
        startDate: '2023-12-01',
        interns: ['Bob Wilson'],
      },
    ];

    const sampleUsers = [
      {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'intern',
        teamLeader: 'Jane Manager',
      },
      {
        id: 2,
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'intern',
        teamLeader: 'Jane Manager',
      },
      {
        id: 3,
        name: 'Bob Wilson',
        email: 'bob@example.com',
        role: 'intern',
        teamLeader: 'Jane Manager',
      },
      {
        id: 4,
        name: 'Alice Johnson',
        email: 'alice@example.com',
        role: 'tl',
        title: 'Team Leader',
      },
      {
        id: 5,
        name: 'Mike Davis',
        email: 'mike@example.com',
        role: 'pm',
        title: 'Project Manager',
      },
    ];

    const sampleDailyUpdates = [
      {
        id: 1,
        userEmail: userEmail,
        date: new Date().toISOString().split('T')[0],
        workDone: 'Completed user authentication module',
        challenges: 'Had issues with JWT token validation',
        planForTomorrow: 'Work on dashboard components',
        timestamp: new Date().toISOString(),
      },
      {
        id: 2,
        userEmail: userEmail,
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
        workDone: 'Implemented login functionality',
        challenges: 'Styling responsive design was challenging',
        planForTomorrow: 'Continue with authentication',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
      },
    ];

    return { sampleProjects, sampleUsers, sampleDailyUpdates };
  },

  // Calculate real-time stats based on stored data
  calculateRealTimeStats: (userRole, userEmail, updates, projects, users) => {
    const today = new Date().toISOString().split('T')[0];

    switch (userRole) {
      case 'intern':
        const myUpdates = updates.filter((u) => u.userEmail === userEmail);
        const myProjects = projects.filter((p) =>
          p.interns?.includes(userEmail?.split('@')[0])
        );
        return {
          streak: dashboardHelpers.calculateStreak(myUpdates),
          projectsActive: myProjects.filter((p) => p.status === 'active')
            .length,
          attendanceRate: dashboardHelpers.calculateAttendanceRate(myUpdates),
          todayStatus: myUpdates.some((u) => u.date === today)
            ? 'Submitted'
            : 'Pending',
        };

      case 'tl':
        const teamMembers = users.filter(
          (u) => u.teamLeader === userEmail?.split('@')[0]
        );
        const teamUpdates = updates.filter((u) =>
          teamMembers.some((member) => member.email === u.userEmail)
        );
        return {
          teamSize: teamMembers.length,
          projectsManaged: projects.filter((p) =>
            p.teamLeaders?.includes(userEmail?.split('@')[0])
          ).length,
          teamAttendance: Math.round(
            (teamUpdates.length / Math.max(teamMembers.length * 7, 1)) * 100
          ),
          pendingReviews: teamUpdates.filter((u) => u.status === 'pending')
            .length,
        };

      case 'pm':
        const managedProjects = projects.filter(
          (p) => p.lead === userEmail?.split('@')[0]
        );
        return {
          totalTeamMembers: users.filter((u) => u.role === 'intern').length,
          activeProjects: managedProjects.filter((p) => p.status === 'active')
            .length,
          overallAttendance: Math.round(
            (updates.length / Math.max(users.length * 7, 1)) * 100
          ),
          budgetUtilization: Math.round(Math.random() * 30 + 70), // Simulated
        };

      case 'admin':
      default:
        return {
          totalUsers: users.length || 45,
          activeProjects:
            projects.filter((p) => p.status === 'active').length || 12,
          dailyUpdates: updates.length || 89,
          attendanceRate:
            Math.round(
              (updates.length / Math.max(users.length * 7, 1)) * 100
            ) || 87,
        };
    }
  },

  // Generate chart data for last 7 days
  generateChartData: (updates, projects) => {
    const now = new Date();
    let data = [];

    // Always show last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayUpdates = updates.filter((u) => u.date === dateStr);

      data.push({
        name: date.toLocaleDateString('en-US', { weekday: 'short' }),
        updates: dayUpdates.length,
        projects: projects.filter((p) => p.startDate === dateStr).length,
        date: dateStr,
      });
    }

    return {
      timeline: data,
      distribution: [
        { name: 'Completed', value: 65, color: '#10b981' },
        { name: 'In Progress', value: 25, color: '#3b82f6' },
        { name: 'Pending', value: 10, color: '#f59e0b' },
      ],
    };
  },

  // Calculate attendance rate
  calculateAttendanceRate: (updates) => {
    if (updates.length === 0) return 0;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const currentMonthUpdates = updates.filter((update) => {
      const updateDate = new Date(update.date);
      return (
        updateDate.getMonth() === currentMonth &&
        updateDate.getFullYear() === currentYear
      );
    });

    const pastWorkingDays = dashboardHelpers.getPastWorkingDaysThisMonth();
    return pastWorkingDays > 0
      ? Math.round((currentMonthUpdates.length / pastWorkingDays) * 100)
      : 0;
  },

  // Calculate consecutive streak
  calculateStreak: (updates) => {
    if (updates.length === 0) return 0;

    const sortedUpdates = updates
      .map((update) => new Date(update.date))
      .sort((a, b) => b - a);

    let streak = 0;
    let currentDate = new Date();

    for (const updateDate of sortedUpdates) {
      const daysDifference = Math.floor(
        (currentDate - updateDate) / (1000 * 60 * 60 * 24)
      );

      if (daysDifference <= 1 && currentDate.getDay() !== 0) {
        // Only Sunday is non-working day
        streak++;
        currentDate = new Date(updateDate);
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  },

  // Get working days in month
  getWorkingDaysInMonth: (year, month) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let workingDays = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 0) {
        // Only Sunday is non-working day
        workingDays++;
      }
    }

    return workingDays;
  },

  // Get past working days this month
  getPastWorkingDaysThisMonth: () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const today = now.getDate();

    let pastWorkingDays = 0;

    for (let day = 1; day <= today; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 0 && date <= now) {
        // Only Sunday is non-working day
        pastWorkingDays++;
      }
    }

    return pastWorkingDays;
  },

  // Get current week dates
  getThisWeekDates: () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  },

  // Generate recent activity
  getRecentActivity: (updates, projects) => {
    const recent = [...updates]
      .sort(
        (a, b) =>
          new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date)
      )
      .slice(0, 5)
      .map((update) => ({
        id: update.id || Math.random().toString(36).substr(2, 9),
        type: 'update',
        title: 'Daily Update Submitted',
        description:
          update.workDone?.substring(0, 50) + '...' || 'Update submitted',
        user: update.userEmail,
        timestamp: update.timestamp || update.date,
        status: 'completed',
      }));

    return recent;
  },

  // Generate smart notifications
  generateNotifications: (userRole, userEmail, updates, projects) => {
    const notifications = [];
    const today = new Date().toISOString().split('T')[0];

    if (userRole === 'intern') {
      const todayUpdate = updates.find(
        (u) => u.date === today && u.userEmail === userEmail
      );
      if (!todayUpdate) {
        notifications.push({
          id: 'update-reminder',
          type: 'warning',
          title: 'Daily Update Pending',
          message:
            'Keep your streak going! Submit your daily update for today.',
          action: 'submit-update',
        });
      }

      // Check streak warning
      const streak = dashboardHelpers.calculateStreak(
        updates.filter((u) => u.userEmail === userEmail)
      );
      if (streak >= 5) {
        notifications.push({
          id: 'streak-celebration',
          type: 'success',
          title: `🔥 ${streak} Day Streak!`,
          message: 'Amazing consistency! Keep up the excellent work.',
          action: null,
        });
      }
    }

    if (userRole === 'tl') {
      const pendingReviews = updates.filter(
        (u) => u.status === 'pending'
      ).length;
      if (pendingReviews > 0) {
        notifications.push({
          id: 'pending-reviews',
          type: 'info',
          title: 'Team Updates Need Review',
          message: `${pendingReviews} team member updates are awaiting your review.`,
          action: 'review-updates',
        });
      }
    }

    if (userRole === 'admin' || userRole === 'pm') {
      const recentSubmissions = updates.filter((u) => u.date === today).length;
      const totalExpected = 20; // Example expected submissions

      if (recentSubmissions < totalExpected * 0.7) {
        notifications.push({
          id: 'low-submissions',
          type: 'warning',
          title: 'Low Submission Rate Today',
          message: `Only ${recentSubmissions}/${totalExpected} daily updates submitted so far.`,
          action: 'view-analytics',
        });
      }
    }

    return notifications;
  },

  // Format time helpers
  formatters: {
    time: (timestamp) => {
      if (!timestamp) return 'N/A';
      return new Date(timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    },

    date: (dateString) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    },

    relativeTime: (timestamp) => {
      const now = new Date();
      const time = new Date(timestamp);
      const diffInHours = (now - time) / (1000 * 60 * 60);

      if (diffInHours < 1) return 'Just now';
      if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
      if (diffInHours < 48) return 'Yesterday';
      return Math.floor(diffInHours / 24) + 'd ago';
    },
  },

  // API-based helper functions
  apiHelpers: {
    // Check today's attendance status using API
    getTodayAttendanceStatus: async () => {
      try {
        const response = await apiService.getTodayUpdate();
        if (response.data.success && response.data.hasSubmitted) {
          return {
            status: 'present',
            hasSubmitted: true,
            update: response.data.update,
            submitTime: response.data.update.date,
          };
        } else {
          return {
            status: 'pending',
            hasSubmitted: false,
            timeRemaining: dashboardHelpers.getTimeRemainingToday(),
          };
        }
      } catch (error) {
        console.error('Error checking attendance status:', error);
        return {
          status: 'pending',
          hasSubmitted: false,
          timeRemaining: dashboardHelpers.getTimeRemainingToday(),
          error: error.message,
        };
      }
    },

    // Get attendance data from API
    getAttendanceData: async (params = {}) => {
      try {
        const response = await apiService.getMyAttendance(params);
        return response.data;
      } catch (error) {
        console.error('Error fetching attendance data:', error);
        return { attendance: [], error: error.message };
      }
    },

    // Get real-time stats from API
    getRealTimeStats: async (userRole) => {
      try {
        const response = await apiService.getDashboardStats();
        return response.data.stats || {};
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        // Return default stats structure instead of localStorage fallback
        return {
          totalUsers: 0,
          activeProjects: 0,
          dailyUpdates: 0,
          attendanceRate: 0,
        };
      }
    },
  },

  // Attendance deadline configuration (matching backend)
  ATTENDANCE_DEADLINE_HOUR: 0, // 12:00 AM (midnight)
  ATTENDANCE_DEADLINE_MINUTE: 0,

  // Time remaining helper (enhanced for midnight deadline)
  getTimeRemainingToday: () => {
    const now = new Date();
    const deadline = new Date();

    // Set deadline to next midnight (end of today)
    deadline.setDate(deadline.getDate() + 1);
    deadline.setHours(
      dashboardHelpers.ATTENDANCE_DEADLINE_HOUR,
      dashboardHelpers.ATTENDANCE_DEADLINE_MINUTE,
      0,
      0
    );

    const timeDiff = deadline - now;
    if (timeDiff <= 0) return '0h 0m';

    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m remaining`;
  },

  // Check if attendance deadline has passed (for midnight deadline, this rarely applies during the day)
  hasAttendanceDeadlinePassed: () => {
    // For midnight deadline, the deadline doesn't pass during the day
    // This function is kept for compatibility but returns false
    return false;
  },

  // Get time remaining in milliseconds for real-time countdown
  getTimeRemainingMs: () => {
    const now = new Date();
    const deadline = new Date();

    // Set deadline to next midnight (end of today)
    deadline.setDate(deadline.getDate() + 1);
    deadline.setHours(
      dashboardHelpers.ATTENDANCE_DEADLINE_HOUR,
      dashboardHelpers.ATTENDANCE_DEADLINE_MINUTE,
      0,
      0
    );

    return deadline - now;
  },
};

export default dashboardHelpers;
