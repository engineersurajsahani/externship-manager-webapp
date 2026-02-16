import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX,
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiSave,
  FiLock,
} from 'react-icons/fi';
import Button from '../ui/Button';
import Card from '../ui/Card';

const UserModal = ({
  isOpen,
  onClose,
  mode = 'create', // 'create', 'edit', 'view'
  user = null,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'Engineering', // Set default department
    role: 'intern',
    status: 'active',
    joinDate: new Date().toISOString().split('T')[0],
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (mode === 'edit' || mode === 'view') {
      setFormData({
        name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '',
        email: user?.email || '',
        phone: user?.phoneNumber || '',
        department: user?.department || '',
        role: user?.role || 'intern',
        status: user?.isActive ? 'active' : 'inactive',
        joinDate: user?.joinDate
          ? new Date(user.joinDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        password: '',
        confirmPassword: '',
      });
    } else {
      // Reset form for create mode
      setFormData({
        name: '',
        email: '',
        phone: '',
        department: 'Engineering', // Set default department
        role: 'intern',
        status: 'active',
        joinDate: new Date().toISOString().split('T')[0],
        password: '',
        confirmPassword: '',
      });
    }
    setErrors({});
  }, [user, mode, isOpen]);

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Phone number must be exactly 10 digits';
    }

    // Password validation (only for create mode)
    if (mode === 'create') {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }; const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Split name into firstName and lastName
      const nameParts = formData.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || ''; // Use empty string if no lastName provided

      const userData = {
        firstName,
        lastName,
        email: formData.email,
        phoneNumber: formData.phone,
        department: formData.department || 'General',
        role: formData.role,
        isActive: formData.status === 'active',
        joinDate: formData.joinDate,
      };

      // Add password for create mode
      if (mode === 'create') {
        userData.password = formData.password;
      }

      await onSave(userData);
    } catch (error) {
      console.error('Submit error:', error);
      // Error handling is done in parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    // Format phone number to only allow digits and limit to 10
    if (field === 'phone') {
      value = value.replace(/\D/g, '').substring(0, 10);
    }

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const roles = [
    { value: 'admin', label: 'Administrator' },
    { value: 'project_manager', label: 'Project Manager' },
    { value: 'team_leader', label: 'Team Leader' },
    { value: 'intern', label: 'Intern' },
  ];

  const departments = [
    'Engineering',
    'Product',
    'Design',
    'Marketing',
    'IT',
    'HR',
    'Finance',
  ];

  const statuses = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'pending', label: 'Pending' },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <Card className="p-0">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {mode === 'create' && 'Add New User'}
                  {mode === 'edit' && 'Edit User'}
                  {mode === 'view' && 'User Details'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {mode === 'create' && 'Create a new user account'}
                  {mode === 'edit' && 'Update user information'}
                  {mode === 'view' && 'View user information'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <div className="relative">
                    <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange('name', e.target.value)
                      }
                      disabled={mode === 'view'}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.name ? 'border-red-300' : 'border-gray-300'
                        } ${mode === 'view' ? 'bg-gray-50' : ''}`}
                      placeholder="Enter full name"
                    />
                  </div>
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange('email', e.target.value)
                      }
                      disabled={mode === 'view'}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.email ? 'border-red-300' : 'border-gray-300'
                        } ${mode === 'view' ? 'bg-gray-50' : ''}`}
                      placeholder="Enter email address"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        handleInputChange('phone', e.target.value)
                      }
                      disabled={mode === 'view'}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.phone ? 'border-red-300' : 'border-gray-300'
                        } ${mode === 'view' ? 'bg-gray-50' : ''}`}
                      placeholder="Enter 10-digit phone number"
                      maxLength="10"
                      pattern="[0-9]{10}"
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                  )}
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department *
                  </label>
                  <div className="relative">
                    <FiMapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <select
                      value={formData.department}
                      onChange={(e) =>
                        handleInputChange('department', e.target.value)
                      }
                      disabled={mode === 'view'}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.department ? 'border-red-300' : 'border-gray-300'
                        } ${mode === 'view' ? 'bg-gray-50' : ''}`}
                    >
                      <option value="">Select department</option>
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.department && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.department}
                    </p>
                  )}
                </div>

                {/* Password - Only show in create mode */}
                {mode === 'create' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password *
                    </label>
                    <div className="relative">
                      <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) =>
                          handleInputChange('password', e.target.value)
                        }
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.password ? 'border-red-300' : 'border-gray-300'
                          }`}
                        placeholder="Enter password (min 6 characters)"
                      />
                    </div>
                    {errors.password && (
                      <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                    )}
                  </div>
                )}

                {/* Confirm Password - Only show in create mode */}
                {mode === 'create' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          handleInputChange('confirmPassword', e.target.value)
                        }
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                          }`}
                        placeholder="Confirm password"
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                    )}
                  </div>
                )}

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    disabled={mode === 'view'}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${mode === 'view' ? 'bg-gray-50' : ''
                      }`}
                  >
                    {roles.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      handleInputChange('status', e.target.value)
                    }
                    disabled={mode === 'view'}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${mode === 'view' ? 'bg-gray-50' : ''
                      }`}
                  >
                    {statuses.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Join Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Join Date
                </label>
                <div className="relative">
                  <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black dark:text-white transition-colors duration-300 w-4 h-4" />
                  <input
                    type="date"
                    value={formData.joinDate}
                    onChange={(e) =>
                      handleInputChange('joinDate', e.target.value)
                    }
                    disabled={mode === 'view'}
                    className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${mode === 'view' ? 'bg-gray-50' : ''
                      }`}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              {mode !== 'view' && (
                <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={isSubmitting}
                  >
                    <FiSave className="w-4 h-4 mr-2" />
                    {mode === 'create' ? 'Create User' : 'Update User'}
                  </Button>
                </div>
              )}

              {mode === 'view' && (
                <div className="flex items-center justify-end pt-6 border-t border-gray-200">
                  <Button variant="outline" onClick={onClose}>
                    Close
                  </Button>
                </div>
              )}
            </form>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default UserModal;
