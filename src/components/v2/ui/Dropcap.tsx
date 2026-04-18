import { FC, HTMLAttributes } from 'react';
import { cn } from '../../../lib/utils';

type Props = HTMLAttributes<HTMLParagraphElement>;

/**
 * Renders a paragraph with an editorial drop cap on the first letter.
 * Requires Tailwind variant `first-letter:` which is available in v4.
 */
const Dropcap: FC<Props> = ({ className, ...rest }) => (
  <p
    className={cn(
      'first-letter:float-left first-letter:pr-2.5 first-letter:pt-2 first-letter:font-serif-ed first-letter:text-[62px] first-letter:font-medium first-letter:leading-[0.9] first-letter:text-ed-ink max-md:first-letter:text-[44px] max-md:first-letter:pr-2 max-md:first-letter:pt-1.5',
      className
    )}
    {...rest}
  />
);

export default Dropcap;
