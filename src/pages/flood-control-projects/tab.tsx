import { BarChart3Icon, TableIcon, MapIcon, UsersIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

export default function FloodControlProjectsTab({
  selectedTab = 'index',
}: {
  selectedTab: string;
}) {
  return (
    <div className='border-b border-gray-200 mb-6 overflow-x-auto'>
      <div className='flex min-w-max'>
        <Link
          to='/flood-control-projects'
          className={cn(
            'px-3 sm:px-4 py-2 border-b-2 font-medium flex items-center whitespace-nowrap',
            selectedTab === 'index'
              ? 'border-blue-500'
              : 'text-gray-800 hover:text-blue-600'
          )}
        >
          <BarChart3Icon className='w-4 h-4 mr-1.5 sm:mr-2' />
          Visual
        </Link>
        <Link
          to='/flood-control-projects/table'
          className={cn(
            'px-3 sm:px-4 py-2 border-b-2 font-medium flex items-center whitespace-nowrap',
            selectedTab === 'table'
              ? 'border-blue-500'
              : 'text-gray-800 hover:text-blue-600'
          )}
        >
          <TableIcon className='w-4 h-4 mr-1.5 sm:mr-2' />
          Table
        </Link>
        <Link
          to='/flood-control-projects/contractors'
          className={cn(
            'px-3 sm:px-4 py-2 border-b-2 font-medium flex items-center whitespace-nowrap',
            selectedTab === 'contractors'
              ? 'border-blue-500'
              : 'text-gray-800 hover:text-blue-600'
          )}
        >
          <UsersIcon className='w-4 h-4 mr-1.5 sm:mr-2' />
          Contractors
        </Link>
        <Link
          to='/flood-control-projects/map'
          className={cn(
            'px-3 sm:px-4 py-2 border-b-2 font-medium flex items-center whitespace-nowrap',
            selectedTab === 'map'
              ? 'border-blue-500'
              : 'text-gray-800 hover:text-blue-600'
          )}
        >
          <MapIcon className='w-4 h-4 mr-1.5 sm:mr-2' />
          Map
        </Link>
      </div>
    </div>
  );
}
