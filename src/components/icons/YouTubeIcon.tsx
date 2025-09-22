import React from 'react';
import { SiYoutube } from '@icons-pack/react-simple-icons';

interface YouTubeIconProps {
  className?: string;
  size?: number;
  color?: string;
}

const YouTubeIcon: React.FC<YouTubeIconProps> = ({
  className = '',
  size = 20,
  color,
}) => {
  return <SiYoutube className={className} size={size} color={color} />;
};

export default YouTubeIcon;
