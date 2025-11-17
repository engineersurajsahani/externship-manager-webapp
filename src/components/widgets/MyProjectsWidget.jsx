import React from 'react';
import { motion } from 'framer-motion';
import {
  FiBriefcase,
  FiUsers,
  FiCalendar,
  FiArrowRight,
  FiEdit3,
} from 'react-icons/fi';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { useAuth } from '../../contexts/AuthContext';

const MyProjectsWidget = ({
  userProjects = [],
  onSubmitUpdate,
  onViewProject,
}) => {
  const { getUserRole, user, ROLES } = useAuth();
  const userRole = getUserRole();

  const getRoleInProject = (project) => {
    if (!user) return 'Member';

    if (project.lead === user.email.split('@')[0]) {
      return 'Project Manager';
    } else if (project.teamLeaders?.includes(user.email.split('@')[0])) {
      return 'Team Leader';
    } else if (project.interns?.includes(user.email.split('@')[0])) {
      return 'Intern';
    }
    return 'Member';
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

  const getDeadlineStatus = (endDate) => {
    if (!endDate) return null;

    const deadline = new Date(endDate);
    const today = new Date();
    const diffTime = deadline - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: 'Overdue', color: 'text-red-600', urgent: true };
    } else if (diffDays <= 7) {
      return {
        text: `${diffDays} days left`,
        color: 'text-orange-600',
        urgent: true,
      };
    } else if (diffDays <= 30) {
      return {
        text: `${diffDays} days left`,
        color: 'text-yellow-600',
        urgent: false,
      };
    } else {
      return {
        text: `${diffDays} days left`,
        color: 'text-gray-600',
        urgent: false,
      };
    }
  };

  if (!userProjects || userProjects.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">My Projects</h3>
          <FiBriefcase className="w-5 h-5 text-gray-400" />
        </div>
        <div className="text-center py-8">
          <FiBriefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No projects assigned</p>
          <p className="text-sm text-gray-400">
            {userRole === ROLES.INTERN
              ? "You'll see your assigned projects here once you're added to a project team."
              : "You'll see projects you're managing here once they're assigned to you."}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">My Projects</h3>
          <p className="text-sm text-gray-500">
            {userProjects.length} active project
            {userProjects.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className="bg-blue-100 text-blue-800">
            {userProjects.length}
          </Badge>
          <FiBriefcase className="w-5 h-5 text-gray-400" />
        </div>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {userProjects.map((project, index) => {
          const deadlineStatus = getDeadlineStatus(project.endDate);
          const userRoleInProject = getRoleInProject(project);

          return (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-semibold text-gray-900 text-sm">
                      {project.name}
                    </h4>
                    <Badge className={getStatusColor(project.status)}>
                      {project.status.charAt(0).toUpperCase() +
                        project.status.slice(1)}
                    </Badge>
                  </div>

                  <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
                    <span className="flex items-center">
                      <FiUsers className="w-3 h-3 mr-1" />
                      {userRoleInProject}
                    </span>
                    {deadlineStatus && (
                      <span
                        className={`flex items-center ${deadlineStatus.color}`}
                      >
                        <FiCalendar className="w-3 h-3 mr-1" />
                        {deadlineStatus.text}
                      </span>
                    )}
                    {project.priority && (
                      <Badge
                        className={`${getPriorityColor(project.priority)} text-xs`}
                      >
                        {project.priority.toUpperCase()}
                      </Badge>
                    )}
                  </div>

                  {project.description && (
                    <p className="text-xs text-gray-600 line-clamp-2 mb-3">
                      {project.description}
                    </p>
                  )}


                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewProject?.(project)}
                  className="text-xs"
                >
                  <FiArrowRight className="w-3 h-3 mr-1" />
                  View Details
                </Button>

                {userRole === ROLES.INTERN &&
                  userRoleInProject === 'Intern' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onSubmitUpdate?.(project)}
                      className="text-xs"
                    >
                      <FiEdit3 className="w-3 h-3 mr-1" />
                      Submit Update
                    </Button>
                  )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {userProjects.length > 3 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <Button variant="outline" size="sm" className="w-full text-xs">
            View All Projects ({userProjects.length})
          </Button>
        </div>
      )}
    </Card>
  );
};

export default MyProjectsWidget;
