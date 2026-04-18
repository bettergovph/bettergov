import { FC, ReactNode } from 'react';
import Container from '../ui/Container';
import Eyebrow from '../ui/Eyebrow';
import { cn } from '../../../lib/utils';

type Variant = 'light' | 'hero';

type Props = {
  /** Small mono label above the title (e.g. "Section · Services Index"). */
  eyebrow?: ReactNode;
  /** Main serif heading. */
  title: ReactNode;
  /** Optional serif lede below the title. */
  lede?: ReactNode;
  /** Content rendered below the lede — commonly a <BigSearch /> or filters. */
  children?: ReactNode;
  /**
   * `light` — paper-2 background with ed-ink title (default, good for
   * listing/detail pages).
   * `hero` — navy gradient with white title (used sparingly for landing
   * sections).
   */
  variant?: Variant;
  className?: string;
};

const variantClasses: Record<Variant, string> = {
  light: 'bg-ed-paper-2 border-b border-ed-ink text-ed-ink',
  hero: 'bg-gradient-to-r from-ed-navy-2 to-ed-navy-ink text-white',
};

const PageMasthead: FC<Props> = ({
  eyebrow,
  title,
  lede,
  children,
  variant = 'light',
  className,
}) => {
  const onDark = variant === 'hero';

  return (
    <section
      className={cn('py-12 max-md:py-8', variantClasses[variant], className)}
    >
      <Container>
        {eyebrow && (
          <div className='mb-3'>
            <Eyebrow tone={onDark ? 'onDark' : 'default'}>{eyebrow}</Eyebrow>
          </div>
        )}
        <h1
          className={cn(
            'font-serif-ed font-normal leading-[1.05] tracking-[-0.02em]',
            'text-[clamp(32px,5vw,56px)]',
            onDark ? 'text-white' : 'text-ed-ink'
          )}
        >
          {title}
        </h1>
        {lede && (
          <p
            className={cn(
              'mt-4 max-w-2xl font-serif-ed text-lg leading-relaxed',
              onDark ? 'text-white/85' : 'text-ed-ink-2'
            )}
          >
            {lede}
          </p>
        )}
        {children && <div className='mt-6'>{children}</div>}
      </Container>
    </section>
  );
};

export default PageMasthead;
