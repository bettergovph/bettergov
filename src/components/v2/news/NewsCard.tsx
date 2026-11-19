import { FC, useState } from 'react';
import { Link } from 'react-router-dom';
import { NewsArticle } from '../../../types/news';
import { formatNewsDate } from '../../../lib/news';
import { cn } from '../../../lib/utils';
import Flag from '../ui/Flag';
import PlaceholderImage from '../ui/PlaceholderImage';

type Variant = 'lead' | 'card';

type Props = {
  article: NewsArticle;
  /**
   * `lead` — the wide, image-left treatment used for the newest item.
   * `card` — the standard grid cell.
   */
  variant?: Variant;
  className?: string;
};

/** Circulars are text-only in the source; a stripe reads better than a gap. */
const Thumbnail: FC<{ article: NewsArticle; className?: string }> = ({
  article,
  className,
}) => {
  const [failed, setFailed] = useState(false);

  if (!article.imageUrl || failed) {
    return (
      <PlaceholderImage height='100%' className={cn('w-full', className)}>
        {article.category.label}
      </PlaceholderImage>
    );
  }

  return (
    <img
      src={article.imageUrl}
      alt=''
      loading='lazy'
      decoding='async'
      onError={() => setFailed(true)}
      className={cn('h-full w-full object-cover object-top', className)}
    />
  );
};

const Meta: FC<{ article: NewsArticle }> = ({ article }) => (
  <div className='flex flex-wrap items-baseline gap-3'>
    <Flag variant={article.category.id === 6 ? 'outline' : 'navy'}>
      {article.category.label}
    </Flag>
    {article.publishedAt && (
      <time
        dateTime={article.publishedAt.toISOString()}
        className='font-mono-ed text-[11px] tracking-[0.12em] text-ed-ink-3'
      >
        {formatNewsDate(article.publishedAt)}
      </time>
    )}
    {article.publisher && (
      <span className='font-mono-ed text-[11px] tracking-[0.12em] text-ed-ink-3'>
        · {article.publisher}
      </span>
    )}
  </div>
);

const NewsCard: FC<Props> = ({ article, variant = 'card', className }) => {
  const to = `/news/${article.id}`;

  if (variant === 'lead') {
    return (
      <article
        className={cn('border-b border-ed-ink pb-5 md:pb-10', className)}
      >
        <div className='grid grid-cols-[1.15fr_1fr] items-start gap-8 max-md:grid-cols-1 max-md:gap-5'>
          <Link to={to} tabIndex={-1} aria-hidden='true' className='block'>
            <div className='aspect-[16/9] w-full overflow-hidden border border-ed-rule'>
              <Thumbnail article={article} />
            </div>
          </Link>
          <div>
            <Meta article={article} />
            <h2 className='mt-4 font-serif-ed text-[clamp(24px,2.6vw,34px)] font-bold leading-[1.08] tracking-[-0.01em] max-md:mt-2.5 max-md:text-[22px]'>
              <Link
                to={to}
                className='text-ed-ink no-underline hover:underline'
              >
                {article.title}
              </Link>
            </h2>
            {article.relativeLabel && (
              <p className='mt-3 font-mono-ed text-[11px] uppercase tracking-[0.14em] text-ed-ink-3'>
                {article.relativeLabel}
              </p>
            )}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className={cn('flex flex-col', className)}>
      <Link to={to} tabIndex={-1} aria-hidden='true' className='block'>
        <div className='aspect-[16/9] w-full overflow-hidden border border-ed-rule'>
          <Thumbnail article={article} />
        </div>
      </Link>
      <div className='mt-4 flex flex-1 flex-col max-md:mt-2.5'>
        <Meta article={article} />
        <h3 className='mt-2 font-serif-ed text-[19px] font-semibold leading-snug tracking-[-0.005em] max-md:mt-1.5 max-md:text-[17px]'>
          <Link to={to} className='text-ed-ink no-underline hover:underline'>
            {article.title}
          </Link>
        </h3>
      </div>
    </article>
  );
};

export default NewsCard;
