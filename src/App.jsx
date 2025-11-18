import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import DailyUpdates from './pages/DailyUpdates';
import SubmitDailyUpdate from './pages/SubmitDailyUpdate';
import Attendance from './pages/Attendance';
import Projects from './pages/Projects';
import Chat from './pages/Chat';
import UserManagement from './pages/UserManagement';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ToastListener from './components/ui/ToastListener';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route Component (for login page)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Main Layout Component
const MainLayout = () => {
  return (
    <div className="app-container flex h-screen bg-gray-50 max-w-full">
      {/* Sidebar */}
      <div className="flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <Header />

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 px-6 py-6">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/daily-updates" element={<DailyUpdates />} />
            <Route path="/daily-updates/:id" element={<DailyUpdates />} />
            <Route
              path="/daily-updates/submit"
              element={<SubmitDailyUpdate />}
            />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <ToastListener />
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />

          {/* Protected routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
