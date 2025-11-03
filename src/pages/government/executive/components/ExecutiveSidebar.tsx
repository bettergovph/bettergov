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

  const offices = [
    {
      label: 'Office of the President',
      icon: BuildingIcon,
      path: '/government/executive/office-of-the-president',
      title: 'Office of the President',
    },
    {
      label: 'Office of the Vice President',
      icon: UserCheckIcon,
      path: '/government/executive/office-of-the-vice-president',
      title: 'Office of the Vice President',
    },
    {
      label: 'Presidential Communications Office',
      icon: MessageSquareIcon,
      path: '/government/executive/presidential-communications-office',
      title: 'Presidential Communications Office',
    },
    {
      label: 'Other Executive Offices',
      icon: BriefcaseIcon,
      path: '/government/executive/other-executive-offices',
      title: 'Other Executive Offices',
    },
  ];

  return (
    <StandardSidebar>
      <nav className='p-2 space-y-4 pt-4'>
        <div>
          <h3 className='px-3 text-xs font-medium text-gray-800 uppercase tracking-wider mb-2'>
            Executive Categories
          </h3>
          <ul className='space-y-1'>
            {offices.map(({ label, icon: Icon, path, title }) => (
              <li key={path}>
                <Link
                  to={path}
                  title={title}
                  state={{ scrollToContent: true }}
                  className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                    isActive(path)
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className='h-4 w-4 mr-2 text-gray-400 flex-shrink-0' />
                  <span>{label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </StandardSidebar>
  );
}
