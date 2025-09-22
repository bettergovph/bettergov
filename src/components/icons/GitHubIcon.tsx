import React from 'react';
import { siGithub } from 'simple-icons';

interface GitHubIconProps {
  className?: string;
  size?: number;
}

const GitHubIcon: React.FC<GitHubIconProps> = ({
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
      <path d={siGithub.path} />
    </svg>
  );
};

export default GitHubIcon;
