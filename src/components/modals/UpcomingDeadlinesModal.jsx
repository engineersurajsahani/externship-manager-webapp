import React from 'react';
import { FiX, FiCalendar, FiClock, FiAlertTriangle } from 'react-icons/fi';

const UpcomingDeadlinesModal = ({ projects, onClose }) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysUntilDeadline = (date) => {
    const today = new Date();
    const deadline = new Date(date);
    // zero out time for accurate day difference
    today.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);
    const diffTime = deadline - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getUrgencyColor = (daysLeft) => {
    if (daysLeft <= 1) return 'text-red-600 bg-red-50';
    if (daysLeft <= 3) return 'text-orange-600 bg-orange-50';
    return 'text-blue-600 bg-blue-50';
  };

  const getUrgencyIcon = (daysLeft) => {
    if (daysLeft <= 1) return <FiAlertTriangle className="w-4 h-4" />;
    if (daysLeft <= 3) return <FiClock className="w-4 h-4" />;
    return <FiCalendar className="w-4 h-4" />;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FiCalendar className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Upcoming Deadlines</h2>
              <p className="text-sm text-gray-500">Projects due in the next 7 days</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-96">
          {(!projects || projects.length === 0) ? (
            <div className="text-center py-8">
              <div className="p-3 bg-green-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <FiCalendar className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Upcoming Deadlines</h3>
              <p className="text-gray-500">All projects are on track with no deadlines in the next 7 days.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => {
                const daysLeft = getDaysUntilDeadline(project.endDate);
                return (
                  <div
                    key={project._id || project.name}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${getUrgencyColor(daysLeft)}`}>
                        {getUrgencyIcon(daysLeft)}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{project.name}</h4>
                        <p className="text-sm text-gray-500">Due: {formatDate(project.endDate)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getUrgencyColor(daysLeft)}`}>
                        {daysLeft <= 0 ? 'Due Today' : daysLeft === 1 ? 'Due Tomorrow' : `${daysLeft} days left`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>{(projects && projects.length) || 0} project(s) with upcoming deadlines</span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpcomingDeadlinesModal;
