import { BarChart3, Table, Map, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FloodControlProjectsTab({
  selectedTab = 'index',
}: {
  selectedTab: string;
}) {
  return (
    <div className='border-b border-gray-200 mb-6'>
      {/* Scrollable horizontal layout for all screen sizes */}
      <div className='flex overflow-x-auto scrollbar-hide'>
        <Link
          to='/flood-control-projects'
          className={`px-4 py-2 border-b-2 whitespace-nowrap ${
            selectedTab === 'index'
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'text-gray-800 hover:text-blue-600 hover:bg-gray-50'
          } font-medium flex items-center`}
        >
          <BarChart3 className='w-4 h-4 mr-2' />
          Visual
        </Link>
        <Link
          to='/flood-control-projects/table'
          className={`px-4 py-2 border-b-2 whitespace-nowrap ${
            selectedTab === 'table'
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'text-gray-800 hover:text-blue-600 hover:bg-gray-50'
          } font-medium flex items-center`}
        >
          <Table className='w-4 h-4 mr-2' />
          Table
        </Link>
        <Link
          to='/flood-control-projects/contractors'
          className={`px-4 py-2 border-b-2 whitespace-nowrap ${
            selectedTab === 'contractors'
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'text-gray-800 hover:text-blue-600 hover:bg-gray-50'
          } font-medium flex items-center`}
        >
          <Users className='w-4 h-4 mr-2' />
          Contractors
        </Link>
        <Link
          to='/flood-control-projects/map'
          className={`px-4 py-2 border-b-2 whitespace-nowrap ${
            selectedTab === 'map'
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'text-gray-800 hover:text-blue-600 hover:bg-gray-50'
          } font-medium flex items-center`}
        >
          <Map className='w-4 h-4 mr-2' />
          Map
        </Link>
      </div>
    </div>
  );
}
