import { FC, FormEvent, ReactNode } from 'react';
import { SearchIcon } from 'lucide-react';
import { cn } from '../../../lib/utils';

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  ariaLabel?: string;
  ctaLabel?: ReactNode;
  /**
   * When true, applies the on-dark (hero gradient) variant where the input
   * border is white and button uses the darker navy shade.
   */
  onDark?: boolean;
  className?: string;
};

const BigSearch: FC<Props> = ({
  value,
  onChange,
  onSubmit,
  placeholder,
  ariaLabel,
  ctaLabel,
  onDark,
  className,
}) => {
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form
      onSubmit={submit}
      className={cn(
        'flex items-stretch border-[1.5px] bg-white max-md:flex-col',
        onDark ? 'border-white' : 'border-ed-navy',
        className
      )}
    >
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={cn(
          'min-w-0 flex-1 border-0 bg-transparent text-ed-ink outline-none font-serif-ed placeholder:italic placeholder:text-ed-ink-4',
          onDark
            ? 'px-[18px] py-4 text-xl max-md:px-3.5 max-md:py-3 max-md:text-base'
            : 'px-6 py-[22px] text-[28px] max-md:px-3.5 max-md:py-3 max-md:text-lg max-md:border-b max-md:border-ed-ink'
        )}
      />
      <button
        type='submit'
        className={cn(
          'flex items-center justify-center gap-2.5 border-0 px-8 font-sans-ed text-sm font-medium tracking-[0.04em] text-white cursor-pointer whitespace-nowrap max-md:px-5 max-md:py-3',
          onDark
            ? 'bg-ed-navy-ink hover:bg-black'
            : 'bg-ed-navy hover:bg-ed-navy-ink'
        )}
      >
        <SearchIcon size={16} />
        <span>{ctaLabel ?? 'Search'}</span>
      </button>
    </form>
  );
};

export default BigSearch;
