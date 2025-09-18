import React from 'react';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiTrendingDown, FiMoreHorizontal } from 'react-icons/fi';

const StatsCard = ({ 
  title, 
  value, 
  change, 
  changeType, 
  icon: Icon, 
  color, 
  delay = 0,
  subtitle,
  trend,
  variant = 'default',
  className = '',
  onClick
}) => {
  const colorClasses = {
    blue: {
      gradient: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-200'
    },
    purple: {
      gradient: 'from-purple-500 to-purple-600',
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-200'
    },
    green: {
      gradient: 'from-green-500 to-green-600',
      bg: 'bg-green-50',
      text: 'text-green-600',
      border: 'border-green-200'
    },
    orange: {
      gradient: 'from-orange-500 to-orange-600',
      bg: 'bg-orange-50',
      text: 'text-orange-600',
      border: 'border-orange-200'
    },
    pink: {
      gradient: 'from-pink-500 to-pink-600',
      bg: 'bg-pink-50',
      text: 'text-pink-600',
      border: 'border-pink-200'
    },
    indigo: {
      gradient: 'from-indigo-500 to-indigo-600',
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
      border: 'border-indigo-200'
    },
  };

  const variants = {
    default: 'bg-white border border-gray-100',
    gradient: `bg-gradient-to-br ${colorClasses[color]?.gradient} text-white`,
    minimal: 'bg-gray-50 border-0',
    outlined: `bg-white border-2 ${colorClasses[color]?.border}`
  };

  const currentColor = colorClasses[color];
  const isGradient = variant === 'gradient';
  const textColor = isGradient ? 'text-white' : 'text-gray-900';
  const subtitleColor = isGradient ? 'text-white/80' : 'text-gray-600';
  const changeColor = isGradient ? 'text-white/90' : (changeType === 'increase' ? 'text-green-600' : 'text-red-600');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ 
        scale: 1.02,
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
      }}
      className={`
        rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 relative overflow-hidden
        ${variants[variant]} ${onClick ? 'cursor-pointer' : ''} ${className}
      `}
      onClick={onClick}
    >
      {/* Background Pattern for gradient variant */}
      {variant === 'gradient' && (
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white rounded-full" />
          <div className="absolute -left-8 -bottom-8 w-24 h-24 bg-white rounded-full" />
        </div>
      )}
      
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <p className={`text-sm font-medium ${subtitleColor}`}>{title}</p>
              <button className={`p-1 rounded-md hover:bg-black/5 ${isGradient ? 'text-white/60 hover:text-white/80' : 'text-gray-400 hover:text-gray-600'} transition-colors`}>
                <FiMoreHorizontal className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-baseline space-x-2">
              <motion.p 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: delay + 0.2 }}
                className={`text-3xl font-bold ${textColor}`}
              >
                {value}
              </motion.p>
              {subtitle && (
                <span className={`text-sm font-medium ${subtitleColor}`}>
                  {subtitle}
                </span>
              )}
            </div>
          </div>
          
          {/* Icon */}
          <div className={`
            p-3 rounded-xl flex items-center justify-center
            ${variant === 'gradient' ? 'bg-white/20' : currentColor?.bg}
          `}>
            <Icon className={`
              w-6 h-6 
              ${variant === 'gradient' ? 'text-white' : currentColor?.text}
            `} />
          </div>
        </div>
        
        {/* Change indicator and trend */}
        <div className="flex items-center justify-between">
          {change && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: delay + 0.4 }}
              className="flex items-center"
            >
              {changeType === 'increase' ? (
                <FiTrendingUp className={`w-4 h-4 mr-1 ${changeColor}`} />
              ) : (
                <FiTrendingDown className={`w-4 h-4 mr-1 ${changeColor}`} />
              )}
              <span className={`text-sm font-semibold ${changeColor}`}>
                {change > 0 ? '+' : ''}{change}%
              </span>
            </motion.div>
          )}
          
          {trend && (
            <div className="flex items-center space-x-1">
              {trend.map((point, index) => (
                <motion.div
                  key={index}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.3, delay: delay + 0.5 + index * 0.1 }}
                  className={`
                    w-1 rounded-full origin-bottom
                    ${variant === 'gradient' ? 'bg-white/40' : 'bg-gray-300'}
                  `}
                  style={{ height: `${point}px` }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default StatsCard;
