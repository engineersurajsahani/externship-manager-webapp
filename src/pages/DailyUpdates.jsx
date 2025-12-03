import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
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
import Portal from '../components/ui/Portal';
import { lockScroll, unlockScroll } from '../utils/scrollLock';

const DailyUpdates = () => {
  const { getUserRole, ROLES, user } = useAuth();
  const navigate = useNavigate();
  const userRole = getUserRole();
  const [isLoading, setIsLoading] = useState(true);
  const [teamUpdates, setTeamUpdates] = useState([]);
  const [filteredUpdates, setFilteredUpdates] = useState([]);
  const formatLocalDateForInput = (d) => {
    const dateObj = new Date(d);
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(
    formatLocalDateForInput(new Date())
  );

  const [selectedUpdate, setSelectedUpdate] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const { id: routeUpdateId } = useParams();
  const location = useLocation();
  const queryDate = new URLSearchParams(location.search).get('date');

  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedIntern, setSelectedIntern] = useState('all');
  const [projects, setProjects] = useState([]);
  const [interns, setInterns] = useState([]);

  const [recentFilter, setRecentFilter] = useState('recent3');
  const [showAllUpdates, setShowAllUpdates] = useState(false);


  const [userProjects, setUserProjects] = useState([]);
  const [projectUpdateModal, setProjectUpdateModal] = useState({
    isOpen: false,
    project: null,
  });
  const [todaysSubmissions, setTodaysSubmissions] = useState(new Set());
  const [loadingProjects, setLoadingProjects] = useState(false);


  useEffect(() => {
    loadTeamUpdates();
    // If route contains an update id, attempt to open it
    const openRouteUpdate = async () => {
      if (routeUpdateId) {
        try {
          const resp = await apiService.getUpdate(routeUpdateId);
          if (resp.data && resp.data.success && resp.data.update) {
            const u = resp.data.update;
            const mapped = {
              id: u._id,
              userEmail: u.user?.email || 'No Email',
              userName: u.user ? `${u.user.firstName} ${u.user.lastName}` : 'Unknown User',
              userRole: u.user?.role || 'intern',
              department: u.user?.department || 'Unknown',
              date: u.date ? formatLocalDateForInput(u.date) : null,
              timestamp: u.createdAt,
              workDone: u.workDone,
              challenges: u.challenges,
              planForTomorrow: u.planForTomorrow,
              status: 'submitted',
              projectId: u.project?._id || null,
              projectName: u.project?.name || 'No Project Assigned',
            };
            setSelectedUpdate(mapped);
            setShowUpdateModal(true);
          }
        } catch (err) {
          console.error('Failed to load update from route id:', err);
        }
      }
    };

    openRouteUpdate();

    // If a date query param is provided, set the selected date so the page filters to that date
    if (queryDate) {
      setSelectedDate(queryDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If the page was opened via ?date=YYYY-MM-DD and the filtered results narrow to one update,
  // open it automatically to provide a smooth fallback from the calendar view.
  useEffect(() => {
    if (!routeUpdateId && queryDate && filteredUpdates && filteredUpdates.length === 1 && !showUpdateModal) {
      setSelectedUpdate(filteredUpdates[0]);
      setShowUpdateModal(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredUpdates, queryDate, routeUpdateId]);

  // Filter updates based on filters
  useEffect(() => {
    let filtered = teamUpdates;
    const todayStr = formatLocalDateForInput(new Date());

    // Role-based filtering
    if (userRole === ROLES.INTERN || userRole === ROLES.TEAM_LEADER) {
      // For interns and team leaders, apply recent updates filter
      if (userRole === ROLES.INTERN) {
        // Interns only see their own updates
        filtered = filtered.filter((update) => update.userEmail === user?.email);
      }

      if (!showAllUpdates) {
        // Apply recent filter
        const now = new Date();
        if (recentFilter === 'recent3') {
          // Always slice, even if there are fewer than 3 items
          filtered = filtered.slice(0, 3);
        } else if (recentFilter === 'lastWeek') {
          const lastWeek = new Date(now);
          lastWeek.setDate(lastWeek.getDate() - 7);
          filtered = filtered.filter((update) => new Date(update.date) >= lastWeek);
        } else if (recentFilter === 'thisMonth') {
          const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          filtered = filtered.filter((update) => new Date(update.date) >= thisMonth);
        }
      }
    } else if (userRole === ROLES.PROJECT_MANAGER) {
      // Project filter for PM
      if (selectedProject !== 'all') {
        filtered = filtered.filter((update) => update.projectId?.toString() === selectedProject);
      }

      // Intern filter for PM (within selected project)
      if (selectedIntern !== 'all') {
        filtered = filtered.filter((update) => update.userEmail === selectedIntern);
      }
    }

    // Date filter - apply when allowed or when selected date is today
    const shouldApplyDateFilter =
      !(userRole === ROLES.INTERN || userRole === ROLES.TEAM_LEADER) ||
      showAllUpdates;

    if (shouldApplyDateFilter) {
      // Date filter
      if (selectedDate) {
        filtered = filtered.filter((update) => update.date === selectedDate);
      }
    }

    setFilteredUpdates(filtered);
  }, [
    teamUpdates,
    selectedDate,
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

      try {
        let apiResponse;
        if (userRole === ROLES.INTERN) {
          // Interns only get their own updates
          apiResponse = await apiService.getMyUpdates();
        } else if (userRole === ROLES.TEAM_LEADER) {
          // Team leaders get their team's updates
          apiResponse = await apiService.getTeamUpdates();
        } else if (userRole === ROLES.PROJECT_MANAGER) {
          // Project managers get all updates from their projects
          apiResponse = await apiService.getTeamUpdates();
        } else {
          // Admin gets all updates
          apiResponse = await apiService.getAllUpdates();
        }

        if (apiResponse.data.success) {

          const updates = apiResponse.data.updates || [];
          console.debug('API returned updates:', updates.length, updates);


          dailyUpdates = updates.map((update) => ({
            id: update._id,
            userEmail: update.user?.email || 'No Email',
            userName: update.user
              ? `${update.user.firstName} ${update.user.lastName}`
              : 'Unknown User',
            userRole: update.user?.role || 'intern',
            department: update.user?.department || 'Unknown',
            date: formatLocalDateForInput(update.date),
            timestamp: update.createdAt,
            workDone: update.workDone,
            challenges: update.challenges,
            planForTomorrow: update.planForTomorrow,
            status: 'submitted',
            projectId: update.project?._id || null,
            projectName: update.project?.name || 'No Project Assigned',
          }));


        }
      } catch (apiError) {
        console.error('Failed to fetch updates from API:', apiError);


        if (
          apiError.code === 'ECONNREFUSED' ||
          apiError.message.includes('Network Error')
        ) {
          console.warn(
            'Cannot connect to database. Make sure your backend server is running on http://localhost:5050'
          );
        }


        dailyUpdates = [];
      }


      dailyUpdates.sort(
        (a, b) =>
          new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date)
      );

      console.debug('Final processed updates:', dailyUpdates.length, dailyUpdates);

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


  const loadUserProjects = async () => {
    if (userRole !== ROLES.INTERN) return;

    setLoadingProjects(true);
    try {
      const response = await apiService.getMyProjects();
      if (response.data.success && response.data.projects) {
        const projectsWithDetails = response.data.projects
          .filter((project) => {
            // For interns and team leaders, exclude completed projects
            if (userRole === ROLES.INTERN || userRole === ROLES.TEAM_LEADER) {
              return project.status !== 'completed';
            }
            return true; // Project managers and admins see all projects
          })
          .map((project) => ({
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


        await checkTodaysSubmissions(projectsWithDetails);
      }
    } catch (error) {
      console.error('Error loading user projects:', error);
    } finally {
      setLoadingProjects(false);
    }
  };


  const checkTodaysSubmissions = async (projects) => {
    try {
      const today = formatLocalDateForInput(new Date());
      const submissions = new Set();


      const response = await apiService.getMyAttendance();
      if (response.data.success && response.data.attendance) {
        const todayAttendance = response.data.attendance.find((record) =>
          formatLocalDateForInput(record.date) === today
        );

        if (todayAttendance && todayAttendance.projectAttendance) {

          todayAttendance.projectAttendance.forEach((projectAtt) => {
            if (projectAtt.hasSubmittedUpdate && projectAtt.status === 'present') {
              submissions.add(projectAtt.project.toString());
            }
          });
        }
      }

      setTodaysSubmissions(submissions);
    } catch (error) {
      console.error('Error checking today submissions:', error);

      const today = formatLocalDateForInput(new Date());
      const submissions = new Set();

      for (const project of projects) {
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
    }
  };


  useEffect(() => {
    if (userRole === ROLES.INTERN) {
      loadUserProjects();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole, teamUpdates]); // Re-run when teamUpdates changes


  const handleProjectUpdateSubmit = (project) => {
    setProjectUpdateModal({ isOpen: true, project });
  };


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


  useEffect(() => {
    if (showUpdateModal) lockScroll();
    else unlockScroll();
    return () => unlockScroll();
  }, [showUpdateModal]);

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
                      className={`p-6 relative overflow-hidden ${hasSubmittedToday
                          ? 'border-green-200 bg-green-50/30'
                          : 'border-gray-200 hover:border-blue-300 hover:shadow-lg'
                        } transition-all`}
                    >
                      {/* Status indicator */}
                      <div
                        className={`absolute top-0 right-0 w-2 h-full ${hasSubmittedToday ? 'bg-green-500' : 'bg-orange-400'
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
                              className={`${project.status === 'active'
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
                          className={`${hasSubmittedToday
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
          <Portal>
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
          </Portal>
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

                {/* Status filter removed — only date filter is displayed */}

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
