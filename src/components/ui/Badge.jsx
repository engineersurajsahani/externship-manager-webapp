import React from 'react';

const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  dot = false,
  icon,
  ...props
}) => {
  const baseClasses = 'badge-premium font-medium';

  const variants = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'badge-primary',
    secondary: 'bg-purple-100 text-purple-800',
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    info: 'badge-info',
    dark: 'bg-gray-800 text-gray-100',
    outline: 'border border-gray-300 text-gray-700 bg-white',
    gradient: 'gradient-primary text-white',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm',
  };

  const classes = `
    ${baseClasses}
    ${variants[variant]}
    ${sizes[size]}
    ${className}
  `.trim();

  return (
    <span className={classes} {...props}>
      {dot && (
        <span className="w-1.5 h-1.5 bg-current rounded-full mr-1.5 inline-block"></span>
      )}
      {icon && <span className="mr-1">{icon}</span>}
      {children}
    </span>
  );
};

export default Badge;
