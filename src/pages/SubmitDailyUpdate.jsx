import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiArrowLeft,
  FiSave,
  FiUpload,
  FiCheckCircle,
  FiClock,
} from 'react-icons/fi';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

const SubmitDailyUpdate = () => {
  const { user, getUserRole, ROLES } = useAuth();
  const navigate = useNavigate();
  const userRole = getUserRole();

  const [formData, setFormData] = useState({
    workDone: '',
    challenges: '',
    planForTomorrow: '',
    attachments: [],
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasExistingUpdate, setHasExistingUpdate] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const checkExistingSubmission = useCallback(async () => {
    if (!user) return;

    try {
      const response = await apiService.getTodayUpdate();
      if (response.data.success && response.data.hasSubmitted) {
        const update = response.data.update;
        setHasExistingUpdate(true);
        setFormData({
          workDone: update.workDone || '',
          challenges: update.challenges || '',
          planForTomorrow: update.planForTomorrow || '',
          attachments: update.attachments || [],
        });
      }
    } catch (error) {
      console.error('Error checking existing submission:', error);
      // If API call fails, we'll assume no existing submission
    }
  }, [user]);

  // Check for existing update on load
  useEffect(() => {
    checkExistingSubmission();
  }, [checkExistingSubmission]);

  // Redirect if user doesn't have permission
  useEffect(() => {
    if (userRole !== ROLES.INTERN && userRole !== ROLES.TEAM_LEADER) {
      navigate('/dashboard');
    }
  }, [userRole, ROLES, navigate]);

  const validateForm = () => {
    const newErrors = {};

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const updateData = {
        workDone: formData.workDone,
        challenges: formData.challenges,
        planForTomorrow: formData.planForTomorrow,
        attachments: formData.attachments,
        hoursWorked: 8, // Default to 8 hours
        mood: 'neutral', // Default mood
      };

      const response = await apiService.submitDailyUpdate(updateData);

      if (response.data.success) {
        setSubmitSuccess(true);

        // Redirect after success message
        setTimeout(() => {
          navigate('/daily-updates');
        }, 2000);
      } else {
        throw new Error(response.data.message || 'Failed to submit update');
      }
    } catch (error) {
      console.error('Error submitting daily update:', error);

      // Show error message to user
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to submit update';
      setErrors({ submit: errorMessage });

      // If it's a validation error from backend, show specific errors
      if (error.response?.data?.errors) {
        const backendErrors = {};
        error.response.data.errors.forEach((err) => {
          if (err.param === 'workDone') backendErrors.workDone = err.msg;
          if (err.param === 'planForTomorrow')
            backendErrors.planForTomorrow = err.msg;
          if (err.param === 'challenges') backendErrors.challenges = err.msg;
        });
        setErrors(backendErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
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

  // Show loading if user is not loaded yet
  if (!user) {
    return (
      <div className="p-6 space-y-6">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading user data...</p>
          </Card>
        </div>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl mx-auto"
        >
          <Card className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiCheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              {hasExistingUpdate ? 'Update Saved!' : 'Daily Update Submitted!'}
            </h2>
            <p className="text-gray-600 mb-6">
              Your daily update has been{' '}
              {hasExistingUpdate ? 'updated' : 'submitted'} successfully. You'll
              be redirected to the updates page shortly.
            </p>
            <Button onClick={() => navigate('/daily-updates')}>
              View All Updates
            </Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center space-x-4"
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/daily-updates')}
        >
          <FiArrowLeft className="w-4 h-4 mr-2" />
          Back to Updates
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {hasExistingUpdate
              ? "Update Today's Submission"
              : 'Submit Daily Update'}
          </h1>
          <p className="text-gray-600 mt-1">
            Share your progress, challenges, and plans for tomorrow
          </p>
        </div>
      </motion.div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="max-w-4xl mx-auto"
      >
        <Card className="p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Daily Progress Update
                </h2>
                <p className="text-sm text-gray-500 mt-1 flex items-center">
                  <FiClock className="w-3 h-3 mr-1" />
                  {getCurrentTime()}
                </p>
              </div>
              <div className="text-right">
                <span className="text-sm text-gray-500">User: </span>
                <span className="text-sm font-medium text-gray-900">
                  {user?.name || user?.email?.split('@')[0]}
                </span>
              </div>
            </div>

            {/* Existing Update Notice */}
            {hasExistingUpdate && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg"
              >
                <div className="flex items-center">
                  <FiCheckCircle className="w-5 h-5 text-blue-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      You've already submitted an update for today
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      You can modify your submission until the daily cutoff
                      time.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
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
                onChange={(e) =>
                  handleInputChange('challenges', e.target.value)
                }
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
                onChange={(e) =>
                  handleInputChange('planForTomorrow', e.target.value)
                }
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

            {/* Submit Error */}
            {errors.submit && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{errors.submit}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/daily-updates')}
              >
                Cancel
              </Button>
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
      </motion.div>
    </div>
  );
};

export default SubmitDailyUpdate;
