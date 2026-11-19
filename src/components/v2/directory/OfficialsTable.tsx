import { FC, ReactNode } from 'react';
import { MailIcon, PhoneIcon } from 'lucide-react';
import { cn } from '../../../lib/utils';

export type OfficialRow = {
  name?: string;
  role?: string;
  office?: string;
  contact?: string;
  email?: string;
};

type Props = {
  officials: OfficialRow[];
  /** Optional group label shown above the table. */
  groupLabel?: ReactNode;
  className?: string;
};

/** Editorial two-column list: role/office on the left, name + contact on the right. */
const OfficialsTable: FC<Props> = ({ officials, groupLabel, className }) => {
  if (!officials || officials.length === 0) return null;

  return (
    <div className={cn('mb-10', className)}>
      {groupLabel && (
        <div className='mb-3 border-b border-ed-ink pb-2 font-mono-ed text-[11px] uppercase tracking-[0.14em] text-ed-ink-2'>
          {groupLabel}
        </div>
      )}
      <ul className='divide-y divide-ed-rule border-y border-ed-rule'>
        {officials.map((o, i) => (
          <li
            key={`${o.name}-${i}`}
            className='grid grid-cols-[220px_1fr] gap-6 py-4 max-md:grid-cols-1 max-md:gap-1.5'
          >
            <div className='font-mono-ed text-[11px] uppercase tracking-[0.12em] text-ed-ink-3'>
              {o.role ?? <span className='text-ed-ink-3'>—</span>}
              {o.office && (
                <span className='mt-0.5 block normal-case tracking-normal text-ed-ink-3'>
                  {o.office}
                </span>
              )}
            </div>
            <div>
              {o.name ? (
                <div className='font-serif-ed text-[17px] text-ed-ink'>
                  {o.name}
                </div>
              ) : (
                <span className='text-ed-ink-3'>—</span>
              )}
              {(o.contact || o.email) && (
                <div className='mt-1 flex flex-wrap gap-4 text-[13px] text-ed-ink-2'>
                  {o.contact && o.contact !== '__' && (
                    <span className='inline-flex items-center gap-1.5'>
                      <PhoneIcon
                        size={12}
                        className='text-ed-ink-3'
                        aria-hidden
                      />
                      <span className='font-mono-ed'>{o.contact}</span>
                    </span>
                  )}
                  {o.email && (
                    <a
                      href={`mailto:${o.email}`}
                      className='inline-flex items-center gap-1.5 text-ed-navy no-underline hover:text-ed-red'
                    >
                      <MailIcon size={12} aria-hidden />
                      <span>{o.email}</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default OfficialsTable;
