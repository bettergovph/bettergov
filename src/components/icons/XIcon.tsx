import React from 'react';
import { SiX } from '@icons-pack/react-simple-icons';

interface XIconProps {
  className?: string;
  size?: number;
  color?: string;
}

const XIcon: React.FC<XIconProps> = ({ className = '', size = 20, color }) => {
  return <SiX className={className} size={size} color={color} />;
};

export default XIcon;
