import { BarChart3, Table, Map, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

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
          className={`px-3 sm:px-4 py-2 border-b-2 ${
            selectedTab === 'index'
              ? 'border-blue-500'
              : 'text-gray-800 hover:text-blue-600'
          } font-medium flex items-center whitespace-nowrap`}
        >
          <BarChart3 className='w-4 h-4 mr-1.5 sm:mr-2' />
          Visual
        </Link>
        <Link
          to='/flood-control-projects/table'
          className={`px-3 sm:px-4 py-2 border-b-2 ${
            selectedTab === 'table'
              ? 'border-blue-500'
              : 'text-gray-800 hover:text-blue-600'
          } font-medium flex items-center whitespace-nowrap`}
        >
          <Table className='w-4 h-4 mr-1.5 sm:mr-2' />
          Table
        </Link>
        <Link
          to='/flood-control-projects/contractors'
          className={`px-3 sm:px-4 py-2 border-b-2 ${
            selectedTab === 'contractors'
              ? 'border-blue-500'
              : 'text-gray-800 hover:text-blue-600'
          } font-medium flex items-center whitespace-nowrap`}
        >
          <Users className='w-4 h-4 mr-1.5 sm:mr-2' />
          Contractors
        </Link>
        <Link
          to='/flood-control-projects/map'
          className={`px-3 sm:px-4 py-2 border-b-2 ${
            selectedTab === 'map'
              ? 'border-blue-500'
              : 'text-gray-800 hover:text-blue-600'
          } font-medium flex items-center whitespace-nowrap`}
        >
          <Map className='w-4 h-4 mr-1.5 sm:mr-2' />
          Map
        </Link>
      </div>
    </div>
  );
}
