import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiX, 
  FiSave, 
  FiClock, 
  FiCheckCircle, 
  FiUpload,
  FiUser,
  FiTarget,
  FiCalendar
} from 'react-icons/fi';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';

const ProjectUpdateModal = ({ isOpen, project, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    workDone: '',
    challenges: '',
    planTomorrow: '',
    hoursWorked: 8,
    mood: 'neutral'
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasExistingUpdate, setHasExistingUpdate] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && project) {
      setFormData({
        workDone: '',
        challenges: '',
        planTomorrow: '',
        hoursWorked: 8,
        mood: 'neutral'
      });
      setErrors({});
      setHasExistingUpdate(false);
      checkExistingUpdate();
    }
  }, [isOpen, project]);

  const checkExistingUpdate = async () => {
    if (!project || !user) return;
    
    try {
      // Check if there's already an update for this project today
      const response = await apiService.getMyUpdates();
      if (response.data.success && response.data.updates) {
        const today = new Date().toISOString().split('T')[0];
        const existingUpdate = response.data.updates.find(update => {
          const updateDate = new Date(update.date).toISOString().split('T')[0];
          return updateDate === today && update.project?._id === project.id;
        });

        if (existingUpdate) {
          setHasExistingUpdate(true);
          setFormData({
            workDone: existingUpdate.workDone || '',
            challenges: existingUpdate.challenges || '',
            planTomorrow: existingUpdate.planForTomorrow || '',
            hoursWorked: existingUpdate.hoursWorked || 8,
            mood: existingUpdate.mood || 'neutral'
          });
        }
      }
    } catch (error) {
      console.error('Error checking existing update:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.workDone.trim()) {
      newErrors.workDone = 'Work done today is required';
    } else if (formData.workDone.trim().length < 10) {
      newErrors.workDone = 'Please provide more detail (minimum 10 characters)';
    }

    if (!formData.planTomorrow.trim()) {
      newErrors.planTomorrow = 'Plan for tomorrow is required';
    } else if (formData.planTomorrow.trim().length < 10) {
      newErrors.planTomorrow = 'Please provide more detail (minimum 10 characters)';
    }

    if (formData.challenges.trim() && formData.challenges.trim().length < 5) {
      newErrors.challenges = 'Please provide more detail if mentioning challenges';
    }

    if (formData.hoursWorked < 1 || formData.hoursWorked > 12) {
      newErrors.hoursWorked = 'Hours worked must be between 1 and 12';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const updateData = {
        ...formData,
        project: project.id,
        // Include project-specific data
        tasksCompleted: [`Worked on ${project.name}`, 'Completed assigned tasks']
      };

      const response = await apiService.submitDailyUpdate(updateData);
      
      if (response.data.success) {
        onSuccess();
      } else {
        throw new Error(response.data.message || 'Failed to submit update');
      }
      
    } catch (error) {
      console.error('Error submitting daily update:', error);
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit update';
      setErrors({ submit: errorMessage });
      
      // Handle backend validation errors
      if (error.response?.data?.errors) {
        const backendErrors = {};
        error.response.data.errors.forEach(err => {
          if (err.param === 'workDone') backendErrors.workDone = err.msg;
          if (err.param === 'planForTomorrow') backendErrors.planTomorrow = err.msg;
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
      minute: '2-digit'
    });
  };

  const getWordCount = (text) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const getMoodColor = (mood) => {
    switch (mood) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'neutral': return 'bg-yellow-100 text-yellow-800';
      case 'challenging': return 'bg-orange-100 text-orange-800';
      case 'difficult': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!project) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FiTarget className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {hasExistingUpdate ? 'Update Submission' : 'Submit Daily Update'}
                    </h2>
                    <p className="text-sm text-gray-600 flex items-center">
                      <FiCalendar className="w-4 h-4 mr-1" />
                      {getCurrentTime()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="border-0"
                >
                  <FiX className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Project Info */}
            <div className="p-6 bg-gray-50 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{project.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{project.description}</p>
                  <div className="flex items-center space-x-4 text-xs">
                    {project.projectManager && (
                      <div className="flex items-center space-x-1">
                        <FiUser className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-500">PM:</span>
                        <span className="font-medium text-gray-700">{project.projectManager.name}</span>
                      </div>
                    )}
                    {project.teamLeader && (
                      <div className="flex items-center space-x-1">
                        <FiUser className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-500">TL:</span>
                        <span className="font-medium text-gray-700">{project.teamLeader.name}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <Badge className={`${project.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {project.status}
                  </Badge>
                  {project.technologies && project.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {project.technologies.slice(0, 3).map((tech, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {tech}
                        </span>
                      ))}
                      {project.technologies.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          +{project.technologies.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Existing Update Notice */}
              {hasExistingUpdate && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <div className="flex items-center">
                    <FiCheckCircle className="w-4 h-4 text-blue-600 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        You've already submitted an update for this project today
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        You can modify your submission until the daily cutoff time.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Form Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Work Done Today */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What did you work on today for this project? *
                  </label>
                  <textarea
                    value={formData.workDone}
                    onChange={(e) => handleInputChange('workDone', e.target.value)}
                    rows={4}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                      errors.workDone ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder={`Describe the specific tasks you completed for ${project.name}...`}
                  />
                  <div className="flex items-center justify-between mt-1">
                    {errors.workDone ? (
                      <p className="text-red-500 text-xs">{errors.workDone}</p>
                    ) : (
                      <p className="text-gray-500 text-xs">
                        Be specific about your project contributions
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
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                      errors.challenges ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Describe any project-specific blockers or difficulties..."
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
                    What do you plan to work on tomorrow for this project? *
                  </label>
                  <textarea
                    value={formData.planTomorrow}
                    onChange={(e) => handleInputChange('planTomorrow', e.target.value)}
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                      errors.planTomorrow ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder={`Outline your goals and tasks for ${project.name} tomorrow...`}
                  />
                  <div className="flex items-center justify-between mt-1">
                    {errors.planTomorrow ? (
                      <p className="text-red-500 text-xs">{errors.planTomorrow}</p>
                    ) : (
                      <p className="text-gray-500 text-xs">
                        Outline your project priorities for tomorrow
                      </p>
                    )}
                    <span className="text-xs text-gray-400">
                      {getWordCount(formData.planTomorrow)} words
                    </span>
                  </div>
                </div>

                {/* Hours Worked and Mood */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Hours Worked */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hours worked on this project
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={formData.hoursWorked}
                      onChange={(e) => handleInputChange('hoursWorked', parseInt(e.target.value) || 8)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.hoursWorked ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.hoursWorked && (
                      <p className="text-red-500 text-xs mt-1">{errors.hoursWorked}</p>
                    )}
                  </div>

                  {/* Mood */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      How was your day?
                    </label>
                    <select
                      value={formData.mood}
                      onChange={(e) => handleInputChange('mood', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="excellent">😁 Excellent</option>
                      <option value="good">😊 Good</option>
                      <option value="neutral">😐 Neutral</option>
                      <option value="challenging">😤 Challenging</option>
                      <option value="difficult">😓 Difficult</option>
                    </select>
                  </div>
                </div>

                {/* Submit Error */}
                {errors.submit && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{errors.submit}</p>
                  </div>
                )}
              </form>
            </div>

            {/* Footer */}
            <div className="p-6 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge className={getMoodColor(formData.mood)}>
                    {formData.mood}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {formData.hoursWorked}h planned
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    loading={isSubmitting}
                    className="min-w-32"
                  >
                    <FiSave className="w-4 h-4 mr-2" />
                    {hasExistingUpdate ? 'Update' : 'Submit'}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ProjectUpdateModal;