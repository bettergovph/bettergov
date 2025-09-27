import {
  BookOpenIcon,
  BuildingIcon,
  LandPlotIcon,
  UsersIcon,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import StandardSidebar from '../../../../components/ui/StandardSidebar';

export default function LegislativeSidebar() {
  const location = useLocation();

  // Check if a path is active
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <StandardSidebar>
      <nav className='p-2 space-y-4 pt-4'>
        {/* Senate Section */}
        <div>
          <h3 className='px-3 text-xs font-medium text-gray-800 uppercase tracking-wider mb-2'>
            Senate
          </h3>
          <ul className='space-y-1'>
            <li>
              <Link
                to='/government/legislative/senate-of-the-philippines-20th-congress'
                state={{ scrollToContent: true }}
                className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                  isActive(
                    '/government/legislative/senate-of-the-philippines-20th-congress'
                  )
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <BuildingIcon className='h-4 w-4 mr-2 text-gray-400 flex-shrink-0' />
                <span>Senate of the Philippines (20th Congress)</span>
              </Link>
            </li>
            <li>
              <Link
                to='/government/legislative/senate-committees'
                state={{ scrollToContent: true }}
                className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                  isActive('/government/legislative/senate-committees')
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <BookOpenIcon className='h-4 w-4 mr-2 text-gray-400 flex-shrink-0' />
                <span>Committees</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* House of Representatives Section */}
        <div>
          <h3 className='px-3 text-xs font-medium text-gray-800 uppercase tracking-wider mb-2'>
            House of Representatives
          </h3>
          <ul className='space-y-1'>
            <li>
              <Link
                to='/government/legislative/house-of-representatives-20th-congress'
                state={{ scrollToContent: true }}
                className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                  isActive(
                    '/government/legislative/house-of-representatives-20th-congress'
                  )
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <LandPlotIcon className='h-4 w-4 mr-2 text-gray-400 flex-shrink-0' />
                <span>House of Representatives (20th Congress)</span>
              </Link>
            </li>
            <li>
              <Link
                to='/government/legislative/house-members'
                state={{ scrollToContent: true }}
                className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                  isActive('/government/legislative/house-members')
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <UsersIcon className='h-4 w-4 mr-2 text-gray-400 flex-shrink-0' />
                <span>Members by City/Province</span>
              </Link>
            </li>
            <li>
              <Link
                to='/government/legislative/party-list-members'
                state={{ scrollToContent: true }}
                className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                  isActive('/government/legislative/party-list-members')
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <UsersIcon className='h-4 w-4 mr-2 text-gray-400 flex-shrink-0' />
                <span>Members by Party List</span>
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </StandardSidebar>
  );
}
