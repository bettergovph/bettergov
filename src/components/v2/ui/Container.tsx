import { FC, HTMLAttributes } from 'react';
import { cn } from '../../../lib/utils';

type Props = HTMLAttributes<HTMLDivElement> & {
  narrow?: boolean;
};

const Container: FC<Props> = ({ narrow, className, ...rest }) => (
  <div
    className={cn(
      'mx-auto w-full px-[18px] md:px-6 xl:px-8',
      narrow ? 'max-w-[1040px]' : 'max-w-[1504px]',
      className
    )}
    {...rest}
  />
);

export default Container;
