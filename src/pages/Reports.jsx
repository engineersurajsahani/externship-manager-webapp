import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    FiFileText,
    FiCalendar,
    FiDownload,
    FiFilter,
    FiCheckCircle,
    FiXCircle,
    FiClock,
    FiChevronLeft,
    FiChevronRight,
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

    const [reportData, setReportData] = useState({
        data: [],
        pagination: {
            total: 0,
            pages: 0,
            page: 1,
            limit: 10
        }
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Trigger fetch when pagination changes, but only if we have dates
    useEffect(() => {
        if (startDate && endDate) {
            fetchReport(currentPage, itemsPerPage);
        }
    }, [currentPage, itemsPerPage]);

    const fetchReport = async (page = 1, limit = 10) => {
        if (!startDate || !endDate) return;

        setLoading(true);
        setError(null);

        try {
            let response;
            if (reportType === 'dailyUpdates') {
                response = await apiService.getAllUpdates({
                    startDate,
                    endDate,
                    page,
                    limit
                });
            } else {
                response = await apiService.getAttendanceReport(startDate, endDate, page, limit);
            }

            if (response.data.success) {
                // If backend provides pagination, use it. usage fallback for safety.
                const pagination = response.data.pagination || {
                    total: response.data.updates?.length || response.data.report?.length || 0,
                    pages: 1,
                    page: 1,
                    limit: 100
                };

                setReportData({
                    type: reportType,
                    data: reportType === 'dailyUpdates' ? (response.data.updates || []) : (response.data.report || []),
                    startDate,
                    endDate,
                    pagination
                });
            } else {
                throw new Error(response.data.message || 'Failed to generate report');
            }
        } catch (error) {
            console.error('Error fetching report:', error);
            setError(error.message);
            window.dispatchEvent(
                new CustomEvent('app-toast', {
                    detail: {
                        message: `Error fetching report: ${error.message}`,
                        type: 'error',
                    },
                })
            );
        } finally {
            setLoading(false);
        }
    };

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

        // Reset to page 1 and fetch
        setCurrentPage(1);
        // We call fetchReport explicitly here because if currentPage is already 1, useEffect won't trigger
        fetchReport(1, itemsPerPage);

        window.dispatchEvent(
            new CustomEvent('app-toast', {
                detail: {
                    message: 'Generating report...',
                    type: 'info',
                },
            })
        );
    };

    const exportToCSV = async () => {
        // Fetch ALL data for export
        try {
            window.dispatchEvent(
                new CustomEvent('app-toast', {
                    detail: {
                        message: 'Preparing export...',
                        type: 'info',
                    },
                })
            );

            let allData = [];

            // Use a large limit to get all data
            if (reportType === 'dailyUpdates') {
                const response = await apiService.getAllUpdates({
                    startDate,
                    endDate,
                    page: 1,
                    limit: 100000
                });
                if (response.data.success) {
                    allData = response.data.updates || [];
                }
            } else {
                const response = await apiService.getAttendanceReport(startDate, endDate, 1, 100000);
                if (response.data.success) {
                    allData = response.data.report || [];
                }
            }

            if (allData.length === 0) {
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

            if (reportType === 'dailyUpdates') {
                // CSV headers for daily updates
                csvContent = 'Date,User,Email,Department,Project,Work Done,Challenges,Plan for Tomorrow\n';

                allData.forEach((update) => {
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

                allData.forEach((record) => {
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

        } catch (error) {
            console.error('Error exporting report:', error);
            window.dispatchEvent(
                new CustomEvent('app-toast', {
                    detail: {
                        message: 'Failed to export report',
                        type: 'error',
                    },
                })
            );
        }
    };

    const changePage = (pageNumber) => {
        if (pageNumber > 0 && pageNumber <= reportData.pagination.pages) {
            setCurrentPage(pageNumber);
        }
    };

    // Only allow admin and project managers to access reports
    if (userRole !== ROLES.ADMIN && userRole !== ROLES.PROJECT_MANAGER) {
        return (
            <div className="p-6">
                <Card className="p-8 text-center dark:bg-gray-800 dark:border-gray-700">
                    <FiFileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Access Restricted
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
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
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                        <FiFileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
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
                <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                        Generate Report
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {/* Report Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Report Type
                            </label>
                            <select
                                value={reportType}
                                onChange={(e) => setReportType(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                <option value="dailyUpdates">Daily Updates</option>
                                <option value="attendance">Attendance</option>
                            </select>
                        </div>

                        {/* Start Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Start Date
                            </label>
                            <div className="relative">
                                <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black dark:text-white transition-colors duration-300 w-4 h-4" />
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent calendar-icon-dark"
                                />
                            </div>
                        </div>

                        {/* End Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                End Date
                            </label>
                            <div className="relative">
                                <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black dark:text-white transition-colors duration-300 w-4 h-4" />
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent calendar-icon-dark"
                                />
                            </div>
                        </div>

                        {/* Generate Button */}
                        <div className="flex items-end">
                            <Button
                                onClick={handleGenerateReport}
                                loading={loading}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
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
                                className="border-purple-600 text-purple-600 hover:bg-purple-50 dark:border-purple-400 dark:text-purple-400 dark:hover:bg-purple-900/20"
                            >
                                <FiDownload className="w-4 h-4 mr-2" />
                                Export to CSV
                            </Button>
                        </div>
                    )}
                </Card>
            </motion.div>

            {/* Report Results */}
            {reportData && reportData.startDate && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                    {reportType === 'dailyUpdates'
                                        ? 'Daily Updates Report'
                                        : 'Attendance Report'}
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {new Date(reportData.startDate).toLocaleDateString()} -{' '}
                                    {new Date(reportData.endDate).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300">
                                    Total: {reportData.pagination.total}
                                </Badge>
                                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                                    Page {currentPage} of {reportData.pagination.pages}
                                </Badge>
                            </div>
                        </div>

                        {reportData.data.length === 0 ? (
                            <div className="text-center py-12">
                                <FiFileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                <p className="text-gray-500 dark:text-gray-400">No data found for the selected date range</p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto mb-4">
                                    {reportType === 'dailyUpdates' ? (
                                        <table className="w-full">
                                            <thead className="bg-gray-50 dark:bg-gray-900/50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                        Date
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                        User
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                        Department
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                        Project
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                        Work Done
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                        Challenges
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                                {reportData.data.map((update, index) => (
                                                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                                                            {new Date(update.date).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-200">
                                                                {update.user?.firstName} {update.user?.lastName}
                                                            </div>
                                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                {update.user?.email}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                            {update.user?.department}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                            {update.project?.name || 'No Project'}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-200 max-w-xs truncate">
                                                            {update.workDone}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                                            {update.challenges || 'None'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <table className="w-full">
                                            <thead className="bg-gray-50 dark:bg-gray-900/50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                        User
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                        Department
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                        Role
                                                    </th>
                                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                        Total Days
                                                    </th>
                                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                        Present
                                                    </th>
                                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                        Absent
                                                    </th>
                                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                        Leaves
                                                    </th>
                                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                        Attendance %
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                                {reportData.data.map((record, index) => (
                                                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-200">
                                                                {record.user.name}
                                                            </div>
                                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                {record.user.email}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                            {record.user.department}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                            {record.user.role}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-gray-200">
                                                            {record.summary.total}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                                            <div className="flex items-center justify-center">
                                                                <FiCheckCircle className="w-4 h-4 text-green-600 mr-1" />
                                                                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                                                                    {record.summary.present}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                                            <div className="flex items-center justify-center">
                                                                <FiXCircle className="w-4 h-4 text-red-600 mr-1" />
                                                                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                                                                    {record.summary.absent}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                                            <div className="flex items-center justify-center">
                                                                <FiClock className="w-4 h-4 text-orange-600 mr-1" />
                                                                <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                                                                    {record.summary.leaves}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                                            <Badge
                                                                className={`${record.summary.percentage >= 90
                                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                                                                    : record.summary.percentage >= 75
                                                                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                                                                        : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
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

                                {/* Pagination Controls */}
                                <div className="flex flex-col sm:flex-row justify-between items-center py-4 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center mb-4 sm:mb-0">
                                        <span className="text-sm text-gray-700 dark:text-gray-300 mr-4">
                                            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, reportData.pagination.total)} of {reportData.pagination.total} results
                                        </span>
                                        <select
                                            value={itemsPerPage}
                                            onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        >
                                            <option value={10}>10 per page</option>
                                            <option value={20}>20 per page</option>
                                            <option value={50}>50 per page</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => changePage(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                        >
                                            <FiChevronLeft className="w-4 h-4" />
                                        </Button>

                                        {/* Pagination Numbers */}
                                        <div className="flex space-x-1">
                                            {Array.from({ length: Math.min(5, reportData.pagination.pages) }, (_, i) => {
                                                let p = i + 1;
                                                const totalPages = reportData.pagination.pages;

                                                if (totalPages > 5) {
                                                    // Logic to center current page
                                                    if (currentPage > 3) {
                                                        p = currentPage - 2 + i;
                                                    }
                                                    // Ensure we don't go past max
                                                    if (p > totalPages - 2) {
                                                        p = totalPages - 4 + i;
                                                    }
                                                }

                                                // Safety
                                                if (p < 1) p = i + 1;

                                                return (
                                                    <button
                                                        key={p}
                                                        onClick={() => changePage(p)}
                                                        className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${currentPage === p
                                                            ? 'bg-purple-600 text-white'
                                                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                                                            }`}
                                                    >
                                                        {p}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => changePage(currentPage + 1)}
                                            disabled={currentPage === reportData.pagination.pages}
                                            className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                        >
                                            <FiChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </>
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
                    <Card className="p-6 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-900/50">
                        <div className="flex items-center space-x-3">
                            <FiXCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                            <div>
                                <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
                                    Error generating report
                                </h3>
                                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            )}
        </div>
    );
};

export default Reports;
