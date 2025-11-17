import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

// Role constants
export const ROLES = {
  ADMIN: 'admin',
  PROJECT_MANAGER: 'project_manager',
  TEAM_LEADER: 'team_leader',
  INTERN: 'intern',
};

// Role mappings for demo users
const ROLE_MAPPINGS = {
  'admin@example.com': ROLES.ADMIN,
  'pm@example.com': ROLES.PROJECT_MANAGER,
  'tl@example.com': ROLES.TEAM_LEADER,
  'intern1@example.com': ROLES.INTERN,
};

// Create the context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        const refreshToken = localStorage.getItem('refreshToken');
        const userEmail = localStorage.getItem('userEmail');
        const storedUserData = localStorage.getItem('userData');

        if (token && userEmail) {
          try {
            // Verify token with backend to ensure it's valid (prevents fake/demo tokens from granting access)
            const resp = await api.get('/auth/me');
            const apiUser = resp.data?.user;

            if (apiUser) {
              const userRole = apiUser.role || ROLE_MAPPINGS[userEmail] || ROLES.INTERN;
              const userData = {
                id: apiUser._id || apiUser.id,
                email: apiUser.email || userEmail,
                firstName: apiUser.firstName,
                lastName: apiUser.lastName,
                role: userRole,
                department: apiUser.department,
                token,
              };

              // Persist cleaned API user data
              localStorage.setItem('userData', JSON.stringify(apiUser));
              setUser(userData);
              setIsAuthenticated(true);
            } else {
              // If backend does not return user (token invalid), clear storage
              localStorage.removeItem('token');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('userEmail');
              localStorage.removeItem('userData');
              setUser(null);
              setIsAuthenticated(false);
            }
          } catch (err) {
            // If server is unreachable, fall back to client-side stored user (useful for offline/dev/demo)
            // But do not trust arbitrary tokens — only restore if we have stored userData
            if (storedUserData) {
              try {
                const parsedUserData = JSON.parse(storedUserData);
                const userData = {
                  id: parsedUserData.id,
                  email: userEmail,
                  firstName: parsedUserData.firstName,
                  lastName: parsedUserData.lastName,
                  role: parsedUserData.role || ROLE_MAPPINGS[userEmail] || ROLES.INTERN,
                  department: parsedUserData.department,
                  token,
                };
                setUser(userData);
                setIsAuthenticated(true);
              } catch (e) {
                // corrupted stored data — clear it
                localStorage.removeItem('userData');
                setUser(null);
                setIsAuthenticated(false);
              }
            } else {
              setUser(null);
              setIsAuthenticated(false);
            }
          }
        } else {
          // No token/userEmail present — ensure logged out state
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        // Clear potentially corrupted data
        localStorage.removeItem('token');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userData');
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Login function
  const login = (email, token, apiUserData = null, refreshToken = null) => {
    // Use API user data if available, otherwise fall back to role mappings
    const userRole = apiUserData?.role || ROLE_MAPPINGS[email] || ROLES.INTERN;
    const userData = {
      id: apiUserData?.id,
      email,
      firstName: apiUserData?.firstName,
      lastName: apiUserData?.lastName,
      role: userRole,
      department: apiUserData?.department,
      token,
    };

    // Store in localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('userEmail', email);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    if (apiUserData) {
      localStorage.setItem('userData', JSON.stringify(apiUserData));
    }

    // Update state
    setUser(userData);
    setIsAuthenticated(true);

    return userData;
  };

  // Logout function
  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userData');

    // Clear state
    setUser(null);
    setIsAuthenticated(false);
  };

  // Get user role
  const getUserRole = () => {
    return user?.role || null;
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return user?.role === role;
  };

  // Check if user has any of the specified roles
  const hasAnyRole = (roles) => {
    return roles.includes(user?.role);
  };

  // Check if token is expired (basic client-side check)
  const isTokenExpired = () => {
    const token = localStorage.getItem('token');
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  };

  // Get token expiration time
  const getTokenExpiration = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return new Date(payload.exp * 1000);
    } catch (error) {
      return null;
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    getUserRole,
    hasRole,
    hasAnyRole,
    isTokenExpired,
    getTokenExpiration,
    ROLES,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
