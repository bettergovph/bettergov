import { FC, ReactNode } from 'react';
import { cn } from '../../lib/utils';

/** Serif long-form copy block used across design system pages. */
export const Prose: FC<{ children: ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div
    className={cn(
      'max-w-2xl space-y-4 font-serif-ed text-[17px] leading-relaxed text-ed-ink-2',
      className
    )}
  >
    {children}
  </div>
);

/** Small mono sub-heading inside a documented section. */
export const DocHeading: FC<{ children: ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <h3
    className={cn(
      'mb-3 font-mono-ed text-[11px] font-medium uppercase tracking-[0.14em] text-ed-ink',
      className
    )}
  >
    {children}
  </h3>
);

/** Framed live example of a style or component. */
export const Example: FC<{
  children: ReactNode;
  caption?: ReactNode;
  padded?: boolean;
  className?: string;
}> = ({ children, caption, padded = true, className }) => (
  <div className={cn('my-6 border border-ed-rule-strong', className)}>
    <div className='flex items-baseline justify-between gap-4 border-b border-ed-rule bg-ed-paper-2 px-4 py-2'>
      <span className='font-mono-ed text-[10px] font-medium uppercase tracking-[0.14em] text-ed-ink-3'>
        Example
      </span>
      {caption && (
        <span className='font-mono-ed text-[10px] text-ed-ink-4'>
          {caption}
        </span>
      )}
    </div>
    <div className={cn('bg-white', padded && 'p-6 max-md:p-4')}>{children}</div>
  </div>
);

/** Paired do / don't guidance, GOV.UK style. */
export const WhenToUse: FC<{
  use: ReactNode[];
  avoid?: ReactNode[];
}> = ({ use, avoid }) => (
  <div className='my-6 grid max-w-3xl gap-8 md:grid-cols-2'>
    <div>
      <DocHeading>When to use it</DocHeading>
      <ul className='space-y-2 font-serif-ed text-[15px] leading-relaxed text-ed-ink-2'>
        {use.map((item, i) => (
          <li key={i} className='border-l-2 border-ed-sage pl-3'>
            {item}
          </li>
        ))}
      </ul>
    </div>
    {avoid && avoid.length > 0 && (
      <div>
        <DocHeading>When not to use it</DocHeading>
        <ul className='space-y-2 font-serif-ed text-[15px] leading-relaxed text-ed-ink-2'>
          {avoid.map((item, i) => (
            <li key={i} className='border-l-2 border-ed-red pl-3'>
              {item}
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
);

/** A single colour swatch with token name, hex value, and role. */
export const Swatch: FC<{
  colorClass: string;
  token: string;
  hex: string;
  role: string;
  border?: boolean;
}> = ({ colorClass, token, hex, role, border }) => (
  <div className='flex items-start gap-3'>
    <div
      className={cn(
        'h-12 w-12 shrink-0',
        colorClass,
        border && 'border border-ed-rule'
      )}
    />
    <div className='min-w-0'>
      <div className='font-mono-ed text-[12px] text-ed-ink'>{token}</div>
      <div className='font-mono-ed text-[11px] uppercase text-ed-ink-4'>
        {hex}
      </div>
      <div className='mt-0.5 font-sans-ed text-[12px] leading-snug text-ed-ink-3'>
        {role}
      </div>
    </div>
  </div>
);
