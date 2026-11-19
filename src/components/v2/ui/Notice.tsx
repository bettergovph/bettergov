import { FC, ReactNode } from 'react';
import Eyebrow from './Eyebrow';
import { cn } from '../../../lib/utils';

type Props = {
  /** Short label above the title, e.g. "Coming soon". */
  tag: ReactNode;
  title: ReactNode;
  /** Body copy and any links. */
  children?: ReactNode;
  /**
   * `status` when the notice replaces content that failed to load, so screen
   * readers announce it; `note` for a standing notice on a page.
   */
  role?: 'status' | 'note';
  className?: string;
};

/**
 * Calm notice panel for content that is unavailable or being updated: a navy
 * rule on the paper background rather than an alarming red error.
 */
const Notice: FC<Props> = ({
  tag,
  title,
  children,
  role = 'note',
  className,
}) => (
  <div
    role={role}
    className={cn(
      'border-l-4 border-ed-navy bg-ed-paper-2 p-6 max-md:p-5',
      className
    )}
  >
    <Eyebrow tone='navy'>{tag}</Eyebrow>
    <p className='mt-2 font-serif-ed text-[22px] font-semibold leading-snug text-ed-ink max-md:text-lg'>
      {title}
    </p>
    {children}
  </div>
);

export default Notice;
