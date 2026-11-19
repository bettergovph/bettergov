import { FC, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../../lib/utils';

type Props = {
  to?: string;
  children: ReactNode;
  className?: string;
};

const base =
  'block border border-ed-rule bg-white p-6 text-ed-ink no-underline transition-colors hover:border-ed-ink';

const Card: FC<Props> = ({ to, children, className }) => {
  if (to) {
    return (
      <Link to={to} className={cn(base, className)}>
        {children}
      </Link>
    );
  }
  return <div className={cn(base, className)}>{children}</div>;
};

export default Card;
