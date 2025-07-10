import { InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'outline';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      variant = 'default',
      className,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substring(2, 8)}`;

    const baseClasses =
      'w-full px-4 py-3 text-slate-900 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]';

    const variantClasses = {
      default:
        'border border-slate-300 rounded-lg bg-white focus:ring-primary-500 focus:border-primary-500',
      outline:
        'border-2 border-slate-300 rounded-lg bg-transparent focus:ring-primary-500 focus:border-primary-500',
    };

    const errorClasses = error
      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
      : '';

    return (
      <div className='space-y-2'>
        {label && (
          <label
            htmlFor={inputId}
            className='block text-sm font-medium text-slate-700'
          >
            {label}
          </label>
        )}

        <div className='relative'>
          {leftIcon && (
            <div className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400'>
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={clsx(
              baseClasses,
              variantClasses[variant],
              errorClasses,
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            {...props}
          />

          {rightIcon && (
            <div className='absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400'>
              {rightIcon}
            </div>
          )}
        </div>

        {(error || helperText) && (
          <div className='text-sm'>
            {error ? (
              <p className='text-red-600'>{error}</p>
            ) : (
              <p className='text-slate-500'>{helperText}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
