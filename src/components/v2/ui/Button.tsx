import {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ElementType,
  ReactNode,
} from 'react';
import { cn } from '../../../lib/utils';

type Variant = 'solid' | 'ghost';
type Size = 'md' | 'sm';

const base =
  'inline-flex items-center justify-center gap-2.5 font-medium no-underline transition-colors cursor-pointer font-sans-ed';

const sizeClasses: Record<Size, string> = {
  md: 'px-5 py-3 text-sm',
  sm: 'px-3.5 py-2 text-xs',
};

const variantClasses: Record<Variant, string> = {
  solid:
    'border border-ed-navy bg-ed-navy text-white hover:bg-ed-navy-2 hover:border-ed-navy-2',
  ghost:
    'border border-ed-navy bg-transparent text-ed-navy hover:bg-ed-navy hover:text-white',
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children?: ReactNode;
};

type ButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & {
    as?: 'button';
  };

type AnchorProps = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children'> & {
    as: 'a';
  };

type LinkLikeProps = CommonProps & {
  as: ElementType;
  [key: string]: unknown;
};

type Props = ButtonProps | AnchorProps | LinkLikeProps;

function Button(props: Props) {
  const {
    as: Component = 'button',
    variant = 'solid',
    size = 'md',
    className,
    children,
    ...rest
  } = props as LinkLikeProps;

  return (
    <Component
      className={cn(
        base,
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...rest}
    >
      {children}
    </Component>
  );
}

export default Button;
