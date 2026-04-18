import { FC, CSSProperties, ReactNode } from 'react';
import { cn } from '../../../lib/utils';

type Props = {
  height?: number | string;
  className?: string;
  children?: ReactNode;
};

const STRIPES: CSSProperties = {
  backgroundImage:
    'repeating-linear-gradient(135deg, transparent 0 10px, rgba(0,0,0,0.04) 10px 11px)',
  backgroundColor: 'var(--color-ed-paper-2)',
};

const PlaceholderImage: FC<Props> = ({ height = 200, className, children }) => (
  <div
    style={{ ...STRIPES, height }}
    className={cn(
      'flex items-center justify-center border border-ed-rule text-center font-mono-ed text-[10px] uppercase tracking-[0.14em] text-ed-ink-3',
      className
    )}
  >
    {children}
  </div>
);

export default PlaceholderImage;
