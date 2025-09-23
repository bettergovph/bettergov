import { Link, useLocation } from 'react-router-dom';
import { Building, UserCheck, MessageSquare, Briefcase } from 'lucide-react';
import StandardSidebar from '../../../../components/ui/StandardSidebar';

export default function ExecutiveSidebar() {
  const location = useLocation();

  // Check if a path is active
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
                className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                  isActive('/government/executive/office-of-the-president')
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Building className='h-4 w-4 mr-2 text-gray-400 shrink-0' />
                <span>Office of the President</span>
              </Link>
            </li>
            <li>
              <Link
                to='/government/executive/office-of-the-vice-president'
                className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                  isActive('/government/executive/office-of-the-vice-president')
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <UserCheck className='h-4 w-4 mr-2 text-gray-400 shrink-0' />
                <span>Office of the Vice President</span>
              </Link>
            </li>
            <li>
              <Link
                to='/government/executive/presidential-communications-office'
                className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                  isActive(
                    '/government/executive/presidential-communications-office'
                  )
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <MessageSquare className='h-4 w-4 mr-2 text-gray-400 shrink-0' />
                <span>Presidential Communications Office</span>
              </Link>
            </li>
            <li>
              <Link
                to='/government/executive/other-executive-offices'
                className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                  isActive('/government/executive/other-executive-offices')
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Briefcase className='h-4 w-4 mr-2 text-gray-400 shrink-0' />
                <span>Other Executive Offices</span>
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </StandardSidebar>
  );
}
