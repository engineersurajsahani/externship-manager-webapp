import React, { forwardRef } from 'react';

const Input = forwardRef(
  (
    {
      label,
      error,
      success,
      helperText,
      leftIcon,
      rightIcon,
      className = '',
      variant = 'default',
      size = 'md',
      fullWidth = false,
      ...props
    },
    ref
  ) => {
    const baseClasses = 'input-premium smooth-transition';

    const variants = {
      default: 'border-gray-300 focus:ring-indigo-500',
      filled: 'bg-gray-50 border-gray-300 focus:bg-white focus:ring-indigo-500',
      outlined: 'border-2 border-gray-300 focus:ring-indigo-500',
      minimal:
        'border-0 border-b-2 border-gray-300 rounded-none bg-transparent px-0 focus:ring-0 focus:border-indigo-500',
    };

    const sizes = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3 text-sm',
      lg: 'px-5 py-4 text-base',
    };

    const getInputClasses = () => {
      let classes = `${baseClasses} ${variants[variant]} ${sizes[size]}`;

      if (error) {
        classes += ' border-red-300 focus:ring-red-500 focus:border-red-500';
      } else if (success) {
        classes +=
          ' border-green-300 focus:ring-green-500 focus:border-green-500';
      }

      if (leftIcon) {
        classes += ' pl-10';
      }

      if (rightIcon) {
        classes += ' pr-10';
      }

      if (fullWidth) {
        classes += ' w-full';
      }

      return `${classes} ${className}`.trim();
    };

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400">{leftIcon}</span>
            </div>
          )}

          <input ref={ref} className={getInputClasses()} {...props} />

          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <span
                className={
                  error
                    ? 'text-red-400'
                    : success
                      ? 'text-green-400'
                      : 'text-gray-400'
                }
              >
                {rightIcon}
              </span>
            </div>
          )}
        </div>

        {(error || success || helperText) && (
          <div className="mt-2">
            {error && (
              <p className="text-sm text-red-600 flex items-center">
                <svg
                  className="w-4 h-4 mr-1 flex-shrink-0"
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
            )}

            {success && !error && (
              <p className="text-sm text-green-600 flex items-center">
                <svg
                  className="w-4 h-4 mr-1 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                {success}
              </p>
            )}

            {helperText && !error && !success && (
              <p className="text-sm text-gray-500">{helperText}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
