import { clsx } from 'clsx';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'white' | 'gray';
  className?: string;
}

export function LoadingSpinner({
  size = 'md',
  variant = 'primary',
  className,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
  };

  const variantClasses = {
    primary: 'border-primary-600 border-t-transparent',
    white: 'border-white border-t-transparent',
    gray: 'border-slate-400 border-t-transparent',
  };

  return (
    <div
      className={clsx(
        'animate-spin rounded-full',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      role='status'
      aria-label='Loading'
    >
      <span className='sr-only'>Loading...</span>
    </div>
  );
}

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  children: React.ReactNode;
}

export function LoadingOverlay({
  isLoading,
  message = 'Loading...',
  children,
}: LoadingOverlayProps) {
  return (
    <div className='relative'>
      {children}
      {isLoading && (
        <div className='absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10'>
          <div className='text-center'>
            <LoadingSpinner size='lg' />
            <p className='mt-2 text-sm text-slate-600'>{message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
