import React from 'react';
import { SiInstagram } from '@icons-pack/react-simple-icons';

interface InstagramIconProps {
  className?: string;
  size?: number;
  color?: string;
}

const InstagramIcon: React.FC<InstagramIconProps> = ({
  className = '',
  size = 20,
  color,
}) => {
  return <SiInstagram className={className} size={size} color={color} />;
};

export default InstagramIcon;
