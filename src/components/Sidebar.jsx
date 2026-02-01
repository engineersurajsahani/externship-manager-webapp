import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FiHome, FiBriefcase, FiUsers, FiClock, FiEdit3, FiMessageSquare, FiLogOut, FiFileText } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = () => {
  const { getUserRole, ROLES, user, logout } = useAuth();
  const navigate = useNavigate();
  const userRole = getUserRole();

  const allMenuItems = [
    // Dashboard - Available to all roles
    {
      path: '/dashboard',
      icon: FiHome,
      label: 'Dashboard',
      badge: null,
      roles: [
        ROLES.ADMIN,
        ROLES.PROJECT_MANAGER,
        ROLES.TEAM_LEADER,
        ROLES.INTERN,
      ],
    },

    // Daily Updates - All roles but different views:
    // Admin: Views all updates across system
    // PM: Views updates from their project teams
    // TL: Reviews updates from their interns + submits own
    // Intern: Submits daily updates
    {
      path: '/daily-updates',
      icon: FiEdit3,
      label: 'Daily Updates',
      badge: null,
      roles: [
        ROLES.ADMIN,
        ROLES.PROJECT_MANAGER,
        ROLES.TEAM_LEADER,
        ROLES.INTERN,
      ],
    },

    // Attendance - All roles:
    // Admin: Views all user attendance
    // PM: Views attendance of their project teams
    // TL: Views attendance of their interns
    // Intern: Views their own attendance history in calendar style
    {
      path: '/attendance',
      icon: FiClock,
      label: 'Attendance',
      badge: null,
      roles: [
        ROLES.ADMIN,
        ROLES.PROJECT_MANAGER,
        ROLES.TEAM_LEADER,
        ROLES.INTERN,
      ],
    },

    // Projects - All roles:
    // Admin: Creates and manages all projects
    // PM: Manages assigned projects
    // TL: Views project details, manages team tasks
    // Intern: Views assigned projects and tracks progress
    {
      path: '/projects',
      icon: FiBriefcase,
      label: 'Projects',
      badge: null,
      roles: [
        ROLES.ADMIN,
        ROLES.PROJECT_MANAGER,
        ROLES.TEAM_LEADER,
        ROLES.INTERN,
      ],
    },

    // Chat - Project-based communication:
    // PM, TL, Intern: Can chat in projects they're assigned to
    {
      path: '/chat',
      icon: FiMessageSquare,
      label: 'Chat',
      badge: null,
      roles: [
        ROLES.PROJECT_MANAGER,
        ROLES.TEAM_LEADER,
        ROLES.INTERN,
      ],
    },

    // Reports - Admin and PM only:
    // Admin & PM: Generate and export reports for daily updates and attendance
    {
      path: '/reports',
      icon: FiFileText,
      label: 'Reports',
      badge: null,
      roles: [ROLES.ADMIN, ROLES.PROJECT_MANAGER],
    },

    // User Management - Admin only:
    // Admin: Full control over all users and roles
    {
      path: '/users',
      icon: FiUsers,
      label: 'User Management',
      badge: null,
      roles: [ROLES.ADMIN],
    },
  ];

  // Filter menu items based on user role
  const menuItems = allMenuItems.filter(
    (item) => item.roles.includes(userRole) || !userRole
  );

  // Get role-specific subtitle
  const getRoleSubtitle = () => {
    switch (userRole) {
      case ROLES.ADMIN:
        return 'Admin';
      case ROLES.PROJECT_MANAGER:
        return 'Project Manager';
      case ROLES.TEAM_LEADER:
        return 'Team Leader';
      case ROLES.INTERN:
        return 'Intern';
      default:
        return 'User';
    }
  };

  return (
    <aside
      style={{ minWidth: '256px', width: '256px' }}
      className="bg-white shadow-2xl border-r border-gray-200 h-screen flex flex-col"
    >
      {/* Header */}
      <div className="relative h-16 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 shadow-lg overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-white rounded-full" />
          <div className="absolute -left-4 -bottom-4 w-12 h-12 bg-white rounded-full" />
        </div>
        <div className="relative flex items-center justify-center h-full">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center mr-3 backdrop-blur-md">
              <span className="text-indigo-600 font-bold text-xl">E</span>
            </div>
            <div>
              <span className="text-white font-bold text-lg leading-tight">
                Externship Manager
              </span>
              <div className="text-indigo-200 text-xs font-medium">
                {getRoleSubtitle()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-3">
          {menuItems.map((item, index) => (
            <div key={item.path} className="mb-2">
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `relative flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group overflow-hidden ${isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg cursor-default'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 cursor-pointer'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute left-0 top-0 w-1 h-full bg-white rounded-r-full" />
                    )}
                    {!isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    )}

                    {/* Content */}
                    <div className="relative flex items-center justify-between w-full">
                      <div className="flex items-center">
                        <item.icon className="w-5 h-5 mr-3" />
                        <span className="font-medium">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="px-2 py-1 text-xs font-bold bg-red-500 text-white rounded-full shadow-lg">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </NavLink>
            </div>
          ))}
        </div>
      </nav>

      {/* Sidebar Footer - user initials and logout */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
              {user && (user.firstName || user.lastName)
                ? `${(user.firstName || '').charAt(0) || ''}${(user.lastName || '').charAt(0) || ''}`.toUpperCase()
                : user && user.email
                  ? user.email.split('@')[0].substring(0, 2).toUpperCase()
                  : 'AD'}
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700">
                {user && (user.firstName || user.lastName)
                  ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                  : user && user.email
                    ? user.email.split('@')[0]
                    : 'Admin'}
              </div>
              <div className="text-xs text-gray-400">{getRoleSubtitle().toUpperCase()}</div>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="flex items-center space-x-2 text-sm text-red-600 hover:text-red-800"
          >
            <FiLogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
