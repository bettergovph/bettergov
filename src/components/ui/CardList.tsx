import {
  ExternalLinkIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
} from 'lucide-react';
import { ReactNode } from 'react';

interface ContactInfo {
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
}

interface CardListProps {
  children: ReactNode;
  className?: string;
}

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'featured' | 'compact';
  hover?: boolean;
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

interface CardTitleProps {
  children: ReactNode;
  level?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  className?: string;
}

interface CardDescriptionProps {
  children: ReactNode;
  className?: string;
}

interface CardContactInfoProps {
  contact: ContactInfo;
  compact?: boolean;
}

interface CardGridProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
  breakpoint?: 'sm' | 'md' | 'lg' | 'xl';
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface CardAvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface CardDividerProps {
  className?: string;
}

export function CardList({ children, className = '' }: CardListProps) {
  return (
    <div className={`space-y-6 ${className}`} role='list'>
      {children}
    </div>
  );
}

export function Card({
  children,
  className = '',
  variant = 'default',
  hover = true,
}: CardProps) {
  const baseClasses = 'bg-white rounded-lg border overflow-hidden';

  const variantClasses = {
    default: 'shadow-xs',
    featured: 'shadow-md',
    compact: 'shadow-xs',
  };

  const hoverClasses = hover
    ? 'hover:shadow-md transition-shadow duration-200'
    : '';

  return (
    <article
      className={`${baseClasses} ${variantClasses[variant]} ${hoverClasses} ${className}`}
      role='listitem'
    >
      {children}
    </article>
  );
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <header className={`border-b border-gray-100 p-5 ${className}`}>
      {children}
    </header>
  );
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}

export function CardTitle({
  children,
  level = 'h3',
  className = '',
}: CardTitleProps) {
  const baseClasses = 'font-semibold text-gray-900';

  const levelClasses = {
    h1: 'text-2xl',
    h2: 'text-xl',
    h3: 'text-lg',
    h4: 'text-base',
    h5: 'text-sm',
    h6: 'text-xs',
  };

  const Component = level;

  return (
    <Component className={`${baseClasses} ${levelClasses[level]} ${className}`}>
      {children}
    </Component>
  );
}

export function CardDescription({
  children,
  className = '',
}: CardDescriptionProps) {
  return (
    <p className={`text-gray-800 text-sm mt-1 ${className}`}>{children}</p>
  );
}

export function CardContactInfo({
  contact,
  compact = false,
}: CardContactInfoProps) {
  const iconSize = compact ? 'h-3 w-3' : 'h-4 w-4';
  const textSize = compact ? 'text-xs' : 'text-sm';
  const spacing = compact ? 'space-y-1' : 'space-y-2';

  return (
    <address className={`not-italic ${spacing}`}>
      {contact.address && (
        <div className='flex items-start'>
          <MapPinIcon
            className={`${iconSize} text-gray-400 mr-2 mt-0.5 flex-shrink-0`}
          />
          <span className={`text-gray-800 ${textSize}`}>{contact.address}</span>
        </div>
      )}

      {contact.phone && (
        <div className='flex items-start'>
          <PhoneIcon
            className={`${iconSize} text-gray-400 mr-2 mt-0.5 flex-shrink-0`}
          />
          <a
            href={`tel:${contact.phone}`}
            className={`text-gray-800 ${textSize} hover:text-primary-600 transition-colors`}
          >
            {contact.phone}
          </a>
        </div>
      )}

      {contact.email && (
        <div className='flex items-start'>
          <MailIcon
            className={`${iconSize} text-gray-400 mr-2 mt-0.5 flex-shrink-0`}
          />
          <a
            href={`mailto:${contact.email}`}
            className={`text-primary-600 hover:underline ${textSize}`}
          >
            {contact.email}
          </a>
        </div>
      )}

      {contact.website && (
        <div className='flex items-start'>
          <ExternalLinkIcon
            className={`${iconSize} text-gray-400 mr-2 mt-0.5 flex-shrink-0`}
          />
          <a
            href={
              contact.website.startsWith('http')
                ? contact.website
                : `https://${contact.website.split(' ')[0]}`
            }
            target='_blank'
            rel='noopener noreferrer'
            className={`text-primary-600 hover:underline ${textSize}`}
          >
            {contact.website.split(' ')[0]}
          </a>
        </div>
      )}
    </address>
  );
}

export function CardGrid({
  children,
  columns = 2,
  breakpoint = 'md',
  gap = 'md',
  className = '',
}: CardGridProps) {
  const columnClasses = {
    1: `${breakpoint}:grid-cols-1`,
    2: `${breakpoint}:grid-cols-2`,
    3: `${breakpoint}:grid-cols-3`,
    4: `${breakpoint}:grid-cols-4`,
  };

  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
  };

  return (
    <div
      className={`grid grid-cols-1 ${columnClasses[columns]} ${gapClasses[gap]} ${className}`}
      role='list'
    >
      {children}
    </div>
  );
}

export function CardAvatar({
  name,
  size = 'md',
  className = '',
}: CardAvatarProps) {
  const sizeClasses = {
    sm: 'w-12 h-12 text-lg',
    md: 'w-16 h-16 text-xl',
    lg: 'w-24 h-24 text-3xl',
  };

  return (
    <div
      className={`rounded-full bg-gray-100 flex items-center justify-center ${sizeClasses[size]} ${className}`}
      aria-label={`${name} avatar`}
    >
      <span className='font-bold text-gray-400'>
        {name.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}

export function CardDivider({ className = '' }: CardDividerProps) {
  return <hr className={`border-gray-100 ${className}`} />;
}
