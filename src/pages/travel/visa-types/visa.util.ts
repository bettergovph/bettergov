import {
  BriefcaseIcon,
  CompassIcon,
  FileTextIcon,
  PlaneIcon,
  UsersIcon,
} from 'lucide-react';
import { createElement, ReactNode } from 'react';

/**
 * Helper function to get the appropriate icon for each visa category
 */
export function getCategoryIcon(categoryId: string): ReactNode {
  switch (categoryId) {
    case 'immigrant':
      return createElement(UsersIcon, { size: 24 });
    case 'non-immigrant':
      return createElement(PlaneIcon, { size: 24 });
    case 'special':
      return createElement(BriefcaseIcon, { size: 24 });
    case 'permits':
      return createElement(FileTextIcon, { size: 24 });
    default:
      return createElement(CompassIcon, { size: 24 });
  }
}
