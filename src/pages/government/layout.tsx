import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  Building2,
  Landmark,
  GalleryVertical,
  Globe,
  BookOpen,
  MapPin,
} from 'lucide-react';
import clsx from 'clsx';

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
      icon: <Landmark className='h-4 w-4' />,
      path: '/government/executive',
      color: 'bg-blue-600',
      hoverColor: 'hover:bg-blue-700',
      textColor: 'text-blue-600',
    },
    {
      title: 'Executive Departments',
      description:
        'Government departments and agencies responsible for specific areas of governance.',
      icon: <Building2 className='h-4 w-4' />,
      path: '/government/departments',
      color: 'bg-green-600',
      hoverColor: 'hover:bg-green-700',
      textColor: 'text-green-600',
    },
    {
      title: 'Constitutional Bodies',
      description:
        'Independent bodies created by the Constitution with specific mandates.',
      icon: <BookOpen className='h-4 w-4' />,
      path: '/government/constitutional',
      color: 'bg-purple-600',
      hoverColor: 'hover:bg-purple-700',
      textColor: 'text-purple-600',
    },
    {
      title: 'Legislative Branch',
      description:
        'The Senate and House of Representatives that make laws and policies.',
      icon: <GalleryVertical className='h-4 w-4' />,
      path: '/government/legislative',
      color: 'bg-amber-600',
      hoverColor: 'hover:bg-amber-700',
      textColor: 'text-amber-600',
    },
    {
      title: 'Local Government Units',
      description: 'Local government units of the Philippines.',
      icon: <MapPin className='h-4 w-4' />,
      path: '/government/local',
      color: 'bg-pink-600',
      hoverColor: 'hover:bg-pink-700',
      textColor: 'text-pink-600',
    },
    {
      title: 'Diplomatic Missions',
      description:
        'Philippine embassies, consulates, and diplomatic missions around the world.',
      icon: <Globe className='h-4 w-4' />,
      path: '/government/diplomatic',
      color: 'bg-red-600',
      hoverColor: 'hover:bg-red-700',
      textColor: 'text-red-600',
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
        <div className='inline-grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 min-w-full md:min-w-0 px-4'>
          {branches.map(branch => {
            const isActive = currentPath.includes(branch.path);
            return (
              <Link
                key={branch.path}
                to={branch.path}
                className={clsx(
                  'group flex flex-col p-3 md:p-4 transition-all rounded-md shadow-sm',
                  isActive
                    ? [branch.color, 'text-white']
                    : [
                        'bg-white border',
                        branch.textColor,
                        branch.hoverColor,
                        'hover:text-white',
                      ]
                )}
              >
                <div className='flex items-center gap-1 mb-1'>
                  <div className='mr-2 text-xs md:text-sm'>{branch.icon}</div>
                  <span className='font-medium text-sm md:text-base'>
                    {branch.title}
                  </span>
                </div>
                <div
                  className={clsx(
                    'text-xs md:text-sm transition-colors',
                    isActive
                      ? 'text-white'
                      : 'text-gray-800 group-hover:text-white'
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
