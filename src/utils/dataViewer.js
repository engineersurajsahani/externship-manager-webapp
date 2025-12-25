// Data Viewer Utility - View MongoDB data via API in browser console or export to file
import { apiService } from '../services/api';

export const DataViewer = {
  // View all daily updates in console
  viewDailyUpdates: async () => {
    try {
      const response = await apiService.getAllDailyUpdates();
      const updates = response.data.updates || [];
  // debug output removed
      return updates;
    } catch (error) {
      console.error('Error fetching daily updates:', error);
      return [];
    }
  },

  // View specific user's updates
  viewUserUpdates: async (userEmail) => {
    try {
      const response = await apiService.getMyDailyUpdates();
      const userUpdates = response.data.updates || [];
  // debug output removed
      return userUpdates;
    } catch (error) {
      console.error('Error fetching user updates:', error);
      return [];
    }
  },

  // View all users
  viewUsers: async () => {
    try {
      const response = await apiService.getAllUsers();
      const users = response.data.users || [];
  // debug output removed
      return users;
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  },

  // View all projects
  viewProjects: async () => {
    try {
      const response = await apiService.getAllProjects();
      const projects = response.data.projects || [];
  // debug output removed
      return projects;
    } catch (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
  },

  // Export data as JSON file
  exportToJSON: async () => {
    try {
      const [updatesResponse, usersResponse, projectsResponse] =
        await Promise.all([
          apiService.getAllDailyUpdates(),
          apiService.getAllUsers(),
          apiService.getAllProjects(),
        ]);

      const data = {
        dailyUpdates: updatesResponse.data.updates || [],
        users: usersResponse.data.users || [],
        projects: projectsResponse.data.projects || [],
        exportDate: new Date().toISOString(),
      };

      const dataStr = JSON.stringify(data, null, 2);
      const dataUri =
        'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

      const exportFileDefaultName = `externship_data_${new Date().toISOString().split('T')[0]}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();

  // debug output removed
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  },

  // Get today's submissions
  getTodaysSubmissions: async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await apiService.getAllDailyUpdates();
      const updates = response.data.updates || [];
      const todayUpdates = updates.filter((update) => {
        const updateDate = new Date(update.date || update.createdAt)
          .toISOString()
          .split('T')[0];
        return updateDate === today;
      });

  // debug output removed
      return todayUpdates;
    } catch (error) {
      console.error('Error fetching today submissions:', error);
      return [];
    }
  },

  // Clear all data (use with caution!) - Note: This should be implemented on the backend
  clearAllData: () => {
    console.warn(
      'clearAllData is not implemented for MongoDB. This operation should be performed on the backend.'
    );
    // debug output removed
  },

  // Get attendance stats for a user
  getUserAttendanceStats: async (userEmail) => {
    try {
      const response = await apiService.getMyAttendance();
      const attendance = response.data.attendance || [];

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const monthlyAttendance = attendance.filter((record) => {
        const recordDate = new Date(record.date);
        return (
          recordDate.getMonth() === currentMonth &&
          recordDate.getFullYear() === currentYear
        );
      });

      const stats = {
        totalRecords: attendance.length,
        thisMonthRecords: monthlyAttendance.length,
        firstRecord: attendance.length > 0 ? attendance[0].date : null,
        lastRecord:
          attendance.length > 0 ? attendance[attendance.length - 1].date : null,
      };

  // debug output removed
      return stats;
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
      return {};
    }
  },

  // Quick summary
  summary: async () => {
    try {
      const response = await apiService.getDashboardStats();
      const stats = response.data.stats || {};

      const summary = {
        totalUpdates: stats.dailyUpdates || 0,
        totalUsers: stats.totalUsers || 0,
        totalProjects: stats.activeProjects || 0,
        attendanceRate: stats.attendanceRate || 0,
        dataSource: 'MongoDB',
      };

  // debug output removed
      return summary;
    } catch (error) {
      console.error('Error fetching summary:', error);
      return { error: error.message };
    }
  },
};

// Make it available globally in browser console
if (typeof window !== 'undefined') {
  window.DataViewer = DataViewer;
}

export default DataViewer;
