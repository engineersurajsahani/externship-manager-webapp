import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    FiFileText,
    FiCalendar,
    FiDownload,
    FiFilter,
    FiUsers,
    FiCheckCircle,
    FiXCircle,
    FiClock,
} from 'react-icons/fi';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

const Reports = () => {
    const { getUserRole, ROLES } = useAuth();
    const userRole = getUserRole();

    const [reportType, setReportType] = useState('dailyUpdates'); // 'dailyUpdates' or 'attendance'
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleGenerateReport = async () => {
        if (!startDate || !endDate) {
            window.dispatchEvent(
                new CustomEvent('app-toast', {
                    detail: {
                        message: 'Please select both start and end dates',
                        type: 'error',
                    },
                })
            );
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            window.dispatchEvent(
                new CustomEvent('app-toast', {
                    detail: {
                        message: 'Start date must be before end date',
                        type: 'error',
                    },
                })
            );
            return;
        }

        setLoading(true);
        setError(null);

        try {
            if (reportType === 'dailyUpdates') {
                // Fetch daily updates report
                const response = await apiService.getAllUpdates({
                    startDate,
                    endDate,
                });

                if (response.data.success) {
                    setReportData({
                        type: 'dailyUpdates',
                        data: response.data.updates || [],
                        startDate,
                        endDate,
                    });
                } else {
                    throw new Error(response.data.message || 'Failed to generate report');
                }
            } else {
                // Fetch attendance report
                const response = await apiService.getAttendanceReport(startDate, endDate);

                if (response.data.success) {
                    setReportData({
                        type: 'attendance',
                        data: response.data.report || [],
                        startDate,
                        endDate,
                    });
                } else {
                    throw new Error(response.data.message || 'Failed to generate report');
                }
            }

            window.dispatchEvent(
                new CustomEvent('app-toast', {
                    detail: {
                        message: 'Report generated successfully',
                        type: 'success',
                    },
                })
            );
        } catch (error) {
            console.error('Error generating report:', error);
            setError(error.message);
            window.dispatchEvent(
                new CustomEvent('app-toast', {
                    detail: {
                        message: `Error generating report: ${error.message}`,
                        type: 'error',
                    },
                })
            );
        } finally {
            setLoading(false);
        }
    };

    const exportToCSV = () => {
        if (!reportData || !reportData.data || reportData.data.length === 0) {
            window.dispatchEvent(
                new CustomEvent('app-toast', {
                    detail: {
                        message: 'No data to export',
                        type: 'error',
                    },
                })
            );
            return;
        }

        let csvContent = '';
        let filename = '';

        if (reportData.type === 'dailyUpdates') {
            // CSV headers for daily updates
            csvContent = 'Date,User,Email,Department,Project,Work Done,Challenges,Plan for Tomorrow\n';

            reportData.data.forEach((update) => {
                const row = [
                    new Date(update.date).toLocaleDateString(),
                    `${update.user?.firstName || ''} ${update.user?.lastName || ''}`,
                    update.user?.email || '',
                    update.user?.department || '',
                    update.project?.name || 'No Project',
                    `"${(update.workDone || '').replace(/"/g, '""')}"`,
                    `"${(update.challenges || '').replace(/"/g, '""')}"`,
                    `"${(update.planForTomorrow || '').replace(/"/g, '""')}"`,
                ];
                csvContent += row.join(',') + '\n';
            });

            filename = `daily_updates_${startDate}_to_${endDate}.csv`;
        } else {
            // CSV headers for attendance
            csvContent = 'User,Email,Department,Role,Total Days,Present,Absent,Leaves,Attendance %\n';

            reportData.data.forEach((record) => {
                const row = [
                    record.user.name,
                    record.user.email,
                    record.user.department,
                    record.user.role,
                    record.summary.total,
                    record.summary.present,
                    record.summary.absent,
                    record.summary.leaves,
                    record.summary.percentage.toFixed(2),
                ];
                csvContent += row.join(',') + '\n';
            });

            filename = `attendance_${startDate}_to_${endDate}.csv`;
        }

        // Create and download CSV file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        window.dispatchEvent(
            new CustomEvent('app-toast', {
                detail: {
                    message: 'Report exported successfully',
                    type: 'success',
                },
            })
        );
    };

    // Only allow admin and project managers to access reports
    if (userRole !== ROLES.ADMIN && userRole !== ROLES.PROJECT_MANAGER) {
        return (
            <div className="p-6">
                <Card className="p-8 text-center">
                    <FiFileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Access Restricted
                    </h3>
                    <p className="text-gray-500">
                        Only administrators and project managers can access reports.
                    </p>
                </Card>
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
                <div className="flex items-center space-x-3 mb-2">
                    <div className="p-3 bg-purple-100 rounded-full">
                        <FiFileText className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
                        <p className="text-gray-600 mt-1">
                            Generate and export reports for daily updates and attendance
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Report Configuration */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <Card className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">
                        Generate Report
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {/* Report Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Report Type
                            </label>
                            <select
                                value={reportType}
                                onChange={(e) => setReportType(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                <option value="dailyUpdates">Daily Updates</option>
                                <option value="attendance">Attendance</option>
                            </select>
                        </div>

                        {/* Start Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Start Date
                            </label>
                            <div className="relative">
                                <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* End Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                End Date
                            </label>
                            <div className="relative">
                                <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Generate Button */}
                        <div className="flex items-end">
                            <Button
                                onClick={handleGenerateReport}
                                loading={loading}
                                className="w-full bg-purple-600 hover:bg-purple-700"
                            >
                                <FiFilter className="w-4 h-4 mr-2" />
                                Generate
                            </Button>
                        </div>
                    </div>

                    {/* Export Button */}
                    {reportData && reportData.data && reportData.data.length > 0 && (
                        <div className="flex justify-end">
                            <Button
                                variant="outline"
                                onClick={exportToCSV}
                                className="border-purple-600 text-purple-600 hover:bg-purple-50"
                            >
                                <FiDownload className="w-4 h-4 mr-2" />
                                Export to CSV
                            </Button>
                        </div>
                    )}
                </Card>
            </motion.div>

            {/* Report Results */}
            {reportData && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">
                                    {reportType === 'dailyUpdates'
                                        ? 'Daily Updates Report'
                                        : 'Attendance Report'}
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    {new Date(reportData.startDate).toLocaleDateString()} -{' '}
                                    {new Date(reportData.endDate).toLocaleDateString()}
                                </p>
                            </div>
                            <Badge className="bg-purple-100 text-purple-800">
                                {reportData.data.length} records
                            </Badge>
                        </div>

                        {reportData.data.length === 0 ? (
                            <div className="text-center py-12">
                                <FiFileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">No data found for the selected date range</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                {reportType === 'dailyUpdates' ? (
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Date
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    User
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Department
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Project
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Work Done
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Challenges
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {reportData.data.map((update, index) => (
                                                <tr key={index} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {new Date(update.date).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {update.user?.firstName} {update.user?.lastName}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {update.user?.email}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {update.user?.department}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {update.project?.name || 'No Project'}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                                                        {update.workDone}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                                        {update.challenges || 'None'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    User
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Department
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Role
                                                </th>
                                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Total Days
                                                </th>
                                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Present
                                                </th>
                                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Absent
                                                </th>
                                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Leaves
                                                </th>
                                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Attendance %
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {reportData.data.map((record, index) => (
                                                <tr key={index} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {record.user.name}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {record.user.email}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {record.user.department}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {record.user.role}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                                                        {record.summary.total}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        <div className="flex items-center justify-center">
                                                            <FiCheckCircle className="w-4 h-4 text-green-600 mr-1" />
                                                            <span className="text-sm font-medium text-green-600">
                                                                {record.summary.present}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        <div className="flex items-center justify-center">
                                                            <FiXCircle className="w-4 h-4 text-red-600 mr-1" />
                                                            <span className="text-sm font-medium text-red-600">
                                                                {record.summary.absent}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        <div className="flex items-center justify-center">
                                                            <FiClock className="w-4 h-4 text-orange-600 mr-1" />
                                                            <span className="text-sm font-medium text-orange-600">
                                                                {record.summary.leaves}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        <Badge
                                                            className={`${record.summary.percentage >= 90
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : record.summary.percentage >= 75
                                                                        ? 'bg-yellow-100 text-yellow-800'
                                                                        : 'bg-red-100 text-red-800'
                                                                }`}
                                                        >
                                                            {record.summary.percentage.toFixed(1)}%
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}
                    </Card>
                </motion.div>
            )}

            {/* Error State */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Card className="p-6 bg-red-50 border-red-200">
                        <div className="flex items-center space-x-3">
                            <FiXCircle className="w-6 h-6 text-red-600" />
                            <div>
                                <h3 className="text-sm font-medium text-red-800">
                                    Error generating report
                                </h3>
                                <p className="text-sm text-red-600 mt-1">{error}</p>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            )}
        </div>
    );
};

export default Reports;
