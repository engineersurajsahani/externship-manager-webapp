import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiX,
  FiSave,
  FiCheckCircle,
  FiUser,
  FiTarget,
  FiCalendar,
} from "react-icons/fi";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import { useAuth } from "../../contexts/AuthContext";
import { apiService } from "../../services/api";

const ProjectUpdateModal = ({ isOpen, project, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    workDone: "Worked on project tasks and implementation",
    challenges: "",
    planForTomorrow: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasExistingUpdate, setHasExistingUpdate] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = "";
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const checkExistingUpdate = useCallback(async () => {
    if (!project || !user) return;

    try {
      // Check if there's already an update for this project today
      const response = await apiService.getMyUpdates();
      if (response.data.success && response.data.updates) {
        const today = new Date().toISOString().split("T")[0];
        const existingUpdate = response.data.updates.find((update) => {
          const updateDate = new Date(update.date).toISOString().split("T")[0];
          return updateDate === today && update.project?._id === project.id;
        });

        if (existingUpdate) {
          setHasExistingUpdate(true);
          setFormData({
            workDone: existingUpdate.workDone || "",
            challenges: existingUpdate.challenges || "",
            planForTomorrow: existingUpdate.planForTomorrow || "",
          });
        }
      }
    } catch (error) {
      // Silently fail - not critical to user flow
    }
  }, [project, user]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && project) {
      setFormData({
        workDone: "",
        challenges: "",
        planForTomorrow: "",
      });
      setErrors({});
      setHasExistingUpdate(false);
      checkExistingUpdate();
    }
  }, [isOpen, project, checkExistingUpdate]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.workDone.trim()) {
      newErrors.workDone = "Work done today is required";
    } else if (formData.workDone.trim().length < 10) {
      newErrors.workDone = "Please provide more detail (minimum 10 characters)";
    }

    if (!formData.planForTomorrow.trim()) {
      newErrors.planForTomorrow = "Plan for tomorrow is required";
    } else if (formData.planForTomorrow.trim().length < 10) {
      newErrors.planForTomorrow =
        "Please provide more detail (minimum 10 characters)";
    }

    if (formData.challenges.trim() && formData.challenges.trim().length < 5) {
      newErrors.challenges =
        "Please provide more detail if mentioning challenges";
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
        [field]: "",
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
        tasksCompleted: [
          `Worked on ${project.name}`,
          "Completed assigned tasks",
        ],
      };

      const response = await apiService.submitDailyUpdate(updateData);

      if (response.data.success) {
        // Dispatch custom event to notify calendar to refresh attendance
        window.dispatchEvent(new CustomEvent('daily-update-submitted'));
        console.log('[ProjectUpdateModal] Dispatched daily-update-submitted event');

        onSuccess();
      } else {
        throw new Error(response.data.message || "Failed to submit update");
      }
    } catch (error) {
      console.error("Error submitting daily update:", error);

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to submit update";
      setErrors({ submit: errorMessage });

      // Handle backend validation errors
      if (error.response?.data?.errors) {
        const backendErrors = {};
        error.response.data.errors.forEach((err) => {
          if (err.param === "workDone") backendErrors.workDone = err.msg;
          if (err.param === "planForTomorrow")
            backendErrors.planForTomorrow = err.msg;
          if (err.param === "challenges") backendErrors.challenges = err.msg;
        });
        setErrors(backendErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCurrentTime = () => {
    return new Date().toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getWordCount = (text) => {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  };

  if (!project) return null;

  const isCompleted = project.status === 'completed';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col transition-colors"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center transition-colors">
                    <FiTarget className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white transition-colors">
                      {hasExistingUpdate
                        ? "Update Submission"
                        : "Submit Daily Update"}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center transition-colors">
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
            <div className="p-6 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 transition-colors">
                    {project.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 transition-colors">
                    {project.description}
                  </p>
                  <div className="flex items-center space-x-4 text-xs">
                    {project.projectManager && (
                      <div className="flex items-center space-x-1">
                        <FiUser className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                        <span className="text-gray-500 dark:text-gray-400">PM:</span>
                        <span className="font-medium text-gray-700 dark:text-gray-200">
                          {project.projectManager.name}
                        </span>
                      </div>
                    )}
                    {project.teamLeader && (
                      <div className="flex items-center space-x-1">
                        <FiUser className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-500 dark:text-gray-400">TL:</span>
                        <span className="font-medium text-gray-700">
                          {project.teamLeader.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <Badge
                    className={`${project.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                  >
                    {project.status}
                  </Badge>
                  {project.technologies && project.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {project.technologies.slice(0, 3).map((tech, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                        >
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
                  className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg transition-colors"
                >
                  <div className="flex items-center">
                    <FiCheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        You've already submitted an update for this project
                        today
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        You can modify your submission until the daily cutoff
                        time.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Form Content */}
            <div className="flex-1 flex flex-col overflow-hidden min-h-0">
              <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
                  {/* Work Done Today */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                      What did you work on today for this project? *
                    </label>
                    <textarea
                      value={formData.workDone}
                      onChange={(e) =>
                        handleInputChange("workDone", e.target.value)
                      }
                      rows={4}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors ${errors.workDone ? "border-red-300 dark:border-red-900" : "border-gray-300 dark:border-gray-600"
                        }`}
                      placeholder={`Describe the specific tasks you completed for ${project.name}...`}
                      required
                    />
                    <div className="flex items-center justify-between mt-1">
                      {errors.workDone ? (
                        <p className="text-red-500 text-xs">{errors.workDone}</p>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-xs">
                          Be specific about your project contributions
                        </p>
                      )}
                      <span className="text-xs text-gray-400 dark:text-gray-500">
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
                        handleInputChange("challenges", e.target.value)
                      }
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors ${errors.challenges ? "border-red-300 dark:border-red-900" : "border-gray-300 dark:border-gray-600"
                        }`}
                      placeholder="Describe any project-specific blockers or difficulties..."
                    />
                    <div className="flex items-center justify-between mt-1">
                      {errors.challenges ? (
                        <p className="text-red-500 text-xs">
                          {errors.challenges}
                        </p>
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
                      value={formData.planForTomorrow}
                      onChange={(e) =>
                        handleInputChange("planForTomorrow", e.target.value)
                      }
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors ${errors.planForTomorrow ? "border-red-300 dark:border-red-900" : "border-gray-300 dark:border-gray-600"
                        }`}
                      placeholder={`Outline your goals and tasks for ${project.name} tomorrow...`}
                    />
                    <div className="flex items-center justify-between mt-1">
                      {errors.planForTomorrow ? (
                        <p className="text-red-500 text-xs">
                          {errors.planForTomorrow}
                        </p>
                      ) : (
                        <p className="text-gray-500 text-xs">
                          Outline your project priorities for tomorrow
                        </p>
                      )}
                      <span className="text-xs text-gray-400">
                        {getWordCount(formData.planForTomorrow)} words
                      </span>
                    </div>
                  </div>

                  {/* Submit Error */}
                  {errors.submit && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg transition-colors">
                      <p className="text-red-600 dark:text-red-400 text-sm">{errors.submit}</p>
                    </div>
                  )}
                </div>

                {/* Form Footer */}
                <div className="p-6 pt-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 transition-colors">
                  <div className="flex items-center justify-between">
                    <div></div>
                    <div className="flex items-center space-x-3">
                      <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                      </Button>
                      <div className="flex items-center space-x-3">
                        {isCompleted && (
                          <div className="text-sm text-red-600 dark:text-red-400 mr-2">This project is completed — updates and attendance cannot be submitted.</div>
                        )}
                        <Button
                          type="submit"
                          loading={isSubmitting}
                          className="min-w-32"
                          disabled={isCompleted}
                        >
                          <div className="flex items-center justify-center">
                            <FiSave className="w-4 h-4 mr-2" />
                            <span>{hasExistingUpdate ? "Update" : "Submit"}</span>
                          </div>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ProjectUpdateModal;
