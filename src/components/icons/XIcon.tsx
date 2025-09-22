import React from 'react';
import { siX } from 'simple-icons';

interface XIconProps {
  className?: string;
  size?: number;
}

const XIcon: React.FC<XIconProps> = ({ className = '', size = 20 }) => {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill='currentColor'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path d={siX.path} />
    </svg>
  );
};

export default XIcon;
