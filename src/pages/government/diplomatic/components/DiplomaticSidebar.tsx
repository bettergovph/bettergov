import { Building2Icon, GlobeIcon, LandmarkIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import StandardSidebar from '../../../../components/ui/StandardSidebar';

export default function DiplomaticSidebar() {
  const location = useLocation();

  // Check if a path is active
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const links = [
    {
      label: 'Diplomatic Missions',
      path: '/government/diplomatic/missions',
      icon: GlobeIcon,
      title: 'Diplomatic Missions',
    },
    {
      label: 'Consulates',
      path: '/government/diplomatic/consulates',
      icon: Building2Icon,
      title: 'Consulates',
    },
    {
      label: 'International Organizations',
      path: '/government/diplomatic/organizations',
      icon: LandmarkIcon,
      title: 'International Organizations',
    },
  ];

  return (
    <StandardSidebar>
      <nav className='p-2 space-y-4 pt-4'>
        <div>
          <h3 className='px-3 text-xs font-medium text-gray-800 uppercase tracking-wider mb-2'>
            Diplomatic Categories
          </h3>
          <ul className='space-y-1'>
            {links.map(({ label, path, icon: Icon, title }) => (
              <li key={path}>
                <Link
                  title={title}
                  to={path}
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
