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

  useEffect(() => {
    if (!isOpen || users.length === 0) {
      return;
    }

    const normalizeRole = (role) => {
      const normalized = (role || '')
        .toString()
        .toLowerCase()
        .replace(/\s+/g, '_');

      if (['pm', 'project_manager', 'projectmanager'].includes(normalized)) {
        return 'pm';
      }
      if (['tl', 'team_leader', 'teamleader'].includes(normalized)) {
        return 'tl';
      }
      if (['intern', 'interns'].includes(normalized)) {
        return 'intern';
      }

      return normalized;
    };

    const normalizeUser = (user) => {
      const fullName =
        user.name ||
        [user.firstName, user.lastName].filter(Boolean).join(' ') ||
        user.email ||
        'Unknown User';

      return {
        ...user,
        id: user.id || user._id,
        name: fullName,
        department: user.department || 'General',
        status: user.status ? user.status.toLowerCase() : 'active',
        roleCategory: normalizeRole(user.role),
      };
    };

    const normalizedUsers = users.map(normalizeUser);
    const isActiveUser = (user) => user.status === 'active';

    const projectManagers = normalizedUsers.filter(
      (user) => user.roleCategory === 'pm' && isActiveUser(user)
    );
    const teamLeaders = normalizedUsers.filter(
      (user) => user.roleCategory === 'tl' && isActiveUser(user)
    );
    const interns = normalizedUsers.filter(
      (user) => user.roleCategory === 'intern' && isActiveUser(user)
    );

    setAvailableUsers({
      projectManagers,
      teamLeaders,
      interns,
    });

    if (project) {
      const currentPM =
        projectManagers.find((user) => user.name === project.lead) || null;
      const currentTLs = project.teamLeaders || [];
      const currentInterns = project.interns || [];

      const mapExistingMembers = (members, pool) =>
        members
          .map((member) => {
            if (typeof member === 'string') {
              return (
                pool.find((user) => user.name === member) ||
                pool.find((user) => user.email === member) ||
                pool.find((user) => user.id === member)
              );
            }

            if (member?.user) {
              const memberUser = member.user;
              const memberId = memberUser._id || memberUser.id;
              return (
                pool.find((user) => user.id === memberId) ||
                pool.find((user) => user.email === memberUser.email) ||
                pool.find((user) => user.name === memberUser.name)
              );
            }

            const memberId = member?._id || member?.id;
            return (
              pool.find((user) => user.id === memberId) ||
              pool.find((user) => user.email === member?.email) ||
              pool.find((user) => user.name === member?.name)
            );
          })
          .filter(Boolean);

      setAssignments({
        projectManager: currentPM,
        teamLeaders: mapExistingMembers(currentTLs, teamLeaders),
        interns: mapExistingMembers(currentInterns, interns),
      });
    } else {
      setAssignments({
        projectManager: null,
        teamLeaders: [],
        interns: [],
      });
    }
  }, [isOpen, users, project]);

  const handleAssignPM = (pm) => {
    setAssignments((prev) => ({
      ...prev,
      projectManager: prev.projectManager?.id === pm.id ? null : pm,
    }));
  };

  const handleToggleTL = (tl) => {
    setAssignments((prev) => ({
      ...prev,
      teamLeaders: prev.teamLeaders.find((user) => user.id === tl.id)
        ? prev.teamLeaders.filter((user) => user.id !== tl.id)
        : [...prev.teamLeaders, tl],
    }));
  };

  const handleToggleIntern = (intern) => {
    setAssignments((prev) => ({
      ...prev,
      interns: prev.interns.find((user) => user.id === intern.id)
        ? prev.interns.filter((user) => user.id !== intern.id)
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
        return assignments.projectManager?.id === user.id;
      case 'tl':
        return assignments.teamLeaders.some((tl) => tl.id === user.id);
      case 'intern':
        return assignments.interns.some((intern) => intern.id === user.id);
      default:
        return false;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        >
          <Card className="p-0">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
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
            <div className="p-6 bg-gray-50 border-b border-gray-200">
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
            <div className="p-6 space-y-8">
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
                              {pm.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {pm.name}
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
                              {tl.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {tl.name}
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
                              {intern.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {intern.name}
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
            <div className="flex items-center justify-between p-6 border-t border-gray-200">
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
