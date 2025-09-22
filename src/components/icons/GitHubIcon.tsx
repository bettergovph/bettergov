import React from 'react';
import { SiGithub } from '@icons-pack/react-simple-icons';

interface GitHubIconProps {
  className?: string;
  size?: number;
  color?: string;
}

const GitHubIcon: React.FC<GitHubIconProps> = ({
  className = '',
  size = 20,
  color,
}) => {
  return <SiGithub className={className} size={size} color={color} />;
};

export default GitHubIcon;
