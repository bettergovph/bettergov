import {
  BriefcaseIcon,
  CompassIcon,
  FileTextIcon,
  PlaneIcon,
  UsersIcon,
} from 'lucide-react';
import React from 'react';

/**
 * Helper function to get the appropriate icon for each visa category
 */
export function getCategoryIcon(categoryId: string): React.ReactNode {
  switch (categoryId) {
    case 'immigrant':
      return React.createElement(UsersIcon, { size: 24 });
    case 'non-immigrant':
      return React.createElement(PlaneIcon, { size: 24 });
    case 'special':
      return React.createElement(BriefcaseIcon, { size: 24 });
    case 'permits':
      return React.createElement(FileTextIcon, { size: 24 });
    default:
      return React.createElement(CompassIcon, { size: 24 });
  }
}
