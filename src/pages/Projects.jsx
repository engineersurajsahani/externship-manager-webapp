import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FiBriefcase,
  FiPlus,
  FiEdit3,
  FiUsers,
  FiCalendar,
  FiClock,
  FiActivity,
  FiMoreVertical,
  FiTrash2,
  FiEye,
  FiArchive,
  FiUserPlus,
  FiRefreshCw,
  FiCode,
  FiCheckCircle,
  FiAlertCircle,
  FiTarget,
  FiSave,
  FiX,
} from 'react-icons/fi';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import StatsCard from '../components/StatsCard';
import ProjectModal from '../components/modals/ProjectModal';
import ProjectAssignmentModal from '../components/modals/ProjectAssignmentModal';
import Portal from '../components/ui/Portal';
import { lockScroll, unlockScroll } from '../utils/scrollLock';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

const Projects = () => {
  const { hasRole, getUserRole, user, ROLES } = useAuth();
  const userRole = getUserRole();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // Modal states
  const [projectModal, setProjectModal] = useState({
    isOpen: false,
    mode: 'create',
    project: null,
  });

  const [assignmentModal, setAssignmentModal] = useState({
    isOpen: false,
    project: null,
  });

  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);

  // Load projects on component mount and set up polling for real-time updates
  React.useEffect(() => {
    // Only proceed if user is loaded
    if (!user) return;

    loadProjects();

    // Load users if user is admin, project manageri
    if (userRole === ROLES.ADMIN || userRole === ROLES.PROJECT_MANAGER) {
      loadUsers();
    }

    // Set up polling for real-time updates every 30 seconds
    const interval = setInterval(() => {
      loadProjects();
    }, 30000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userRole]);

  const loadProjects = async () => {
    try {
      // Admin should see ALL projects, PM should see only their assigned projects
      const response =
        userRole === ROLES.ADMIN
          ? await apiService.getAllProjects()
          : await apiService.getMyProjects();

      if (response.data.success) {
        setProjects(response.data.projects);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const loadUsers = async () => {
    try {
      let allUsers = [];

      if (userRole === ROLES.ADMIN) {
        // Admin can load all users at once
        const response = await apiService.getAllUsers();
        if (response.data.success) {
          allUsers = response.data.users || [];
        }
      } else if (userRole === ROLES.PROJECT_MANAGER || userRole === ROLES.TEAM_LEADER) {
        // Project managers and team leaders can load users by role for assignments
        try {
          const [pmResponse, tlResponse, internResponse] = await Promise.all([
            apiService.getUsersByRole('project_manager').catch(() => ({ data: { users: [] } })),
            apiService.getUsersByRole('team_leader').catch(() => ({ data: { users: [] } })),
            apiService.getUsersByRole('intern').catch(() => ({ data: { users: [] } }))
          ]);

          allUsers = [
            ...(pmResponse.data?.users || []),
            ...(tlResponse.data?.users || []),
            ...(internResponse.data?.users || [])
          ];
        } catch (error) {
          console.error('Error loading users by role:', error);
          allUsers = [];
        }
      }

      const normalizedUsers = allUsers.map((user) => ({
        ...user,
        id: user._id || user.id,
      }));

      setUsers(normalizedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    }
  };

  // CRUD Operations
  const handleCreateProject = () => {
    setProjectModal({
      isOpen: true,
      mode: 'create',
      project: null,
    });
  };

  const handleEditProject = (project) => {
    setProjectModal({
      isOpen: true,
      mode: 'edit',
      project: project,
    });
  };

  const handleViewProject = (project) => {
    setProjectModal({
      isOpen: true,
      mode: 'view',
      project: project,
    });
  };

  const handleManageTeam = (project) => {
    setAssignmentModal({
      isOpen: true,
      project: project,
    });
  };

  const handleArchiveProject = (projectId) => {
    if (
      window.confirm(
        'Are you sure you want to archive this project? It will be moved to archived status.'
      )
    ) {
      setProjects((prevProjects) =>
        prevProjects.map((project) => {
          if (project._id === projectId || project.id === projectId) {
            return { ...project, status: 'archived' };
          }
          return project;
        })
      );
    }
  };

  const handleDeleteProject = (projectId) => {
    if (
      window.confirm(
        'Are you sure you want to delete this project? This action cannot be undone.'
      )
    ) {
      setProjects((prevProjects) =>
        prevProjects.filter((project) => project.id !== projectId)
      );
    }
  };

  const handleSaveProject = async (projectData, mode) => {
    try {
      if (mode === 'create') {
        const response = await apiService.createProject(projectData);
        if (response.data.success) {
          // Refresh the projects list to get the latest data
          await loadProjects();
        }
      } else if (mode === 'edit') {
        const response = await apiService.updateProject(
          projectData._id,
          projectData
        );
        if (response.data.success) {
          // Refresh the projects list to get the latest data
          await loadProjects();
        }
      }

      setProjectModal({ isOpen: false, mode: 'create', project: null });
    } catch (error) {
      console.error('Error saving project:', error);
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Error saving project. Please try again.', type: 'error' } }));
    }
  };

  const handleSaveAssignments = async (assignmentData) => {
    try {
      const { projectManager, teamLeaders, interns, projectId } = assignmentData;
      if (!projectId) {
        throw new Error('Missing project identifier for assignment');
      }

      const resolveUserId = (member) => {
        if (!member) return null;
        if (typeof member === 'string') return member;

        const directId = member._id || member.id;
        if (directId) return directId;

        const nestedUser = member.user;
        if (!nestedUser) return null;
        if (typeof nestedUser === 'string') return nestedUser;
        return nestedUser._id || nestedUser.id || null;
      };

      // Extract IDs
      const pmId = resolveUserId(projectManager);
      const tlIds = (teamLeaders || []).map(resolveUserId).filter(Boolean);
      const internIds = (interns || []).map(resolveUserId).filter(Boolean);

      // Call bulk update endpoint
      await apiService.updateProjectTeam(projectId, {
        projectManager: pmId,
        teamLeaders: tlIds,
        interns: internIds
      });

      // Refresh projects to show updated team assignments
      await loadProjects();

      setAssignmentModal({ isOpen: false, project: null });

      // Show success message using UI toast
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Team assignments updated successfully! Changes will be visible to all users.', type: 'success' } }));
    } catch (error) {
      console.error('Error updating assignments:', error);
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Error updating team assignments. Please try again.', type: 'error' } }));
    }
  };

  const handleCloseModal = () => {
    setProjectModal({ isOpen: false, mode: 'create', project: null });
  };

  const handleCloseAssignmentModal = () => {
    setAssignmentModal({ isOpen: false, project: null });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'planning':
        return 'bg-yellow-100 text-yellow-800';
      case 'on-hold':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredProjects = projects.filter((project) => {
    if (selectedFilter === 'all') return true;
    return project.status === selectedFilter;
  });

  const projectStats = {
    total: projects.length,
    active: projects.filter((p) => p.status === 'active').length,
    completed: projects.filter((p) => p.status === 'completed').length,
    onHold: projects.filter((p) => p.status === 'on-hold').length,
  };

  // If user is an intern, show intern-specific projects view
  if (userRole === ROLES.INTERN) {
    return <InternProjectsView user={user} />;
  }

  // If user is a team leader, show team leader-specific projects view
  if (userRole === ROLES.TEAM_LEADER) {
    return <TeamLeaderProjectsView user={user} />;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-2">
            {userRole === ROLES.ADMIN
              ? 'Manage and track all projects in the system'
              : 'Manage and track your assigned project initiatives'}
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <Button variant="outline" size="sm">
            <FiActivity className="w-4 h-4 mr-2" />
            Activity
          </Button>
          <Button variant="primary" size="sm" onClick={handleCreateProject}>
            <FiPlus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Projects"
          value={projectStats.total.toString()}
          icon={FiBriefcase}
          color="blue"
          delay={0}
        />
        <StatsCard
          title="Active Projects"
          value={projectStats.active.toString()}
          icon={FiActivity}
          color="green"
          delay={0.1}
        />
        <StatsCard
          title="Completed"
          value={projectStats.completed.toString()}
          icon={FiClock}
          color="purple"
          delay={0.2}
        />
        <StatsCard
          title="On Hold"
          value={projectStats.onHold.toString()}
          icon={FiUsers}
          color="orange"
          delay={0.3}
        />
      </div>

      {/* Filters and View Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-2">
          <Button
            variant={selectedFilter === 'all' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter('all')}
          >
            All ({projects.length})
          </Button>
          <Button
            variant={selectedFilter === 'active' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter('active')}
          >
            Active ({projectStats.active})
          </Button>
          <Button
            variant={selectedFilter === 'completed' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter('completed')}
          >
            Completed ({projectStats.completed})
          </Button>
          <Button
            variant={selectedFilter === 'planning' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter('planning')}
          >
            Planning
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'grid' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            Grid
          </Button>
          <Button
            variant={viewMode === 'list' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            List
          </Button>
        </div>
      </div>

      {/* Projects Grid */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project, index) => (
            <motion.div
              key={project._id || project.id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 hover:shadow-lg transition-shadow h-full">
                <div className="flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg flex items-center justify-center mr-3 text-indigo-600 dark:text-indigo-400">
                        <FiBriefcase className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {project.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          PM: {project.projectManager?.firstName ? `${project.projectManager.firstName} ${project.projectManager.lastName || ''}` : 'Not Assigned'}
                        </p>
                      </div>
                    </div>
                    <div className="relative">
                      <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-400 dark:text-gray-500">
                        <FiMoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                    {project.description}
                  </p>

                  <div className="flex items-center justify-between mb-4">
                    <Badge className={getStatusColor(project.status)}>
                      {project.status
                        ? project.status.charAt(0).toUpperCase() +
                        project.status.slice(1).replace('_', ' ')
                        : 'Unknown'}
                    </Badge>
                    {project.priority && (
                      <Badge className={getPriorityColor(project.priority)}>
                        {project.priority.charAt(0).toUpperCase() +
                          project.priority.slice(1)}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <div className="flex items-center">
                      <FiUsers className="w-4 h-4 mr-1 text-gray-400" />
                      <span>
                        {project.teamMembers?.filter(m => m.role === 'team_leader').length || 0} TLs, {project.teamMembers?.filter(m => m.role === 'intern').length || 0} Interns
                      </span>
                    </div>
                    <div className="flex items-center">
                      <FiCalendar className="w-4 h-4 mr-1 text-gray-400" />
                      <span>
                        {project.endDate
                          ? new Date(project.endDate).toLocaleDateString()
                          : 'No end date'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 mt-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleViewProject(project)}
                    >
                      <FiEye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEditProject(project)}
                    >
                      <FiEdit3 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleManageTeam(project)}
                    >
                      <FiUserPlus className="w-4 h-4 mr-2" />
                      Team
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Projects List */}
      {viewMode === 'list' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Team
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredProjects.map((project) => (
                    <tr
                      key={project._id || project.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg flex items-center justify-center mr-3 text-indigo-600 dark:text-indigo-400">
                            <FiBriefcase className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {project.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              PM: {project.projectManager?.firstName ? `${project.projectManager.firstName} ${project.projectManager.lastName || ''}` : 'Not Assigned'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={getStatusColor(project.status)}>
                          {project.status
                            ? project.status.charAt(0).toUpperCase() +
                            project.status.slice(1).replace('_', ' ')
                            : 'Unknown'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                            <div
                              className="bg-indigo-600 h-2 rounded-full"
                              style={{ width: `${project.progress || 0}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {project.progress || 0}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <FiUsers className="w-4 h-4 mr-1 text-gray-400" />
                          {project.teamMembers?.filter(m => m.role === 'team_leader').length || 0} TLs
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {project.endDate
                          ? new Date(project.endDate).toLocaleDateString()
                          : 'No end date'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            className="text-indigo-600 hover:text-indigo-900"
                            onClick={() => handleViewProject(project)}
                            title="View Project"
                          >
                            <FiEye className="w-4 h-4" />
                          </button>
                          <button
                            className="text-gray-600 hover:text-gray-900"
                            onClick={() => handleEditProject(project)}
                            title="Edit Project"
                          >
                            <FiEdit3 className="w-4 h-4" />
                          </button>
                          <button
                            className="text-blue-600 hover:text-blue-900"
                            onClick={() => handleManageTeam(project)}
                            title="Manage Team"
                          >
                            <FiUserPlus className="w-4 h-4" />
                          </button>
                          <button
                            className="text-orange-600 hover:text-orange-900"
                            onClick={() =>
                              handleArchiveProject(project._id || project.id)
                            }
                            title="Archive Project"
                          >
                            <FiArchive className="w-4 h-4" />
                          </button>
                          {hasRole(ROLES.ADMIN) && (
                            <button
                              className="text-red-600 hover:text-red-900"
                              onClick={() =>
                                handleDeleteProject(project._id || project.id)
                              }
                              title="Delete Project"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Project Modal */}
      <ProjectModal
        isOpen={projectModal.isOpen}
        onClose={handleCloseModal}
        mode={projectModal.mode}
        project={projectModal.project}
        onSave={handleSaveProject}
      />

      {/* Project Assignment Modal */}
      <ProjectAssignmentModal
        isOpen={assignmentModal.isOpen}
        onClose={handleCloseAssignmentModal}
        project={assignmentModal.project}
        users={users}
        onSave={handleSaveAssignments}
        currentUserRole={getUserRole()}
      />
    </div>
  );
};

// Intern-specific Projects View
const InternProjectsView = ({ user }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showProjectModal, setShowProjectModal] = useState(false);

  React.useEffect(() => {
    loadInternProjects();

    // Set up polling for real-time updates every 30 seconds
    const interval = setInterval(() => {
      loadInternProjects();
    }, 30000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (showProjectModal) {
      lockScroll();
      return () => unlockScroll();
    }
    return undefined;
  }, [showProjectModal]);

  const loadInternProjects = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getMyProjects();
      if (response.data.success) {
        setProjects(response.data.projects);
      } else {
        setProjects([]);
      }
    } catch (error) {
      console.error('Error loading intern projects:', error);
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'on-hold':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTaskStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewProject = (project) => {
    setSelectedProject(project);
    setShowProjectModal(true);
  };

  const calculateDaysRemaining = (endDate, status) => {
    if (status === 'completed') return 'Completed';

    if (!endDate) return 'No end date';

    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const overdueDays = Math.abs(diffDays);
      return `${overdueDays} days overdue`;
    }

    if (diffDays === 0) {
      return 'Due today';
    }

    return `${diffDays} days remaining`;
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-96 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Projects</h1>
            <p className="text-gray-600 mt-2">
              View and track progress on your assigned projects
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 lg:mt-0">
            <Button
              variant="outline"
              onClick={loadInternProjects}
              disabled={isLoading}
            >
              <FiRefreshCw
                className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Projects Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {projects.length === 0 ? (
          <Card className="p-8 text-center">
            <FiBriefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Projects Found
            </h3>
            <p className="text-gray-600">
              You have not been assigned to any projects yet. Contact your team
              leader for more information.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <motion.div
                key={project._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Card className="p-6 hover:shadow-lg transition-all duration-300 h-full">
                  <div className="flex flex-col h-full">
                    {/* Project Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <FiBriefcase className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {project.name}
                          </h3>
                          {project.myRole && (
                            <p className="text-sm text-blue-600 font-medium">
                              {project.myRole}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge className={getStatusColor(project.status)}>
                        {project.status
                          ? project.status.charAt(0).toUpperCase() +
                          project.status.slice(1)
                          : 'Unknown'}
                      </Badge>
                    </div>

                    {/* Project Description */}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-1">
                      {project.description}
                    </p>

                    {/* Progress removed from cards */}

                    {/* Project Details */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-gray-600">
                          <FiCalendar className="w-4 h-4 mr-2" />
                          <span>Duration</span>
                        </div>
                        <div className="text-gray-900 text-right">
                          <div>
                            {new Date(project.startDate).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            to {new Date(project.endDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-gray-600">
                          <FiUsers className="w-4 h-4 mr-2" />
                          <span>Team Size</span>
                        </div>
                        <div className="text-gray-900">
                          {project.teamMembers?.length || 0} members
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-gray-600">
                          <FiClock className="w-4 h-4 mr-2" />
                          <span>Time Left</span>
                        </div>
                        <div
                          className={`font-medium text-right ${calculateDaysRemaining(project.endDate, project.status).includes('overdue') ? 'text-red-600' : calculateDaysRemaining(project.endDate, project.status).includes('remaining') && parseInt(calculateDaysRemaining(project.endDate, project.status)) < 30 ? 'text-orange-600' : 'text-gray-900'}`}
                        >
                          {calculateDaysRemaining(project.endDate, project.status)}
                        </div>
                      </div>
                    </div>

                    {/* Technologies */}
                    {project.technologies && (
                      <div className="mb-4">
                        <div className="flex items-center mb-2">
                          <FiCode className="w-4 h-4 mr-2 text-gray-600" />
                          <span className="text-sm font-medium text-gray-700">
                            Technologies
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {project.technologies.slice(0, 3).map((tech, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium"
                            >
                              {tech}
                            </span>
                          ))}
                          {project.technologies.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs">
                              +{project.technologies.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    <div className="mt-auto pt-2">
                      <Button
                        variant="outline"
                        onClick={() => handleViewProject(project)}
                        className="w-full"
                        leftIcon={<FiEye className="w-4 h-4" />}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Project Detail Modal */}
      {showProjectModal && selectedProject && (
        <Portal>
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <FiBriefcase className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedProject.name}
                    </h2>
                    {selectedProject.myRole && (
                      <p className="text-blue-600 font-medium">
                        {selectedProject.myRole}
                      </p>
                    )}
                    <Badge className={getStatusColor(selectedProject.status)}>
                      {selectedProject.status
                        ? selectedProject.status.charAt(0).toUpperCase() +
                        selectedProject.status.slice(1)
                        : 'Unknown'}
                    </Badge>
                  </div>
                </div>
                <button
                  onClick={() => setShowProjectModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Project Details */}
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Project Description
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {selectedProject.description}
                    </p>
                  </div>

                  {/* Technologies */}
                  {selectedProject.technologies && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Technologies
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedProject.technologies.map((tech, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tasks */}
                  {selectedProject.tasks && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        My Tasks
                      </h3>
                      <div className="space-y-3">
                        {selectedProject.tasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              {task.status === 'completed' ? (
                                <FiCheckCircle className="w-5 h-5 text-green-600" />
                              ) : (
                                <FiAlertCircle className="w-5 h-5 text-yellow-600" />
                              )}
                              <div>
                                <p className="font-medium text-gray-900">
                                  {task.title}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Due:{' '}
                                  {new Date(task.dueDate).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <Badge className={getTaskStatusColor(task.status)}>
                              {task.status.charAt(0).toUpperCase() +
                                task.status.slice(1)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Weekly Goals from Team Leader */}
                  {selectedProject.weeklyGoals &&
                    selectedProject.weeklyGoals.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                          <FiTarget className="w-5 h-5 inline mr-2 text-green-600" />
                          Weekly Goals
                        </h3>
                        <div className="space-y-3">
                          {selectedProject.weeklyGoals
                            .filter(
                              (goal) =>
                                goal.week ===
                                `Week of ${new Date().toLocaleDateString()}`
                            )
                            .map((goal) => (
                              <div
                                key={goal.id}
                                className={`p-4 border rounded-lg ${goal.status === 'current'
                                  ? 'bg-green-50 border-green-200'
                                  : 'bg-gray-50 border-gray-200'
                                  }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span
                                    className={`font-medium ${goal.status === 'current'
                                      ? 'text-green-800'
                                      : 'text-gray-700'
                                      }`}
                                  >
                                    {goal.week}
                                  </span>
                                  <div className="flex items-center space-x-2">
                                    <Badge
                                      className={
                                        goal.status === 'current'
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-gray-100 text-gray-800'
                                      }
                                    >
                                      {goal.status === 'current'
                                        ? 'Current Goal'
                                        : 'Completed'}
                                    </Badge>
                                  </div>
                                </div>
                                <p className="text-gray-700 mb-2">{goal.goal}</p>
                                <div className="flex items-center text-sm text-gray-500">
                                  <FiUsers className="w-3 h-3 mr-1" />
                                  <span>
                                    Set by{' '}
                                    {goal.setBy?.firstName && goal.setBy?.lastName
                                      ? `${goal.setBy.firstName} ${goal.setBy.lastName}`
                                      : 'Team Leader'}
                                  </span>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                  {/* Progress Overview removed */}

                  {/* Project Timeline */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Timeline</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Start Date:</span>
                        <span className="font-medium">
                          {new Date(
                            selectedProject.startDate
                          ).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">End Date:</span>
                        <span className="font-medium">
                          {new Date(selectedProject.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span
                          className={`font-medium ${calculateDaysRemaining(selectedProject.endDate, selectedProject.status).includes('overdue') ? 'text-red-600' : calculateDaysRemaining(selectedProject.endDate, selectedProject.status).includes('remaining') && parseInt(calculateDaysRemaining(selectedProject.endDate, selectedProject.status)) < 30 ? 'text-orange-600' : 'text-gray-900'}`}
                        >
                          {calculateDaysRemaining(selectedProject.endDate, selectedProject.status)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Team Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Team</h4>
                    <div className="space-y-3 text-sm">
                      {selectedProject.projectManager && (
                        <div>
                          <span className="text-gray-600">Project Manager:</span>
                          <p className="font-medium">
                            {selectedProject.projectManager.firstName}{' '}
                            {selectedProject.projectManager.lastName}
                          </p>
                          <p className="text-gray-500">
                            {selectedProject.projectManager.email}
                          </p>
                        </div>
                      )}
                      {selectedProject.teamLeader && (
                        <div>
                          <span className="text-gray-600">Team Leader:</span>
                          <p className="font-medium">
                            {selectedProject.teamLeader.firstName}{' '}
                            {selectedProject.teamLeader.lastName}
                          </p>
                          <p className="text-gray-500">
                            {selectedProject.teamLeader.email}
                          </p>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-600">Team Size:</span>
                        <p className="font-medium">
                          {selectedProject.teamSize} members
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </Portal>
      )}
    </div>
  );
};

// Team Leader-specific Projects View
const TeamLeaderProjectsView = ({ user }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalText, setGoalText] = useState('');
  const [selectedProjectForGoal, setSelectedProjectForGoal] = useState(null);

  React.useEffect(() => {
    loadTeamLeaderProjects();

    // Set up polling for real-time updates every 30 seconds
    const interval = setInterval(() => {
      loadTeamLeaderProjects();
    }, 30000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTeamLeaderProjects = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getMyProjects();
      if (response.data.success) {
        setProjects(response.data.projects);
      } else {
        setProjects([]);
      }
    } catch (error) {
      console.error('Error loading team leader projects:', error);
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'on-hold':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTaskStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewProject = (project) => {
    setSelectedProject(project);
    setShowProjectModal(true);
  };

  const handleSetWeeklyGoal = (project) => {
    setSelectedProjectForGoal(project);
    const currentWeek = `Week of ${new Date().toLocaleDateString()}`;
    const existingGoal = project.weeklyGoals?.find(
      (g) => g.week === currentWeek
    );
    setGoalText(existingGoal ? existingGoal.goal : '');
    setShowGoalModal(true);
  };

  const handleSaveWeeklyGoal = async () => {
    if (!goalText.trim() || !selectedProjectForGoal) return;

    try {
      const goalData = {
        goal: goalText.trim(),
        week: `Week of ${new Date().toLocaleDateString()}`,
      };

      const response = await apiService.addWeeklyGoal(
        selectedProjectForGoal._id,
        goalData
      );

      if (response.data.success) {
        // Reload projects to get updated data
        await loadTeamLeaderProjects();
        setShowGoalModal(false);
        setGoalText('');
        setSelectedProjectForGoal(null);
      } else {
        console.error('Failed to save weekly goal:', response.data.message);
        alert('Failed to save weekly goal. Please try again.');
      }
    } catch (error) {
      console.error('Error saving weekly goal:', error);
      alert('Error saving weekly goal. Please try again.');
    }
  };

  const calculateDaysRemaining = (endDate, status) => {
    if (status === 'completed') return 'Completed';

    if (!endDate) return 'No end date';

    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const overdueDays = Math.abs(diffDays);
      return `${overdueDays} days overdue`;
    }

    if (diffDays === 0) {
      return 'Due today';
    }

    return `${diffDays} days remaining`;
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-96 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Projects</h1>
            <p className="text-gray-600 mt-2">
              Manage your team projects and set weekly goals for your interns
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 lg:mt-0">
            <Button
              variant="outline"
              onClick={loadTeamLeaderProjects}
              disabled={isLoading}
            >
              <FiRefreshCw
                className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Projects Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {projects.length === 0 ? (
          <Card className="p-8 text-center">
            <FiBriefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Projects Found
            </h3>
            <p className="text-gray-600">
              You are not currently leading any projects. Contact your project
              manager for assignments.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <motion.div
                key={project._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Card className="p-6 hover:shadow-lg transition-all duration-300 h-full">
                  <div className="flex flex-col h-full">
                    {/* Project Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                          <FiBriefcase className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {project.name}
                          </h3>
                          {project.myRole && (
                            <p className="text-sm text-green-600 font-medium">
                              {project.myRole}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge className={getStatusColor(project.status)}>
                        {project.status
                          ? project.status.charAt(0).toUpperCase() +
                          project.status.slice(1)
                          : 'Unknown'}
                      </Badge>
                    </div>

                    {/* Project Description */}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-1">
                      {project.description}
                    </p>

                    {/* Progress removed from cards */}

                    {/* Project Details */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-gray-600">
                          <FiUsers className="w-4 h-4 mr-2" />
                          <span>Team Size</span>
                        </div>
                        <div className="text-gray-900">
                          {project.teamMembers?.length || 0} members
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-gray-600">
                          <FiUsers className="w-4 h-4 mr-2" />
                          <span>Interns</span>
                        </div>
                        <div className="text-gray-900">
                          {project.teamMembers?.filter(
                            (member) => member.role === 'intern'
                          )?.length || 0}{' '}
                          interns
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-gray-600">
                          <FiClock className="w-4 h-4 mr-2" />
                          <span>Time Left</span>
                        </div>
                        <div
                          className={`font-medium text-right ${calculateDaysRemaining(project.endDate, project.status).includes('overdue') ? 'text-red-600' : calculateDaysRemaining(project.endDate, project.status).includes('remaining') && parseInt(calculateDaysRemaining(project.endDate, project.status)) < 30 ? 'text-orange-600' : 'text-gray-900'}`}
                        >
                          {calculateDaysRemaining(project.endDate, project.status)}
                        </div>
                      </div>
                    </div>

                    {/* Technologies */}
                    {project.technologies && (
                      <div className="mb-4">
                        <div className="flex items-center mb-2">
                          <FiCode className="w-4 h-4 mr-2 text-gray-600" />
                          <span className="text-sm font-medium text-gray-700">
                            Technologies
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {project.technologies.slice(0, 3).map((tech, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-green-50 text-green-700 rounded-md text-xs font-medium"
                            >
                              {tech}
                            </span>
                          ))}
                          {project.technologies.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs">
                              +{project.technologies.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-auto pt-2 space-y-2">
                      <Button
                        variant="outline"
                        onClick={() => handleViewProject(project)}
                        className="w-full"
                        leftIcon={<FiEye className="w-4 h-4" />}
                      >
                        View Details
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => handleSetWeeklyGoal(project)}
                        className="w-full"
                        leftIcon={<FiTarget className="w-4 h-4" />}
                      >
                        Set Weekly Goal
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Weekly Goal Modal */}
      {showGoalModal && selectedProjectForGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-2xl w-full"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <FiTarget className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {goalText ? 'Update Weekly Goal' : 'Set Weekly Goal'}
                  </h2>
                  <p className="text-gray-600">{selectedProjectForGoal.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowGoalModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weekly Goal for {new Date().toLocaleDateString()}
              </label>
              <textarea
                value={goalText}
                onChange={(e) => setGoalText(e.target.value)}
                placeholder="Enter the weekly goal for your team (e.g., Complete user authentication module, Fix responsive design issues, etc.)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows={4}
              />
            </div>

            <div className="flex items-center justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowGoalModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveWeeklyGoal}
                disabled={!goalText.trim()}
                leftIcon={<FiSave className="w-4 h-4" />}
              >
                Save Goal
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Project Detail Modal - Similar to intern view but with team leader perspective */}
      {showProjectModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <FiBriefcase className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedProject.name}
                  </h2>
                  {selectedProject.myRole && (
                    <p className="text-green-600 font-medium">
                      {selectedProject.myRole}
                    </p>
                  )}
                  <Badge className={getStatusColor(selectedProject.status)}>
                    {selectedProject.status
                      ? selectedProject.status.charAt(0).toUpperCase() +
                      selectedProject.status.slice(1)
                      : 'Unknown'}
                  </Badge>
                </div>
              </div>
              <button
                onClick={() => setShowProjectModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Project Description
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {selectedProject.description}
                  </p>
                </div>

                {/* Team Members */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Team Members
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedProject.teamMembers?.map((member) => (
                      <div
                        key={member.user._id}
                        className="flex items-center p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white text-sm font-medium">
                            {member.user.firstName?.charAt(0) ||
                              member.user.email?.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {member.user.firstName && member.user.lastName
                              ? `${member.user.firstName} ${member.user.lastName}`
                              : member.user.email}
                          </p>
                          <p className="text-sm text-gray-600">
                            {member.role
                              ?.replace('_', ' ')
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </p>
                        </div>
                      </div>
                    )) || []}
                  </div>
                </div>

                {/* Tasks */}
                {selectedProject.tasks && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Team Tasks
                    </h3>
                    <div className="space-y-3">
                      {selectedProject.tasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            {task.status === 'completed' ? (
                              <FiCheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <FiAlertCircle className="w-5 h-5 text-yellow-600" />
                            )}
                            <div>
                              <p className="font-medium text-gray-900">
                                {task.title}
                              </p>
                              <p className="text-sm text-gray-600">
                                Due:{' '}
                                {new Date(task.dueDate).toLocaleDateString()} •
                                Assigned to: {task.assignedTo}
                              </p>
                            </div>
                          </div>
                          <Badge className={getTaskStatusColor(task.status)}>
                            {task.status.charAt(0).toUpperCase() +
                              task.status.slice(1)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Weekly Goals */}
                {selectedProject.weeklyGoals && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Weekly Goals
                    </h3>
                    <div className="space-y-3">
                      {selectedProject.weeklyGoals
                        .filter(
                          (goal) =>
                            goal.week ===
                            `Week of ${new Date().toLocaleDateString()}`
                        )
                        .map((goal) => (
                          <div
                            key={goal.id}
                            className="p-4 bg-green-50 border border-green-200 rounded-lg"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-green-800">
                                {goal.week}
                              </span>
                              <Badge
                                className={
                                  goal.status === 'current'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }
                              >
                                {goal.status === 'current'
                                  ? 'Current'
                                  : 'Completed'}
                              </Badge>
                            </div>
                            <p className="text-gray-700">{goal.goal}</p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar Info */}
              <div className="space-y-6">
                {/* Progress Overview removed */}

                {/* Project Timeline */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Timeline</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Start Date:</span>
                      <span className="font-medium">
                        {new Date(
                          selectedProject.startDate
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">End Date:</span>
                      <span className="font-medium">
                        {new Date(selectedProject.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span
                        className={`font-medium ${calculateDaysRemaining(selectedProject.endDate, selectedProject.status).includes('overdue') ? 'text-red-600' : calculateDaysRemaining(selectedProject.endDate, selectedProject.status).includes('remaining') && parseInt(calculateDaysRemaining(selectedProject.endDate, selectedProject.status)) < 30 ? 'text-orange-600' : 'text-gray-900'}`}
                      >
                        {calculateDaysRemaining(selectedProject.endDate, selectedProject.status)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Technologies */}
                {selectedProject.technologies && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">
                      Technologies
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedProject.technologies.map((tech, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-green-50 text-green-700 rounded-lg text-sm font-medium"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Projects;
