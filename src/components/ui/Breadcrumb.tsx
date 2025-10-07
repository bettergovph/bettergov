import { ChevronRightIcon, HomeIcon } from 'lucide-react';
import { forwardRef, HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface BreadcrumbProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  className?: string;
}

interface BreadcrumbListProps extends HTMLAttributes<HTMLOListElement> {
  children: ReactNode;
  className?: string;
}

interface BreadcrumbItemProps extends LiHTMLAttributes<HTMLLIElement> {
  children: ReactNode;
  className?: string;
}

interface BreadcrumbLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  className?: string;
  children: ReactNode;
}

interface BreadcrumbPageProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  className?: string;
}

interface BreadcrumbSeparatorProps extends HTMLAttributes<HTMLLIElement> {
  children?: ReactNode;
  className?: string;
}

const Breadcrumb = forwardRef<HTMLElement, BreadcrumbProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <nav ref={ref} aria-label='breadcrumb' className={className} {...props}>
        <ol className={cn('flex items-center space-x-2', className)}>
          {children}
        </ol>
      </nav>
    );
  }
);
Breadcrumb.displayName = 'Breadcrumb';

const BreadcrumbList = forwardRef<HTMLOListElement, BreadcrumbListProps>(
  ({ className, children, ...props }, ref) => (
    <ol
      ref={ref}
      className={cn(
        'flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground',
        className
      )}
      {...props}
    >
      {children}
    </ol>
  )
);
BreadcrumbList.displayName = 'BreadcrumbList';

const BreadcrumbItem = forwardRef<HTMLLIElement, BreadcrumbItemProps>(
  ({ className, children, ...props }, ref) => (
    <li
      ref={ref}
      className={cn('inline-flex items-center', className)}
      {...props}
    >
      {children}
    </li>
  )
);
BreadcrumbItem.displayName = 'BreadcrumbItem';

const BreadcrumbLink = forwardRef<HTMLAnchorElement, BreadcrumbLinkProps>(
  ({ className, href, children, ...props }, ref) => (
    <a
      ref={ref}
      href={href}
      className={cn(
        'text-sm font-medium text-muted-foreground hover:text-foreground transition-colors',
        className
      )}
      {...props}
    >
      {children}
    </a>
  )
);
BreadcrumbLink.displayName = 'BreadcrumbLink';

const BreadcrumbPage = forwardRef<HTMLSpanElement, BreadcrumbPageProps>(
  ({ className, children, ...props }, ref) => (
    <span
      ref={ref}
      role='link'
      aria-disabled='true'
      aria-current='page'
      className={cn('text-sm font-medium text-foreground', className)}
      {...props}
    >
      {children}
    </span>
  )
);
BreadcrumbPage.displayName = 'BreadcrumbPage';

const BreadcrumbSeparator = ({
  children,
  className,
  ...props
}: BreadcrumbSeparatorProps) => (
  <li
    role='presentation'
    aria-hidden='true'
    className={cn('text-muted-foreground', className)}
    {...props}
  >
    {children || <ChevronRightIcon className='h-4 w-4' />}
  </li>
);
BreadcrumbSeparator.displayName = 'BreadcrumbSeparator';

const BreadcrumbHome = forwardRef<HTMLAnchorElement, BreadcrumbLinkProps>(
  ({ className, href, children, ...props }, ref) => (
    <a
      ref={ref}
      href={href}
      className={cn(
        'flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors',
        className
      )}
      {...props}
    >
      <HomeIcon className='h-4 w-4' />
      {children}
    </a>
  )
);
BreadcrumbHome.displayName = 'BreadcrumbHome';

export {
  Breadcrumb,
  BreadcrumbHome,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
};
