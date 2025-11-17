// Utility to notify components of data changes in MongoDB API architecture
export const notifyDataChange = (
  dataType,
  operation = 'update',
  data = null
) => {
  // Dispatch custom event for same-tab notifications
  const event = new CustomEvent('dataChanged', {
    detail: {
      type: dataType, // 'dailyUpdates', 'projects', 'users', 'attendance'
      operation: operation, // 'create', 'update', 'delete', 'refresh'
      data: data,
      timestamp: new Date().toISOString(),
    },
  });

  window.dispatchEvent(event);
  // Debug log removed
};

// API-based data change notifier for MongoDB architecture
// Components should listen for these events to refresh their data from the API
export const apiDataNotifier = {
  // Notify when daily updates data changes
  notifyDailyUpdatesChanged: (operation = 'refresh', data = null) => {
    notifyDataChange('dailyUpdates', operation, data);
  },

  // Notify when projects data changes
  notifyProjectsChanged: (operation = 'refresh', data = null) => {
    notifyDataChange('projects', operation, data);
  },

  // Notify when users data changes
  notifyUsersChanged: (operation = 'refresh', data = null) => {
    notifyDataChange('users', operation, data);
  },

  // Notify when attendance data changes
  notifyAttendanceChanged: (operation = 'refresh', data = null) => {
    notifyDataChange('attendance', operation, data);
  },

  // Notify when dashboard should refresh all data
  notifyDashboardRefresh: () => {
    notifyDataChange('dashboard', 'refresh', null);
  },

  // Generic notification for any data type
  notify: (dataType, operation, data = null) => {
    notifyDataChange(dataType, operation, data);
  },
};

// Deprecated: The following localStorage-based methods are no longer used
// They are kept for backward compatibility but will be removed in future versions
const deprecatedNotice = () => {
  console.warn(
    'localStorage-based data operations are deprecated. Use API-based data fetching instead.'
  );
};

export const notifyingLocalStorage = {
  setItem: () => deprecatedNotice(),
  getItem: () => deprecatedNotice(),
  removeItem: () => deprecatedNotice(),
  updateDailyUpdates: () => deprecatedNotice(),
  updateProjects: () => deprecatedNotice(),
  updateUsers: () => deprecatedNotice(),
  addDailyUpdate: () => deprecatedNotice(),
  addProject: () => deprecatedNotice(),
  addUser: () => deprecatedNotice(),
};

export default notifyDataChange;
