import { cn } from '@/lib/utils';
import { ComponentProps } from 'react';

type SkipNavLinkProps = { label?: string } & Omit<
  ComponentProps<'a'>,
  'children'
>;

export default function SkipNavLink({
  label = 'Skip to main content',
  className,
  ...props
}: SkipNavLinkProps) {
  return (
    <a
      href='#main-content'
      className={cn(
        'absolute left-2 top-0 z-999 bg-primary-500 text-white py-2 px-4 -translate-y-full focus:translate-y-2 transition ease-out focus:outline-2 outline-primary-500 outline-offset-2 rounded',
        className
      )}
      {...props}
    >
      {label}
    </a>
  );
}
