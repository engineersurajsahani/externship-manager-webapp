import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiWifi, FiWifiOff, FiRefreshCw } from 'react-icons/fi';
import { apiService } from '../services/api';
import Button from './ui/Button';
import Card from './ui/Card';
import Badge from './ui/Badge';

const ConnectionTest = () => {
  const [connectionStatus, setConnectionStatus] = useState('testing');
  const [backendInfo, setBackendInfo] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const testConnection = async () => {
    setLoading(true);
    setConnectionStatus('testing');
    setError(null);

    try {
      const response = await apiService.testConnection();
      setBackendInfo(response.data);
      setConnectionStatus('connected');
    } catch (err) {
      console.error('Connection test failed:', err);
      setError(err.message);
      setConnectionStatus('disconnected');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return (
          <Badge variant="success" icon={<FiWifi />}>
            Connected
          </Badge>
        );
      case 'disconnected':
        return (
          <Badge variant="danger" icon={<FiWifiOff />}>
            Disconnected
          </Badge>
        );
      case 'testing':
        return (
          <Badge
            variant="warning"
            icon={<FiRefreshCw className="animate-spin" />}
          >
            Testing...
          </Badge>
        );
      default:
        return <Badge variant="default">Unknown</Badge>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto mt-8"
    >
      <Card>
        <Card.Header>
          <h3 className="text-lg font-semibold">Backend Connection Status</h3>
        </Card.Header>

        <Card.Body>
          <div className="text-center space-y-4">
            {getStatusBadge()}

            {connectionStatus === 'connected' && backendInfo && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-2"
              >
                <p className="text-sm text-gray-600">
                  <strong>Message:</strong> {backendInfo.message}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Environment:</strong> {backendInfo.environment}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Timestamp:</strong>{' '}
                  {new Date(backendInfo.timestamp).toLocaleString()}
                </p>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-3 bg-red-50 border border-red-200 rounded-lg"
              >
                <p className="text-sm text-red-600">
                  <strong>Error:</strong> {error}
                </p>
                <p className="text-xs text-red-500 mt-1">
                  Make sure the backend server is running on port 5050
                </p>
              </motion.div>
            )}

            <Button
              onClick={testConnection}
              loading={loading}
              leftIcon={<FiRefreshCw />}
              size="sm"
            >
              Test Connection
            </Button>
          </div>
        </Card.Body>
      </Card>
    </motion.div>
  );
};

export default ConnectionTest;
