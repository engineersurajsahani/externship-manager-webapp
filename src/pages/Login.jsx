import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
// ... existing code ...
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
// ... existing code ...
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Try API authentication first
      const response = await apiService.login({
        email: formData.email,
        password: formData.password,
      });

      if (response.data.token) {
        // Use AuthContext login with API user data
        login(
          formData.email, 
          response.data.token, 
          response.data.user,
          response.data.refreshToken
        );
        navigate('/dashboard');
        return;
      }
    } catch (err) {
// ... existing code ...
      // Do NOT fall back to a client-side demo login automatically.
      // Only show an informative error so authentication must come from the server.
      if (err.code === 'ECONNREFUSED' || err.message.includes('Network Error')) {
        setError('Server unavailable. Please ensure the backend is running.');
      } else if (err.response?.status === 401) {
        setError('Invalid email or password.');
      } else if (err.response?.status === 404) {
        setError('User not found. Please check your email address.');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-primary">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.1, scale: 1 }}
          transition={{ duration: 2 }}
          className="absolute -top-40 -right-40 w-80 h-80 bg-white rounded-full"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.1, scale: 1 }}
          transition={{ duration: 2, delay: 0.5 }}
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-white rounded-full"
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-2xl flex items-center justify-center">
              <h1 className="text-3xl font-bold text-indigo-600">E</h1>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-indigo-100">
            Sign in to your Externship Manager account
          </p>
        </motion.div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card glass className="backdrop-blur-md bg-white/10 border-white/20">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                name="email"
                type="email"
                label="Email Address"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
                leftIcon={<FiMail />}
                variant="filled"
                fullWidth
                required
                className="bg-white/10 border-white/20 text-white placeholder-white/70 focus:bg-white/20"
              />

              <div className="relative">
                <Input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  label="Password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  leftIcon={<FiLock />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="focus:outline-none"
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  }
                  variant="filled"
                  fullWidth
                  required
                  className="bg-white/10 border-white/20 text-white placeholder-white/70 focus:bg-white/20"
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-3 bg-red-500/20 border border-red-300/30 rounded-lg"
                >
                  <p className="text-red-200 text-sm flex items-center">
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {error}
                  </p>
                </motion.div>
              )}

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-white/30 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 bg-white/10"
                  />
                  <span className="ml-2 text-white/80">Remember me</span>
                </label>
                {/* Forgot password removed - only admin demo login is allowed from this page */}
                <div />
              </div>

              <Button
                type="submit"
                loading={loading}
                fullWidth
                size="lg"
                className="!bg-white !text-indigo-600 hover:!bg-gray-50 hover:!text-indigo-700 !font-semibold !shadow-xl !border-0 rounded-lg"
              >
                <span className="text-indigo-600 font-semibold">
                  {loading ? 'Signing in...' : 'Sign In'}
                </span>
              </Button>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
