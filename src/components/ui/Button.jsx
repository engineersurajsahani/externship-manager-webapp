import React from 'react';
import { motion } from 'framer-motion';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  onClick,
  type = 'button',
  ...props
}) => {
  const baseClasses = 'btn-premium font-semibold focus-ring smooth-transition';
  
  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl',
    secondary: 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl',
    success: 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white shadow-lg hover:shadow-xl',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl',
    outline: 'border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white bg-white',
    ghost: 'text-gray-700 hover:bg-gray-100 bg-transparent',
    gradient: 'gradient-primary text-white shadow-lg hover:shadow-xl',
    glass: 'glass text-gray-800 hover:bg-white/20'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg'
  };

  const classes = `
    ${baseClasses}
    ${variants[variant]}
    ${sizes[size]}
    ${fullWidth ? 'w-full' : ''}
    ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'hover-lift'}
    ${className}
  `.trim();

  const buttonContent = (
    <>
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}
      <span>{children}</span>
      {!loading && rightIcon && <span className="ml-2">{rightIcon}</span>}
    </>
  );

  if (loading || disabled) {
    return (
      <button
        className={classes}
        disabled={true}
        type={type}
        {...props}
      >
        {buttonContent}
      </button>
    );
  }

  return (
    <motion.button
      className={classes}
      onClick={onClick}
      type={type}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      {...props}
    >
      {buttonContent}
    </motion.button>
  );
};

export default Button;