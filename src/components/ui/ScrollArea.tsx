import { forwardRef, HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface ScrollAreaProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative overflow-auto',
          // Custom scrollbar styling - consistent with scrollbar-thin
          '[&::-webkit-scrollbar]:w-1',
          '[&::-webkit-scrollbar-track]:bg-gray-100',
          '[&::-webkit-scrollbar-track]:rounded-sm',
          '[&::-webkit-scrollbar-thumb]:bg-gray-300',
          '[&::-webkit-scrollbar-thumb]:rounded-sm',
          '[&::-webkit-scrollbar-thumb]:hover:bg-gray-400',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ScrollArea.displayName = 'ScrollArea';
