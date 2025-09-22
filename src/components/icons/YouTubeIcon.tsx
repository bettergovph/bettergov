import React from 'react';
import { siYoutube } from 'simple-icons';

interface YouTubeIconProps {
  className?: string;
  size?: number;
}

const YouTubeIcon: React.FC<YouTubeIconProps> = ({
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
      <path d={siYoutube.path} />
    </svg>
  );
};

export default YouTubeIcon;
