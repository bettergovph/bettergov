import { FC, ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { DESIGN_SECTIONS } from './sections';

/** In-column page header used by every design system page. */
export const PageHeader: FC<{
  title: string;
  lede?: string;
  kicker?: string;
}> = ({ title, lede, kicker = 'National Design Guidelines' }) => (
  <header className='mb-10 border-b border-ed-ink pb-8 max-md:mb-8 max-md:pb-6'>
    <div className='mb-3 font-sans-ed text-[11px] font-semibold uppercase tracking-[0.14em] text-ed-navy'>
      {kicker}
    </div>
    <h1 className='font-serif-ed text-[clamp(30px,4vw,44px)] font-bold leading-none tracking-[-0.02em] text-ed-ink'>
      {title}
    </h1>
    {lede && (
      <p className='mt-4 max-w-2xl font-sans-ed text-lg leading-relaxed text-ed-ink-2'>
        {lede}
      </p>
    )}
  </header>
);

/**
 * Stacked content section: every section after the first gets a top rule.
 * The id anchors the sidebar's subsection links — keep it in sync with
 * sections.ts.
 */
export const DocSection: FC<{
  children: ReactNode;
  first?: boolean;
  id?: string;
}> = ({ children, first, id }) => (
  <section
    id={id}
    className={cn(
      'scroll-mt-6',
      !first && 'mt-14 border-t border-ed-rule pt-10 max-md:mt-10'
    )}
  >
    {children}
  </section>
);

/** Previous / next page navigation at the foot of every guideline page. */
export const PagerNav: FC = () => {
  const { pathname } = useLocation();
  const index = DESIGN_SECTIONS.findIndex(s =>
    s.end ? pathname === s.to : pathname.startsWith(s.to)
  );
  if (index === -1) return null;
  const prev = index > 0 ? DESIGN_SECTIONS[index - 1] : null;
  const next =
    index < DESIGN_SECTIONS.length - 1 ? DESIGN_SECTIONS[index + 1] : null;

  return (
    <nav
      aria-label='Previous and next page'
      className='mt-16 grid grid-cols-2 gap-6 border-t-2 border-ed-ink pt-6 max-md:mt-12'
    >
      <div>
        {prev && (
          <Link to={prev.to} className='group block no-underline'>
            <div className='font-sans-ed text-[11px] uppercase tracking-[0.12em] text-ed-ink-3'>
              Previous
            </div>
            <div className='mt-1 font-serif-ed text-lg font-semibold text-ed-navy transition-colors group-hover:text-ed-red'>
              ← {prev.label}
            </div>
          </Link>
        )}
      </div>
      <div className='text-right'>
        {next && (
          <Link to={next.to} className='group block no-underline'>
            <div className='font-sans-ed text-[11px] uppercase tracking-[0.12em] text-ed-ink-3'>
              Next
            </div>
            <div className='mt-1 font-serif-ed text-lg font-semibold text-ed-navy transition-colors group-hover:text-ed-red'>
              {next.label} →
            </div>
          </Link>
        )}
      </div>
    </nav>
  );
};

/** Long-form copy block used across design system pages. */
export const Prose: FC<{ children: ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div
    className={cn(
      'max-w-2xl space-y-4 font-sans-ed text-[17px] leading-relaxed text-ed-ink-2',
      className
    )}
  >
    {children}
  </div>
);

/** Sub-heading inside a documented section. */
export const DocHeading: FC<{ children: ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <h3
    className={cn(
      'mb-3 font-serif-ed text-[17px] font-semibold text-ed-ink',
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
      <ul className='space-y-2 font-sans-ed text-[15px] leading-relaxed text-ed-ink-2'>
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
        <ul className='space-y-2 font-sans-ed text-[15px] leading-relaxed text-ed-ink-2'>
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
