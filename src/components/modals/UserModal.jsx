import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, FiSave } from 'react-icons/fi';
import Button from '../ui/Button';
import Card from '../ui/Card';

const UserModal = ({ 
  isOpen, 
  onClose, 
  mode = 'create', // 'create', 'edit', 'view'
  user = null,
  onSave
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    role: 'intern',
    status: 'active',
    joinDate: new Date().toISOString().split('T')[0]
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user && mode !== 'create') {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        department: user.department || '',
        role: user.role || 'intern',
        status: user.status || 'active',
        joinDate: user.joinDate || new Date().toISOString().split('T')[0]
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        department: '',
        role: 'intern',
        status: 'active',
        joinDate: new Date().toISOString().split('T')[0]
      });
    }
    setErrors({});
  }, [user, mode, isOpen]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.department.trim()) {
      newErrors.department = 'Department is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const userData = {
        ...formData,
        id: user?.id || Date.now(),
        projects: user?.projects || 0,
        lastLogin: user?.lastLogin || new Date().toLocaleString()
      };

      await onSave(userData, mode);
      onClose();
    } catch (error) {
      console.error('Error saving user:', error);
      // Handle error (show toast, etc.)
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const roles = [
    { value: 'admin', label: 'Administrator' },
    { value: 'pm', label: 'Project Manager' },
    { value: 'tl', label: 'Team Leader' },
    { value: 'intern', label: 'Intern' }
  ];

  const departments = [
    'Engineering',
    'Product',
    'Design',
    'Marketing',
    'IT',
    'HR',
    'Finance'
  ];

  const statuses = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'pending', label: 'Pending' }
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
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      disabled={mode === 'view'}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                        errors.name ? 'border-red-300' : 'border-gray-300'
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
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={mode === 'view'}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
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
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={mode === 'view'}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                        errors.phone ? 'border-red-300' : 'border-gray-300'
                      } ${mode === 'view' ? 'bg-gray-50' : ''}`}
                      placeholder="Enter phone number"
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
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      disabled={mode === 'view'}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                        errors.department ? 'border-red-300' : 'border-gray-300'
                      } ${mode === 'view' ? 'bg-gray-50' : ''}`}
                    >
                      <option value="">Select department</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  {errors.department && (
                    <p className="text-red-500 text-sm mt-1">{errors.department}</p>
                  )}
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    disabled={mode === 'view'}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      mode === 'view' ? 'bg-gray-50' : ''
                    }`}
                  >
                    {roles.map(role => (
                      <option key={role.value} value={role.value}>{role.label}</option>
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
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    disabled={mode === 'view'}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      mode === 'view' ? 'bg-gray-50' : ''
                    }`}
                  >
                    {statuses.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
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
                  <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="date"
                    value={formData.joinDate}
                    onChange={(e) => handleInputChange('joinDate', e.target.value)}
                    disabled={mode === 'view'}
                    className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      mode === 'view' ? 'bg-gray-50' : ''
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