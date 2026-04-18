import { FC, HTMLAttributes } from 'react';
import { cn } from '../../../lib/utils';

type Variant = 'default' | 'red' | 'navy' | 'outline';

type Props = HTMLAttributes<HTMLSpanElement> & {
  variant?: Variant;
};

const variantClasses: Record<Variant, string> = {
  default: 'bg-ed-paper-2 text-ed-ink-2 border-ed-rule-strong',
  red: 'bg-ed-red text-white border-ed-red',
  navy: 'bg-ed-navy text-white border-ed-navy',
  outline: 'bg-transparent text-ed-ink-2 border-ed-rule-strong',
};

const Flag: FC<Props> = ({ variant = 'default', className, ...rest }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 border px-2 py-[3px] font-mono-ed text-[10px] uppercase tracking-[0.14em] whitespace-nowrap',
      variantClasses[variant],
      className
    )}
    {...rest}
  />
);

export default Flag;
