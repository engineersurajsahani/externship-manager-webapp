import React from 'react';
import { motion } from 'framer-motion';
import { FiAward, FiTrendingUp, FiZap } from 'react-icons/fi';

/**
 * StreakBadge Component
 * Displays attendance streak with visual rewards
 * 
 * @param {number} streak - Number of consecutive days attended
 * @param {string} size - 'sm', 'md', 'lg'
 */
const StreakBadge = ({ streak = 0, size = 'md' }) => {
  // Determine streak tier and emoji
  const getStreakTier = () => {
    if (streak >= 30) {
      return {
        label: 'Legendary',
        emoji: '🏆',
        color: 'from-yellow-400 to-orange-500',
        bgColor: 'bg-yellow-50',
        textColor: 'text-yellow-700',
        icon: FiAward,
      };
    } else if (streak >= 14) {
      return {
        label: 'On Fire',
        emoji: '🔥',
        color: 'from-orange-400 to-red-500',
        bgColor: 'bg-orange-50',
        textColor: 'text-orange-700',
        icon: FiZap,
      };
    } else if (streak >= 7) {
      return {
        label: 'Hot Streak',
        emoji: '⚡',
        color: 'from-purple-400 to-pink-500',
        bgColor: 'bg-purple-50',
        textColor: 'text-purple-700',
        icon: FiTrendingUp,
      };
    } else if (streak >= 3) {
      return {
        label: 'Building Up',
        emoji: '🌟',
        color: 'from-blue-400 to-blue-600',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
        icon: FiTrendingUp,
      };
    } else {
      return {
        label: 'Getting Started',
        emoji: '💪',
        color: 'from-gray-400 to-gray-600',
        bgColor: 'bg-gray-50',
        textColor: 'text-gray-700',
        icon: FiTrendingUp,
      };
    }
  };

  const tier = getStreakTier();
  const Icon = tier.icon;

  // Size configurations
  const sizeClasses = {
    sm: {
      container: 'px-3 py-1.5',
      emoji: 'text-lg',
      number: 'text-xl',
      label: 'text-xs',
      icon: 'w-3 h-3',
    },
    md: {
      container: 'px-4 py-2',
      emoji: 'text-2xl',
      number: 'text-3xl',
      label: 'text-sm',
      icon: 'w-4 h-4',
    },
    lg: {
      container: 'px-6 py-3',
      emoji: 'text-3xl',
      number: 'text-4xl',
      label: 'text-base',
      icon: 'w-5 h-5',
    },
  };

  const currentSize = sizeClasses[size];

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, type: 'spring', bounce: 0.4 }}
      className={`
        inline-flex items-center gap-2 rounded-full
        ${tier.bgColor} ${currentSize.container}
        border-2 border-opacity-20 shadow-md
      `}
      style={{
        borderColor: tier.color.includes('yellow') ? '#FCD34D' : 
                     tier.color.includes('orange') ? '#FB923C' : 
                     tier.color.includes('purple') ? '#C084FC' : 
                     tier.color.includes('blue') ? '#60A5FA' : '#9CA3AF'
      }}
    >
      {/* Emoji */}
      <motion.span
        className={currentSize.emoji}
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 10, -10, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 3,
        }}
      >
        {tier.emoji}
      </motion.span>

      {/* Streak Number */}
      <div className="flex flex-col items-center">
        <motion.span
          className={`${currentSize.number} font-bold ${tier.textColor}`}
          key={streak}
          initial={{ scale: 1.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {streak}
        </motion.span>
        <span className={`${currentSize.label} ${tier.textColor} font-medium uppercase tracking-wide`}>
          {tier.label}
        </span>
      </div>

      {/* Icon */}
      <Icon className={`${currentSize.icon} ${tier.textColor}`} />
    </motion.div>
  );
};

export default StreakBadge;
