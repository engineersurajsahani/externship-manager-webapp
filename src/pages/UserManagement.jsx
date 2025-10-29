import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FiUsers,
  FiPlus,
  FiEdit3,
  FiSearch,
  FiUserCheck,
  FiUserX,
  FiMail,
  FiCalendar,
  FiEye,
  FiTrash2,
  FiDownload,
} from 'react-icons/fi';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import StatsCard from '../components/StatsCard';
import UserModal from '../components/modals/UserModal';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

const UserManagement = () => {
  const { hasRole, ROLES } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [userModal, setUserModal] = useState({
    isOpen: false,
    mode: 'create',
    user: null,
  });

  const [users, setUsers] = useState([]);

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await apiService.getAllUsers();
        if (response.data && response.data.success) {
          const userData = response.data.users || response.data.data || [];
          // Transform user data to match UI expectations
          const transformedUsers = userData.map(user => ({
            id: user._id || user.id,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || 'Unknown User',
            email: user.email,
            role: user.role === 'project_manager' ? 'pm' : user.role === 'team_leader' ? 'tl' : user.role,
            status: user.isActive ? 'active' : 'inactive',
            joinDate: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A',
            lastLogin: user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never',
            projects: user.projects || 0,
            phone: user.phone || 'N/A',
            department: user.department || 'General',
          }));
          setUsers(transformedUsers);
        } else {
          throw new Error(response.data?.message || 'Failed to fetch users');
        }
      } catch (err) {
        console.error('Error fetching users:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // CRUD Operations
  const handleCreateUser = () => {
    setUserModal({
      isOpen: true,
      mode: 'create',
      user: null,
    });
  };

  const handleEditUser = (user) => {
    setUserModal({
      isOpen: true,
      mode: 'edit',
      user: user,
    });
  };

  const handleViewUser = (user) => {
    setUserModal({
      isOpen: true,
      mode: 'view',
      user: user,
    });
  };

  const handleToggleUserStatus = async (userId) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      const updateData = {
        isActive: user.status !== 'active',
      };
      
      const response = await apiService.updateStudent(userId, updateData);
      if (response.data && response.data.success) {
        setUsers((prevUsers) =>
          prevUsers.map((user) => {
            if (user.id === userId) {
              return {
                ...user,
                status: user.status === 'active' ? 'inactive' : 'active',
              };
            }
            return user;
          })
        );
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      alert('Failed to update user status: ' + error.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (
      window.confirm(
        'Are you sure you want to delete this user? This action cannot be undone.'
      )
    ) {
      try {
        const response = await apiService.deleteStudent(userId);
        if (response.data && response.data.success) {
          setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user: ' + error.message);
      }
    }
  };

  const handleSaveUser = async (userData, mode) => {
    try {
      if (mode === 'create') {
        // Transform role back to backend format
        const transformedRole = userData.role === 'pm' ? 'project_manager' : userData.role === 'tl' ? 'team_leader' : userData.role;
        const createData = {
          firstName: userData.name?.split(' ')[0] || '',
          lastName: userData.name?.split(' ').slice(1).join(' ') || '',
          email: userData.email,
          role: transformedRole,
          department: userData.department,
          phone: userData.phone,
          password: userData.password || 'defaultpass123', // You might want to handle this differently
        };
        
        const response = await apiService.createStudent(createData);
        if (response.data && response.data.success) {
          // Refresh the user list
          const usersResponse = await apiService.getAllUsers();
          if (usersResponse.data && usersResponse.data.success) {
            const userData = usersResponse.data.users || usersResponse.data.data || [];
            const transformedUsers = userData.map(user => ({
              id: user._id || user.id,
              name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || 'Unknown User',
              email: user.email,
              role: user.role === 'project_manager' ? 'pm' : user.role === 'team_leader' ? 'tl' : user.role,
              status: user.isActive ? 'active' : 'inactive',
              joinDate: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A',
              lastLogin: user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never',
              projects: user.projects || 0,
              phone: user.phone || 'N/A',
              department: user.department || 'General',
            }));
            setUsers(transformedUsers);
          }
        }
      } else if (mode === 'edit') {
        const transformedRole = userData.role === 'pm' ? 'project_manager' : userData.role === 'tl' ? 'team_leader' : userData.role;
        const updateData = {
          firstName: userData.name?.split(' ')[0] || '',
          lastName: userData.name?.split(' ').slice(1).join(' ') || '',
          email: userData.email,
          role: transformedRole,
          department: userData.department,
          phone: userData.phone,
          isActive: userData.status === 'active',
        };
        
        const response = await apiService.updateStudent(userData.id, updateData);
        if (response.data && response.data.success) {
          // Update local state
          setUsers((prevUsers) =>
            prevUsers.map((user) => (user.id === userData.id ? userData : user))
          );
        }
      }
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Failed to save user: ' + error.message);
    }
    setUserModal({ isOpen: false, mode: 'create', user: null });
  };

  const handleCloseModal = () => {
    setUserModal({ isOpen: false, mode: 'create', user: null });
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'pm':
        return 'bg-blue-100 text-blue-800';
      case 'tl':
        return 'bg-green-100 text-green-800';
      case 'intern':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleDisplay = (role) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'pm':
        return 'Project Manager';
      case 'tl':
        return 'Team Leader';
      case 'intern':
        return 'Intern';
      default:
        return role;
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesStatus =
      selectedStatus === 'all' || user.status === selectedStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const userStats = {
    total: users.length,
    active: users.filter((u) => u.status === 'active').length,
    admins: users.filter((u) => u.role === 'admin').length,
    interns: users.filter((u) => u.role === 'intern').length,
  };

  // Show loading state
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="p-6 space-y-6">
        <Card className="p-6 text-center">
          <div className="text-red-600 mb-4">
            <FiUsers className="w-12 h-12 mx-auto mb-2" />
            <p className="text-lg font-semibold">Error Loading Users</p>
            <p className="text-sm">{error}</p>
          </div>
          <Button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">
            Manage users, roles, and permissions
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <Button variant="outline" size="sm">
            <FiDownload className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="primary" size="sm" onClick={handleCreateUser}>
            <FiPlus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Users"
          value={userStats.total.toString()}
          icon={FiUsers}
          color="blue"
          delay={0}
        />
        <StatsCard
          title="Active Users"
          value={userStats.active.toString()}
          icon={FiUserCheck}
          color="green"
          delay={0.1}
        />
        <StatsCard
          title="Administrators"
          value={userStats.admins.toString()}
          icon={FiUserCheck}
          color="purple"
          delay={0.2}
        />
        <StatsCard
          title="Interns"
          value={userStats.interns.toString()}
          icon={FiUsers}
          color="orange"
          delay={0.3}
        />
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Role Filter */}
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="all">All Roles</option>
            <option value="admin">Administrator</option>
            <option value="pm">Project Manager</option>
            <option value="tl">Team Leader</option>
            <option value="intern">Intern</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </Card>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Projects
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-indigo-600 font-medium text-sm">
                            {user.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <FiMail className="w-3 h-3 mr-1" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={getRoleColor(user.role)}>
                        {getRoleDisplay(user.role)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={getStatusColor(user.status)}>
                        {user.status.charAt(0).toUpperCase() +
                          user.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {user.department}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {user.projects}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <FiCalendar className="w-3 h-3 mr-1" />
                        {user.lastLogin}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          className="text-gray-600 hover:text-gray-900"
                          title="View"
                          onClick={() => handleViewUser(user)}
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                        <button
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Edit"
                          onClick={() => handleEditUser(user)}
                        >
                          <FiEdit3 className="w-4 h-4" />
                        </button>
                        <button
                          className={`${
                            user.status === 'active'
                              ? 'text-red-600 hover:text-red-900'
                              : 'text-green-600 hover:text-green-900'
                          }`}
                          title={
                            user.status === 'active' ? 'Deactivate' : 'Activate'
                          }
                          onClick={() => handleToggleUserStatus(user.id)}
                        >
                          {user.status === 'active' ? (
                            <FiUserX className="w-4 h-4" />
                          ) : (
                            <FiUserCheck className="w-4 h-4" />
                          )}
                        </button>
                        {hasRole(ROLES.ADMIN) && (
                          <button
                            className="text-red-600 hover:text-red-900"
                            title="Delete User"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <FiUsers className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                No users found matching your criteria.
              </p>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <FiPlus className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Bulk Import
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Import multiple users from CSV file
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Import Users
            </Button>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <FiUserCheck className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Role Management
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Configure roles and permissions
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Manage Roles
            </Button>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <FiMail className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Send Invitations
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Invite new users to join the platform
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Send Invites
            </Button>
          </Card>
        </motion.div>
      </div>

      {/* User Modal */}
      <UserModal
        isOpen={userModal.isOpen}
        onClose={handleCloseModal}
        mode={userModal.mode}
        user={userModal.user}
        onSave={handleSaveUser}
      />
    </div>
  );
};

export default UserManagement;
