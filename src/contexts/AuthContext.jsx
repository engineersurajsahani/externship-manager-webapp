import React, { createContext, useContext, useState, useEffect } from 'react';

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
    const checkAuthStatus = () => {
      try {
        const token = localStorage.getItem('token');
        const refreshToken = localStorage.getItem('refreshToken');
        const userEmail = localStorage.getItem('userEmail');
        const storedUserData = localStorage.getItem('userData');

        if (token && userEmail) {
          let userData;

          // Try to use stored API user data first
          if (storedUserData) {
            try {
              const parsedUserData = JSON.parse(storedUserData);
              userData = {
                id: parsedUserData.id,
                email: userEmail,
                firstName: parsedUserData.firstName,
                lastName: parsedUserData.lastName,
                role: parsedUserData.role,
                department: parsedUserData.department,
                token: token,
              };
            } catch (e) {
              // Fall back to role mappings if stored data is corrupted
              const userRole = ROLE_MAPPINGS[userEmail] || ROLES.INTERN;
              userData = {
                email: userEmail,
                role: userRole,
                token: token,
              };
            }
          } else {
            // Fall back to role mappings if no stored data
            const userRole = ROLE_MAPPINGS[userEmail] || ROLES.INTERN;
            userData = {
              email: userEmail,
              role: userRole,
              token: token,
            };
          }

          setUser(userData);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        // Clear potentially corrupted data
        localStorage.removeItem('token');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userData');
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
