import { FC, HTMLAttributes } from 'react';
import { cn } from '../../../lib/utils';

type Props = HTMLAttributes<HTMLSpanElement> & {
  tone?: 'default' | 'onDark' | 'navy' | 'red';
};

const toneClasses: Record<NonNullable<Props['tone']>, string> = {
  default: 'text-ed-ink-3',
  onDark: 'text-white/70',
  navy: 'text-ed-navy',
  red: 'text-ed-red',
};

const Eyebrow: FC<Props> = ({ tone = 'default', className, ...rest }) => (
  <span
    className={cn(
      'font-mono-ed text-[11px] font-medium uppercase tracking-[0.14em]',
      toneClasses[tone],
      className
    )}
    {...rest}
  />
);

export default Eyebrow;
