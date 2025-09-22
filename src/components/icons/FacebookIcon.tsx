import React from 'react';
import { siFacebook } from 'simple-icons';

interface FacebookIconProps {
  className?: string;
  size?: number;
}

const FacebookIcon: React.FC<FacebookIconProps> = ({
  className = '',
  size = 20,
}) => {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill='currentColor'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path d={siFacebook.path} />
    </svg>
  );
};

export default FacebookIcon;
