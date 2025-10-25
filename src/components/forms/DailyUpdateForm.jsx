import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FiSave,
  FiUpload,
  FiX,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiFolder,
} from 'react-icons/fi';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';

const DailyUpdateForm = ({
  selectedProject = null,
  existingUpdate = null,
  onSubmit,
  onCancel,
  isSubmitting = false,
  showProjectSelector = true,
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    workDone: '',
    challenges: '',
    planForTomorrow: '',
    attachments: [],
    project: selectedProject?.id || '',
  });
  const [errors, setErrors] = useState({});
  const [hasExistingUpdate, setHasExistingUpdate] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  useEffect(() => {
    // Fetch user projects if project selector is enabled
    if (showProjectSelector && !selectedProject) {
      fetchUserProjects();
    } else {
      setLoadingProjects(false);
    }
  }, [showProjectSelector, selectedProject]);

  useEffect(() => {
    if (existingUpdate) {
      setFormData({
        workDone: existingUpdate.workDone || '',
        challenges: existingUpdate.challenges || '',
        planForTomorrow: existingUpdate.planForTomorrow || '',
        attachments: existingUpdate.attachments || [],
        project: existingUpdate.project?._id || selectedProject?.id || '',
      });
      setHasExistingUpdate(true);
    } else {
      // Check if there's already a submission for today
      checkExistingSubmission();
    }
  }, [existingUpdate, selectedProject]);

  useEffect(() => {
    if (selectedProject) {
      setFormData(prev => ({
        ...prev,
        project: selectedProject.id,
      }));
    }
  }, [selectedProject]);

  const fetchUserProjects = async () => {
    try {
      setLoadingProjects(true);
      const response = await apiService.getMyProjects();
      if (response.data.success) {
        setProjects(response.data.projects || []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  };

  const checkExistingSubmission = async () => {
    try {
      const response = await apiService.getTodayUpdate();

      if (response.data.success && response.data.hasSubmitted) {
        const todaysSubmission = response.data.update;
        setHasExistingUpdate(true);
        setFormData({
          workDone: todaysSubmission.workDone || '',
          challenges: todaysSubmission.challenges || '',
          planForTomorrow: todaysSubmission.planForTomorrow || '',
          attachments: todaysSubmission.attachments || [],
          project: todaysSubmission.project?._id || selectedProject?.id || '',
        });
      }
    } catch (error) {
      console.error('Error checking existing submission:', error);
      // If API call fails, assume no existing submission
      setHasExistingUpdate(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (showProjectSelector && !formData.project) {
      newErrors.project = 'Please select a project';
    }

    if (!formData.workDone.trim()) {
      newErrors.workDone = 'Work done today is required';
    } else if (formData.workDone.trim().length < 10) {
      newErrors.workDone = 'Please provide more detail (minimum 10 characters)';
    }

    if (!formData.planForTomorrow.trim()) {
      newErrors.planForTomorrow = 'Plan for tomorrow is required';
    } else if (formData.planForTomorrow.trim().length < 10) {
      newErrors.planForTomorrow =
        'Please provide more detail (minimum 10 characters)';
    }

    // Challenges can be optional, but if provided, should have some content
    if (formData.challenges.trim() && formData.challenges.trim().length < 5) {
      newErrors.challenges =
        'Please provide more detail if mentioning challenges';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const updateData = {
      ...formData,
      project: formData.project || selectedProject?.id,
      projectId: formData.project || selectedProject?.id,
      projectName: selectedProject?.name,
      userEmail: user?.email,
      userName: user?.email?.split('@')[0] || 'Unknown',
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
      isUpdate: hasExistingUpdate,
    };

    onSubmit(updateData);
  };

  const getCurrentTime = () => {
    return new Date().toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getWordCount = (text) => {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  };

  if (!selectedProject && !showProjectSelector) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <FiAlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No project selected</p>
          <p className="text-sm text-gray-400">
            Please select a project to submit your daily update.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {hasExistingUpdate
              ? "Update Today's Submission"
              : 'Submit Daily Update'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Project: <span className="font-medium">{selectedProject.name}</span>
          </p>
          <p className="text-xs text-gray-400 flex items-center mt-1">
            <FiClock className="w-3 h-3 mr-1" />
            {getCurrentTime()}
          </p>
        </div>
        {onCancel && (
          <Button variant="outline" size="sm" onClick={onCancel}>
            <FiX className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        )}
      </div>

      {/* Existing Update Notice */}
      {hasExistingUpdate && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <div className="flex items-center">
            <FiCheckCircle className="w-5 h-5 text-blue-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-blue-900">
                You've already submitted an update for today
              </p>
              <p className="text-xs text-blue-700 mt-1">
                You can modify your submission until the daily cutoff time.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Project Selection - Only show if enabled and no project is pre-selected */}
        {showProjectSelector && !selectedProject && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FiFolder className="inline w-4 h-4 mr-1 mb-0.5" />
              Select Project *
            </label>
            {loadingProjects ? (
              <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                <p className="text-sm text-gray-500">Loading projects...</p>
              </div>
            ) : projects.length === 0 ? (
              <div className="w-full px-3 py-2 border border-yellow-300 rounded-lg bg-yellow-50">
                <p className="text-sm text-yellow-700">
                  No projects assigned. Please contact your project manager.
                </p>
              </div>
            ) : (
              <select
                value={formData.project}
                onChange={(e) => handleInputChange('project', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.project ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">-- Select a project --</option>
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </select>
            )}
            {errors.project && (
              <p className="text-red-500 text-xs mt-1">{errors.project}</p>
            )}
          </div>
        )}

        {/* Work Done Today */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What did you work on today? *
          </label>
          <textarea
            value={formData.workDone}
            onChange={(e) => handleInputChange('workDone', e.target.value)}
            rows={4}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none ${
              errors.workDone ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Describe the tasks you completed, progress made, milestones achieved, etc."
          />
          <div className="flex items-center justify-between mt-1">
            {errors.workDone ? (
              <p className="text-red-500 text-xs">{errors.workDone}</p>
            ) : (
              <p className="text-gray-500 text-xs">
                Be specific about your accomplishments and progress
              </p>
            )}
            <span className="text-xs text-gray-400">
              {getWordCount(formData.workDone)} words
            </span>
          </div>
        </div>

        {/* Challenges */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Challenges faced (if any)
          </label>
          <textarea
            value={formData.challenges}
            onChange={(e) => handleInputChange('challenges', e.target.value)}
            rows={3}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none ${
              errors.challenges ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Describe any blockers, difficulties, or issues you encountered..."
          />
          <div className="flex items-center justify-between mt-1">
            {errors.challenges ? (
              <p className="text-red-500 text-xs">{errors.challenges}</p>
            ) : (
              <p className="text-gray-500 text-xs">
                Optional: Mention any obstacles or help needed
              </p>
            )}
            <span className="text-xs text-gray-400">
              {getWordCount(formData.challenges)} words
            </span>
          </div>
        </div>

        {/* Plan for Tomorrow */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What do you plan to work on tomorrow? *
          </label>
          <textarea
            value={formData.planForTomorrow}
            onChange={(e) => handleInputChange('planForTomorrow', e.target.value)}
            rows={3}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none ${
              errors.planForTomorrow ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Outline your goals and tasks for the next working day..."
          />
          <div className="flex items-center justify-between mt-1">
            {errors.planForTomorrow ? (
              <p className="text-red-500 text-xs">{errors.planForTomorrow}</p>
            ) : (
              <p className="text-gray-500 text-xs">
                Outline your priorities and goals for tomorrow
              </p>
            )}
            <span className="text-xs text-gray-400">
              {getWordCount(formData.planForTomorrow)} words
            </span>
          </div>
        </div>

        {/* File Upload Section - Future-proofed */}
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6">
          <div className="text-center">
            <FiUpload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Attach Files (Optional)
            </h4>
            <p className="text-sm text-gray-500 mb-2">
              Screenshots, documents, or relevant files
            </p>
            <p className="text-xs text-gray-400 mb-4">
              File upload functionality will be available in future updates
            </p>
            <div className="flex items-center justify-center space-x-2">
              <div className="bg-white px-3 py-1 rounded-md border border-gray-300">
                <span className="text-xs text-gray-400">
                  Supported: PNG, JPG, PDF, DOC
                </span>
              </div>
              <div className="bg-white px-3 py-1 rounded-md border border-gray-300">
                <span className="text-xs text-gray-400">Max: 10MB</span>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            className="min-w-32"
          >
            <FiSave className="w-4 h-4 mr-2" />
            {hasExistingUpdate ? 'Update Submission' : 'Submit Update'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default DailyUpdateForm;
