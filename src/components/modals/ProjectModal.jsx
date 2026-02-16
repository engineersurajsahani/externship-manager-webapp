import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX,
  FiBriefcase,
  FiCalendar,
  FiFlag,
  FiSave,
  FiFileText,
} from 'react-icons/fi';
import Button from '../ui/Button';
import Card from '../ui/Card';

const ProjectModal = ({
  isOpen,
  onClose,
  mode = 'create', // 'create', 'edit', 'view'
  project = null,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    priority: 'medium',
    status: 'planning',
    budget: '',
    department: '',
    requirements: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (project && mode !== 'create') {
      const formatDateForInput = (d) => {
        if (!d) return '';
        // If value is a Date object
        if (d instanceof Date) return d.toISOString().split('T')[0];
        // If value is a number (timestamp)
        if (typeof d === 'number') return new Date(d).toISOString().split('T')[0];
        // If value is an ISO string, strip time portion
        if (typeof d === 'string') {
          const idx = d.indexOf('T');
          return idx > -1 ? d.split('T')[0] : d;
        }
        return '';
      };

      // Normalize status coming from backend (e.g. 'on_hold') to frontend form value ('on-hold')
      const normalizeStatusForForm = (s) => {
        if (!s) return 'planning';
        return String(s).replace('_', '-');
      };

      setFormData({
        name: project.name || '',
        description: project.description || '',
        startDate:
          formatDateForInput(project.startDate) ||
          new Date().toISOString().split('T')[0],
        endDate: formatDateForInput(project.endDate) || '',
        priority: project.priority || 'medium',
        status: normalizeStatusForForm(project.status) || 'planning',
        budget:
          project.budget !== undefined && project.budget !== null
            ? String(project.budget)
            : '',
        department: project.department || '',
        requirements: project.requirements || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        priority: 'medium',
        status: 'planning',
        budget: '',
        department: '',
        requirements: '',
      });
    }
    setErrors({});
  }, [project, mode, isOpen]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Project description is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    } else if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      newErrors.endDate = 'End date must be after start date';
    }

    if (!formData.department.trim()) {
      newErrors.department = 'Department is required';
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
      // Convert form status back to backend format (e.g. 'on-hold' -> 'on_hold')
      const normalizeStatusForBackend = (s) => (s ? String(s).replace('-', '_') : s);

      const projectData = {
        ...formData,
        status: normalizeStatusForBackend(formData.status),
        // Ensure dates are ISO strings accepted by backend
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
        _id: project?._id || project?.id,
        id: project?.id || project?._id || Date.now(),
        progress: project?.progress || 0,
        teamSize: project?.teamSize || 0,
        lead: project?.lead || '',
        interns: project?.interns || [],
        createdAt: project?.createdAt || new Date().toISOString(),
      };

      await onSave(projectData, mode);
      onClose();
    } catch (error) {
      console.error('Error saving project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
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

  const priorities = [
    { value: 'low', label: 'Low', color: 'text-green-600' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'high', label: 'High', color: 'text-red-600' },
    { value: 'urgent', label: 'Urgent', color: 'text-purple-600' },
  ];

  const statuses = [
    { value: 'planning', label: 'Planning' },
    { value: 'active', label: 'Active' },
    { value: 'on-hold', label: 'On Hold' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const departments = [
    'Engineering',
    'Product',
    'Design',
    'Marketing',
    'IT',
    'HR',
    'Finance',
    'Operations',
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
          className="w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        >
          <Card className="p-0">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {mode === 'create' && 'Create New Project'}
                  {mode === 'edit' && 'Edit Project'}
                  {mode === 'view' && 'Project Details'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {mode === 'create' &&
                    'Set up a new project with timeline and requirements'}
                  {mode === 'edit' && 'Update project information and settings'}
                  {mode === 'view' && 'View project details and information'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-400 dark:text-gray-500"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Project Name */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Project Name *
                  </label>
                  <div className="relative">
                    <FiBriefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange('name', e.target.value)
                      }
                      disabled={mode === 'view'}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.name ? 'border-red-300 dark:border-red-900' : 'border-gray-300 dark:border-gray-600'
                        } ${mode === 'view' ? 'bg-gray-50 dark:bg-gray-800' : ''}`}
                      placeholder="Enter project name"
                    />
                  </div>
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Description */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description *
                  </label>
                  <div className="relative">
                    <FiFileText className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        handleInputChange('description', e.target.value)
                      }
                      disabled={mode === 'view'}
                      rows={3}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.description
                        ? 'border-red-300 dark:border-red-900'
                        : 'border-gray-300 dark:border-gray-600'
                        } ${mode === 'view' ? 'bg-gray-50 dark:bg-gray-800' : ''}`}
                      placeholder="Describe the project objectives and scope"
                    />
                  </div>
                  {errors.description && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.description}
                    </p>
                  )}
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Date *
                  </label>
                  <div className="relative">
                    <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black dark:text-white transition-colors duration-300 w-4 h-4" />
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        handleInputChange('startDate', e.target.value)
                      }
                      disabled={mode === 'view'}
                      className={`w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${mode === 'view' ? 'bg-gray-50 dark:bg-gray-800' : ''
                        }`}
                    />
                  </div>
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Date *
                  </label>
                  <div className="relative">
                    <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black dark:text-white transition-colors duration-300 w-4 h-4" />
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) =>
                        handleInputChange('endDate', e.target.value)
                      }
                      disabled={mode === 'view'}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.endDate ? 'border-red-300 dark:border-red-900' : 'border-gray-300 dark:border-gray-600'
                        } ${mode === 'view' ? 'bg-gray-50 dark:bg-gray-800' : ''}`}
                    />
                  </div>
                  {errors.endDate && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.endDate}
                    </p>
                  )}
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority
                  </label>
                  <div className="relative">
                    <FiFlag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <select
                      value={formData.priority}
                      onChange={(e) =>
                        handleInputChange('priority', e.target.value)
                      }
                      disabled={mode === 'view'}
                      className={`w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${mode === 'view' ? 'bg-gray-50 dark:bg-gray-800' : ''
                        }`}
                    >
                      {priorities.map((priority) => (
                        <option key={priority.value} value={priority.value}>
                          {priority.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      handleInputChange('status', e.target.value)
                    }
                    disabled={mode === 'view'}
                    className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${mode === 'view' ? 'bg-gray-50 dark:bg-gray-800' : ''
                      }`}
                  >
                    {statuses.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Department *
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) =>
                      handleInputChange('department', e.target.value)
                    }
                    disabled={mode === 'view'}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.department ? 'border-red-300 dark:border-red-900' : 'border-gray-300 dark:border-gray-600'
                      } ${mode === 'view' ? 'bg-gray-50 dark:bg-gray-800' : ''}`}
                  >
                    <option value="">Select department</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                  {errors.department && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.department}
                    </p>
                  )}
                </div>

                {/* Budget */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Budget (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      $
                    </span>
                    <input
                      type="number"
                      value={formData.budget}
                      onChange={(e) =>
                        handleInputChange('budget', e.target.value)
                      }
                      disabled={mode === 'view'}
                      className={`w-full pl-8 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${mode === 'view' ? 'bg-gray-50 dark:bg-gray-800' : ''
                        }`}
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Requirements */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Requirements & Objectives
                  </label>
                  <textarea
                    value={formData.requirements}
                    onChange={(e) =>
                      handleInputChange('requirements', e.target.value)
                    }
                    disabled={mode === 'view'}
                    rows={4}
                    className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${mode === 'view' ? 'bg-gray-50 dark:bg-gray-800' : ''
                      }`}
                    placeholder="List key requirements, deliverables, and success criteria"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              {mode !== 'view' && (
                <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
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
                    {mode === 'create' ? 'Create Project' : 'Update Project'}
                  </Button>
                </div>
              )}

              {mode === 'view' && (
                <div className="flex items-center justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
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

export default ProjectModal;
