import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiSearch, FiEdit2, FiTrash2, FiEye, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const DataTable = ({ title, columns, data, actions = true }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Filter data based on search term
  const filteredData = data.filter(item =>
    Object.values(item).some(value =>
      value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-xl shadow-lg overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">{title}</h2>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column}
                </th>
              ))}
              {actions && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentItems.map((item, index) => (
              <motion.tr
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className="hover:bg-gray-50 transition-colors duration-200"
              >
                {Object.values(item).map((value, idx) => (
                  <td key={idx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {typeof value === 'object' ? (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${value.className}`}>
                        {value.text}
                      </span>
                    ) : (
                      value
                    )}
                  </td>
                ))}
                {actions && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-indigo-600 hover:text-indigo-900 transition-colors duration-200">
                        <FiEye className="w-4 h-4" />
                      </button>
                      <button className="text-blue-600 hover:text-blue-900 transition-colors duration-200">
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900 transition-colors duration-200">
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                )}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredData.length)} of{' '}
            {filteredData.length} results
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <FiChevronLeft className="w-4 h-4" />
            </button>
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index}
                onClick={() => paginate(index + 1)}
                className={`px-3 py-1 rounded-lg transition-all duration-200 ${
                  currentPage === index + 1
                    ? 'bg-indigo-600 text-white'
                    : 'border border-gray-300 hover:bg-gray-100'
                }`}
              >
                {index + 1}
              </button>
            ))}
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DataTable;
