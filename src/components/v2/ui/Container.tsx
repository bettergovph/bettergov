import { FC, HTMLAttributes } from 'react';
import { cn } from '../../../lib/utils';

type Props = HTMLAttributes<HTMLDivElement> & {
  narrow?: boolean;
};

/**
 * Standard page container. Widths come from the --container-page tokens in
 * index.css — pages should never set their own max-width for page layout.
 */
const Container: FC<Props> = ({ narrow, className, ...rest }) => (
  <div
    className={cn(
      'mx-auto w-full px-4 md:px-6 xl:px-8',
      narrow ? 'max-w-page-narrow' : 'max-w-page',
      className
    )}
    {...rest}
  />
);

export default Container;
