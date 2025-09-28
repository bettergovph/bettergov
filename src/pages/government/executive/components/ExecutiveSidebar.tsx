import {
  BriefcaseIcon,
  BuildingIcon,
  MessageSquareIcon,
  UserCheckIcon,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import StandardSidebar from '../../../../components/ui/StandardSidebar';

export default function ExecutiveSidebar() {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <StandardSidebar>
      <nav className='p-2 space-y-4 pt-4'>
        <div>
          <h3 className='px-3 text-xs font-medium text-gray-800 uppercase tracking-wider mb-2'>
            Executive Categories
          </h3>
          <ul className='space-y-1'>
            <li>
              <Link
                to='/government/executive/office-of-the-president'
                state={{ scrollToContent: true }}
                className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                  isActive('/government/executive/office-of-the-president')
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <BuildingIcon className='h-4 w-4 mr-2 text-gray-400 flex-shrink-0' />
                <span>Office of the President</span>
              </Link>
            </li>
            <li>
              <Link
                to='/government/executive/office-of-the-vice-president'
                state={{ scrollToContent: true }}
                className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                  isActive('/government/executive/office-of-the-vice-president')
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <UserCheckIcon className='h-4 w-4 mr-2 text-gray-400 flex-shrink-0' />
                <span>Office of the Vice President</span>
              </Link>
            </li>
            <li>
              <Link
                to='/government/executive/presidential-communications-office'
                state={{ scrollToContent: true }}
                className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                  isActive(
                    '/government/executive/presidential-communications-office'
                  )
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <MessageSquareIcon className='h-4 w-4 mr-2 text-gray-400 flex-shrink-0' />
                <span>Presidential Communications Office</span>
              </Link>
            </li>
            <li>
              <Link
                to='/government/executive/other-executive-offices'
                state={{ scrollToContent: true }}
                className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                  isActive('/government/executive/other-executive-offices')
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <BriefcaseIcon className='h-4 w-4 mr-2 text-gray-400 flex-shrink-0' />
                <span>Other Executive Offices</span>
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </StandardSidebar>
  );
}
