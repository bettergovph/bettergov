import React from 'react';
import { SiFacebook } from '@icons-pack/react-simple-icons';

interface FacebookIconProps {
  className?: string;
  size?: number;
  color?: string;
}

const FacebookIcon: React.FC<FacebookIconProps> = ({
  className = '',
  size = 20,
  color,
}) => {
  return <SiFacebook className={className} size={size} color={color} />;
};

export default FacebookIcon;
