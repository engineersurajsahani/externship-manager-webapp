import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiUsers, FiPlus, FiCheck, FiSave } from 'react-icons/fi';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

const ProjectAssignmentModal = ({
  isOpen,
  onClose,
  project = null,
  users = [],
  onSave,
}) => {
  const [assignments, setAssignments] = useState({
    projectManager: null,
    teamLeaders: [],
    interns: [],
  });
  const [availableUsers, setAvailableUsers] = useState({
    projectManagers: [],
    teamLeaders: [],
    interns: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper function to get user's full name
  const getUserName = (user) => {
    if (user.name) return user.name;
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    if (user.firstName) return user.firstName;
    return user.email?.split('@')[0] || 'Unknown';
  };

  // Helper function to get user initials
  const getUserInitials = (user) => {
    const name = getUserName(user);
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  // Helper to get consistent user identifier
  const getUserId = (user) => user?._id || user?.id;

  useEffect(() => {
    if (isOpen && users.length > 0) {
      console.log('ProjectAssignmentModal - users:', users);
      
      // Filter users by role (support both short and long role names)
      const pms = users.filter(
        (user) => (user.role === 'pm' || user.role === 'project_manager') && 
                  (user.status === 'active' || !user.status)
      );
      const tls = users.filter(
        (user) => (user.role === 'tl' || user.role === 'team_leader') && 
                  (user.status === 'active' || !user.status)
      );
      const interns = users.filter(
        (user) => user.role === 'intern' && 
                  (user.status === 'active' || !user.status)
      );
      
      console.log('Filtered users:', { pms, tls, interns });

      setAvailableUsers({
        projectManagers: pms,
        teamLeaders: tls,
        interns: interns,
      });

      // Set current assignments if project exists
      if (project) {
        const currentPM =
          pms.find(
            (user) => getUserId(user)?.toString() === project.projectManager?._id?.toString()
          ) || null;
        const currentTLs = project.teamLeaders || [];
        const currentInterns = project.interns || [];

        setAssignments({
          projectManager: currentPM,
          teamLeaders: currentTLs
            .map((member) =>
              tls.find(
                (user) =>
                  getUserId(user)?.toString() ===
                  (member?._id || member?.user?._id || member?.user || member?.id)?.toString()
              )
            )
            .filter(Boolean),
          interns: currentInterns
            .map((member) =>
              interns.find(
                (user) =>
                  getUserId(user)?.toString() ===
                  (member?._id || member?.user?._id || member?.user || member?.id)?.toString()
              )
            )
            .filter(Boolean),
        });
      } else {
        setAssignments({
          projectManager: null,
          teamLeaders: [],
          interns: [],
        });
      }
    }
  }, [isOpen, users, project]);

  const handleAssignPM = (pm) => {
    setAssignments((prev) => ({
      ...prev,
      projectManager:
        getUserId(prev.projectManager)?.toString() === getUserId(pm)?.toString()
          ? null
          : pm,
    }));
  };

  const handleToggleTL = (tl) => {
    setAssignments((prev) => ({
      ...prev,
      teamLeaders: prev.teamLeaders.find(
        (user) => getUserId(user)?.toString() === getUserId(tl)?.toString()
      )
        ? prev.teamLeaders.filter(
            (user) => getUserId(user)?.toString() !== getUserId(tl)?.toString()
          )
        : [...prev.teamLeaders, tl],
    }));
  };

  const handleToggleIntern = (intern) => {
    setAssignments((prev) => ({
      ...prev,
      interns: prev.interns.find(
        (user) => getUserId(user)?.toString() === getUserId(intern)?.toString()
      )
        ? prev.interns.filter(
            (user) => getUserId(user)?.toString() !== getUserId(intern)?.toString()
          )
        : [...prev.interns, intern],
    }));
  };

  const handleSave = async () => {
    setIsSubmitting(true);

    try {
      const assignmentData = {
        projectManager: assignments.projectManager,
        teamLeaders: assignments.teamLeaders,
        interns: assignments.interns,
        projectId: project?._id || project?.id,
      };

      await onSave(assignmentData);
      onClose();
    } catch (error) {
      console.error('Error saving assignments:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTotalAssigned = () => {
    return (
      (assignments.projectManager ? 1 : 0) +
      assignments.teamLeaders.length +
      assignments.interns.length
    );
  };

  const isUserAssigned = (user, role) => {
    switch (role) {
      case 'pm':
        return (
          getUserId(assignments.projectManager)?.toString() ===
          getUserId(user)?.toString()
        );
      case 'tl':
        return assignments.teamLeaders.some(
          (tl) => getUserId(tl)?.toString() === getUserId(user)?.toString()
        );
      case 'intern':
        return assignments.interns.some(
          (intern) =>
            getUserId(intern)?.toString() === getUserId(user)?.toString()
        );
      default:
        return false;
    }
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-4xl max-h-[90vh] flex flex-col my-4"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="p-0 flex flex-col max-h-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Project Team Assignment
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {project
                    ? `Assign team members to "${project.name}"`
                    : 'Assign team members to project'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Assignment Summary */}
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <FiUsers className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-700">
                      Total Assigned: {getTotalAssigned()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-blue-100 text-blue-800">
                      PM: {assignments.projectManager ? 1 : 0}
                    </Badge>
                    <Badge className="bg-green-100 text-green-800">
                      TL: {assignments.teamLeaders.length}
                    </Badge>
                    <Badge className="bg-orange-100 text-orange-800">
                      Interns: {assignments.interns.length}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Assignment Sections */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 overscroll-contain">
              {/* Project Manager Section */}
              <div>
                <div className="flex items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Project Manager
                  </h3>
                  <Badge className="ml-3 bg-blue-100 text-blue-800">
                    {assignments.projectManager ? 'Assigned' : 'Not Assigned'}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableUsers.projectManagers.map((pm) => (
                    <motion.div
                      key={pm.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        isUserAssigned(pm, 'pm')
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                      onClick={() => handleAssignPM(pm)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-blue-600 font-medium text-sm">
                              {getUserInitials(pm)}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {getUserName(pm)}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {pm.department}
                            </p>
                          </div>
                        </div>
                        {isUserAssigned(pm, 'pm') && (
                          <FiCheck className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Team Leaders Section */}
              <div>
                <div className="flex items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Team Leaders
                  </h3>
                  <Badge className="ml-3 bg-green-100 text-green-800">
                    {assignments.teamLeaders.length} Selected
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableUsers.teamLeaders.map((tl) => (
                    <motion.div
                      key={tl.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        isUserAssigned(tl, 'tl')
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                      onClick={() => handleToggleTL(tl)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-green-600 font-medium text-sm">
                              {getUserInitials(tl)}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {getUserName(tl)}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {tl.department}
                            </p>
                          </div>
                        </div>
                        {isUserAssigned(tl, 'tl') ? (
                          <FiCheck className="w-5 h-5 text-green-600" />
                        ) : (
                          <FiPlus className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Interns Section */}
              <div>
                <div className="flex items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Interns
                  </h3>
                  <Badge className="ml-3 bg-orange-100 text-orange-800">
                    {assignments.interns.length} Selected
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableUsers.interns.map((intern) => (
                    <motion.div
                      key={intern.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        isUserAssigned(intern, 'intern')
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                      onClick={() => handleToggleIntern(intern)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-orange-600 font-medium text-sm">
                              {getUserInitials(intern)}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {getUserName(intern)}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {intern.department}
                            </p>
                          </div>
                        </div>
                        {isUserAssigned(intern, 'intern') ? (
                          <FiCheck className="w-5 h-5 text-orange-600" />
                        ) : (
                          <FiPlus className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between p-4 border-t border-gray-200 flex-shrink-0 bg-white">
              <div className="text-sm text-gray-500">
                {getTotalAssigned() > 0 && (
                  <span>
                    {getTotalAssigned()} team member
                    {getTotalAssigned() !== 1 ? 's' : ''} will be assigned
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSave}
                  loading={isSubmitting}
                >
                  <FiSave className="w-4 h-4 mr-2" />
                  Save Assignments
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ProjectAssignmentModal;
