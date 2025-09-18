import React from 'react';
import { motion } from 'framer-motion';

const Card = ({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
  hover = true,
  glass = false,
  gradient = false,
  onClick,
  ...props
}) => {
  const baseClasses = 'card-premium overflow-hidden';
  
  const variants = {
    default: 'bg-white border border-gray-100',
    elevated: 'bg-white shadow-xl border-0',
    flat: 'bg-white border border-gray-200 shadow-none',
    bordered: 'bg-white border-2 border-gray-200',
    dark: 'bg-gray-800 text-white border border-gray-700',
  };

  const paddings = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10'
  };

  const classes = `
    ${baseClasses}
    ${variants[variant]}
    ${paddings[padding]}
    ${glass ? 'glass' : ''}
    ${gradient ? 'gradient-primary text-white' : ''}
    ${hover ? 'hover-lift cursor-pointer' : ''}
    ${onClick ? 'cursor-pointer' : ''}
    ${className}
  `.trim();

  const cardProps = {
    className: classes,
    onClick,
    ...props
  };

  if (hover && !onClick) {
    return (
      <motion.div
        {...cardProps}
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
    );
  }

  if (onClick) {
    return (
      <motion.div
        {...cardProps}
        whileHover={{ y: -2, scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
    );
  }

  return <div {...cardProps}>{children}</div>;
};

// Card sub-components
const CardHeader = ({ children, className = '', ...props }) => (
  <div className={`pb-4 border-b border-gray-100 last:border-b-0 ${className}`} {...props}>
    {children}
  </div>
);

const CardBody = ({ children, className = '', ...props }) => (
  <div className={`py-4 first:pt-0 last:pb-0 ${className}`} {...props}>
    {children}
  </div>
);

const CardFooter = ({ children, className = '', ...props }) => (
  <div className={`pt-4 border-t border-gray-100 first:border-t-0 ${className}`} {...props}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '', as = 'h3', ...props }) => {
  const Component = as;
  return (
    <Component className={`text-lg font-semibold text-gray-900 ${className}`} {...props}>
      {children}
    </Component>
  );
};

const CardDescription = ({ children, className = '', ...props }) => (
  <p className={`text-sm text-gray-600 mt-1 ${className}`} {...props}>
    {children}
  </p>
);

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;
Card.Title = CardTitle;
Card.Description = CardDescription;

export default Card;