import React, { useState } from 'react';
import hotlinesData from '../../data/philippines_hotlines.json';

interface Hotline {
  name: string;
  category: string;
  numbers: string[];
  description?: string;
}
import {
  PhoneIcon,
  SearchIcon,
  AlertCircleIcon,
  AlertTriangleIcon,
  CloudLightningIcon,
  ShieldIcon,
  BusIcon,
  DropletIcon,
  HeartIcon,
} from 'lucide-react';

const Hotlines: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = [
    {
      id: 'all',
      name: 'All Hotlines',
      icon: <PhoneIcon className='w-5 h-5' />,
    },
    {
      id: 'emergency',
      name: 'Emergency',
      icon: <AlertCircleIcon className='w-5 h-5' />,
    },
    {
      id: 'disaster',
      name: 'Disaster',
      icon: <AlertTriangleIcon className='w-5 h-5' />,
    },
    {
      id: 'security',
      name: 'Security',
      icon: <ShieldIcon className='w-5 h-5' />,
    },
    {
      id: 'transport',
      name: 'Transport',
      icon: <BusIcon className='w-5 h-5' />,
    },
    {
      id: 'weather',
      name: 'Weather',
      icon: <CloudLightningIcon className='w-5 h-5' />,
    },
    {
      id: 'utility',
      name: 'Utilities',
      icon: <DropletIcon className='w-5 h-5' />,
    },
    {
      id: 'social',
      name: 'Social Services',
      icon: <HeartIcon className='w-5 h-5' />,
    },
  ];

  const getCategoryHotlines = (category: string): Hotline[] => {
    switch (category) {
      case 'emergency':
        return hotlinesData.emergencyHotlines as Hotline[];
      case 'disaster':
        return hotlinesData.disasterHotlines as Hotline[];
      case 'security':
        return hotlinesData.securityHotlines as Hotline[];
      case 'transport':
        return hotlinesData.transportHotlines as Hotline[];
      case 'weather':
        return hotlinesData.weatherHotlines as Hotline[];
      case 'utility':
        return hotlinesData.utilityHotlines as Hotline[];
      case 'social':
        return hotlinesData.socialServicesHotlines as Hotline[];
      default:
        return [
          ...hotlinesData.emergencyHotlines,
          ...hotlinesData.disasterHotlines,
          ...hotlinesData.securityHotlines,
          ...hotlinesData.transportHotlines,
          ...hotlinesData.weatherHotlines,
          ...hotlinesData.utilityHotlines,
          ...hotlinesData.socialServicesHotlines,
        ] as Hotline[];
    }
  };

  const filteredHotlines = getCategoryHotlines(activeCategory).filter(
    hotline =>
      hotline.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hotline.numbers.some(number => number.includes(searchTerm))
  );

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='text-center mb-8'>
        <h1 className='text-3xl font-bold mb-2'>
          Philippines Emergency Hotlines
        </h1>
        <p className='text-gray-800'>
          Important contact numbers for emergencies and public services
        </p>
      </div>

      {/* Search Bar */}
      <div className='relative max-w-md mx-auto mb-8'>
        <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
          <SearchIcon className='h-5 w-5 text-gray-400' />
        </div>
        <input
          type='text'
          className='block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-xs focus:ring-blue-500 focus:border-blue-500'
          placeholder='Search for hotlines...'
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Category Tabs */}
      <div className='flex flex-wrap justify-center gap-2 mb-8'>
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`flex items-center px-4 py-2 rounded-full cursor-pointer ${
              activeCategory === category.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
            }`}
          >
            <span className='mr-2'>{category.icon}</span>
            {category.name}
          </button>
        ))}
      </div>

      {/* Hotlines List */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {filteredHotlines.length > 0 ? (
          filteredHotlines.map((hotline, index) => (
            <div
              key={index}
              className='bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow'
            >
              <div className='p-5'>
                <h3 className='font-bold text-lg mb-2'>{hotline.name}</h3>
                {hotline.description && (
                  <p className='text-gray-800 text-sm mb-3'>
                    {hotline.description}
                  </p>
                )}
                <div className='space-y-2'>
                  {hotline.numbers.map((number, idx) => (
                    <div key={idx} className='flex items-center'>
                      <PhoneIcon className='h-4 w-4 text-blue-500 mr-2' />
                      <a
                        href={`tel:${number.replace(/\D/g, '')}`}
                        className='text-blue-600 hover:underline'
                      >
                        {number}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className='col-span-full text-center py-10'>
            <AlertCircleIcon className='h-12 w-12 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900'>
              No hotlines found
            </h3>
            <p className='mt-1 text-gray-800'>
              Try adjusting your search or filter.
            </p>
          </div>
        )}
      </div>

      <div className='mt-12 text-center'>
        <p className='text-sm text-gray-800'>
          These hotlines are collected from official government sources. If you
          notice any outdated information, please report it.
        </p>
      </div>
    </div>
  );
};

export default Hotlines;
