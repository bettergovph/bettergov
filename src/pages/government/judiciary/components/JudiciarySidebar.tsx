import { Link, useLocation } from 'react-router-dom';
import { Building } from 'lucide-react';
import StandardSidebar from '../../../../components/ui/StandardSidebar';

export default function JudiciarySidebar() {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <StandardSidebar>
      <nav className='p-2 space-y-4 pt-4'>
        <div>
          <h3 className='px-3 text-xs font-medium text-gray-800 uppercase tracking-wider mb-2'>
            Judiciary Categories
          </h3>
          <ul className='space-y-1'>
            <li>
              <Link
                to='/government/judiciary/supreme-court-of-the-philippines'
                state={{ scrollToContent: true }}
                className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                  isActive(
                    '/government/judiciary/supreme-court-of-the-philippines'
                  )
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Building className='h-4 w-4 mr-2 text-gray-400 shrink-0' />
                <span>Supreme Court of the Philippines</span>
              </Link>
            </li>
            <li>
              <Link
                to='/government/judiciary/court-of-appeals-of-the-philippines'
                state={{ scrollToContent: true }}
                className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                  isActive(
                    '/government/judiciary/court-of-appeals-of-the-philippines'
                  )
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Building className='h-4 w-4 mr-2 text-gray-400 shrink-0' />
                <span>Court of Appeals of the Philippines</span>
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </StandardSidebar>
  );
}
