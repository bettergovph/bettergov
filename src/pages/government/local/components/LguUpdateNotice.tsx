import { FC } from 'react';
import Notice from '../../../../components/v2/ui/Notice';

type Props = {
  className?: string;
};

/**
 * Standing notice on the local government pages while the LGU directory is
 * being refreshed. Remove it from those pages once the update is done.
 */
const LguUpdateNotice: FC<Props> = ({ className }) => (
  <Notice
    tag='Being updated'
    title='This directory is being updated'
    className={className}
  >
    <p className='mt-2 max-w-[640px] font-sans-ed text-[15px] leading-relaxed text-ed-ink-2 max-md:text-sm'>
      We&rsquo;re refreshing the list of local government units, their officials
      and contact details, so some entries may be out of date. Check with the
      LGU&rsquo;s own office or website before relying on them.
    </p>
  </Notice>
);

export default LguUpdateNotice;
