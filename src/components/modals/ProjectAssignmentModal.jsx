import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiUsers, FiPlus, FiCheck, FiSave, FiSearch } from 'react-icons/fi';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

const ProjectAssignmentModal = ({
  isOpen,
  onClose,
  project = null,
  users = [],
  onSave,
  currentUserRole = null,
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
  const [internSearch, setInternSearch] = useState('');
  const [internDeptFilter, setInternDeptFilter] = useState('all');
  const [internPage, setInternPage] = useState(1);
  const internItemsPerPage = 5;

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
      // Parse current team members from project.teamMembers array
      const teamMembers = project.teamMembers || [];

      // Find current project manager (either from projectManager field or teamMembers with role)
      let currentPM = null;
      if (project.projectManager) {
        // If projectManager is populated
        const pmId = project.projectManager._id || project.projectManager.id || project.projectManager;
        currentPM = projectManagers.find((user) => user.id === pmId);
      }

      // If not found, look in teamMembers array
      if (!currentPM) {
        const pmMember = teamMembers.find((member) => member.role === 'project_manager');
        if (pmMember && pmMember.user) {
          const pmId = pmMember.user._id || pmMember.user.id || pmMember.user;
          currentPM = projectManagers.find((user) => user.id === pmId);
        }
      }

      // Get current team leaders from teamMembers
      const currentTLMembers = teamMembers.filter((member) => member.role === 'team_leader');
      const currentTLs = currentTLMembers
        .map((member) => {
          const userId = member.user?._id || member.user?.id || member.user;
          return teamLeaders.find((user) => user.id === userId);
        })
        .filter(Boolean);

      // Get current interns from teamMembers  
      const currentInternMembers = teamMembers.filter((member) => member.role === 'intern');
      const currentInterns = currentInternMembers
        .map((member) => {
          const userId = member.user?._id || member.user?.id || member.user;
          return interns.find((user) => user.id === userId);
        })
        .filter(Boolean);

      setAssignments({
        projectManager: currentPM,
        teamLeaders: currentTLs,
        interns: currentInterns,
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

  // Filter and paginate interns
  const filteredInterns = availableUsers.interns.filter((intern) => {
    const matchesSearch =
      intern.name.toLowerCase().includes(internSearch.toLowerCase()) ||
      intern.email.toLowerCase().includes(internSearch.toLowerCase());
    const matchesDept =
      internDeptFilter === 'all' || intern.department === internDeptFilter;
    return matchesSearch && matchesDept;
  });

  const totalInternPages = Math.ceil(
    filteredInterns.length / internItemsPerPage
  );
  const paginatedInterns = filteredInterns.slice(
    (internPage - 1) * internItemsPerPage,
    internPage * internItemsPerPage
  );

  // Reset intern page when filters change
  useEffect(() => {
    setInternPage(1);
  }, [internSearch, internDeptFilter]);

  // Unique departments for filter
  const departments = [
    'all',
    ...new Set(availableUsers.interns.map((u) => u.department)),
  ];

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
      (currentUserRole === 'admin' && assignments.projectManager ? 1 : 0) +
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
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Project Team Assignment
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {project
                    ? `Assign team members to "${project.name}"`
                    : 'Assign team members to project'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-400 dark:text-gray-500"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Assignment Summary */}
            <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <FiUsers className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-2" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Total Assigned: {getTotalAssigned()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {currentUserRole === 'admin' && (
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        PM: {assignments.projectManager ? 1 : 0}
                      </Badge>
                    )}
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      TL: {assignments.teamLeaders.length}
                    </Badge>
                    <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                      Interns: {assignments.interns.length}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Assignment Sections */}
            <div className="p-6 space-y-8">
              {/* Project Manager Section - Admin Only */}
              {currentUserRole === 'admin' && (
                <div>
                  <div className="flex items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Project Manager
                    </h3>
                    <Badge className="ml-3 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                      {assignments.projectManager ? 'Assigned' : 'Not Assigned'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availableUsers.projectManagers.map((pm) => (
                      <motion.div
                        key={pm.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${isUserAssigned(pm, 'pm')
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                          }`}
                        onClick={() => handleAssignPM(pm)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mr-3">
                              <span className="text-blue-600 dark:text-blue-400 font-medium text-sm">
                                {pm.name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {pm.name}
                              </h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {pm.department}
                              </p>
                            </div>
                          </div>
                          {isUserAssigned(pm, 'pm') && (
                            <FiCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Team Leaders Section */}
              <div>
                <div className="flex items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Team Leaders
                  </h3>
                  <Badge className="ml-3 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    {assignments.teamLeaders.length} Selected
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableUsers.teamLeaders.map((tl) => (
                    <motion.div
                      key={tl.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${isUserAssigned(tl, 'tl')
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                        }`}
                      onClick={() => handleToggleTL(tl)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mr-3">
                            <span className="text-green-600 dark:text-green-400 font-medium text-sm">
                              {tl.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {tl.name}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {tl.department}
                            </p>
                          </div>
                        </div>
                        {isUserAssigned(tl, 'tl') ? (
                          <FiCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <FiPlus className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Interns Section */}
              <div>
                <div className="flex items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Interns
                  </h3>
                  <Badge className="ml-3 bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                    {assignments.interns.length} Selected
                  </Badge>
                </div>
                <div className="space-y-4">
                  {/* Intern Filters */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <div className="flex-1 relative">
                      <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search interns..."
                        value={internSearch}
                        onChange={(e) => setInternSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>
                    <select
                      value={internDeptFilter}
                      onChange={(e) => setInternDeptFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="all">All Departments</option>
                      {departments.filter(d => d !== 'all').map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Interns Table */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 uppercase text-xs font-medium">
                        <tr>
                          <th className="px-4 py-3">Intern</th>
                          <th className="px-4 py-3">Department</th>
                          <th className="px-4 py-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                        {paginatedInterns.length > 0 ? (
                          paginatedInterns.map((intern) => (
                            <tr key={intern.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center">
                                  <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/50 rounded-full flex items-center justify-center mr-3">
                                    <span className="text-orange-600 dark:text-orange-400 font-medium text-xs">
                                      {intern.name
                                        .split(' ')
                                        .map((n) => n[0])
                                        .join('')}
                                    </span>
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-900 dark:text-white">{intern.name}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{intern.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                {intern.department}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  onClick={() => handleToggleIntern(intern)}
                                  className={`p-1.5 rounded-full transition-colors ${isUserAssigned(intern, 'intern')
                                    ? 'bg-orange-500 text-white hover:bg-orange-600'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                                >
                                  {isUserAssigned(intern, 'intern') ? (
                                    <FiCheck className="w-4 h-4" />
                                  ) : (
                                    <FiPlus className="w-4 h-4" />
                                  )}
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="3" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                              No interns found matching your criteria
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Intern Pagination */}
                  {totalInternPages > 1 && (
                    <div className="flex items-center justify-between pt-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Showing {(internPage - 1) * internItemsPerPage + 1} to {Math.min(internPage * internItemsPerPage, filteredInterns.length)} of {filteredInterns.length}
                      </p>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => setInternPage(p => Math.max(1, p - 1))}
                          disabled={internPage === 1}
                          className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 text-gray-600 dark:text-gray-400"
                        >
                          Prev
                        </button>
                        {[...Array(totalInternPages)].map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setInternPage(i + 1)}
                            className={`px-2 py-1 text-xs rounded ${internPage === i + 1
                              ? 'bg-indigo-600 text-white'
                              : 'border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                              }`}
                          >
                            {i + 1}
                          </button>
                        ))}
                        <button
                          onClick={() => setInternPage(p => Math.min(totalInternPages, p + 1))}
                          disabled={internPage === totalInternPages}
                          className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 text-gray-600 dark:text-gray-400"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400">
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
