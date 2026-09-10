import { FC, ReactNode } from 'react';
import Container from '../ui/Container';
import { cn } from '../../../lib/utils';

type Variant = 'light' | 'hero';

type Props = {
  /** Main serif heading. */
  title: ReactNode;
  /** Optional lede below the title. */
  lede?: ReactNode;
  /** Content rendered below the lede — commonly a <BigSearch /> or filters. */
  children?: ReactNode;
  /**
   * `light` — paper-2 background with ed-ink title (default, good for
   * listing/detail pages).
   * `hero` — flat ed-navy-2 band with white title (used for landing
   * sections and section mastheads).
   */
  variant?: Variant;
  /**
   * Element used for the title. Defaults to h1 — override only when the
   * masthead is rendered as a demo inside another page (e.g. the design
   * system docs), where an extra h1 would break the heading outline.
   */
  titleAs?: 'h1' | 'h2' | 'p';
  className?: string;
};

const variantClasses: Record<Variant, string> = {
  light: 'bg-ed-paper-2 border-b border-ed-ink text-ed-ink',
  // Single flat blue shared by every hero band, including the landing hero.
  hero: 'bg-ed-navy-2 text-white',
};

const PageMasthead: FC<Props> = ({
  title,
  lede,
  children,
  variant = 'light',
  titleAs: TitleTag = 'h1',
  className,
}) => {
  const onDark = variant === 'hero';

  return (
    <section
      className={cn('py-16 max-md:py-7', variantClasses[variant], className)}
    >
      <Container>
        <TitleTag
          className={cn(
            'font-serif-ed font-bold tracking-[-0.02em]',
            // leading must follow the size class: tailwind-merge treats
            // text-[...] as conflicting and would otherwise drop it.
            'text-[clamp(32px,5vw,56px)] leading-none max-md:text-[26px]',
            onDark ? 'text-white' : 'text-ed-ink'
          )}
        >
          {title}
        </TitleTag>
        {lede && (
          <p
            className={cn(
              'mt-4 max-w-2xl font-sans-ed text-lg leading-relaxed max-md:mt-2.5 max-md:text-[15px] max-md:leading-snug',
              onDark ? 'text-white/85' : 'text-ed-ink-2'
            )}
          >
            {lede}
          </p>
        )}
        {children && <div className='mt-6 max-md:mt-4'>{children}</div>}
      </Container>
    </section>
  );
};

export default PageMasthead;
