import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  Building2Icon,
  LandmarkIcon,
  GalleryVerticalIcon,
  GlobeIcon,
  BookOpenIcon,
  MapPinIcon,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface GovernmentLayoutProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export default function GovernmentLayout({ children }: GovernmentLayoutProps) {
  // Get current path to highlight active tab
  const location = useLocation();
  const currentPath = location.pathname;

  // Define branch data
  const branches = [
    {
      title: 'Executive Branch',
      description:
        'The President, Vice President, and the Cabinet members who implement and enforce laws.',
      icon: <LandmarkIcon className='h-4 w-4' />,
      path: '/government/executive',
    },
    {
      title: 'Executive Departments',
      description:
        'Government departments and agencies responsible for specific areas of governance.',
      icon: <Building2Icon className='h-4 w-4' />,
      path: '/government/departments',
    },
    {
      title: 'Constitutional Bodies',
      description:
        'Independent bodies created by the Constitution with specific mandates.',
      icon: <BookOpenIcon className='h-4 w-4' />,
      path: '/government/constitutional',
    },
    {
      title: 'Legislative Branch',
      description:
        'The Senate and House of Representatives that make laws and policies.',
      icon: <GalleryVerticalIcon className='h-4 w-4' />,
      path: '/government/legislative',
    },
    {
      title: 'Local Government Units',
      description: 'Local government units of the Philippines.',
      icon: <MapPinIcon className='h-4 w-4' />,
      path: '/government/local',
    },
    {
      title: 'Diplomatic Missions',
      description:
        'Philippine embassies, consulates, and diplomatic missions around the world.',
      icon: <GlobeIcon className='h-4 w-4' />,
      path: '/government/diplomatic',
    },
  ];

  // Check if we're on the main government page
  const isMainPage =
    currentPath === '/government' || currentPath === '/government/';

  return (
    <div className='container mx-auto px-4 md:px-0'>
      <div className='py-8 md:py-12 text-center flex flex-col justify-center'>
        <h2 className='text-3xl md:text-4xl font-bold text-gray-800 mb-4'>
          The Philippine Government Directory
        </h2>
        <p className='text-sm md:text-base text-gray-800'>
          Explore the different branches and agencies of the Philippine
          government
        </p>
      </div>

      {/* Card Tabs Navigation */}
      <div className='mb-8 md:mb-12 overflow-x-auto'>
        <div className='inline-grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 min-w-full md:min-w-0 px-4 py-2'>
          {branches.map(branch => {
            const isActive = currentPath.includes(branch.path);
            return (
              <Link
                key={branch.path}
                to={branch.path}
                className={cn(
                  'group flex flex-col p-3 md:p-4 rounded-md shadow-sm ring-1 ring-neutral-300',
                  'hover:bg-primary-500/95',
                  isActive && 'text-neutral-50  bg-primary-500'
                )}
              >
                <div className='flex items-center gap-1 mb-1 group-hover:text-neutral-200'>
                  <div className='mr-2 text-xs md:text-sm'>{branch.icon}</div>
                  {branch.title}
                </div>
                <div
                  className={cn(
                    'text-neutral-500 group-hover:text-neutral-200 text-xs md:text-sm',
                    isActive && 'text-neutral-200'
                  )}
                >
                  {branch.description}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {!isMainPage && (
        <div className='px-4 md:px-0 pb-12'>{children || <Outlet />}</div>
      )}
    </div>
  );
}
