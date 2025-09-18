import axios from 'axios';

// API Base URL - adjust this to match your backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5050/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API methods
export const apiService = {
  // Authentication
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  
  // Students (Users with intern role)
  getStudents: () => api.get('/users/role/intern'),
  getStudent: (id) => api.get(`/users/${id}`),
  createStudent: (studentData) => api.post('/users', {...studentData, role: 'intern'}),
  updateStudent: (id, studentData) => api.put(`/users/${id}`, studentData),
  deleteStudent: (id) => api.delete(`/users/${id}`),
  
  // Daily Updates
  submitDailyUpdate: (updateData) => {
    const formData = new FormData();
    formData.append('workDone', updateData.workDone);
    formData.append('challenges', updateData.challenges || '');
    formData.append('planForTomorrow', updateData.planTomorrow);
    formData.append('hoursWorked', updateData.hoursWorked || 8);
    formData.append('project', updateData.project || '');
    formData.append('team', updateData.team || '');
    formData.append('mood', updateData.mood || 'neutral');
    if (updateData.tasksCompleted) {
      formData.append('tasksCompleted', Array.isArray(updateData.tasksCompleted) 
        ? updateData.tasksCompleted.join(',') 
        : updateData.tasksCompleted);
    }
    // Handle file attachments if present
    if (updateData.attachments && updateData.attachments.length > 0) {
      updateData.attachments.forEach((file, index) => {
        formData.append('attachments', file);
      });
    }
    return api.post('/updates', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getTodayUpdate: () => api.get('/updates/today'),
  getMyUpdates: (params = {}) => api.get('/updates/my', { params }),
  getTeamUpdates: (params = {}) => api.get('/updates/team', { params }),
  getAllUpdates: (params = {}) => api.get('/updates/all', { params }),
  getUpdate: (id) => api.get(`/updates/${id}`),
  reviewUpdate: (id, reviewData) => api.put(`/updates/${id}/review`, reviewData),
  
  // Attendance
  getAttendance: (params = {}) => api.get('/attendance', { params }),
  getMyAttendance: (params = {}) => api.get('/attendance/my', { params }),
  markAttendance: (attendanceData) => api.post('/attendance', attendanceData),
  getAttendanceStats: (params = {}) => api.get('/attendance/stats', { params }),
  
  // Projects
  getAllProjects: (params = {}) => api.get('/projects', { params }),
  getProject: (id) => api.get(`/projects/${id}`),
  createProject: (projectData) => api.post('/projects', projectData),
  updateProject: (id, projectData) => api.put(`/projects/${id}`, projectData),
  deleteProject: (id) => api.delete(`/projects/${id}`),
  getMyProjects: () => api.get('/projects/my'),
  
  // Weekly Goals
  addWeeklyGoal: (projectId, goalData) => api.post(`/projects/${projectId}/weekly-goals`, goalData),
  getWeeklyGoals: (projectId) => api.get(`/projects/${projectId}/weekly-goals`),
  
  // Project Team Management
  assignUserToProject: (projectId, userId, role) => api.put(`/projects/${projectId}/assign`, { userId, role }),
  unassignUserFromProject: (projectId, userId) => api.put(`/projects/${projectId}/unassign`, { userId }),
  
  // Dashboard
  getDashboardStats: () => api.get('/dashboard/stats'),
  
  // Test connection
  testConnection: () => api.get('/health'),
};

export default api;