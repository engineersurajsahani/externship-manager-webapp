import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiUser } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// Demo user credentials for testing
const DEMO_USERS = [
  { role: 'Admin', email: 'admin@example.com', password: 'admin123' },
  { role: 'Project Manager', email: 'pm@example.com', password: 'pm123456' },
  { role: 'Team Leader', email: 'tl@example.com', password: 'tl123456' },
  { role: 'Intern', email: 'intern1@example.com', password: 'intern123' },
];

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
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
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
      // Fallback to demo authentication if API fails
      const demoUser = DEMO_USERS.find(
        (user) =>
          user.email === formData.email && user.password === formData.password
      );

      if (demoUser) {
        // Demo login success
        const demoToken = 'demo-token-' + Date.now();
        login(formData.email, demoToken);
        navigate('/dashboard');
        return;
      }

      // If both API and demo authentication fail, show appropriate error
      if (
        err.code === 'ECONNREFUSED' ||
        err.message.includes('Network Error')
      ) {
        setError(
          'Server unavailable. Try demo credentials below or ensure backend is running.'
        );
      } else if (err.response?.status === 401 || !demoUser) {
        setError(
          'Invalid email or password. Please try the demo credentials below.'
        );
      } else if (err.response?.status === 404) {
        setError(
          'User not found. Please check your email address or try demo credentials.'
        );
      } else {
        setError(
          'Login failed. Please try again or use demo credentials below.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = (user) => {
    setFormData({
      email: user.email,
      password: user.password,
    });
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
              <FiUser className="w-8 h-8 text-indigo-600" />
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
                <button
                  type="button"
                  className="text-white/80 hover:text-white transition-colors"
                >
                  Forgot password?
                </button>
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

        {/* Demo Credentials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8"
        >
          <Card glass className="backdrop-blur-md bg-white/10 border-white/20">
            <div className="text-center">
              <h3 className="text-white font-semibold mb-4">Demo Accounts</h3>
              <div className="grid grid-cols-2 gap-3">
                {DEMO_USERS.map((user, index) => (
                  <motion.button
                    key={user.role}
                    onClick={() => fillDemoCredentials(user)}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium transition-all duration-200 border border-white/20 hover:border-white/40"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                  >
                    <div className="font-semibold">{user.role}</div>
                    <div className="text-xs text-white/70 mt-1">
                      {user.email}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
