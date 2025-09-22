import React from 'react';
import { siInstagram } from 'simple-icons';

interface InstagramIconProps {
  className?: string;
  size?: number;
}

const InstagramIcon: React.FC<InstagramIconProps> = ({
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
      <path d={siInstagram.path} />
    </svg>
  );
};

export default InstagramIcon;
