import { FC, ReactNode } from 'react';

type Props = {
  num: string;
  label: ReactNode;
  meta?: ReactNode;
};

const SectionHeader: FC<Props> = ({ num, label, meta }) => (
  <div className='mb-8 flex flex-wrap items-baseline gap-4 border-t border-ed-navy border-b border-b-ed-rule py-3.5'>
    <span className='font-mono-ed text-[11px] tracking-[0.12em] text-ed-ink-3 max-[480px]:hidden'>
      {num}
    </span>
    <span className='font-mono-ed text-[11px] font-medium uppercase tracking-[0.14em] text-ed-ink'>
      {label}
    </span>
    {meta != null && (
      <span className='font-mono-ed text-[11px] text-ed-ink-3 md:ml-auto max-md:w-full'>
        {meta}
      </span>
    )}
  </div>
);

export default SectionHeader;
