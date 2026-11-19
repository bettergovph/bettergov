import { FC, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon } from 'lucide-react';
import { cn } from '../../../lib/utils';

type Props = {
  to: string;
  children: ReactNode;
  external?: boolean;
  className?: string;
};

const ArrowLink: FC<Props> = ({ to, children, external, className }) => {
  const classes = cn(
    'inline-flex items-center gap-2 border-b border-ed-navy pb-0.5 font-sans-ed text-sm font-medium text-ed-navy no-underline transition-colors hover:border-ed-red hover:text-ed-red',
    className
  );

  if (external) {
    return (
      <a href={to} target='_blank' rel='noreferrer' className={classes}>
        {children} <ArrowRightIcon size={14} />
      </a>
    );
  }

  return (
    <Link to={to} className={classes}>
      {children} <ArrowRightIcon size={14} />
    </Link>
  );
};

export default ArrowLink;
