import { FC } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { PAGE_GAP, paginationRange } from '../../../lib/pagination';

type Props = {
  /** 1-indexed. */
  page: number;
  totalPages: number;
  /** Builds the `to` for a given page — pagination stays in the URL. */
  hrefFor: (page: number) => string;
  /** How many pages to show either side of the current one. */
  siblings?: number;
  /** Describes the list being paged, for screen readers. */
  label?: string;
  className?: string;
};

const cellBase =
  'inline-flex h-10 min-w-10 items-center justify-center border px-3 font-mono-ed text-[12px] no-underline transition-colors';

const inactive =
  'border-ed-rule-strong bg-white text-ed-ink hover:border-ed-navy hover:bg-ed-navy-tint hover:text-ed-navy';

const unavailable = 'border-ed-rule bg-ed-paper-2 text-ed-rule-strong';

/**
 * Previous/next. When there's nowhere to go the control is rendered as an
 * inert, aria-hidden span: it holds the layout but is not a link, so it is
 * neither focusable nor announced — the numbered links carry the semantics.
 */
const Step: FC<{
  to: string;
  direction: 'prev' | 'next';
  available: boolean;
}> = ({ to, direction, available }) => {
  const Icon = direction === 'prev' ? ChevronLeftIcon : ChevronRightIcon;

  if (!available) {
    return (
      <span aria-hidden='true' className={cn(cellBase, unavailable)}>
        <Icon size={14} />
      </span>
    );
  }

  return (
    <Link
      to={to}
      rel={direction}
      aria-label={direction === 'prev' ? 'Previous page' : 'Next page'}
      className={cn(cellBase, inactive)}
    >
      <Icon size={14} aria-hidden='true' />
    </Link>
  );
};

const Pagination: FC<Props> = ({
  page,
  totalPages,
  hrefFor,
  siblings = 1,
  label = 'Pagination',
  className,
}) => {
  if (totalPages <= 1) return null;

  const slots = paginationRange(page, totalPages, siblings);
  const hasPrevious = page > 1;
  const hasNext = page < totalPages;

  return (
    <nav aria-label={label} className={cn('flex justify-center', className)}>
      <ul className='flex flex-wrap items-center justify-center gap-1.5'>
        <li>
          <Step
            to={hrefFor(page - 1)}
            direction='prev'
            available={hasPrevious}
          />
        </li>

        {slots.map((slot, i) =>
          slot === PAGE_GAP ? (
            <li
              // Gaps have no stable identity beyond their position.
              key={`gap-${i}`}
              aria-hidden='true'
              className='px-1 font-mono-ed text-[12px] text-ed-ink-3'
            >
              …
            </li>
          ) : (
            <li key={slot}>
              <Link
                to={hrefFor(slot)}
                aria-label={`Page ${slot}`}
                aria-current={slot === page ? 'page' : undefined}
                className={cn(
                  cellBase,
                  slot === page
                    ? 'border-ed-navy bg-ed-navy font-medium text-white'
                    : inactive
                )}
              >
                {slot}
              </Link>
            </li>
          )
        )}

        <li>
          <Step to={hrefFor(page + 1)} direction='next' available={hasNext} />
        </li>
      </ul>
    </nav>
  );
};

export default Pagination;
