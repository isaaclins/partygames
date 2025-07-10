import { ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantClasses = {
      primary:
        'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500',
      secondary:
        'bg-slate-200 hover:bg-slate-300 text-slate-900 focus:ring-slate-500',
      outline:
        'border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 focus:ring-slate-500',
      ghost:
        'bg-transparent hover:bg-slate-100 text-slate-700 focus:ring-slate-500',
      danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    };

    const sizeClasses = {
      sm: 'px-3 py-2 text-sm rounded-md min-h-[36px]',
      md: 'px-4 py-3 text-sm rounded-lg min-h-[44px]',
      lg: 'px-6 py-4 text-base rounded-lg min-h-[52px]',
    };

    return (
      <button
        ref={ref}
        className={clsx(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <div className='w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin' />
        ) : (
          <>
            {leftIcon && <span className='mr-2'>{leftIcon}</span>}
            {children}
            {rightIcon && <span className='ml-2'>{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
