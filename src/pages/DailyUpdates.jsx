import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiEdit3,
  FiCalendar,
  FiClock,
  FiEye,
  FiFilter,
  FiUser,
  FiUsers,
  FiFolder,
  FiDownload,
  FiRefreshCw,
  FiTarget,
  FiCheckCircle,
  FiBriefcase,
  FiX,
} from 'react-icons/fi';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import ProjectUpdateModal from '../components/modals/ProjectUpdateModal';

const DailyUpdates = () => {
  const { getUserRole, ROLES, user } = useAuth();
  const navigate = useNavigate();
  const userRole = getUserRole();
  const [isLoading, setIsLoading] = useState(true);
  const [teamUpdates, setTeamUpdates] = useState([]);
  const [filteredUpdates, setFilteredUpdates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUpdate, setSelectedUpdate] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  // PM-specific filters
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedIntern, setSelectedIntern] = useState('all');
  const [projects, setProjects] = useState([]);
  const [interns, setInterns] = useState([]);
  // Recent updates filter for intern/TL
  const [recentFilter, setRecentFilter] = useState('recent3');
  const [showAllUpdates, setShowAllUpdates] = useState(false);

  // NEW: Project-specific states for interns
  const [userProjects, setUserProjects] = useState([]);
  const [projectUpdateModal, setProjectUpdateModal] = useState({
    isOpen: false,
    project: null,
  });
  const [todaysSubmissions, setTodaysSubmissions] = useState(new Set());
  const [loadingProjects, setLoadingProjects] = useState(false);

  // Load team updates data
  useEffect(() => {
    loadTeamUpdates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter updates based on filters
  useEffect(() => {
    console.log('🎀 Starting filtering process');
    console.log('🗺 Original teamUpdates:', teamUpdates);
    console.log('🗺 teamUpdates length:', teamUpdates.length);

    let filtered = teamUpdates;

    // Role-based filtering
    if (userRole === ROLES.INTERN || userRole === ROLES.TEAM_LEADER) {
      console.log('👑 Applying INTERN/TEAM_LEADER filters');
      // For interns and team leaders, apply recent updates filter
      if (userRole === ROLES.INTERN) {
        // Interns only see their own updates
        console.log('📱 Filtering for INTERN user:', user?.email);
        console.log('📱 Updates before intern filter:', filtered.length);
        filtered = filtered.filter((update) => {
          console.log(
            '🔍 Checking update:',
            update.userEmail,
            'vs',
            user?.email
          );
          return update.userEmail === user?.email;
        });
        console.log('📱 Updates after intern filter:', filtered.length);
      }

      if (!showAllUpdates) {
        // Apply recent filter
        const now = new Date();
        if (recentFilter === 'recent3') {
          // Show only recent 3 updates - ensure we have updates before slicing
          console.log('🔍 Applying recent3 filter, before:', filtered.length);
          // Always slice, even if there are fewer than 3 items
          filtered = filtered.slice(0, 3);
          console.log('🔍 After recent3 filter:', filtered.length);
        } else if (recentFilter === 'lastWeek') {
          const lastWeek = new Date(now);
          lastWeek.setDate(lastWeek.getDate() - 7);
          filtered = filtered.filter(
            (update) => new Date(update.date) >= lastWeek
          );
        } else if (recentFilter === 'thisMonth') {
          const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          filtered = filtered.filter(
            (update) => new Date(update.date) >= thisMonth
          );
        }
      }
    } else if (userRole === ROLES.PROJECT_MANAGER) {
      // Project filter for PM
      if (selectedProject !== 'all') {
        filtered = filtered.filter(
          (update) => update.projectId?.toString() === selectedProject
        );
      }

      // Intern filter for PM (within selected project)
      if (selectedIntern !== 'all') {
        filtered = filtered.filter(
          (update) => update.userEmail === selectedIntern
        );
      }
    }

    // Date and status filters - only apply if not intern/TL or if showing all updates
    if (
      !(userRole === ROLES.INTERN || userRole === ROLES.TEAM_LEADER) ||
      showAllUpdates
    ) {
      // Date filter
      if (selectedDate) {
        filtered = filtered.filter((update) => update.date === selectedDate);
      }

      // Status filter
      if (statusFilter !== 'all') {
        filtered = filtered.filter((update) => {
          if (statusFilter === 'pending')
            return !update.status || update.status === 'pending';
          if (statusFilter === 'submitted')
            return (
              update.status === 'submitted' || update.status === 'approved'
            );
          if (statusFilter === 'missing') return update.status === 'missing';
          return true;
        });
      }
    }

    console.log('🎆 Final filtered updates:', filtered);
    console.log('🎆 Final filtered updates length:', filtered.length);

    setFilteredUpdates(filtered);
  }, [
    teamUpdates,
    selectedDate,
    statusFilter,
    selectedProject,
    selectedIntern,
    userRole,
    ROLES.INTERN,
    ROLES.TEAM_LEADER,
    ROLES.PROJECT_MANAGER,
    user,
    recentFilter,
    showAllUpdates,
  ]);

  const loadTeamUpdates = async () => {
    setIsLoading(true);
    try {
      let dailyUpdates = [];

      // Try to fetch from API first
      try {
        let apiResponse;

        console.log('🔍 Fetching updates for role:', userRole);
        console.log('📧 Current user:', user?.email);

        if (userRole === ROLES.INTERN) {
          // Interns only get their own updates
          console.log('📱 Fetching MY updates as INTERN');
          apiResponse = await apiService.getMyUpdates();
        } else if (userRole === ROLES.TEAM_LEADER) {
          // Team leaders get their team's updates
          console.log('👥 Fetching TEAM updates as TEAM_LEADER');
          apiResponse = await apiService.getTeamUpdates();
        } else if (userRole === ROLES.PROJECT_MANAGER) {
          // Project managers get all updates from their projects
          console.log('📊 Fetching TEAM updates as PROJECT_MANAGER');
          apiResponse = await apiService.getTeamUpdates();
        } else {
          // Admin gets all updates
          console.log('🔒 Fetching ALL updates as ADMIN');
          apiResponse = await apiService.getAllUpdates();
        }

        console.log('🌐 API Response:', apiResponse);

        if (apiResponse.data.success) {
          console.log('📜 Raw updates from API:', apiResponse.data.updates);
          // Ensure updates array exists
          const updates = apiResponse.data.updates || [];
          console.log('🔢 Number of raw updates:', updates.length);

          // Process all updates regardless of length
          dailyUpdates = updates.map((update) => ({
            id: update._id,
            userEmail: update.user?.email || 'unknown@example.com',
            userName: update.user
              ? `${update.user.firstName} ${update.user.lastName}`
              : 'Unknown User',
            userRole: update.user?.role || 'intern',
            department: update.user?.department || 'Unknown',
            date: new Date(update.date).toISOString().split('T')[0],
            timestamp: update.createdAt,
            workDone: update.workDone,
            challenges: update.challenges,
            planForTomorrow: update.planForTomorrow,
            status: 'submitted',
            projectId: update.project?._id || null,
            projectName: update.project?.name || 'No Project Assigned',
          }));

          console.log('🔄 Processed all updates, count:', dailyUpdates.length);

          console.log('🔧 Processed updates:', dailyUpdates);
          console.log('🔢 Number of processed updates:', dailyUpdates.length);
        }
      } catch (apiError) {
        console.error('Failed to fetch updates from API:', apiError);

        // Show user-friendly error message
        if (
          apiError.code === 'ECONNREFUSED' ||
          apiError.message.includes('Network Error')
        ) {
          console.warn(
            'Cannot connect to database. Make sure your backend server is running on http://localhost:5050'
          );
        }

        // No fallback to localStorage since we're using MongoDB
        dailyUpdates = [];
      }

      // Sort by date (newest first)
      dailyUpdates.sort(
        (a, b) =>
          new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date)
      );

      console.log('🗒 Sorted updates:', dailyUpdates);
      console.log('📦 Setting team updates with', dailyUpdates.length, 'items');

      setTeamUpdates(dailyUpdates);

      // Set unique interns for PM filtering
      const uniqueInterns = [
        ...new Set(dailyUpdates.map((update) => update.userEmail)),
      ].map((email) => {
        const update = dailyUpdates.find((u) => u.userEmail === email);
        return {
          email: email,
          name: update.userName,
        };
      });
      setInterns(uniqueInterns);

      // Set projects for PM filtering
      const uniqueProjects = [
        ...new Set(
          dailyUpdates.map((update) => update.projectId).filter((id) => id)
        ),
      ].map((id) => {
        const update = dailyUpdates.find((u) => u.projectId === id);
        return {
          id: id,
          name: update.projectName,
        };
      });
      setProjects(uniqueProjects);
    } catch (error) {
      console.error('Error loading team updates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // NEW: Load user's assigned projects (for interns)
  const loadUserProjects = async () => {
    if (userRole !== ROLES.INTERN) return;

    setLoadingProjects(true);
    try {
      const response = await apiService.getMyProjects();
      if (response.data.success && response.data.projects) {
        const projectsWithDetails = response.data.projects.map((project) => ({
          id: project._id,
          name: project.name,
          description: project.description,
          status: project.status,
          projectManager: project.projectManager
            ? {
                name: `${project.projectManager.firstName} ${project.projectManager.lastName}`,
                email: project.projectManager.email,
              }
            : null,
          teamLeader: project.teamMembers?.find(
            (member) => member.role === 'team_leader'
          )?.user
            ? {
                name: `${project.teamMembers.find((member) => member.role === 'team_leader').user.firstName} ${project.teamMembers.find((member) => member.role === 'team_leader').user.lastName}`,
                email: project.teamMembers.find(
                  (member) => member.role === 'team_leader'
                ).user.email,
              }
            : null,
          technologies: project.technologies || [],
          startDate: project.startDate,
          endDate: project.endDate,
        }));
        setUserProjects(projectsWithDetails);

        // Check today's submissions for each project
        await checkTodaysSubmissions(projectsWithDetails);
      }
    } catch (error) {
      console.error('Error loading user projects:', error);
    } finally {
      setLoadingProjects(false);
    }
  };

  // NEW: Check which projects have today's submissions
  const checkTodaysSubmissions = async (projects) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const submissions = new Set();

      for (const project of projects) {
        // Check if user has submitted for this project today
        const userTodayUpdates = teamUpdates.filter(
          (update) =>
            update.userEmail === user?.email &&
            update.date === today &&
            update.projectId === project.id
        );

        if (userTodayUpdates.length > 0) {
          submissions.add(project.id);
        }
      }

      setTodaysSubmissions(submissions);
    } catch (error) {
      console.error('Error checking today submissions:', error);
    }
  };

  // NEW: Load projects when component mounts (for interns)
  useEffect(() => {
    if (userRole === ROLES.INTERN) {
      loadUserProjects();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole, teamUpdates]); // Re-run when teamUpdates changes

  // NEW: Handle project-specific update submission
  const handleProjectUpdateSubmit = (project) => {
    setProjectUpdateModal({ isOpen: true, project });
  };

  // NEW: Handle update submission success
  const handleUpdateSuccess = () => {
    setProjectUpdateModal({ isOpen: false, project: null });
    // Reload data
    loadTeamUpdates();
    loadUserProjects();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted':
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'missing':
        return 'bg-red-100 text-red-800';
      case 'late':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewUpdate = (update) => {
    setSelectedUpdate(update);
    setShowUpdateModal(true);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
          <div className="h-96 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  // Render for Interns: Project-specific interface
  if (userRole === ROLES.INTERN) {
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
              <h1 className="text-3xl font-bold text-gray-900">
                My Project Updates
              </h1>
              <p className="text-gray-600 mt-2">
                Submit daily updates for each project you're assigned to and
                track your progress
              </p>
            </div>
            <div className="flex items-center space-x-3 mt-4 lg:mt-0">
              <Button
                variant="outline"
                onClick={loadUserProjects}
                disabled={loadingProjects}
              >
                <FiRefreshCw
                  className={`w-4 h-4 mr-2 ${loadingProjects ? 'animate-spin' : ''}`}
                />
                Refresh
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Project Cards */}
        {loadingProjects ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <Card className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
                  <div className="h-10 bg-gray-200 rounded w-32"></div>
                </Card>
              </div>
            ))}
          </div>
        ) : userProjects.length === 0 ? (
          <Card className="p-8 text-center">
            <FiBriefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Projects Assigned
            </h3>
            <p className="text-gray-500">
              You haven't been assigned to any projects yet. Contact your team
              leader or project manager.
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {userProjects.map((project, index) => {
                const hasSubmittedToday = todaysSubmissions.has(project.id);

                return (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <Card
                      className={`p-6 relative overflow-hidden ${
                        hasSubmittedToday
                          ? 'border-green-200 bg-green-50/30'
                          : 'border-gray-200 hover:border-blue-300 hover:shadow-lg'
                      } transition-all`}
                    >
                      {/* Status indicator */}
                      <div
                        className={`absolute top-0 right-0 w-2 h-full ${
                          hasSubmittedToday ? 'bg-green-500' : 'bg-orange-400'
                        }`}
                      ></div>

                      {/* Project Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <FiTarget className="w-5 h-5 text-blue-600" />
                            <h3 className="text-lg font-semibold text-gray-900">
                              {project.name}
                            </h3>
                            <Badge
                              className={`${
                                project.status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {project.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {project.description}
                          </p>
                        </div>
                        {hasSubmittedToday && (
                          <div className="ml-4">
                            <FiCheckCircle className="w-6 h-6 text-green-600" />
                          </div>
                        )}
                      </div>

                      {/* Project Details */}
                      <div className="space-y-3 mb-6">
                        {/* Team Information */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          {project.projectManager && (
                            <div className="flex items-center space-x-1">
                              <FiUser className="w-3 h-3 text-gray-400" />
                              <span className="text-gray-500">PM:</span>
                              <span className="font-medium text-gray-700">
                                {project.projectManager.name}
                              </span>
                            </div>
                          )}
                          {project.teamLeader && (
                            <div className="flex items-center space-x-1">
                              <FiUser className="w-3 h-3 text-gray-400" />
                              <span className="text-gray-500">TL:</span>
                              <span className="font-medium text-gray-700">
                                {project.teamLeader.name}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Technologies */}
                        {project.technologies &&
                          project.technologies.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {project.technologies
                                .slice(0, 4)
                                .map((tech, techIndex) => (
                                  <span
                                    key={techIndex}
                                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                                  >
                                    {tech}
                                  </span>
                                ))}
                              {project.technologies.length > 4 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                  +{project.technologies.length - 4}
                                </span>
                              )}
                            </div>
                          )}

                        {/* Project Timeline */}
                        <div className="flex items-center text-xs text-gray-500">
                          <FiCalendar className="w-3 h-3 mr-1" />
                          <span>
                            {new Date(project.startDate).toLocaleDateString()} -{' '}
                            {new Date(project.endDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>


                      {/* Action Button */}
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          Project-specific attendance tracking
                        </div>
                        <Button
                          onClick={() => handleProjectUpdateSubmit(project)}
                          className={`${
                            hasSubmittedToday
                              ? 'bg-blue-600 hover:bg-blue-700'
                              : 'bg-green-600 hover:bg-green-700'
                          }`}
                          size="sm"
                        >
                          <FiEdit3 className="w-4 h-4 mr-2" />
                          {hasSubmittedToday
                            ? 'Update Submission'
                            : 'Submit Update'}
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        )}

        {/* Update History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Recent Updates
              </h2>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <FiFilter className="w-4 h-4 text-gray-400" />
                  <select
                    value={recentFilter}
                    onChange={(e) => setRecentFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    disabled={showAllUpdates}
                  >
                    <option value="recent3">Recent 3 Updates</option>
                    <option value="lastWeek">Last Week</option>
                    <option value="thisMonth">This Month</option>
                  </select>
                  <Button
                    variant={showAllUpdates ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setShowAllUpdates(!showAllUpdates)}
                  >
                    {showAllUpdates ? 'Show Filtered' : 'Show All'}
                  </Button>
                </div>
                <span className="text-sm text-gray-500">
                  {filteredUpdates.length} updates found
                </span>
              </div>
            </div>

            {filteredUpdates.length === 0 ? (
              <div className="text-center py-8">
                <FiEdit3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No updates found</p>
                <p className="text-sm text-gray-400">
                  Start submitting daily updates to see them here
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredUpdates.map((update, index) => (
                  <motion.div
                    key={update.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * (index % 10) }}
                    className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                          <FiTarget className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {update.projectName}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Daily Update Submission
                          </p>
                          <div className="flex items-center space-x-2 text-xs text-gray-400">
                            <FiCalendar className="w-3 h-3" />
                            <span>
                              {new Date(update.date).toLocaleDateString()}
                            </span>
                            <span>•</span>
                            <FiClock className="w-3 h-3" />
                            <span>
                              {new Date(
                                update.timestamp || update.date
                              ).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Badge className={getStatusColor(update.status)}>
                          {update.status.charAt(0).toUpperCase() +
                            update.status.slice(1)}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewUpdate(update)}
                        >
                          <FiEye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 ml-14">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <h4 className="font-medium text-gray-700 mb-1">
                            Work Done:
                          </h4>
                          <p className="text-gray-600 line-clamp-2">
                            {update.workDone || 'No details provided'}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-700 mb-1">
                            Challenges:
                          </h4>
                          <p className="text-gray-600 line-clamp-2">
                            {update.challenges || 'None mentioned'}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-700 mb-1">
                            Tomorrow's Plan:
                          </h4>
                          <p className="text-gray-600 line-clamp-2">
                            {update.planForTomorrow || 'No plan provided'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Project Update Modal */}
        <ProjectUpdateModal
          isOpen={projectUpdateModal.isOpen}
          project={projectUpdateModal.project}
          onClose={() =>
            setProjectUpdateModal({ isOpen: false, project: null })
          }
          onSuccess={handleUpdateSuccess}
        />

        {/* Update Detail Modal */}
        {showUpdateModal && selectedUpdate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Daily Update Details
                </h2>
                <button
                  onClick={() => setShowUpdateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <FiTarget className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {selectedUpdate.projectName}
                    </h3>
                    <p className="text-sm text-gray-500">Project Update</p>
                    <div className="flex items-center space-x-2 text-xs text-gray-400">
                      <FiCalendar className="w-3 h-3" />
                      <span>
                        {new Date(selectedUpdate.date).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <FiClock className="w-3 h-3" />
                      <span>
                        {new Date(
                          selectedUpdate.timestamp || selectedUpdate.date
                        ).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  <Badge className={getStatusColor(selectedUpdate.status)}>
                    {selectedUpdate.status.charAt(0).toUpperCase() +
                      selectedUpdate.status.slice(1)}
                  </Badge>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-2">
                    What was accomplished:
                  </h4>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {selectedUpdate.workDone || 'No details provided'}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-2">
                    Challenges faced:
                  </h4>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {selectedUpdate.challenges || 'None mentioned'}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-2">
                    Plan for tomorrow:
                  </h4>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {selectedUpdate.planForTomorrow || 'No plan provided'}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    );
  }

  // Original interface for non-interns (Team Leaders, PMs, Admins)
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
            <h1 className="text-3xl font-bold text-gray-900">
              {userRole === ROLES.ADMIN
                ? 'All Daily Updates'
                : userRole === ROLES.PROJECT_MANAGER
                  ? 'Project Team Updates'
                  : userRole === ROLES.TEAM_LEADER
                    ? 'Team Daily Updates'
                    : 'Daily Updates'}
            </h1>
            <p className="text-gray-600 mt-2">
              {userRole === ROLES.ADMIN
                ? 'Monitor and manage daily submissions across the entire system'
                : userRole === ROLES.PROJECT_MANAGER
                  ? 'Review updates from all teams in your assigned projects'
                  : userRole === ROLES.TEAM_LEADER
                    ? 'Review daily updates from your assigned interns'
                    : 'Submit your daily progress updates and track consistency'}
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 lg:mt-0">
            {userRole === ROLES.TEAM_LEADER && (
              <Button
                onClick={() => navigate('/daily-updates/submit')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <FiEdit3 className="w-4 h-4 mr-2" />
                Submit Update
              </Button>
            )}
            <Button
              variant="outline"
              onClick={loadTeamUpdates}
              disabled={isLoading}
            >
              <FiRefreshCw
                className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
            <Button variant="outline">
              <FiDownload className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Filters - Only show for PM/Admin or when Intern/TL clicks Show All */}
      {(!(userRole === ROLES.INTERN || userRole === ROLES.TEAM_LEADER) ||
        showAllUpdates) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
              {/* Date Filter */}
              <div className="flex items-center space-x-2">
                <FiCalendar className="w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center space-x-2">
                <FiFilter className="w-4 h-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="submitted">Submitted</option>
                  <option value="pending">Pending</option>
                  <option value="missing">Missing</option>
                </select>
              </div>

              {/* Project Filter (PM only) */}
              {userRole === ROLES.PROJECT_MANAGER && (
                <div className="flex items-center space-x-2">
                  <FiFolder className="w-4 h-4 text-gray-400" />
                  <select
                    value={selectedProject}
                    onChange={(e) => {
                      setSelectedProject(e.target.value);
                      // Reset intern filter when project changes
                      setSelectedIntern('all');
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Projects</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id.toString()}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Intern Filter (PM only, filtered by project) */}
              {userRole === ROLES.PROJECT_MANAGER && (
                <div className="flex items-center space-x-2">
                  <FiUsers className="w-4 h-4 text-gray-400" />
                  <select
                    value={selectedIntern}
                    onChange={(e) => setSelectedIntern(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={selectedProject === 'all'}
                  >
                    <option value="all">
                      {selectedProject === 'all'
                        ? 'Select Project First'
                        : 'All Interns'}
                    </option>
                    {selectedProject !== 'all' &&
                      interns
                        .filter((intern) => {
                          // Filter interns by selected project
                          const internUpdates = teamUpdates.filter(
                            (update) =>
                              update.userEmail === intern.email &&
                              update.projectId?.toString() === selectedProject
                          );
                          return internUpdates.length > 0;
                        })
                        .map((intern) => (
                          <option key={intern.email} value={intern.email}>
                            {intern.name}
                          </option>
                        ))}
                  </select>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Updates List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Update History
            </h2>
            <div className="flex items-center space-x-4">
              {/* Recent Updates Filter (Intern/Team Leader only) */}
              {(userRole === ROLES.INTERN ||
                userRole === ROLES.TEAM_LEADER) && (
                <div className="flex items-center space-x-2">
                  <FiFilter className="w-4 h-4 text-gray-400" />
                  <select
                    value={recentFilter}
                    onChange={(e) => setRecentFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    disabled={showAllUpdates}
                  >
                    <option value="recent3">Recent 3 Updates</option>
                    <option value="lastWeek">Last Week</option>
                    <option value="thisMonth">This Month</option>
                  </select>
                  <Button
                    variant={showAllUpdates ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setShowAllUpdates(!showAllUpdates)}
                  >
                    {showAllUpdates ? 'Show Filtered' : 'Show All'}
                  </Button>
                </div>
              )}
              <span className="text-sm text-gray-500">
                {filteredUpdates.length} updates found
              </span>
            </div>
          </div>

          {filteredUpdates.length === 0 ? (
            <div className="text-center py-8">
              <FiEdit3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                No updates found for the selected criteria
              </p>
              <p className="text-sm text-gray-400">
                Try adjusting your filters or search terms
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUpdates.map((update, index) => (
                <motion.div
                  key={update.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * (index % 10) }}
                  className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <FiUser className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {update.userName}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {update.userEmail}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-gray-400">
                          <span>
                            {update.department} • {update.userRole}
                          </span>
                          {update.projectName && (
                            <>
                              <span>•</span>
                              <div className="flex items-center">
                                <FiFolder className="w-3 h-3 mr-1" />
                                <span>{update.projectName}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Badge className={getStatusColor(update.status)}>
                        {update.status.charAt(0).toUpperCase() +
                          update.status.slice(1)}
                      </Badge>
                      <div className="text-right text-sm text-gray-500">
                        <div className="flex items-center">
                          <FiCalendar className="w-3 h-3 mr-1" />
                          {new Date(update.date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center mt-1">
                          <FiClock className="w-3 h-3 mr-1" />
                          {new Date(
                            update.timestamp || update.date
                          ).toLocaleTimeString()}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewUpdate(update)}
                      >
                        <FiEye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 ml-14">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <h4 className="font-medium text-gray-700 mb-1">
                          Work Done:
                        </h4>
                        <p className="text-gray-600 line-clamp-2">
                          {update.workDone || 'No details provided'}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-700 mb-1">
                          Challenges:
                        </h4>
                        <p className="text-gray-600 line-clamp-2">
                          {update.challenges || 'None mentioned'}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-700 mb-1">
                          Tomorrow's Plan:
                        </h4>
                        <p className="text-gray-600 line-clamp-2">
                          {update.planForTomorrow || 'No plan provided'}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      </motion.div>

      {/* Update Detail Modal */}
      {showUpdateModal && selectedUpdate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Daily Update Details
              </h2>
              <button
                onClick={() => setShowUpdateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <FiUser className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {selectedUpdate.userName}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {selectedUpdate.userEmail}
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-gray-400">
                    <span>
                      {selectedUpdate.department} • {selectedUpdate.userRole}
                    </span>
                    {selectedUpdate.projectName && (
                      <>
                        <span>•</span>
                        <div className="flex items-center">
                          <FiFolder className="w-3 h-3 mr-1" />
                          <span>{selectedUpdate.projectName}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <Badge className={getStatusColor(selectedUpdate.status)}>
                  {selectedUpdate.status.charAt(0).toUpperCase() +
                    selectedUpdate.status.slice(1)}
                </Badge>
              </div>

              <div>
                <h4 className="font-medium text-gray-700 mb-2">
                  What was accomplished:
                </h4>
                <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                  {selectedUpdate.workDone || 'No details provided'}
                </p>
              </div>

              <div>
                <h4 className="font-medium text-gray-700 mb-2">
                  Challenges faced:
                </h4>
                <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                  {selectedUpdate.challenges || 'None mentioned'}
                </p>
              </div>

              <div>
                <h4 className="font-medium text-gray-700 mb-2">
                  Plan for tomorrow:
                </h4>
                <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                  {selectedUpdate.planForTomorrow || 'No plan provided'}
                </p>
              </div>

              <div className="flex justify-between text-sm text-gray-500">
                <span>
                  Date: {new Date(selectedUpdate.date).toLocaleDateString()}
                </span>
                <span>
                  Time:{' '}
                  {new Date(
                    selectedUpdate.timestamp || selectedUpdate.date
                  ).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default DailyUpdates;
