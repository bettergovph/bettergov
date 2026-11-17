import { FC, ReactNode } from 'react';
import { cn } from '../../../lib/utils';

type Props = {
  label: ReactNode;
  children: ReactNode;
  className?: string;
};

const FilterSection: FC<Props> = ({ label, children, className }) => (
  <div className={cn('mb-6', className)}>
    <div className='mb-2.5 font-mono-ed text-[11px] font-medium uppercase tracking-[0.12em] text-ed-ink-2'>
      {label}
    </div>
    {children}
  </div>
);

export default FilterSection;
