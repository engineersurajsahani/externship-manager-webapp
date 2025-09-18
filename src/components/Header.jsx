import React, { useState } from 'react';
import { FiBell, FiSearch, FiUser, FiLogOut } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  
  const handleSignOut = () => {
    // Use AuthContext logout method
    logout();
    // Navigate to login page
    navigate('/login');
  };

  // Get user display info
  const getUserDisplayInfo = () => {
    if (!user) return { name: 'User', role: 'Guest', initials: 'U' };
    
    const email = user.email || '';
    const name = email.split('@')[0] || 'User';
    const initials = name.substring(0, 2).toUpperCase();
    
    const roleDisplayNames = {
      admin: 'Administrator',
      pm: 'Project Manager', 
      tl: 'Team Leader',
      intern: 'Intern'
    };
    
    return {
      name: name.charAt(0).toUpperCase() + name.slice(1),
      role: roleDisplayNames[user.role] || user.role || 'User',
      initials
    };
  };

  const userDisplayInfo = getUserDisplayInfo();

  const notifications = [
    { id: 1, text: 'New externship application received', time: '5 min ago', unread: true },
    { id: 2, text: 'Interview scheduled with ABC Corp', time: '1 hour ago', unread: true },
    { id: 3, text: 'Application approved for John Doe', time: '3 hours ago', unread: false },
  ];

  return (
    <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Search */}
          <div className="flex items-center flex-1">
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search projects, users, daily updates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Right side - Notifications and Profile */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowProfile(false);
                }}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <FiBell size={20} />
                <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
                  >
                    <div className="px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                      <h3 className="text-sm font-semibold">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`px-4 py-3 hover:bg-gray-50 border-b border-gray-100 cursor-pointer ${
                            notif.unread ? 'bg-blue-50' : ''
                          }`}
                        >
                          <p className="text-sm text-gray-800">{notif.text}</p>
                          <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                        </div>
                      ))}
                    </div>
                    <div className="px-4 py-2 bg-gray-50 text-center">
                      <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                        View all notifications
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowProfile(!showProfile);
                  setShowNotifications(false);
                }}
                className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {userDisplayInfo.initials}
                </div>
              </button>

              <AnimatePresence>
                {showProfile && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
                  >
                    <div className="px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600">
                      <p className="text-sm font-semibold text-white">{userDisplayInfo.name}</p>
                      <p className="text-xs text-indigo-100">{userDisplayInfo.role}</p>
                    </div>
                    <div className="py-2">
                      <button className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <FiUser className="inline mr-2" /> Profile Settings
                      </button>
                      <button className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Account Settings
                      </button>
                      <hr className="my-2" />
                      <button 
                        onClick={handleSignOut}
                        className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <FiLogOut className="inline mr-2" /> Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
