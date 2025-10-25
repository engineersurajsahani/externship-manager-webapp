import React, { useState, useEffect } from 'react';
import { FiWifi, FiWifiOff } from 'react-icons/fi';
import { apiService } from '../../services/api';

const ConnectionStatus = () => {
  const [connectionStatus, setConnectionStatus] = useState({
    isConnected: false,
    isLoading: true,
    lastChecked: null,
    error: null,
  });

  const checkConnection = async () => {
    setConnectionStatus((prev) => ({ ...prev, isLoading: true }));

    try {
      // Try to ping the backend
      await apiService.testConnection();

      setConnectionStatus({
        isConnected: true,
        isLoading: false,
        lastChecked: new Date(),
        error: null,
      });
    } catch (error) {
      setConnectionStatus({
        isConnected: false,
        isLoading: false,
        lastChecked: new Date(),
        error: error.message,
      });
    }
  };

  useEffect(() => {
    checkConnection();

    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);

    return () => clearInterval(interval);
  }, []);

  if (connectionStatus.isLoading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400"></div>
        <span>Checking connection...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 text-sm">
      {connectionStatus.isConnected ? (
        <>
          <FiWifi className="w-4 h-4 text-green-500" />
          <span className="text-green-600">Connected to API</span>
        </>
      ) : (
        <>
          <FiWifiOff className="w-4 h-4 text-orange-500" />
          <span className="text-orange-600">Using local data</span>
          <button
            onClick={checkConnection}
            className="ml-2 text-xs text-blue-500 hover:text-blue-700 underline"
          >
            Retry
          </button>
        </>
      )}

      {connectionStatus.lastChecked && (
        <span className="text-xs text-gray-400">
          • Last checked: {connectionStatus.lastChecked.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
};

export default ConnectionStatus;
