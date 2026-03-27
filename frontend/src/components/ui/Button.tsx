import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    const variants = {
      primary: 'bg-green-500 hover:bg-green-400 text-gray-950 font-semibold border border-green-500 hover:shadow-green-glow',
      secondary: 'bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium border border-gray-700 hover:border-gray-600',
      danger: 'bg-red-900/50 hover:bg-red-800/70 text-red-400 hover:text-red-300 border border-red-800/50 hover:border-red-700/70',
      ghost: 'bg-transparent hover:bg-gray-800 text-gray-400 hover:text-gray-200 border border-transparent',
      outline: 'bg-transparent hover:bg-gray-800/50 text-green-400 border border-green-500/40 hover:border-green-500/70',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5 rounded-md',
      md: 'text-sm px-4 py-2 gap-2 rounded-lg',
      lg: 'text-base px-6 py-3 gap-2.5 rounded-lg',
      icon: 'p-2 rounded-lg',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-950',
          'disabled:opacity-50 disabled:cursor-not-allowed active:scale-95',
          variant === 'primary' && 'focus:ring-green-500',
          variant === 'danger' && 'focus:ring-red-600',
          variant !== 'primary' && variant !== 'danger' && 'focus:ring-gray-600',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          leftIcon
        )}
        {children && <span>{children}</span>}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
