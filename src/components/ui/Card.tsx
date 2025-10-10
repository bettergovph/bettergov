import { HTMLAttributes, ImgHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
}

const Card = ({
  children,
  className,
  hoverable = false,
  ...props
}: CardProps) => {
  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden',
        hoverable &&
          'transition-all duration-300 hover:shadow-md hover:-translate-y-1',
        className
      )}
      role='article'
      aria-label='Service card'
      {...props}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

const CardHeader = ({ children, className, ...props }: CardHeaderProps) => {
  return (
    <div
      className={cn('p-4 md:p-6 border-b border-gray-200', className)}
      role='heading'
      aria-level={2}
      {...props}
    >
      {children}
    </div>
  );
};

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

const CardContent = ({ children, className, ...props }: CardContentProps) => {
  return (
    <div
      className={cn('p-4 md:p-6', className)}
      role='region'
      aria-label='Service details'
      {...props}
    >
      {children}
    </div>
  );
};

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

const CardFooter = ({ children, className, ...props }: CardFooterProps) => {
  return (
    <div
      className={cn(
        'p-4 md:p-6 border-t border-gray-200 bg-gray-50',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

interface CardImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
}

const CardImage = ({ className, ...props }: CardImageProps) => {
  return (
    <div className='relative w-full h-48 overflow-hidden'>
      <img
        className={cn('w-full h-full object-cover', className)}
        {...props}
        alt={props.alt || 'Card image'}
      />
    </div>
  );
};

export { Card, CardHeader, CardContent, CardFooter, CardImage };
