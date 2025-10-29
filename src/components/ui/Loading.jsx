import React from 'react';

// Loading Spinner
export const Spinner = ({ size = 'md', color = 'primary', className = '' }) => {
  const sizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const colors = {
    primary: 'text-indigo-600',
    secondary: 'text-purple-600',
    white: 'text-white',
    gray: 'text-gray-600',
  };

  return (
    <svg
      className={`${sizes[size]} ${colors[color]} animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

// Loading Dots
export const LoadingDots = ({
  size = 'md',
  color = 'primary',
  className = '',
}) => {
  const sizes = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  };

  const colors = {
    primary: 'bg-indigo-600',
    secondary: 'bg-purple-600',
    gray: 'bg-gray-400',
  };

  const dotClass = `${sizes[size]} ${colors[color]} rounded-full`;

  return (
    <div className={`flex space-x-1 ${className}`}>
      <div
        className={`${dotClass} animate-bounce`}
        style={{ animationDelay: '0ms' }}
      ></div>
      <div
        className={`${dotClass} animate-bounce`}
        style={{ animationDelay: '150ms' }}
      ></div>
      <div
        className={`${dotClass} animate-bounce`}
        style={{ animationDelay: '300ms' }}
      ></div>
    </div>
  );
};

// Full Page Loading
export const PageLoading = ({ message = 'Loading...', className = '' }) => {
  return (
    <div
      className={`min-h-screen flex items-center justify-center bg-gray-50 ${className}`}
    >
      <div className="text-center">
        <Spinner size="xl" />
        <p className="mt-4 text-lg text-gray-600 font-medium">{message}</p>
      </div>
    </div>
  );
};

// Skeleton Components
export const Skeleton = ({
  width,
  height,
  className = '',
  variant = 'rectangular',
}) => {
  const variants = {
    rectangular: '',
    circular: 'rounded-full',
    text: 'rounded',
  };

  const style = {
    width: width || '100%',
    height: height || (variant === 'text' ? '1rem' : '2rem'),
  };

  return (
    <div
      className={`skeleton loading-shimmer ${variants[variant]} ${className}`}
      style={style}
    />
  );
};

// Card Skeleton
export const CardSkeleton = ({ className = '' }) => {
  return (
    <div className={`card-premium p-6 ${className}`}>
      <div className="flex items-center space-x-4">
        <Skeleton variant="circular" width="3rem" height="3rem" />
        <div className="flex-1 space-y-2">
          <Skeleton height="1rem" width="60%" />
          <Skeleton height="0.75rem" width="40%" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton height="0.75rem" />
        <Skeleton height="0.75rem" width="80%" />
        <Skeleton height="0.75rem" width="60%" />
      </div>
    </div>
  );
};

// Table Skeleton
export const TableSkeleton = ({ rows = 5, columns = 4, className = '' }) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} height="1.5rem" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} height="1rem" />
          ))}
        </div>
      ))}
    </div>
  );
};

// Loading Button
export const LoadingButton = ({
  loading = false,
  children,
  className = '',
  ...props
}) => {
  return (
    <button
      className={`btn-premium flex items-center justify-center ${className}`}
      disabled={loading}
      {...props}
    >
      {loading && <Spinner size="sm" color="white" className="mr-2" />}
      {children}
    </button>
  );
};

const LoadingComponents = {
  Spinner,
  LoadingDots,
  PageLoading,
  Skeleton,
  CardSkeleton,
  TableSkeleton,
  LoadingButton,
};

export default LoadingComponents;
